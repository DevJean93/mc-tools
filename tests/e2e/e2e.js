// Prueba E2E con Edge headless via CDP (Node 22+). Uso: node tests/e2e.js  (capturas en %TEMP%/formas-mc-e2e)
const { spawn, spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const OUT = path.join(require('os').tmpdir(), 'formas-mc-e2e'); fs.mkdirSync(OUT, { recursive: true });
const URL_APP = require('url').pathToFileURL(path.join(__dirname, '..', '..', 'index.html')).href;
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const perfil = path.join(OUT, 'perfil');
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--remote-debugging-port=9333', '--window-size=1400,1000', `--user-data-dir=${perfil}`, 'about:blank']);
const esperar = ms => new Promise(r => setTimeout(r, ms));
// En Windows edge.kill() solo cierra el proceso padre: Edge relanza el navegador con otro PID y
// sus hijos siguen vivos en el mismo puerto, y la siguiente ejecucion se conectaria a ese navegador
// viejo (con su emulacion movil puesta). Se cierran por la carpeta de perfil, que es de esta prueba.
const cerrar = () => {
  const comando = `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${perfil}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`;
  try { spawnSync('powershell', ['-NoProfile', '-Command', comando], { stdio: 'ignore' }); } catch (e) { /* nada que cerrar */ }
  edge.kill();
};
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
  await send('Emulation.clearDeviceMetricsOverride'); await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT }).catch(() => {});

  // 0) Almacenamiento bloqueado desde el arranque: la app funciona y avisa de que no guarda.
  const bloqueo = await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('bloqueado', 'SecurityError'); } });`,
  });
  await cargar();
  ok(await ev(`!document.getElementById('nota').hidden && document.getElementById('notaTxt').textContent.includes('bloquea') && document.querySelector('.tot').textContent.startsWith('208')`),
    'A4: con el almacenamiento bloqueado hay una nota fija y la app arranca');
  ok(await ev(`(() => { const n = document.getElementById('nota'); return n.getAttribute('role') === 'status' && n.querySelector('svg') && n.getBoundingClientRect().height > 0; })()`),
    'B1: la nota es role=status, lleva icono y se ve');
  await shot('00-nota-almacenamiento.png');
  await esperar(5600);   // mas que lo que dura un aviso temporal
  ok(await ev(`!document.getElementById('nota').hidden`), 'B1: la nota sigue visible pasados los 5 s de un aviso temporal');
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: bloqueo.identifier });
  await cargar();

  // C4: un localStorage vacio que no deja escribir (cuota 0) no es persistente: debe avisar de
  // que no guarda, no de que esta lleno.
  await ev(`localStorage.clear()`);
  const soloLectura = await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `Storage.prototype.setItem = function () { throw new DOMException('cuota 0', 'QuotaExceededError'); };`,
  });
  await cargar();
  ok(await ev(`!document.getElementById('nota').hidden && document.getElementById('notaTxt').textContent.includes('bloquea') && !document.getElementById('notaTxt').textContent.includes('lleno') && document.querySelector('.tot').textContent.startsWith('208')`),
    'C4: sin escritura la nota dice que el navegador bloquea el almacenamiento');
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: soloLectura.identifier });
  await cargar();

  // A1: con el almacenamiento lleno la app sigue recuperando el progreso ya guardado y avisa
  // de que esta lleno (nunca de que esta bloqueado).
  await ev(`localStorage.clear(); localStorage.setItem('mc-formas-v1', JSON.stringify({ forma: 'triangulo', w: 21, h: 15, igualar: false }))`);
  await cargar();
  await ev(`document.getElementById('marcarTodo').click()`); await esperar(250);
  const progLleno = await prog();
  ok(progLleno.includes('159/159'), `A1: preparado el progreso a recuperar (${progLleno})`);
  await ev(`(() => { let n = 0, trozo = 'x'.repeat(1 << 20); while (trozo.length) { try { localStorage.setItem('relleno' + n, trozo); n++; } catch (e) { trozo = trozo.slice(0, trozo.length >> 1); } } })()`);
  await cargar();
  ok(await ev(`document.getElementById('forma').value === 'triangulo'`) && await prog() === progLleno,
    `A1: con el almacenamiento lleno se recupera el progreso (${await prog()})`);
  ok(await ev(`(() => { const n = document.getElementById('notaTxt').textContent, a = document.getElementById('avisoTxt').textContent; return !n.includes('bloquea') && !a.includes('bloquea'); })()`),
    'A1: con el almacenamiento lleno no dice que el navegador lo bloquea');
  await ev(`localStorage.clear()`);
  await cargar();

  // 1) Estado corrupto -> arranca igual
  await cargar();
  await ev(`localStorage.setItem('mc-formas-v1', '{"forma":"foo","w":"abc","zoom":9999,"grosor":-3}'); localStorage.setItem('mc-formas-v1:marcas','{basura')`);
  await cargar();
  ok(await ev(`document.getElementById('forma').value === 'circulo' && document.querySelector('.tot').textContent.startsWith('208')`), 'A1: localStorage corrupto -> circulo 16 por defecto (208)');
  await ev(`localStorage.clear()`); await cargar();
  await shot('01-inicio.png');
  ok(await ev(`(() => {
    const ops = [...document.getElementById('forma').options];
    return ops.length === Formas.FORMAS.length && ops.every(o => Formas.FORMAS.includes(o.value) && o.textContent === Formas.obtener(o.value).nombre);
  })()`), 'B2: el selector de formas sale del registro (FORMAS + nombre)');
  ok(await ev(`[...document.getElementById('forma').options].map(o => o.textContent).join('|') ===
    'Círculo / Óvalo|Cuadrado / Rectángulo|Triángulo|Rombo|Hexágono|Esfera / Cúpula (3D)'`),
  'A2: el selector conserva el orden Círculo, Cuadrado, Triángulo, Rombo, Hexágono, Esfera');
  // C2: `poner()` se llama en cada cambio; no debe rehacer las opciones de los selectores.
  const mutaciones = await ev(`new Promise(res => {
    let n = 0;
    const obs = new MutationObserver(lista => { n += lista.length; });
    obs.observe(document.getElementById('forma'), { childList: true });
    obs.observe(document.getElementById('esfera'), { childList: true });
    const w = document.getElementById('w');
    w.value = '17'; w.dispatchEvent(new Event('input'));
    setTimeout(() => { obs.disconnect(); w.value = '16'; w.dispatchEvent(new Event('input')); res(n); }, 250);
  })`);
  await esperar(300);
  ok(mutaciones === 0, 'C2: escribir no reconstruye los selectores de forma y variante');
  // B1: la orientacion no depende del id de la forma sino de sus opciones declaradas.
  await ev(`(() => { const f = document.getElementById('forma'); f.value = 'hexagono'; f.dispatchEvent(new Event('input')); })()`);
  await esperar(200);
  const orientHex = await ev(`!document.getElementById('rowOrient').hidden`);
  await ev(`(() => { const f = document.getElementById('forma'); f.value = 'circulo'; f.dispatchEvent(new Event('input')); })()`);
  await esperar(200);
  ok(orientHex && await ev(`document.getElementById('rowOrient').hidden`),
    'B1: la orientacion aparece solo en las formas que la ofrecen');

  // B2/B3: la orientacion y las variantes salen de la definicion de cada forma.
  const elegirForma = id => ev(`(() => { const f = document.getElementById('forma'); f.value = '${id}'; f.dispatchEvent(new Event('input')); })()`).then(() => esperar(200));
  await elegirForma('hexagono');
  ok(await ev(`[...document.getElementById('orient').options].map(o => o.value + ':' + o.textContent).join('|') ===
    Formas.obtener('hexagono').orientaciones.map(o => o.valor + ':' + o.etiqueta).join('|') &&
    document.getElementById('orient').options.length === 2`),
  'B2: las orientaciones del selector salen de la definicion del hexagono');
  await ev(`(() => { const o = document.getElementById('orient'); o.value = 'punta'; o.dispatchEvent(new Event('input')); })()`);
  await esperar(200);
  await elegirForma('circulo'); await elegirForma('hexagono');
  ok(await ev(`document.getElementById('orient').value === 'punta'`), 'B2: al volver al hexagono se recuerda la orientacion elegida');
  await cargar();
  ok(await ev(`document.getElementById('forma').value === 'hexagono' && document.getElementById('orient').value === 'punta' && !document.getElementById('rowOrient').hidden`),
    'B2: la orientacion guardada se restaura al recargar');
  await ev(`localStorage.setItem('mc-formas-v1', JSON.stringify({ forma: 'esfera', w: 12, esfera: 'cupula' }))`); await cargar();
  ok(await ev(`document.getElementById('esfera').value === 'cupula' && document.getElementById('capaTxt').textContent.includes('de 6')`),
    'B3: una cupula guardada se restaura (6 capas)');
  await ev(`localStorage.setItem('mc-formas-v1', JSON.stringify({ forma: 'esfera', w: 12, esfera: 'plano' }))`); await cargar();
  ok(await ev(`document.getElementById('esfera').value === 'esfera' && document.getElementById('capaTxt').textContent.includes('de 12')`),
    'B3: una variante que no es de la forma cae en la primera (esfera, 12 capas)');
  await ev(`localStorage.clear()`); await cargar();

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


  // Tactil: el lienzo lleva touch-action: none, asi que la app gestiona dedos y toques.
  // Se prueba en movil (375 px), que es donde importa.
  await ev(`(() => {
    const f = document.getElementById('forma'); f.value = 'circulo'; f.dispatchEvent(new Event('input'));
    const w = document.getElementById('w'); w.value = 16; w.dispatchEvent(new Event('change'));
    document.getElementById('lienzo').scrollIntoView({ block: 'center' });
  })()`);
  await esperar(350);
  await ev(`(() => { const z = document.getElementById('zoom'); z.value = 26; z.dispatchEvent(new Event('input')); })()`);
  await esperar(150);
  const rect = await ev(`(() => { const r = document.getElementById('lienzo').getBoundingClientRect(); return [r.left, r.top]; })()`);
  const progTactil = await prog();
  // Dedos escalonados: el primero llega y se mueve antes que el segundo.
  const zt = await zoom();
  const wc0 = await ev(`(() => { const r = document.getElementById('lienzo').parentElement.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  const t1 = [wc0[0] - 60, wc0[1] - 20];
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: t1[0], y: t1[1], id: 1 }] });
  await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: t1[0] + 14, y: t1[1] + 6, id: 1 }] });
  await esperar(60);
  const zTrasUno = await zoom();
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [
    { x: t1[0] + 14, y: t1[1] + 6, id: 1 }, { x: t1[0] + 54, y: t1[1] + 6, id: 2 },
  ] });
  for (const d of [70, 90, 120, 150]) {
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
      { x: t1[0] + 14, y: t1[1] + 6, id: 1 }, { x: t1[0] + 14 + d, y: t1[1] + 6, id: 2 },
    ] });
    await esperar(30);
  }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(200);
  ok(zTrasUno === zt && await zoom() > zt * 1.5,
    `TACTIL: dedos escalonados -> pellizco (${zt} -> ${await zoom()})`);
  ok(await prog() === progTactil, 'TACTIL: el pellizco no marca bloques');
  // Un toque corto sigue marcando (el pellizco no deja el gesto bloqueado).
  await ev(`(() => { const w = document.getElementById('lienzo').parentElement; w.scrollLeft = 0; w.scrollTop = 0; const z = document.getElementById('zoom'); z.value = 26; z.dispatchEvent(new Event('input')); })()`);
  await esperar(150);
  const rect2 = await ev(`(() => { const r = document.getElementById('lienzo').getBoundingClientRect(); return [r.left, r.top]; })()`);
  const pTap = [rect2[0] + L + 8 * 26 + 13, rect2[1] + T + 7 * 26 + 13];
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pTap[0], y: pTap[1], id: 1 }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(200);
  ok(await prog() === 'Construidos: 1/208 (0 %)', 'TACTIL: un toque corto marca la celda -> ' + await prog());
  // Arrastrar con un dedo desplaza el dibujo (no marca).
  await ev(`(() => { const z = document.getElementById('zoom'); z.value = 48; z.dispatchEvent(new Event('input')); })()`);
  await esperar(200);
  const leerScroll = `(() => { const w = document.getElementById('lienzo').parentElement; return [w.scrollLeft, w.scrollTop]; })()`;
  const s0 = await ev(leerScroll);
  const wc = await ev(`(() => { const r = document.getElementById('lienzo').parentElement.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: wc[0], y: wc[1], id: 1 }] });
  for (const d of [20, 40, 60, 80]) {
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: wc[0] - d, y: wc[1] - d, id: 1 }] });
    await esperar(20);
  }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(150);
  const s1 = await ev(leerScroll);
  ok(s1[0] > s0[0] && s1[1] > s0[1] && await prog() === 'Construidos: 1/208 (0 %)',
    `TACTIL: arrastrar con un dedo desplaza el dibujo (${s0[0]},${s0[1]} -> ${s1[0]},${s1[1]})`);

  // A1: en el zoom maximo (48) el pellizco ya no puede acercar mas, pero debe seguir desplazando.
  await ev(`(() => { const z = document.getElementById('zoom'); z.value = 48; z.dispatchEvent(new Event('input')); const w = document.getElementById('lienzo').parentElement; w.scrollLeft = 200; w.scrollTop = 200; })()`);
  await esperar(150);
  const sA1 = await ev(leerScroll);
  const wcA1 = await ev(`(() => { const r = document.getElementById('lienzo').parentElement.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  const dedosA1 = (dx, dy, sep) => [
    { x: wcA1[0] - sep + dx, y: wcA1[1] + dy, id: 1 },
    { x: wcA1[0] + sep + dx, y: wcA1[1] + dy, id: 2 },
  ];
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: dedosA1(0, 0, 40) });
  // Los dos dedos se mueven en paralelo (el contenedor puede moverse) y se separan un 2 %: 80 -> 81.6 px.
  await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: dedosA1(30, 10, 40) });
  await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: dedosA1(30, 10, 40.8) });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(150);
  const sA1b = await ev(leerScroll);
  // Sin recortar el zoom, los dos primeros movimientos se perderian y solo se desplazaria la mitad.
  ok(await zoom() === 48 && sA1[0] - sA1b[0] >= 25 && sA1b[1] < sA1[1] && await prog() === 'Construidos: 1/208 (0 %)',
    `TACTIL A1: con zoom 48 el pellizco sigue desplazando (${sA1[0]},${sA1[1]} -> ${sA1b[0]},${sA1b[1]})`);

  // A2: pellizco que ademas se desplaza 80 px: la celda bajo el punto medio inicial sigue
  // bajo el punto medio final (el dibujo no se queda atras).
  await ev(`(() => { const z = document.getElementById('zoom'); z.value = 26; z.dispatchEvent(new Event('input')); const w = document.getElementById('lienzo').parentElement; w.scrollLeft = 0; w.scrollTop = 0; })()`);
  await esperar(150);
  const wcA2 = await ev(`(() => { const r = document.getElementById('lienzo').parentElement.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  const celdaEn = async p => {
    await mouse('mouseMoved', p[0], p[1], 'none', 0); await esperar(40);
    return (await ev(`document.getElementById('info').textContent`)).split(' · ')[0];
  };
  const celdaA2a = await celdaEn(wcA2);
  const dedosA2 = k => {
    const sep = 40 + k, off = -20 * k;
    return [
      { x: wcA2[0] - sep + off, y: wcA2[1], id: 1 },
      { x: wcA2[0] + sep + off, y: wcA2[1], id: 2 },
    ];
  };
  const zA2 = await zoom();
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: dedosA2(0) });
  for (const k of [1, 2, 3, 4]) {
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: dedosA2(k) });
    await esperar(30);
  }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(200);
  const celdaA2b = await celdaEn([wcA2[0] - 80, wcA2[1]]);
  const rc = t => (t.match(/^Columna (\d+), fila (\d+)$/) || []).slice(1).map(Number);
  const [ca, ra] = rc(celdaA2a), [cb, rb] = rc(celdaA2b);
  ok(await zoom() > zA2 && ca && Math.abs(ca - cb) <= 1 && Math.abs(ra - rb) <= 1 && await prog() === 'Construidos: 1/208 (0 %)',
    `TACTIL A2: pellizcar y arrastrar mantiene la celda bajo los dedos (${celdaA2a} -> ${celdaA2b})`);

  // A3: con tres dedos se ignora el gesto; al levantar uno, los dos que quedan reanudan el pellizco.
  await ev(`(() => { const z = document.getElementById('zoom'); z.value = 26; z.dispatchEvent(new Event('input')); const w = document.getElementById('lienzo').parentElement; w.scrollLeft = 0; w.scrollTop = 0; })()`);
  await esperar(150);
  const wcA3 = await ev(`(() => { const r = document.getElementById('lienzo').parentElement.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  const tresA3 = sep => [
    { x: wcA3[0] - sep, y: wcA3[1], id: 1 },
    { x: wcA3[0] + sep, y: wcA3[1], id: 2 },
    { x: wcA3[0], y: wcA3[1] + 120, id: 3 },
  ];
  const zA3 = await zoom(), progA3 = await prog();
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tresA3(40) });
  // touchEnd lleva los dedos que se sueltan: solo el tercero.
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [tresA3(40)[2]] });
  await esperar(60);
  for (const sep of [55, 70, 85]) {
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
      { x: wcA3[0] - sep, y: wcA3[1], id: 1 }, { x: wcA3[0] + sep, y: wcA3[1], id: 2 },
    ] });
    await esperar(30);
  }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(200);
  ok(await zoom() > zA3 * 1.4 && await prog() === progA3,
    `TACTIL A3: al levantar el tercer dedo el pellizco continua (${zA3} -> ${await zoom()})`);

  // FORM: el campo de ancho se puede vaciar. Vacio no se rellena con el minimo ni cambia la forma.
  await ev(`(() => { const f = document.getElementById('forma'); f.value = 'circulo'; f.dispatchEvent(new Event('input')); const w = document.getElementById('w'); w.value = '16'; w.dispatchEvent(new Event('change')); })()`);
  await esperar(300);
  await ev(`(() => { const w = document.getElementById('w'); w.value = ''; w.dispatchEvent(new Event('input')); })()`);
  await esperar(350);
  ok(await ev(`document.getElementById('w').value === '' && document.querySelector('.tot').textContent.startsWith('208')`),
    'FORM: al borrar el ancho queda vacio y la forma no cambia');
  await ev(`(() => { const w = document.getElementById('w'); w.value = '2'; w.dispatchEvent(new Event('input')); })()`);
  await esperar(300);
  ok(await ev(`document.getElementById('w').value === '2' && document.querySelector('.tot').textContent.startsWith('4')`),
    'FORM: al teclear 2 se aplica 2 (no se queda en el minimo 1)');
  await ev(`(() => { const w = document.getElementById('w'); w.value = '20'; w.dispatchEvent(new Event('input')); })()`);
  await esperar(300);
  ok(await ev(`document.getElementById('w').value === '20' && document.querySelector('.tot').textContent.startsWith('316')`),
    'FORM: escribir 20 despues del 2 da 20');

  // A5: en alta densidad (3x), arrastrar dentro de un dibujo grande no empuja la pagina.
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 800, deviceScaleFactor: 3, mobile: true });
  await cargar(); await esperar(400);
  await ev(`(() => {
    const f = document.getElementById('forma'); f.value = 'circulo'; f.dispatchEvent(new Event('input'));
    const w = document.getElementById('w'); w.value = '200'; w.dispatchEvent(new Event('change'));
  })()`);
  await esperar(500);
  await ev(`(() => {
    const z = document.getElementById('zoom'); z.value = 6; z.dispatchEvent(new Event('input'));
    const w = document.getElementById('lienzo').parentElement;
    w.scrollLeft = (w.scrollWidth - w.clientWidth) / 2; w.scrollTop = (w.scrollHeight - w.clientHeight) / 2;
    document.getElementById('lienzo').scrollIntoView({ block: 'center' });
  })()`);
  await esperar(400);
  const yA5 = await ev(`window.scrollY`);
  const sA5 = await ev(leerScroll);
  const wcA5 = await ev(`(() => { const r = document.getElementById('lienzo').parentElement.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: wcA5[0], y: wcA5[1], id: 1 }] });
  for (const d of [30, 60, 90, 120]) {
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: wcA5[0] - d, y: wcA5[1] - d, id: 1 }] });
    await esperar(20);
  }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(200);
  const sA5b = await ev(leerScroll);
  ok(await ev(`window.scrollY`) === yA5 && sA5b[0] > sA5[0] && sA5b[1] > sA5[1],
    `TACTIL A5: a 3x el arrastre mueve el dibujo y no la pagina (scrollY ${yA5} -> ${await ev(`window.scrollY`)})`);

  // A1 lento: un dibujo que cabe entero no puede desplazarse dentro del contenedor, asi que
  // cada movimiento (aunque sea de 0,8 px) debe pasar a la pagina.
  await ev(`(() => {
    const f = document.getElementById('forma'); f.value = 'circulo'; f.dispatchEvent(new Event('input'));
    const w = document.getElementById('w'); w.value = '16'; w.dispatchEvent(new Event('change'));
  })()`);
  await esperar(400);
  await ev(`(() => {
    const z = document.getElementById('zoom'); z.value = 8; z.dispatchEvent(new Event('input'));
    const w = document.getElementById('lienzo').parentElement; w.scrollLeft = 0; w.scrollTop = 0;
    window.scrollTo(0, 0);
  })()`);
  await esperar(300);
  const lento0 = await ev(`(() => { const c = document.getElementById('lienzo'), w = c.parentElement;
    return { y: window.scrollY, st: w.scrollTop, cabe: c.offsetWidth <= w.clientWidth && c.offsetHeight <= w.clientHeight }; })()`);
  const lentoProg = await prog();
  const wcLento = await ev(`(() => { const r = document.getElementById('lienzo').parentElement.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: wcLento[0], y: wcLento[1], id: 1 }] });
  for (let i = 1; i <= 120; i++) {
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: wcLento[0], y: wcLento[1] - i * 0.8, id: 1 }] });
  }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(200);
  const lentoY = await ev(`window.scrollY`);
  ok(lento0.cabe && lentoY - lento0.y > 50 && await ev(`document.getElementById('lienzo').parentElement.scrollTop`) === lento0.st && await prog() === lentoProg,
    `TACTIL A1: arrastre lento (0,8 px) sobre un dibujo que cabe desplaza la pagina (scrollY ${lento0.y} -> ${lentoY})`);

  // C5: si la captura del puntero se pierde (dedo levantado fuera del lienzo), el dedo no
  // queda registrado: el siguiente toque sigue marcando en vez de empezar un pellizco.
  await ev(`(() => {
    const z = document.getElementById('zoom'); z.value = 26; z.dispatchEvent(new Event('input'));
    const w = document.getElementById('lienzo').parentElement; w.scrollLeft = 0; w.scrollTop = 0;
    window.scrollTo(0, 0);
  })()`);
  await esperar(300);
  const progC5 = await prog();
  const rectC5 = await ev(`(() => { const r = document.getElementById('lienzo').getBoundingClientRect(); return [r.left, r.top]; })()`);
  const pC5 = [rectC5[0] + L + 7 * 26 + 13, rectC5[1] + T + 7 * 26 + 13];
  await ev(`(() => {
    const c = document.getElementById('lienzo');
    const o = { pointerId: 77, pointerType: 'touch', clientX: ${pC5[0]}, clientY: ${pC5[1]}, bubbles: true, cancelable: true };
    c.dispatchEvent(new PointerEvent('pointerdown', o));
    c.dispatchEvent(new PointerEvent('lostpointercapture', o));
  })()`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pC5[0], y: pC5[1], id: 1 }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(200);
  const hechosC5 = t => +(t.match(/Construidos: (\d+)\//) || [])[1];
  ok(hechosC5(await prog()) === hechosC5(progC5) + 1,
    `TACTIL C5: al perderse la captura el dedo se suelta y el siguiente toque marca (${progC5} -> ${await prog()})`);

  // B4: con densidad 1 el navegador redondea el scroll a pixeles enteros. Un dedo muy lento
  // (menos de 1 px por evento) debe acabar moviendo el dibujo igualmente: el resto se acumula.
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 800, deviceScaleFactor: 1, mobile: true });
  await cargar(); await esperar(400);
  await ev(`(() => {
    const f = document.getElementById('forma'); f.value = 'circulo'; f.dispatchEvent(new Event('input'));
    const w = document.getElementById('w'); w.value = '200'; w.dispatchEvent(new Event('change'));
  })()`);
  await esperar(500);
  await ev(`(() => {
    const z = document.getElementById('zoom'); z.value = 6; z.dispatchEvent(new Event('input'));
    const w = document.getElementById('lienzo').parentElement;
    w.scrollLeft = (w.scrollWidth - w.clientWidth) / 2; w.scrollTop = (w.scrollHeight - w.clientHeight) / 2;
    document.getElementById('lienzo').scrollIntoView({ block: 'center' });
  })()`);
  await esperar(400);
  const yB4 = await ev(`window.scrollY`), sB4 = await ev(leerScroll);
  const wcB4 = await ev(`(() => { const r = document.getElementById('lienzo').parentElement.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: wcB4[0], y: wcB4[1], id: 1 }] });
  for (let i = 1; i <= 100; i++) {
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: wcB4[0] - i * 0.4, y: wcB4[1] - i * 0.4, id: 1 }] });
  }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(200);
  const sB4b = await ev(leerScroll);
  ok(sB4b[0] - sB4[0] >= 30 && sB4b[1] - sB4[1] >= 30 && await ev(`window.scrollY`) === yB4,
    `TACTIL B4: a 1x un arrastre de 0,4 px por evento mueve el dibujo (${sB4[0]},${sB4[1]} -> ${sB4b[0]},${sB4b[1]}) sin mover la pagina`);

  ok(errores.length === 0, 'Consola sin errores ' + (errores.length ? JSON.stringify(errores) : ''));
  ws.close(); cerrar();
})().catch(e => { console.error(e); cerrar(); process.exit(1); });
