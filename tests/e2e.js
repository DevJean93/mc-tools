// Prueba E2E con Edge headless via CDP (Node 22+). Uso: node tests/e2e.js  (capturas en %TEMP%/formas-mc-e2e)
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const OUT = path.join(require('os').tmpdir(), 'formas-mc-e2e'); fs.mkdirSync(OUT, { recursive: true });
const URL_APP = require('url').pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const perfil = path.join(OUT, 'perfil');
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--remote-debugging-port=9333', '--window-size=1400,1000', `--user-data-dir=${perfil}`, 'about:blank']);
const esperar = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pend = new Map(); const errores = [];
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
const shot = async n => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, n), Buffer.from(r.data, 'base64')); };
const mouse = (type, x, y, button = 'left', buttons = 1) => send('Input.dispatchMouseEvent', { type, x, y, button, buttons: type === 'mouseReleased' ? 0 : buttons, clickCount: 1 });
const key = (k, code, vk) => send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk }).then(() => send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk }));
const ok = (c, m) => { console.log((c ? 'OK    ' : 'FALLO ') + m); if (!c) process.exitCode = 1; };
const prog = () => ev(`document.getElementById('progTxt').textContent`);
const ctrl = k => ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: '${k}', ctrlKey: true, bubbles: true }))`);
async function cargar() { await send('Page.navigate', { url: URL_APP }); await esperar(1200); }

(async () => {
  let tabs;
  for (let i = 0; i < 40; i++) { try { tabs = await (await fetch('http://127.0.0.1:9333/json')).json(); break; } catch { await esperar(250); } }
  const pg = tabs.find(t => t.type === 'page');
  ws = new WebSocket(pg.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { const p = pend.get(d.id); pend.delete(d.id); if (d.error) p.rej(new Error(d.error.message)); else p.res(d.result); }
    if (d.method === 'Runtime.exceptionThrown') errores.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errores.push(d.params.args.map(a => a.value || a.description).join(' '));
  };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT }).catch(() => {});

  // 1) Estado corrupto -> arranca igual
  await cargar();
  await ev(`localStorage.setItem('mc-formas-v1', '{"forma":"foo","w":"abc","zoom":9999,"grosor":-3}'); localStorage.setItem('mc-formas-v1:marcas','{basura')`);
  await cargar();
  ok(await ev(`document.getElementById('forma').value === 'circulo' && document.querySelector('.tot').textContent.startsWith('208')`), 'A1: localStorage corrupto -> circulo 16 por defecto (208)');
  await ev(`localStorage.clear()`); await cargar();
  await shot('01-inicio.png');

  // 2) Pintar arrastrando sobre la fila central (fila 8 = y 7)
  const geo = await ev(`(() => { const r = document.getElementById('lienzo').getBoundingClientRect(); return { l: r.left, t: r.top }; })()`);
  const L = 80, T = 42, s = 26; // Render con rel=true: L = 34+38+8, T = 22+20
  const P = (x, y) => [geo.l + L + x * s + s / 2, geo.t + T + y * s + s / 2];
  await mouse('mousePressed', ...P(0, 7));
  for (let x = 1; x <= 15; x++) await mouse('mouseMoved', ...P(x, 7));
  await mouse('mouseReleased', ...P(15, 7));
  await esperar(150);
  ok(await prog() === 'Construidos: 16/208 (8 %)', 'B1: arrastre marca 16 bloques -> ' + await prog());
  await mouse('mousePressed', ...P(0, 7), 'right', 2); await mouse('mouseReleased', ...P(0, 7), 'right', 2);
  await esperar(100);
  ok(await prog() === 'Construidos: 15/208 (7 %)', 'B1: clic derecho desmarca -> ' + await prog());

  // 3) Persistencia tras recargar
  await cargar();
  ok(await prog() === 'Construidos: 15/208 (7 %)', 'A2: las marcas sobreviven a recargar -> ' + await prog());

  // 4) Zoom/toggles no tocan marcas; cambio de geometria limpia y avisa; deshacer restaura
  await ev(`(() => { const z = document.getElementById('zoom'); z.value = 30; z.dispatchEvent(new Event('input')); const t = document.getElementById('tramos'); t.click(); t.click(); })()`);
  await esperar(100);
  ok(await prog() === 'Construidos: 15/208 (7 %)', 'A2: zoom/toggles conservan las marcas');
  await ev(`(() => { const w = document.getElementById('w'); w.value = 2; w.dispatchEvent(new Event('input')); w.value = 20; w.dispatchEvent(new Event('input')); })()`);
  await esperar(60);
  ok(await ev(`document.querySelector('.tot').textContent.startsWith('208')`), 'B2: debounce, no regenera mientras se escribe');
  await esperar(300);
  ok(await ev(`document.querySelector('.tot').textContent.startsWith('316')`), 'B2: tras 150 ms regenera (circulo 20 = 316)');
  ok(await ev(`!document.getElementById('aviso').hidden && document.getElementById('avisoTxt').textContent.includes('se limpiaron') && !document.getElementById('avisoAccion').hidden`), 'A2: aviso de limpieza con boton Deshacer');
  await ctrl('z'); await esperar(150);
  ok(await ev(`document.getElementById('w').value === '16'`) && await prog() === 'Construidos: 15/208 (7 %)', 'A2: Ctrl+Z restaura forma y marcas');
  await ctrl('y'); await esperar(150);
  ok(await ev(`document.getElementById('w').value === '20'`), 'A2: Ctrl+Y rehace');
  await ctrl('z'); await esperar(150);

  // 5) Grosor maximo
  await ev(`(() => { const m = document.getElementById('modo'); m.value = 'hueco'; m.dispatchEvent(new Event('input')); const g = document.getElementById('grosor'); g.value = 40; g.dispatchEvent(new Event('change')); })()`);
  await esperar(150);
  ok(await ev(`document.getElementById('grosor').value === '7' && document.getElementById('maxG').textContent === '(máx. 7)' && document.getElementById('avisoTxt').textContent.includes('Grosor máximo')`), 'A3: grosor 40 se recorta a 7 con aviso');
  await ctrl('z'); await esperar(150);
  ok(await ev(`document.getElementById('modo').value === 'relleno'`) && await prog() === 'Construidos: 15/208 (7 %)', 'A2: deshacer vuelve a solido con las marcas');

  // 6) Teclado: foco en canvas, flecha arriba y Espacio
  await ev(`document.getElementById('lienzo').focus()`);
  await key('ArrowUp', 'ArrowUp', 38); await key(' ', 'Space', 32);
  await esperar(100);
  ok(await prog() === 'Construidos: 16/208 (8 %)' && (await ev(`document.getElementById('anuncio').textContent`)).includes('construido'), 'B1/B3: teclado marca la celda -> ' + await prog());
  await shot('02-teclado.png');

  // 7) Esfera: capas, marcar capa, tabla
  await ev(`(() => { const f = document.getElementById('forma'); f.value = 'esfera'; f.dispatchEvent(new Event('input')); const w = document.getElementById('w'); w.value = 11; w.dispatchEvent(new Event('change')); })()`);
  await esperar(200);
  ok(await ev(`document.getElementById('capa').max === '10' && document.getElementById('rowH').hidden && document.getElementById('w').max === '100'`), 'A4: esfera 11 capas, alto oculto, max 100');
  await ev(`document.getElementById('marcarCapa').click()`);
  await esperar(100);
  ok(await ev(`document.querySelector('tr.sel').textContent.includes('100 %')`), 'B1: marcar capa -> 100 % en la tabla');
  await shot('03-esfera.png');

  // 8) Accesibilidad basica
  ok(await ev(`[...document.querySelectorAll('button')].every(b => b.textContent.trim() || b.getAttribute('aria-label'))`), 'B3: todos los botones tienen nombre accesible');
  ok(await ev(`!!document.getElementById('lienzo').getAttribute('aria-label') && document.getElementById('lienzo').tabIndex === 0`), 'B3: canvas enfocable con aria-label');

  // 9) Export PNG
  await ev(`document.getElementById('exportar').click()`);
  await esperar(1500);
  const pngs = fs.readdirSync(OUT).filter(f => f.startsWith('esfera-11'));
  ok(pngs.length > 0, 'B4: PNG exportado ' + pngs.join(','));

  // 10) Zoom con formas grandes
  const zoom = () => ev(`+document.getElementById('zoom').value`);
  const cabe = () => ev(`(() => { const c = document.getElementById('lienzo'), w = c.parentElement; return c.offsetWidth <= w.clientWidth && c.offsetHeight <= w.clientHeight; })()`);
  await ev(`(() => { const f = document.getElementById('forma'); f.value = 'circulo'; f.dispatchEvent(new Event('input')); const w = document.getElementById('w'); w.value = 200; w.dispatchEvent(new Event('change')); })()`);
  await esperar(400);
  const zAuto = await zoom();
  ok(zAuto < 26 && await cabe(), `ZOOM: circulo 200 se aleja solo hasta caber (zoom ${zAuto})`);
  await shot('05-circulo200.png');
  await ev(`document.getElementById('zoomMas').click()`); await esperar(100);
  const zMas = await zoom();
  ok(zMas > zAuto, `ZOOM: boton + acerca (${zAuto} -> ${zMas})`);
  await ev(`document.getElementById('zoomMenos').click()`); await esperar(100);
  ok(await zoom() < zMas, `ZOOM: boton - aleja (${zMas} -> ${await zoom()})`);
  // Ctrl + rueda anclado al puntero: la celda bajo el raton no cambia
  await ev(`(() => { const z = document.getElementById('zoom'); z.value = 10; z.dispatchEvent(new Event('input')); })()`);
  await esperar(150);
  const pr = await ev(`(() => { const r = document.getElementById('lienzo').parentElement.getBoundingClientRect(); return [r.left + r.width * 0.6, r.top + r.height * 0.4]; })()`);
  await mouse('mouseMoved', pr[0], pr[1], 'none', 0);
  const celdaAntes = (await ev(`document.getElementById('info').textContent`)).split(' · ')[0];
  const z0 = await zoom();
  for (let i = 0; i < 3; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: pr[0], y: pr[1], deltaX: 0, deltaY: -120, modifiers: 2 }); await esperar(60); }
  await mouse('mouseMoved', pr[0] + 0.5, pr[1], 'none', 0);
  const celdaDespues = (await ev(`document.getElementById('info').textContent`)).split(' · ')[0];
  ok(await zoom() > z0 && celdaAntes === celdaDespues, `ZOOM: Ctrl+rueda acerca hacia el puntero (${z0} -> ${await zoom()}; ${celdaAntes} | ${celdaDespues})`);
  await shot('06-zoom-puntero.png');
  // Teclado: 0 ajusta, + acerca
  await ev(`document.getElementById('lienzo').focus()`);
  await key('0', 'Digit0', 48); await esperar(100);
  ok(await zoom() === zAuto && await cabe(), 'ZOOM: tecla 0 ajusta a la ventana');
  await key('+', 'Equal', 187); await esperar(100);
  ok(await zoom() > zAuto, 'ZOOM: tecla + acerca');
  // Pellizco tactil con dos dedos
  await key('0', 'Digit0', 48); await esperar(100);
  const c0 = await ev(`(() => { const r = document.getElementById('lienzo').getBoundingClientRect(); return [r.left + 200, r.top + 200]; })()`);
  const zp = await zoom();
  const tp = d => [{ x: c0[0] - d, y: c0[1], id: 1 }, { x: c0[0] + d, y: c0[1], id: 2 }];
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(20) });
  for (const d of [30, 40, 50, 60]) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(d) }); await esperar(30); }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(150);
  ok(await zoom() >= zp * 2.5, `ZOOM: pellizcar con dos dedos acerca (${zp} -> ${await zoom()})`);
  // Zoom no borra marcas ni regenera
  ok((await prog()).startsWith('Construidos:'), 'ZOOM: progreso intacto');

  // 11) Movil 375 px
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 800, deviceScaleFactor: 1, mobile: true });
  await cargar(); await esperar(300);
  ok(await ev(`document.documentElement.scrollWidth <= 375`), 'B5: sin scroll horizontal a 375 px');
  ok(await ev(`document.getElementById('panel').hidden && document.querySelector('.area').getBoundingClientRect().top < 300`), 'B5: en movil el menu arranca cerrado y el dibujo va primero');
  await ev(`document.getElementById('verMenu').click()`); await esperar(300);
  ok(await ev(`(() => { const r = document.getElementById('panel').getBoundingClientRect(); return r.top === 0 && r.width === 375 && document.activeElement.id === 'cerrarMenu' && document.getElementById('verMenu').getAttribute('aria-expanded') === 'true'; })()`), 'B5: el boton abre el menu a pantalla completa con foco en Cerrar');
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  ok(await ev(`document.getElementById('panel').hidden && document.activeElement.id === 'verMenu'`), 'B5: Esc cierra el menu y devuelve el foco');
  await ev(`document.querySelector('.navmovil a[href="#secMat"]').click()`); await esperar(800);
  // Materiales es la ultima seccion: si es corta, el menu queda desplazado hasta el final.
  ok(await ev(`(() => { const p = document.getElementById('panel');
    const llego = document.getElementById('secMat').getBoundingClientRect().top < 200 || p.scrollTop + p.clientHeight >= p.scrollHeight - 1;
    return !p.hidden && p.scrollTop > 0 && llego && document.querySelector('.navmovil a[href="#secMat"]').getAttribute('aria-current') === 'true'; })()`), 'B5: Materiales abre el menu en su seccion');
  await ev(`document.querySelector('.navmovil a[href="#secDibujo"]').click()`); await esperar(300);
  ok(await ev(`document.getElementById('panel').hidden`), 'B5: Dibujo cierra el menu');
  await shot('04-movil.png');

  ok(errores.length === 0, 'Consola sin errores ' + (errores.length ? JSON.stringify(errores) : ''));
  ws.close(); edge.kill();
})().catch(e => { console.error(e); edge.kill(); process.exit(1); });
