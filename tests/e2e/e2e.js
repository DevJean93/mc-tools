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
// Caja del aviso temporal: margenes a cada lado, ancho y lineas que ocupa su texto.
const medirAviso = () => ev(`(() => {
  const a = document.getElementById('aviso'), t = document.getElementById('avisoTxt');
  const r = a.getBoundingClientRect(), vw = document.documentElement.clientWidth;
  return { visible: !a.hidden, izq: Math.round(r.left), der: Math.round(vw - r.right), ancho: Math.round(r.width),
    lineas: Math.round(t.getBoundingClientRect().height / parseFloat(getComputedStyle(t).lineHeight)), texto: t.textContent };
})()`);
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
    'MAR-09: con el almacenamiento bloqueado hay una nota fija y la app arranca');
  ok(await ev(`(() => { const n = document.getElementById('nota'); return n.getAttribute('role') === 'status' && n.querySelector('svg') && n.getBoundingClientRect().height > 0; })()`),
    'MAR-09: la nota es role=status, lleva icono y se ve');
  await shot('00-nota-almacenamiento.png');
  await esperar(5600);   // mas que lo que dura un aviso temporal
  ok(await ev(`!document.getElementById('nota').hidden`), 'MAR-09: la nota sigue visible pasados los 5 s de un aviso temporal');
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
    'MAR-08: sin escritura la nota dice que el navegador bloquea el almacenamiento');
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: soloLectura.identifier });
  await cargar();

  // A1: con el almacenamiento lleno la app sigue recuperando el progreso ya guardado y avisa
  // de que esta lleno (nunca de que esta bloqueado).
  await ev(`localStorage.clear(); localStorage.setItem('mc-formas-v1', JSON.stringify({ forma: 'triangulo', w: 21, h: 15, igualar: false }))`);
  await cargar();
  await ev(`document.getElementById('marcarTodo').click()`); await esperar(250);
  const progLleno = await prog();
  ok(progLleno.includes('159/159'), `MAR-11: preparado el progreso a recuperar (${progLleno})`);
  await ev(`(() => { let n = 0, trozo = 'x'.repeat(1 << 20); while (trozo.length) { try { localStorage.setItem('relleno' + n, trozo); n++; } catch (e) { trozo = trozo.slice(0, trozo.length >> 1); } } })()`);
  await cargar();
  ok(await ev(`document.getElementById('forma').value === 'triangulo'`) && await prog() === progLleno,
    `MAR-11: con el almacenamiento lleno se recupera el progreso (${await prog()})`);
  ok(await ev(`(() => { const n = document.getElementById('notaTxt').textContent, a = document.getElementById('avisoTxt').textContent; return !n.includes('bloquea') && !a.includes('bloquea'); })()`),
    'MAR-11: con el almacenamiento lleno no dice que el navegador lo bloquea');
  await ev(`localStorage.clear()`);
  await cargar();

  // 1) Estado corrupto -> arranca igual
  await cargar();
  await ev(`localStorage.setItem('mc-formas-v1', '{"forma":"foo","w":"abc","zoom":9999,"grosor":-3}'); localStorage.setItem('mc-formas-v1:marcas','{basura')`);
  await cargar();
  ok(await ev(`document.getElementById('forma').value === 'circulo' && document.querySelector('.tot').textContent.startsWith('208')`), 'MAR-10: localStorage corrupto -> circulo 16 por defecto (208)');
  await ev(`localStorage.clear()`); await cargar();
  await shot('01-inicio.png');
  ok(await ev(`(() => {
    const ops = [...document.getElementById('forma').options];
    return ops.length === Formas.FORMAS.length && ops.every(o => Formas.FORMAS.includes(o.value) && o.textContent === Formas.obtener(o.value).nombre);
  })()`), 'FOR-12: el selector de formas sale del registro (FORMAS + nombre)');
  ok(await ev(`[...document.getElementById('forma').options].map(o => o.textContent).join('|') ===
    'Círculo / Óvalo|Cuadrado / Rectángulo|Triángulo|Rombo|Hexágono|Esfera / Cúpula (3D)'`),
  'FOR-12: el selector conserva el orden Círculo, Cuadrado, Triángulo, Rombo, Hexágono, Esfera');
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
  ok(mutaciones === 0, 'FOR-12: escribir no reconstruye los selectores de forma y variante');
  // B1: la orientacion no depende del id de la forma sino de sus opciones declaradas.
  await ev(`(() => { const f = document.getElementById('forma'); f.value = 'hexagono'; f.dispatchEvent(new Event('input')); })()`);
  await esperar(200);
  const orientHex = await ev(`!document.getElementById('rowOrient').hidden`);
  await ev(`(() => { const f = document.getElementById('forma'); f.value = 'circulo'; f.dispatchEvent(new Event('input')); })()`);
  await esperar(200);
  ok(orientHex && await ev(`document.getElementById('rowOrient').hidden`),
    'FOR-13: la orientacion aparece solo en las formas que la ofrecen');

  // B2/B3: la orientacion y las variantes salen de la definicion de cada forma.
  const elegirForma = id => ev(`(() => { const f = document.getElementById('forma'); f.value = '${id}'; f.dispatchEvent(new Event('input')); })()`).then(() => esperar(200));
  await elegirForma('hexagono');
  ok(await ev(`[...document.getElementById('orient').options].map(o => o.value + ':' + o.textContent).join('|') ===
    Formas.obtener('hexagono').orientaciones.map(o => o.valor + ':' + o.etiqueta).join('|') &&
    document.getElementById('orient').options.length === 2`),
  'FOR-13: las orientaciones del selector salen de la definicion del hexagono');
  await ev(`(() => { const o = document.getElementById('orient'); o.value = 'punta'; o.dispatchEvent(new Event('input')); })()`);
  await esperar(200);
  await elegirForma('circulo'); await elegirForma('hexagono');
  ok(await ev(`document.getElementById('orient').value === 'punta'`), 'FOR-13: al volver al hexagono se recuerda la orientacion elegida');
  await cargar();
  ok(await ev(`document.getElementById('forma').value === 'hexagono' && document.getElementById('orient').value === 'punta' && !document.getElementById('rowOrient').hidden`),
    'FOR-13: la orientacion guardada se restaura al recargar');
  await ev(`localStorage.setItem('mc-formas-v1', JSON.stringify({ forma: 'esfera', w: 12, esfera: 'cupula' }))`); await cargar();
  ok(await ev(`document.getElementById('esfera').value === 'cupula' && document.getElementById('capaTxt').textContent.includes('de 6')`),
    'FOR-14: una cupula guardada se restaura (6 capas)');
  await ev(`localStorage.setItem('mc-formas-v1', JSON.stringify({ forma: 'esfera', w: 12, esfera: 'plano' }))`); await cargar();
  ok(await ev(`document.getElementById('esfera').value === 'esfera' && document.getElementById('capaTxt').textContent.includes('de 12')`),
    'FOR-14: una variante que no es de la forma cae en la primera (esfera, 12 capas)');
  await ev(`localStorage.clear()`); await cargar();

  // 2) Pintar arrastrando sobre la fila central (fila 8 = y 7)
  const geo = await ev(`(() => { const r = document.getElementById('lienzo').getBoundingClientRect(); return { l: r.left, t: r.top }; })()`);
  const L = 80, T = 42, s = 26; // Render con rel=true: L = 34+38+8, T = 22+20
  const P = (x, y) => [geo.l + L + x * s + s / 2, geo.t + T + y * s + s / 2];
  await mouse('mousePressed', ...P(0, 7));
  for (let x = 1; x <= 15; x++) await mouse('mouseMoved', ...P(x, 7));
  await mouse('mouseReleased', ...P(15, 7));
  await esperar(150);
  ok(await prog() === 'Construidos: 16/208 (8 %)', 'MAR-12: arrastre marca 16 bloques -> ' + await prog());
  await mouse('mousePressed', ...P(0, 7), 'right', 2); await mouse('mouseReleased', ...P(0, 7), 'right', 2);
  await esperar(100);
  ok(await prog() === 'Construidos: 15/208 (7 %)', 'MAR-12: clic derecho desmarca -> ' + await prog());

  // 3) Persistencia tras recargar
  await cargar();
  ok(await prog() === 'Construidos: 15/208 (7 %)', 'MAR-05: las marcas sobreviven a recargar -> ' + await prog());

  // 4) Zoom/toggles no tocan marcas; cambio de geometria limpia y avisa; deshacer restaura
  await ev(`(() => { const z = document.getElementById('zoom'); z.value = 30; z.dispatchEvent(new Event('input')); const t = document.getElementById('tramos'); t.click(); t.click(); })()`);
  await esperar(100);
  ok(await prog() === 'Construidos: 15/208 (7 %)', 'MAR-05: zoom/toggles conservan las marcas');
  await ev(`(() => { const w = document.getElementById('w'); w.value = 2; w.dispatchEvent(new Event('input')); w.value = 20; w.dispatchEvent(new Event('input')); })()`);
  await esperar(60);
  ok(await ev(`document.querySelector('.tot').textContent.startsWith('208')`), 'INT-01: no regenera mientras se escribe');
  await esperar(300);
  ok(await ev(`document.querySelector('.tot').textContent.startsWith('316')`), 'INT-01: tras 150 ms regenera (circulo 20 = 316)');
  ok(await ev(`!document.getElementById('aviso').hidden && document.getElementById('avisoTxt').textContent.includes('se limpiaron') && !document.getElementById('avisoAccion').hidden`), 'MAR-05: aviso de limpieza con boton Deshacer');
  await ctrl('z'); await esperar(150);
  ok(await ev(`document.getElementById('w').value === '16'`) && await prog() === 'Construidos: 15/208 (7 %)', 'MAR-04: Ctrl+Z restaura forma y marcas');
  await ctrl('y'); await esperar(150);
  ok(await ev(`document.getElementById('w').value === '20'`), 'MAR-04: Ctrl+Y rehace');
  await ctrl('z'); await esperar(150);

  // 5) Grosor maximo
  await ev(`(() => { const m = document.getElementById('modo'); m.value = 'hueco'; m.dispatchEvent(new Event('input')); const g = document.getElementById('grosor'); g.value = 40; g.dispatchEvent(new Event('change')); })()`);
  await esperar(150);
  ok(await ev(`document.getElementById('grosor').value === '7' && document.getElementById('maxG').textContent === '(máx. 7)' && document.getElementById('avisoTxt').textContent.includes('Grosor máximo')`), 'FOR-04: grosor 40 se recorta a 7 con aviso');
  await ctrl('z'); await esperar(150);
  ok(await ev(`document.getElementById('modo').value === 'relleno'`) && await prog() === 'Construidos: 15/208 (7 %)', 'MAR-05: deshacer vuelve a solido con las marcas');

  // 6) Teclado: foco en canvas, flecha arriba y Espacio
  await ev(`document.getElementById('lienzo').focus()`);
  await key('ArrowUp', 'ArrowUp', 38); await key(' ', 'Space', 32);
  await esperar(100);
  ok(await prog() === 'Construidos: 16/208 (8 %)' && (await ev(`document.getElementById('anuncio').textContent`)).includes('construido'), 'MAR-01: teclado marca la celda -> ' + await prog());
  await shot('02-teclado.png');

  // 6b) Marcar filas y columnas desde la regla (escritorio). Se empieza de cero: la regla
  // izquierda ocupa L = 80 px y la superior T = 42 px, con celdas de 26 px.
  await ev(`localStorage.clear()`);
  await cargar();
  await ev(`(() => { const z = document.getElementById('zoom'); z.value = 26; z.dispatchEvent(new Event('input')); })()`);
  await esperar(150);
  const rg = await ev(`(() => { const r = document.getElementById('lienzo').getBoundingClientRect(); return { l: r.left, t: r.top }; })()`);
  const filaP = y => [rg.l + 20, rg.t + T + y * s + s / 2];       // banda izquierda
  const colP = x => [rg.l + L + x * s + s / 2, rg.t + 20];        // banda superior
  const anuncio = () => ev(`document.getElementById('anuncio').textContent`);

  await mouse('mousePressed', ...filaP(7)); await mouse('mouseReleased', ...filaP(7));
  await esperar(150);
  ok(await prog() === 'Construidos: 16/208 (8 %)', 'MAR-14: clic en la banda de la fila 8 marca sus 16 bloques -> ' + await prog());
  ok(await ev(`!document.getElementById('aviso').hidden && document.getElementById('avisoTxt').textContent.includes('fila 8') && !document.getElementById('avisoAccion').hidden`),
    'MAR-16: el aviso nombra la fila y ofrece Deshacer');
  const avisoEsc = await medirAviso();
  ok(avisoEsc.visible && Math.abs(avisoEsc.izq - avisoEsc.der) <= 2 && avisoEsc.ancho <= 560 && avisoEsc.lineas === 1,
    `INT-08: en escritorio el aviso queda centrado y en una linea (${JSON.stringify(avisoEsc)})`);
  ok((await anuncio()).startsWith('Fila 8: 16 bloques marcados'), 'MAR-16: se anuncia «Fila 8: 16 bloques marcados» -> ' + await anuncio());
  await shot('02b-fila-marcada.png');

  await mouse('mousePressed', ...filaP(7)); await mouse('mouseReleased', ...filaP(7));
  await esperar(150);
  ok(await prog() === 'Construidos: 0/208 (0 %)', 'MAR-14: otro clic en la misma fila la desmarca entera -> ' + await prog());

  await mouse('mousePressed', ...filaP(7)); await mouse('mouseReleased', ...filaP(7));
  await esperar(100);
  await ctrl('z'); await esperar(150);
  ok(await prog() === 'Construidos: 0/208 (0 %)', 'MAR-16: Ctrl+Z deshace la fila entera en un solo paso -> ' + await prog());

  await mouse('mousePressed', ...colP(7)); await mouse('mouseReleased', ...colP(7));
  await esperar(150);
  ok(await prog() === 'Construidos: 16/208 (8 %)', 'MAR-15: clic en la banda de la columna 8 marca sus 16 bloques -> ' + await prog());
  ok((await anuncio()).startsWith('Columna 8: 16 bloques marcados'), 'MAR-15: se anuncia «Columna 8: 16 bloques marcados» -> ' + await anuncio());
  await ctrl('z'); await esperar(150);
  ok(await prog() === 'Construidos: 0/208 (0 %)', 'MAR-16: Ctrl+Z tambien deshace la columna');

  // La regla es interactiva: cursor de mano y explicacion en la linea de informacion.
  await mouse('mouseMoved', ...filaP(7), 'none', 0);
  ok(await ev(`document.getElementById('lienzo').style.cursor`) === 'pointer', 'MAR-14: el cursor es de mano sobre la regla');
  ok((await ev(`document.getElementById('info').textContent`)).includes('toda la fila o columna'), 'MAR-14: la informacion explica el clic en la regla');
  await mouse('mouseMoved', rg.l + L + 8 * s + 13, rg.t + T + 7 * s + 13, 'none', 0);
  ok(await ev(`document.getElementById('lienzo').style.cursor`) === '', 'MAR-14: sobre el dibujo el cursor vuelve a lo normal');

  // NUM-14: la posicion respecto al centro usa la cuenta de la regla, con flechas y sin signos.
  const infoEn = async (cx, cy) => { await mouse('mouseMoved', rg.l + L + cx * s + 13, rg.t + T + cy * s + 13, 'none', 0); return ev(`document.getElementById('info').textContent`); };
  const infoNO = await infoEn(2, 4), infoSE = await infoEn(13, 12), infoCentro = await infoEn(7, 7);
  ok(infoNO.includes('relativo al centro (← 6, ↑ 4)') && infoSE.includes('relativo al centro (→ 6, ↓ 5)') &&
    infoCentro.includes('relativo al centro (1, 1)') && !/\(-|, -/.test(infoNO + infoSE + infoCentro),
  `NUM-14: la informacion del bloque usa flechas y la cuenta de la regla (${infoNO.split(' · ')[1]} | ${infoSE.split(' · ')[1]} | ${infoCentro.split(' · ')[1]})`);

  // MAR-17: con el dibujo enfocado, F alterna la fila del cursor y C su columna.
  await ev(`document.getElementById('lienzo').focus()`);
  await key('f', 'KeyF', 70); await esperar(150);
  ok(await prog() === 'Construidos: 16/208 (8 %)' && (await anuncio()).startsWith('Fila 8: 16 bloques marcados'),
    'MAR-17: F marca la fila del cursor -> ' + await prog());
  await key('f', 'KeyF', 70); await esperar(150);
  ok(await prog() === 'Construidos: 0/208 (0 %)' && (await anuncio()).startsWith('Fila 8: 16 bloques desmarcados'),
    'MAR-17: F otra vez la desmarca -> ' + await prog());
  await key('c', 'KeyC', 67); await esperar(150);
  ok(await prog() === 'Construidos: 16/208 (8 %)' && (await anuncio()).startsWith('Columna 8: 16 bloques marcados'),
    'MAR-17: C marca la columna del cursor -> ' + await prog());
  await shot('02c-columna-teclado.png');
  await ctrl('z'); await esperar(150);
  ok(await ev(`(() => { const s = document.querySelector('#ayudaLienzo .solo-raton'); return s.getBoundingClientRect().height > 0 && s.textContent.includes('clic en el número de la regla marca la fila o columna entera') && s.textContent.includes('F marca la fila del cursor y C su columna'); })()`),
    'INT-07: la ayuda de ratón y teclado explica el gesto de marcar filas y columnas');

  // 7) Esfera: capas, marcar capa, tabla
  await ev(`(() => { const f = document.getElementById('forma'); f.value = 'esfera'; f.dispatchEvent(new Event('input')); const w = document.getElementById('w'); w.value = 11; w.dispatchEvent(new Event('change')); })()`);
  await esperar(200);
  ok(await ev(`document.getElementById('capa').max === '10' && document.getElementById('rowH').hidden && document.getElementById('w').max === '100'`), 'FOR-02: esfera 11 capas, alto oculto, max 100');
  await ev(`document.getElementById('marcarCapa').click()`);
  await esperar(100);
  ok(await ev(`document.querySelector('tr.sel').textContent.includes('100 %')`), 'MAR-02: marcar capa -> 100 % en la tabla');
  // MAT-10: los numeros del desglose en negrita; etiquetas y tabla por capas en peso normal.
  const pesos = await ev(`(() => {
    const peso = el => +getComputedStyle(el).fontWeight;
    const nums = [...document.querySelectorAll('#materiales .mat b')], etiquetas = [...document.querySelectorAll('#materiales .mat span')];
    return { n: nums.length, numeros: nums.map(peso), etiquetas: etiquetas.map(peso),
      tabla: [...document.querySelectorAll('#tablaCapas td')].map(peso).slice(0, 8) };
  })()`);
  ok(pesos.n === 5 && pesos.numeros.every(w => w >= 600) && pesos.etiquetas.every(w => w <= 500) && pesos.tabla.length > 0 && pesos.tabla.every(w => w <= 500),
    `MAT-10: los numeros del desglose en negrita y las etiquetas y la tabla en peso normal (${JSON.stringify(pesos)})`);
  await shot('03-esfera.png');

  // 8) Accesibilidad basica
  ok(await ev(`[...document.querySelectorAll('button')].every(b => b.textContent.trim() || b.getAttribute('aria-label'))`), 'INT-02: todos los botones tienen nombre accesible');
  ok(await ev(`!!document.getElementById('lienzo').getAttribute('aria-label') && document.getElementById('lienzo').tabIndex === 0`), 'INT-02: canvas enfocable con aria-label');

  // 9) Export PNG. Se borran antes los PNG de la esfera de ejecuciones anteriores.
  const borrarPngs = () => { for (const f of fs.readdirSync(OUT).filter(f => /^esfera-11.*\.png$/.test(f))) fs.unlinkSync(path.join(OUT, f)); };
  borrarPngs();
  const esperado = await ev(`(() => {
    const m = document.getElementById('modo').value, g = document.getElementById('grosor').value, c = +document.getElementById('capa').value;
    return 'esfera-11' + (m === 'hueco' ? '-hueco-g' + g : '') + '-capas11-capa' + (c + 1) + '.png';
  })()`);
  await ev(`document.getElementById('exportar').click()`);
  await esperar(1500);
  const pngs = fs.readdirSync(OUT).filter(f => f.startsWith('esfera-11'));
  ok(pngs.length === 1 && pngs[0] === esperado, `MAT-07: PNG de la capa exportado como ${esperado} (${pngs.join(',')})`);
  borrarPngs();
  await ev(`window.confirm = () => true; document.getElementById('exportarTodas').click()`);
  for (let i = 0; i < 40 && fs.readdirSync(OUT).filter(f => /^esfera-11.*-capas11-capa\d+\.png$/.test(f)).length < 11; i++) await esperar(250);
  await esperar(600);
  const todasPngs = fs.readdirSync(OUT).filter(f => /^esfera-11.*-capas11-capa\d+\.png$/.test(f));
  ok(todasPngs.length === 11 && (await ev(`document.getElementById('avisoTxt').textContent`)).includes('Exportadas 11 capas'),
    `MAT-08: «Todas las capas» descarga una imagen por capa (${todasPngs.length} de 11) y avisa al terminar`);

  // 10) Zoom con formas grandes
  const zoom = () => ev(`+document.getElementById('zoom').value`);
  const cabe = () => ev(`(() => { const c = document.getElementById('lienzo'), w = c.parentElement; return c.offsetWidth <= w.clientWidth && c.offsetHeight <= w.clientHeight; })()`);
  await ev(`(() => { const f = document.getElementById('forma'); f.value = 'circulo'; f.dispatchEvent(new Event('input')); const w = document.getElementById('w'); w.value = 200; w.dispatchEvent(new Event('change')); })()`);
  await esperar(400);
  const zAuto = await zoom();
  ok(zAuto < 26 && await cabe(), `ZOO-03: circulo 200 se aleja solo hasta caber (zoom ${zAuto})`);
  await shot('05-circulo200.png');
  await ev(`document.getElementById('zoomMas').click()`); await esperar(100);
  const zMas = await zoom();
  ok(zMas > zAuto, `ZOO-01: boton + acerca (${zAuto} -> ${zMas})`);
  await ev(`document.getElementById('zoomMenos').click()`); await esperar(100);
  ok(await zoom() < zMas, `ZOO-01: boton - aleja (${zMas} -> ${await zoom()})`);
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
  ok(await zoom() > z0 && celdaAntes === celdaDespues, `ZOO-04: Ctrl+rueda acerca hacia el puntero (${z0} -> ${await zoom()}; ${celdaAntes} | ${celdaDespues})`);
  await shot('06-zoom-puntero.png');
  // Teclado: 0 ajusta, + acerca
  await ev(`document.getElementById('lienzo').focus()`);
  await key('0', 'Digit0', 48); await esperar(100);
  ok(await zoom() === zAuto && await cabe(), 'ZOO-02: tecla 0 ajusta a la ventana');
  await key('+', 'Equal', 187); await esperar(100);
  ok(await zoom() > zAuto, 'ZOO-01: tecla + acerca');
  // Pellizco tactil con dos dedos
  await key('0', 'Digit0', 48); await esperar(100);
  const c0 = await ev(`(() => { const r = document.getElementById('lienzo').getBoundingClientRect(); return [r.left + 200, r.top + 200]; })()`);
  const zp = await zoom();
  const tp = d => [{ x: c0[0] - d, y: c0[1], id: 1 }, { x: c0[0] + d, y: c0[1], id: 2 }];
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(20) });
  for (const d of [30, 40, 50, 60]) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(d) }); await esperar(30); }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(150);
  ok(await zoom() >= zp * 2.5, `TAC-03: pellizcar con dos dedos acerca (${zp} -> ${await zoom()})`);
  // Zoom no borra marcas ni regenera
  ok((await prog()).startsWith('Construidos:'), 'ZOO-05: progreso intacto');

  // INT-06: en escritorio el menu se oculta y se muestra, y la preferencia se recuerda al recargar.
  await cargar();
  const estadoMenu = () => ev(`(() => ({
    oculto: document.getElementById('panel').hidden,
    ancho: document.querySelector('main').classList.contains('sin-menu'),
    aria: document.getElementById('verMenu').getAttribute('aria-expanded'),
  }))()`);
  const menu0 = await estadoMenu();
  await ev(`document.getElementById('verMenu').click()`); await esperar(150);
  const menu1 = await estadoMenu();
  await cargar();
  const menu2 = await estadoMenu();
  await ev(`document.getElementById('verMenu').click()`); await esperar(150);
  const menu3 = await estadoMenu();
  ok(!menu0.oculto && menu0.aria === 'true' && menu1.oculto && menu1.ancho && menu1.aria === 'false' &&
    menu2.oculto && menu2.aria === 'false' && !menu3.oculto && !menu3.ancho && menu3.aria === 'true',
  'INT-06: en escritorio el menu se oculta, el dibujo ocupa todo el ancho y la preferencia se recuerda al recargar');

  // NUM-15: reglas fijas al desplazar. Circulo de 60 con zoom 24: no cabe y se desplaza.
  await ev(`localStorage.setItem('mc-formas-v1', JSON.stringify({ forma: 'circulo', w: 60, h: 60, igualar: true, zoom: 24, rel: true }))`);
  await cargar();
  // Al cargar, la app aleja el zoom hasta que la forma cabe: se acerca despues, como haria el usuario.
  await ev(`(() => { const z = document.getElementById('zoom'); z.value = 24; z.dispatchEvent(new Event('input')); })()`);
  await esperar(300);
  const irA = (sl, st) => ev(`(() => { const w = document.querySelector('.lienzoWrap'); w.scrollLeft = ${sl}; w.scrollTop = ${st}; })()`).then(() => esperar(200));
  // Estado de las reglas fijas: cajas respecto al contenedor, tamano del scroll y pixeles que difieren de
  // la regla real (la regla fija debe ser identica a la del dibujo en la misma posicion).
  const reglasFijas = () => ev(`(() => {
    const w = document.querySelector('.lienzoWrap'), cv = document.getElementById('lienzo');
    const ancla = document.querySelector('.reglasFijas'), sup = document.getElementById('reglaSup'), izq = document.getElementById('reglaIzq');
    if (!ancla || !sup || !izq) return { ausente: true };
    const rw = w.getBoundingClientRect(), rc = cv.getBoundingClientRect(), ra = ancla.getBoundingClientRect();
    const caja = c => { const r = c.getBoundingClientRect(); return { izq: Math.round(r.left - rw.left - w.clientLeft), arr: Math.round(r.top - rw.top - w.clientTop), ancho: Math.round(r.width), alto: Math.round(r.height) }; };
    const cs = getComputedStyle(w), rx = parseFloat(cs.paddingLeft), ry = parseFloat(cs.paddingTop);
    // Posicion REAL del origen: donde cae el ancla sobre el dibujo (no la formula de la app).
    const x0 = Math.round(ra.left - rc.left), y0 = Math.round(ra.top - rc.top);
    const dpr = window.devicePixelRatio || 1, real = cv.getContext('2d');
    const L = Math.round(80 * dpr), T = Math.round(42 * dpr), rxp = Math.round(rx * dpr), ryp = Math.round(ry * dpr);
    // Compara una zona de la regla fija con la zona del dibujo que le corresponde (en pixeles).
    const difiere = (c, cu, cvv, cx, cy, ancho, alto) => {
      if (c.hidden || ancho <= 0 || alto <= 0) return -1;
      const a = c.getContext('2d').getImageData(cu, cvv, ancho, alto).data, b = real.getImageData(cx, cy, ancho, alto).data;
      let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++;
      return n;
    };
    // Superior: el lienzo (u, v) es el ancla (u - rx, v - ry); la banda del dibujo (x >= L, y < T) cae en u = x - x0 + rx, v = y + ry.
    const uSup = rxp + L, wSup = Math.min(sup.width - uSup, real.canvas.width - Math.round(x0 * dpr) - L);
    const vIzq = ryp + T, hIzq = Math.min(izq.height - vIzq, real.canvas.height - Math.round(y0 * dpr) - T);
    return {
      supOculta: sup.hidden, izqOculta: izq.hidden, sup: caja(sup), izq: caja(izq), sw: w.scrollWidth, sh: w.scrollHeight,
      cw: w.clientWidth, ch: w.clientHeight, x0, y0, st: w.scrollTop, sl: w.scrollLeft, aria: ancla.getAttribute('aria-hidden'),
      eventos: getComputedStyle(sup).pointerEvents + '/' + getComputedStyle(izq).pointerEvents,
      difSup: difiere(sup, uSup, ryp, L + Math.round(x0 * dpr), 0, wSup, T),
      difIzq: difiere(izq, rxp, vIzq, 0, T + Math.round(y0 * dpr), L, hIzq),
    };
  })()`);

  await irA(0, 0);
  const base = await reglasFijas();
  ok(!base.ausente && base.supOculta && base.izqOculta, 'NUM-15: sin desplazar no hay reglas fijas');
  await irA(500, 400);
  const fija = await reglasFijas();
  ok(!fija.ausente && !fija.supOculta && !fija.izqOculta &&
    fija.sup.izq === 0 && fija.sup.arr === 0 && fija.sup.ancho === fija.cw &&
    fija.izq.izq === 0 && fija.izq.arr === 0 && fija.izq.alto === fija.ch,
  `NUM-15: desplazado en los dos ejes, las reglas quedan fijas en el borde visible (${JSON.stringify({ sup: fija.sup, izq: fija.izq, cw: fija.cw, ch: fija.ch })})`);
  ok(!fija.ausente && fija.x0 === fija.sl && fija.y0 === fija.st,
    `NUM-15: el origen visible del dibujo es exactamente lo desplazado (x0=${fija.x0} sl=${fija.sl}, y0=${fija.y0} st=${fija.st})`);
  ok(!fija.ausente && fija.sw === base.sw && fija.sh === base.sh, `NUM-15: las reglas fijas no anaden desplazamiento (${fija.sw}x${fija.sh} = ${base.sw}x${base.sh})`);
  ok(fija.difSup === 0 && fija.difIzq === 0,
    `NUM-15: los numeros de la regla fija son los de las columnas y filas visibles (pixeles distintos: sup ${fija.difSup}, izq ${fija.difIzq})`);
  ok(fija.aria === 'true' && fija.eventos === 'none/none', 'NUM-15: las reglas fijas son decorativas (aria-hidden) y no reciben eventos');
  await irA(0, 300);
  const soloV = await reglasFijas();
  ok(!soloV.supOculta && soloV.izqOculta && soloV.sup.izq + soloV.sup.ancho <= soloV.cw && soloV.sw === base.sw,
    `NUM-15: desplazado solo en vertical solo hay regla superior y no se sale del contenedor (${JSON.stringify(soloV.sup)})`);
  await irA(300, 0);
  const soloH = await reglasFijas();
  ok(soloH.supOculta && !soloH.izqOculta && soloH.izq.arr + soloH.izq.alto <= soloH.ch && soloH.sh === base.sh,
    `NUM-15: desplazado solo en horizontal solo hay regla izquierda y no se sale del contenedor (${JSON.stringify(soloH.izq)})`);
  // MAR-14, MAR-15: con las reglas fijas, el clic en su numero alterna la fila o columna del punto
  // del dibujo que corresponde, nunca un bloque suelto, y la esquina entre ellas no hace nada.
  await irA(500, 400);
  const puntoFijo = (ax, ay) => ev(`(() => {   // ax, ay: coordenadas respecto al ancla (borde visible del contenido)
    const w = document.querySelector('.lienzoWrap'), r = w.getBoundingClientRect(), cs = getComputedStyle(w);
    return [r.left + w.clientLeft + parseFloat(cs.paddingLeft) + ${ax}, r.top + w.clientTop + parseFloat(cs.paddingTop) + ${ay}];
  })()`);
  const clicEn = async (x, y) => { await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y); await esperar(150); };
  const bloquesDe = (eje, i) => ev(`(() => { const g = Formas.generar({ forma: 'circulo', w: 60, h: 60, modo: 'relleno', grosor: 1 }).capas[0];
    return ${JSON.stringify(eje)} === 'fila' ? g[${i}].filter(Boolean).length : g.filter(f => f[${i}]).length; })()`);
  const hechosN = async () => +(await prog()).match(/(\d+)\//)[1];
  // Fila: banda izquierda fija (ax dentro de [0, 80)) a 100 px por debajo de la regla superior fija.
  const filaVista = Math.floor((400 + 100) / 24);
  await clicEn(...await puntoFijo(40, 42 + 100));
  const nFila = await hechosN(), esperadoFila = await bloquesDe('fila', filaVista);
  ok(nFila === esperadoFila && nFila > 1, `MAR-14: clic en la regla izquierda fija marca la fila ${filaVista + 1} entera (${nFila} de ${esperadoFila}), no un bloque`);
  await clicEn(...await puntoFijo(40, 42 + 100));
  ok(await hechosN() === 0, 'MAR-14: otro clic en la regla izquierda fija la desmarca');
  // Columna: banda superior fija a 100 px a la derecha de la regla izquierda fija.
  const colVista = Math.floor((500 + 100) / 24);
  await clicEn(...await puntoFijo(80 + 100, 20));
  const nCol = await hechosN(), esperadoCol = await bloquesDe('columna', colVista);
  ok(nCol === esperadoCol && nCol > 1, `MAR-15: clic en la regla superior fija marca la columna ${colVista + 1} entera (${nCol} de ${esperadoCol}), no un bloque`);
  await clicEn(...await puntoFijo(80 + 100, 20));
  ok(await hechosN() === 0, 'MAR-15: otro clic en la regla superior fija la desmarca');
  // Esquina entre las dos reglas fijas.
  await clicEn(...await puntoFijo(30, 20));
  ok(await hechosN() === 0, 'MAR-14, MAR-15: la esquina entre las dos reglas fijas no hace nada');
  // Un bloque visible, fuera de las reglas, sigue marcando solo ese bloque.
  await clicEn(...await puntoFijo(80 + 200, 42 + 200));
  ok(await hechosN() === 1, 'MAR-14: un clic en un bloque visible sigue marcando solo ese bloque');
  await clicEn(...await puntoFijo(80 + 200, 42 + 200));
  ok(await hechosN() === 0, 'MAR-14: y otro clic lo desmarca');
  // Cursor de mano e informacion sobre la regla fija.
  const [hx, hy] = await puntoFijo(40, 42 + 100);
  await mouse('mouseMoved', hx, hy, 'none', 0);
  ok(await ev(`document.getElementById('lienzo').style.cursor`) === 'pointer' &&
    (await ev(`document.getElementById('info').textContent`)).includes('toda la fila o columna'),
  'MAR-14: sobre la regla fija el cursor es de mano y la informacion explica el clic');
  await mouse('mouseMoved', ...await puntoFijo(80 + 200, 42 + 200), 'none', 0);
  ok(await ev(`document.getElementById('lienzo').style.cursor`) === '', 'MAR-14: sobre un bloque visible el cursor vuelve a lo normal');

  // El cursor del teclado no se queda bajo una regla fija: sube hasta salir de la zona visible.
  await ev(`document.getElementById('lienzo').focus()`);
  for (let i = 0; i < 14; i++) await key('ArrowUp', 'ArrowUp', 38);
  await esperar(150);
  const bajoRegla = await ev(`(() => {
    const w = document.querySelector('.lienzoWrap'), m = document.getElementById('info').textContent.match(/Columna ([0-9]+), fila ([0-9]+)/);
    if (!m) return { sinInfo: true, texto: document.getElementById('info').textContent, activo: document.activeElement.id };
    const py = 42 + (+m[2] - 1) * 24, px = 80 + (+m[1] - 1) * 24;   // zoom 24, regla relativa: L = 80, T = 42
    return { fila: +m[2], bajoSup: w.scrollTop > 0 && py < w.scrollTop + 42, bajoIzq: w.scrollLeft > 0 && px < w.scrollLeft + 80, st: w.scrollTop };
  })()`);
  ok(!bajoRegla.sinInfo && !bajoRegla.bajoSup && !bajoRegla.bajoIzq,
    `MAR-14: el cursor del teclado (fila ${bajoRegla.fila}) no queda tapado por las reglas fijas (scrollTop ${bajoRegla.st}${bajoRegla.sinInfo ? ', info: ' + bajoRegla.texto + ', activo: ' + bajoRegla.activo : ''})`);

  await irA(0, 0);
  const vuelta = await reglasFijas();
  ok(vuelta.supOculta && vuelta.izqOculta, 'NUM-15: al volver al origen las reglas fijas desaparecen');
  await ev(`localStorage.clear()`);
  await cargar();

  // MAR-19, MAR-20, MAR-21, MAR-22, INT-09: guardar y cargar un proyecto en un archivo (escritorio).
  await cargar();
  const proyectosGuardados = () => fs.readdirSync(OUT).filter(f => /^formas-mc-.*\.json$/.test(f));
  const borrarProyectos = () => { for (const f of proyectosGuardados()) fs.unlinkSync(path.join(OUT, f)); };
  const esperarProyecto = async () => { for (let i = 0; i < 25 && !proyectosGuardados().length; i++) await esperar(150); return proyectosGuardados(); };
  // Carga un texto como si el usuario hubiera elegido ese archivo en el selector.
  const cargarArchivo = texto => ev(`(() => {
    const i = document.getElementById('archivoProyecto'), dt = new DataTransfer();
    dt.items.add(new File([${JSON.stringify(texto)}], 'proyecto.json', { type: 'application/json' }));
    i.files = dt.files; i.dispatchEvent(new Event('change', { bubbles: true }));
  })()`).then(() => esperar(400));
  const aviso = () => ev(`(() => { const a = document.getElementById('aviso'); return { visible: !a.hidden, texto: document.getElementById('avisoTxt').textContent, accion: !document.getElementById('avisoAccion').hidden }; })()`);
  borrarProyectos();

  const secProy = await ev(`(() => {
    const s = document.getElementById('secProyecto'); if (!s) return null;
    const g = document.getElementById('guardarProyecto'), c = document.getElementById('cargarProyecto'), mat = document.getElementById('secMat');
    return { titulo: s.querySelector('h2').textContent, guardar: g && g.textContent.trim(), cargar: c && c.textContent.trim(),
      trasMateriales: !!(mat.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING), enElMenu: document.getElementById('panel').contains(s),
      ayuda: !!s.querySelector('.ayuda'), selectorOculto: document.getElementById('archivoProyecto').hidden };
  })()`);
  ok(secProy && secProy.titulo === 'Proyecto' && secProy.guardar === 'Guardar proyecto' && secProy.cargar === 'Cargar proyecto' &&
    secProy.trasMateriales && secProy.enElMenu && secProy.ayuda && secProy.selectorOculto,
  `INT-09: el menu tiene la seccion «Proyecto» con «Guardar proyecto» y «Cargar proyecto» (${JSON.stringify(secProy)})`);
  const abre = await ev(`(() => { const i = document.getElementById('archivoProyecto'); window.__abrio = 0;
    i.addEventListener('click', e => { e.preventDefault(); window.__abrio++; }); document.getElementById('cargarProyecto').click(); return window.__abrio; })()`);
  ok(abre === 1, 'INT-09: «Cargar proyecto» abre el selector de archivos del dispositivo');

  // MAR-19: «Guardar proyecto» descarga un archivo con la forma y las marcas (fila 8 marcada con F).
  await ev(`document.getElementById('lienzo').focus()`);
  await key('f', 'KeyF', 70); await esperar(200);
  ok((await prog()).startsWith('Construidos: 16/208'), 'MAR-19: preparado un proyecto con una fila marcada (' + await prog() + ')');
  await ev(`document.getElementById('guardarProyecto').click()`);
  const guardados = await esperarProyecto();
  const proyecto = guardados.length ? JSON.parse(fs.readFileSync(path.join(OUT, guardados[0]), 'utf8')) : null;
  ok(proyecto && guardados[0] === 'formas-mc-circulo-16x16.json' && proyecto.app === 'formas-mc' && proyecto.version === 1 &&
    proyecto.forma.forma === 'circulo' && proyecto.forma.w === 16 && proyecto.forma.modo === 'relleno' &&
    proyecto.marcas.porCapa['0'].length === 32 && !('zoom' in proyecto.forma) && !('rel' in proyecto.forma),
  `MAR-19: «Guardar proyecto» descarga ${guardados[0]} con la forma, las 16 marcas y sin zoom ni vista`);
  ok((await aviso()).texto === 'Proyecto guardado: formas-mc-circulo-16x16.json', 'MAR-19: al guardar sale un aviso con el nombre del archivo (' + (await aviso()).texto + ')');

  // MAR-20: cargar sustituye la forma y las marcas, con aviso y Deshacer.
  const textoProyecto = guardados.length ? fs.readFileSync(path.join(OUT, guardados[0]), 'utf8') : '{}';
  await ev(`(() => { const f = document.getElementById('forma'); f.value = 'rombo'; f.dispatchEvent(new Event('input')); })()`);
  await esperar(300);
  ok(await ev(`document.getElementById('forma').value === 'rombo'`) && (await prog()).startsWith('Construidos: 0/'), 'MAR-20: preparada otra forma sin marcas');
  await cargarArchivo(textoProyecto);
  const trasCargar = await aviso();
  ok(await ev(`document.getElementById('forma').value === 'circulo'`) && (await prog()).startsWith('Construidos: 16/208') &&
    trasCargar.texto === 'Proyecto cargado.' && trasCargar.accion,
  `MAR-20: cargar sustituye la forma y las marcas y ofrece Deshacer (${await prog()} · ${trasCargar.texto})`);
  await ev(`document.getElementById('avisoAccion').click()`); await esperar(300);
  ok(await ev(`document.getElementById('forma').value === 'rombo'`) && (await prog()).startsWith('Construidos: 0/'),
    'MAR-20: «Deshacer» del aviso devuelve la forma de antes de un solo paso');

  // MAR-21: un archivo que no es un proyecto, o de una version mas nueva, no cambia nada.
  await cargarArchivo('{"esto":"no es un proyecto"}');
  const noProy = await aviso();
  ok(noProy.texto.startsWith('No es un proyecto de Formas MC') && !noProy.accion && await ev(`document.getElementById('forma').value === 'rombo'`),
    `MAR-21: un archivo que no es un proyecto se rechaza con un mensaje y no cambia nada (${noProy.texto})`);
  await cargarArchivo('{"app":"formas-mc","version":99,"forma":{"forma":"circulo"}}');
  const nueva = await aviso();
  ok(nueva.texto.includes('versión más nueva') && await ev(`document.getElementById('forma').value === 'rombo'`),
    `MAR-21: un archivo de una version mas nueva se rechaza y dice que hay que actualizar (${nueva.texto})`);
  await shot('05-proyecto-error.png');

  // MAR-22: con el almacenamiento bloqueado, guardar y cargar funcionan y la nota fija sigue visible.
  const bloqueoProyecto = await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('bloqueado', 'SecurityError'); } });`,
  });
  await cargar(); borrarProyectos();
  await ev(`document.getElementById('lienzo').focus()`);
  await key('f', 'KeyF', 70); await esperar(200);
  await ev(`document.getElementById('guardarProyecto').click()`);
  const sinAlmacen = await esperarProyecto();
  await ev(`(() => { const f = document.getElementById('forma'); f.value = 'rombo'; f.dispatchEvent(new Event('input')); })()`);
  await esperar(300);
  if (sinAlmacen.length) await cargarArchivo(fs.readFileSync(path.join(OUT, sinAlmacen[0]), 'utf8'));
  ok(sinAlmacen.length === 1 && await ev(`document.getElementById('forma').value === 'circulo'`) && (await prog()).startsWith('Construidos: 16/208') &&
    await ev(`!document.getElementById('nota').hidden`),
  `MAR-22: con el almacenamiento bloqueado se guarda y se carga un proyecto y la nota fija sigue (${await prog()})`);
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: bloqueoProyecto.identifier });
  borrarProyectos();
  await cargar();   // la pagina actual sigue con el almacenamiento bloqueado: recargar antes de limpiarlo
  await ev(`localStorage.clear()`);
  await cargar();

  // INT-11, PUB-01: el pie muestra la version y todas las direcciones locales la llevan.
  const versiones = await ev(`(() => {
    const locales = [...document.querySelectorAll('script[src], link[rel="stylesheet"]')]
      .map(e => e.getAttribute('src') || e.getAttribute('href')).filter(d => !/^(https?:)?\\/\\//.test(d));
    const pie = document.getElementById('version');
    return { pie: pie ? pie.textContent : null, v: locales.map(d => new URLSearchParams(d.split('?')[1] || '').get('v')), n: locales.length,
      cargado: typeof Estado === 'object' && typeof Documento === 'object' && !!document.getElementById('lienzo').width };
  })()`);
  const vApp = versiones.v[versiones.v.length - 1];
  ok(versiones.n >= 19 && versiones.v.every(v => v && /^[0-9a-f]{8}$/.test(v) && v === vApp) && versiones.cargado,
    `PUB-01: los ${versiones.n} archivos locales llevan la misma version (${vApp}) y la app carga con file://`);
  ok(versiones.pie === `Versión ${vApp}`, `INT-11: el pie muestra la version de los archivos (${versiones.pie})`);

  // FOR-16, FOR-17, FOR-18, INT-10: enlace para compartir una forma (escritorio).
  // Para abrir un enlace hay que salir de la pagina: navegar solo cambiando el # no la recarga.
  const abrirEnlace = async fragmento => {
    await send('Page.navigate', { url: 'about:blank' }); await esperar(250);
    await send('Page.navigate', { url: URL_APP + (fragmento ? '#' + fragmento : '') }); await esperar(1500);
  };
  const formaVista = () => ev(`(() => ({ forma: document.getElementById('forma').value, w: +document.getElementById('w').value,
    modo: document.getElementById('modo').value, grosor: +document.getElementById('grosor').value, hash: location.hash, href: location.href }))()`);
  const sustituirPortapapeles = escribir => ev(`(() => { window.__copiado = null;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: ${escribir} } }); })()`);
  await ev(`localStorage.clear()`);

  // FOR-17: abrir un enlace muestra esa forma y quita el # de la barra de direcciones.
  await abrirEnlace('forma=circulo&w=30&modo=hueco&grosor=2');
  const conEnlace = await formaVista();
  ok(conEnlace.forma === 'circulo' && conEnlace.w === 30 && conEnlace.modo === 'hueco' && conEnlace.grosor === 2 && conEnlace.hash === '' && !conEnlace.href.includes('#'),
    `FOR-17: abrir un enlace muestra la forma del enlace y deja la direccion sin # (${JSON.stringify(conEnlace)})`);
  ok(await ev(`document.getElementById('lienzo').getBoundingClientRect().width > 0`) && (await prog()).startsWith('Construidos: 0/'), 'FOR-17: la forma del enlace se dibuja');

  // INT-10, FOR-16: «Copiar enlace» deja la direccion con la forma actual y lo avisa.
  const botonEnlace = await ev(`(() => { const b = document.getElementById('copiarEnlace'); if (!b) return null;
    const s = document.getElementById('secProyecto'); return { texto: b.textContent.trim(), enSeccion: s.contains(b), oculto: b.hidden }; })()`);
  ok(botonEnlace && botonEnlace.texto === 'Copiar enlace' && botonEnlace.enSeccion && !botonEnlace.oculto,
    `INT-10: la seccion «Proyecto» tiene el boton «Copiar enlace» (${JSON.stringify(botonEnlace)})`);
  await sustituirPortapapeles(`t => { window.__copiado = t; return Promise.resolve(); }`);
  await ev(`document.getElementById('copiarEnlace').click()`); await esperar(300);
  const copiado = await ev(`window.__copiado`);
  ok(copiado === URL_APP + '#forma=circulo&w=30&h=30&igualar=1&modo=hueco&grosor=2&esfera=esfera&orient=plano&capa=0',
    'FOR-16: «Copiar enlace» copia la direccion de la app con la forma actual -> ' + copiado);
  ok((await aviso()).texto === 'Enlace copiado.', 'INT-10: al copiar sale «Enlace copiado.» -> ' + (await aviso()).texto);

  // INT-10: sin portapapeles el aviso muestra el enlace entero, seleccionado.
  await sustituirPortapapeles(`() => Promise.reject(new Error('sin permiso'))`);
  await ev(`document.getElementById('copiarEnlace').click()`); await esperar(300);
  const aMano = await ev(`(() => ({ aviso: document.getElementById('avisoTxt').textContent, seleccion: String(getSelection()),
    visible: !document.getElementById('aviso').hidden }))()`);
  ok(aMano.visible && aMano.aviso.includes(copiado) && aMano.seleccion.includes(copiado),
    `INT-10: sin portapapeles el aviso muestra el enlace y lo deja seleccionado (${aMano.aviso.slice(0, 60)}…)`);
  await shot('08-enlace-a-mano.png');

  // FOR-17: valores no validos y fragmentos ajenos.
  await ev(`localStorage.clear()`);
  await abrirEnlace('forma=nada&w=999&grosor=-3');
  const invalido = await formaVista();
  ok(invalido.forma === 'circulo' && invalido.w === 200 && invalido.hash === '',
    `FOR-17: un enlace con valores no validos arranca con valores validos (${JSON.stringify(invalido)})`);
  await ev(`localStorage.clear()`);
  await abrirEnlace('forma=rombo&w=12');
  await abrirEnlace('hola');
  const ajeno = await formaVista();
  ok(ajeno.forma === 'rombo' && ajeno.w === 12 && ajeno.hash === '#hola',
    `FOR-17: un fragmento que no es de forma se ignora: arranca con lo guardado y no lo quita (${JSON.stringify(ajeno)})`);

  // FOR-18: con marcas y otra geometria, aviso con Deshacer que devuelve forma y marcas.
  await ev(`localStorage.clear()`);
  await abrirEnlace('forma=circulo&w=16&modo=relleno');
  await ev(`document.getElementById('lienzo').focus()`);
  await key('f', 'KeyF', 70); await esperar(250);
  ok((await prog()).startsWith('Construidos: 16/208'), 'FOR-18: preparado un circulo de 16 con una fila marcada -> ' + await prog());
  await abrirEnlace('forma=circulo&w=16&modo=relleno&capa=0');
  ok((await prog()).startsWith('Construidos: 16/208') && !(await aviso()).visible,
    'FOR-18: con la misma geometria las marcas siguen y no sale ningun aviso -> ' + await prog());
  await abrirEnlace('forma=rombo&w=20');
  const trasEnlace = await aviso();
  ok((await formaVista()).forma === 'rombo' && (await prog()).startsWith('Construidos: 0/') &&
    trasEnlace.texto === 'Se abrió la forma del enlace. Tu progreso anterior se borró.' && trasEnlace.accion,
  `FOR-18: con otra geometria se borran las marcas y sale el aviso con Deshacer (${trasEnlace.texto})`);
  await ev(`document.getElementById('avisoAccion').click()`); await esperar(300);
  ok((await formaVista()).forma === 'circulo' && (await prog()).startsWith('Construidos: 16/208'),
    'FOR-18: «Deshacer» devuelve el circulo y sus marcas -> ' + await prog());
  await ev(`localStorage.clear()`);
  await cargar();

  // INT-12, NUM-16, NUM-17: guias de chunk (escritorio). Circulo de 16 a 26 px: L = 80, T = 42.
  await ev(`localStorage.clear()`); await cargar();
  const lienzoImg = () => ev(`document.getElementById('lienzo').toDataURL()`);
  const escribir = (id, v) => ev(`(() => { const e = document.getElementById('${id}'); e.value = '${v}'; e.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  const casilla = (id, v) => ev(`(() => { const e = document.getElementById('${id}'); e.checked = ${v}; e.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  // Posiciones (en px del lienzo) con el color de la guia (#E879F9) a lo largo de una fila o columna.
  const guiasEn = (eje, fijo) => ev(`(() => { const c = document.getElementById('lienzo'), d = window.devicePixelRatio || 1, x = c.getContext('2d');
    const w = c.width, h = c.height, n = '${eje}' === 'fila' ? w : h;
    const datos = '${eje}' === 'fila' ? x.getImageData(0, Math.round(${fijo} * d), w, 1).data : x.getImageData(Math.round(${fijo} * d), 0, 1, h).data;
    const r = []; for (let i = 0; i < n; i++) { const p = i * 4; if (Math.abs(datos[p] - 232) < 12 && Math.abs(datos[p + 1] - 121) < 12 && Math.abs(datos[p + 2] - 249) < 12) r.push(Math.round(i / d)); }
    return r; })()`);
  const filaCoords = () => ev(`(() => { const f = document.getElementById('filaCentroMundo'), x = document.getElementById('centroX'), z = document.getElementById('centroZ');
    return f ? { visible: !f.hidden, x: x.value, z: z.value, etX: x.closest('label').textContent.trim(), etZ: z.closest('label').textContent.trim(),
      ayuda: document.getElementById('ayudaGuias').textContent, leyenda: !document.getElementById('leyendaGuias').hidden } : null; })()`);

  await ev(`document.getElementById('lienzo').focus()`);
  await key('f', 'KeyF', 70); await esperar(250);
  const trasMarcar = await aviso();
  const imgBase = await lienzoImg();
  const ini = await ev(`(() => { const c = document.getElementById('guiasChunk'); const f = document.getElementById('filaCentroMundo');
    return c ? { marcada: c.checked, enVista: !!c.closest('section') && c.closest('section').querySelector('h2').textContent === 'Vista', fila: f ? f.hidden : null } : null; })()`);
  ok(ini && ini.enVista && !ini.marcada && ini.fila === true, `INT-12: «Guias de chunk» esta en «Vista», apagada y sin los campos (${JSON.stringify(ini)})`);

  // NUM-17: activada sin coordenadas, el panel las pide y el dibujo no cambia.
  await casilla('guiasChunk', true); await esperar(250);
  const sinCoords = await filaCoords();
  ok(sinCoords && sinCoords.visible && sinCoords.etX.includes('X del centro') && sinCoords.etZ.includes('Z del centro') && sinCoords.x === '' && sinCoords.z === '' &&
    /Escribe la X y la Z del bloque central/.test(sinCoords.ayuda) && !sinCoords.leyenda,
  `INT-12: al activarla aparecen X y Z del centro y el panel pide las coordenadas (${JSON.stringify(sinCoords)})`);
  ok(await lienzoImg() === imgBase, 'NUM-17: con la opcion activada pero sin coordenadas el dibujo no cambia');

  // NUM-16: con X = 100 y Z = -40 hay una guia entre las columnas 2 y 3 (x = 80 + 3 * 26) y otra entre las filas 14 y 15 (y = 42 + 15 * 26).
  await escribir('centroX', '100'); await escribir('centroZ', '-40'); await esperar(300);
  const vert = await guiasEn('fila', 42 + 7 * 26 + 13), horiz = await guiasEn('columna', 80 + 100);
  ok(vert.length >= 1 && vert.every(x => Math.abs(x - 158) <= 1) && horiz.length >= 1 && horiz.every(y => Math.abs(y - 432) <= 1),
    `NUM-16: con X=100 y Z=-40 hay una sola guia vertical en x=158 y una horizontal en y=432 (verticales ${JSON.stringify(vert)}, horizontales ${JSON.stringify(horiz)})`);
  ok(vert.length === 2 && horiz.length === 2, `NUM-16: la guia mide 2 px de grosor (${vert.length} x ${horiz.length})`);
  const conGuias = await filaCoords();
  ok(conGuias.leyenda && /frontera/i.test(await ev(`document.getElementById('leyendaGuias').textContent`)) && !/Escribe la X y la Z/.test(conGuias.ayuda),
    'NUM-16: con guias visibles la leyenda las explica y la ayuda cambia');
  ok((await prog()).startsWith('Construidos: 16/208') && (await aviso()).texto === trasMarcar.texto,
    'NUM-17: cambiar las coordenadas no toca las marcas ni saca ningun aviso -> ' + await prog());

  // NUM-16: tambien salen en el PNG exportado.
  await ev(`(() => { const o = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function (cb, t, q) { window.__png = this; return o.call(this, cb, t, q); }; })()`);
  await ev(`document.getElementById('exportar').click()`); await esperar(700);
  const enPng = await ev(`(() => { const c = window.__png; if (!c) return -1; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0;
    for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 232) < 12 && Math.abs(d[i + 1] - 121) < 12 && Math.abs(d[i + 2] - 249) < 12) n++; return n; })()`);
  ok(enPng > 100, `NUM-16: el PNG exportado lleva las guias (${enPng} pixeles del color de la guia)`);

  // INT-12: apagar las guias oculta los campos pero conserva los valores, y el dibujo vuelve a ser el de antes.
  await casilla('guiasChunk', false); await esperar(250);
  const apagada = await filaCoords();
  ok(!apagada.visible && apagada.x === '100' && apagada.z === '-40' && !apagada.leyenda, `INT-12: al apagarla se ocultan los campos y se conservan los valores (${JSON.stringify(apagada)})`);
  ok(await lienzoImg() === imgBase, 'NUM-17: con la opcion apagada el dibujo es identico al de antes, pixel a pixel');

  // INT-12: la casilla y las coordenadas se recuerdan al recargar.
  await casilla('guiasChunk', true); await esperar(250);
  await cargar();
  const recargada = await filaCoords();
  ok(await ev(`document.getElementById('guiasChunk').checked`) && recargada.visible && recargada.x === '100' && recargada.z === '-40' && (await guiasEn('fila', 42 + 7 * 26 + 13)).length === 2,
    `INT-12: al recargar siguen la casilla, las coordenadas y las guias (${JSON.stringify(recargada)})`);

  // NUM-17: un estado guardado antes de este cambio (sin las claves nuevas) arranca bien con las guias apagadas.
  await ev(`localStorage.setItem('mc-formas-v1', '{"forma":"rombo","w":20,"h":20,"igualar":true,"modo":"relleno","grosor":1,"esfera":"esfera","orient":"plano","zoom":26,"rel":true,"tramos":true,"tramosDentro":false,"distEjes":true,"capa":0}')`);
  await cargar();
  const antiguo = await ev(`({ forma: document.getElementById('forma').value, guias: document.getElementById('guiasChunk').checked, x: document.getElementById('centroX').value })`);
  ok(antiguo.forma === 'rombo' && antiguo.guias === false && antiguo.x === '', `NUM-17: un estado guardado antes de las guias carga igual y las deja apagadas (${JSON.stringify(antiguo)})`);
  await ev(`localStorage.clear()`);
  await cargar();

  // INT-13, NUM-18, NUM-19: altura Y de la base (escritorio).
  await ev(`localStorage.clear()`); await cargar();
  const ponerCampo = (id, v) => ev(`(() => { const e = document.getElementById('${id}'); e.value = '${v}'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  const irCapaN = i => ev(`(() => { const e = document.getElementById('capa'); e.value = ${i}; e.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  const textoCapa = () => ev(`document.getElementById('capaTxt').textContent`);
  const campoY = () => ev(`(() => { const e = document.getElementById('baseY'), f = document.getElementById('rowBaseY');
    return e ? { visible: !f.hidden, valor: e.value, etiqueta: e.closest('label').textContent.trim(), ayuda: (document.getElementById(e.getAttribute('aria-describedby')) || {}).textContent || '' } : null; })()`);

  // INT-13: con una forma 2D no hay campo.
  const en2D = await campoY();
  ok(en2D && !en2D.visible, `INT-13: con el circulo (2D) no se ve el campo «Y de la base» (${JSON.stringify(en2D)})`);

  // INT-13, NUM-19: con una esfera aparece, vacio, y el texto de la capa es el de siempre.
  await ponerCampo('forma', 'esfera'); await ponerCampo('w', '11'); await esperar(500);
  const en3D = await campoY();
  ok(en3D && en3D.visible && en3D.valor === '' && en3D.etiqueta.includes('Y de la base') && /capa 1/.test(en3D.ayuda),
    `INT-13: con la esfera aparece el campo vacio, con etiqueta y ayuda enlazada (${JSON.stringify(en3D)})`);
  ok(await textoCapa() === 'Capa 1 de 11 (base)', 'NUM-19: con la Y vacia el texto de la capa es el de siempre -> ' + await textoCapa());
  await ev(`document.getElementById('marcarCapa').click()`); await esperar(300);
  const marcadas = await prog(), avisoMarcar = (await aviso()).texto;

  // NUM-18: con la base en Y=64 cada capa muestra su altura.
  await ponerCampo('baseY', '64'); await esperar(300);
  ok(await textoCapa() === 'Capa 1 de 11 (base) · Y 64', 'NUM-18: la capa base muestra Y 64 -> ' + await textoCapa());
  await irCapaN(2); await esperar(250);
  ok(await textoCapa() === 'Capa 3 de 11 · Y 66', 'NUM-18: la capa 3 muestra Y 66 -> ' + await textoCapa());
  await irCapaN(10); await esperar(250);
  ok(await textoCapa() === 'Capa 11 de 11 · Y 74', 'NUM-18: la capa 11 muestra Y 74 -> ' + await textoCapa());
  await ponerCampo('baseY', '-60'); await esperar(250);
  ok(await textoCapa() === 'Capa 11 de 11 · Y -50', 'NUM-18: con la base negativa (-60) la capa 11 esta en Y -50 -> ' + await textoCapa());
  await ponerCampo('baseY', '64'); await irCapaN(0); await esperar(250);
  ok(await prog() === marcadas && (await aviso()).texto === avisoMarcar, 'NUM-19: cambiar la Y no toca las marcas ni saca ningun aviso -> ' + await prog());

  // INT-13: se recuerda al recargar.
  await cargar();
  const recargado = await campoY();
  ok(recargado.visible && recargado.valor === '64' && /Y 64$/.test(await textoCapa()), `INT-13: al recargar sigue la Y de la base (${JSON.stringify(recargado)} · ${await textoCapa()})`);

  // NUM-19: vuelta a una forma 2D con la Y guardada: sin campo ni altura.
  await ponerCampo('forma', 'circulo'); await esperar(400);
  const vuelta2D = await campoY();
  ok(!vuelta2D.visible && await ev(`document.getElementById('selCapa').hidden`), 'NUM-19: en una forma 2D con la Y guardada no se ve el campo ni la altura');

  // NUM-19: un estado guardado antes de este cambio (sin baseY) arranca igual.
  await ev(`localStorage.setItem('mc-formas-v1', '{"forma":"esfera","w":11,"h":11,"igualar":true,"modo":"relleno","grosor":1,"esfera":"cupula","orient":"plano","zoom":20,"rel":true,"tramos":true,"tramosDentro":false,"distEjes":true,"capa":0}')`);
  await cargar();
  const antiguoY = await campoY();
  ok(antiguoY.visible && antiguoY.valor === '' && /^Capa 1 de [0-9]+ \(base\)$/.test(await textoCapa()), `NUM-19: un estado guardado antes de la altura carga igual y sin Y (${JSON.stringify(antiguoY)} · ${await textoCapa()})`);
  await ev(`localStorage.clear()`);
  await cargar();

  // NUM-18, NUM-19: la altura en la tabla por capas, en la cabecera del PNG y en la etiqueta accesible.
  await ev(`localStorage.clear()`); await cargar();
  await ponerCampo('forma', 'esfera'); await ponerCampo('w', '11'); await ponerCampo('baseY', '64'); await irCapaN(2); await esperar(500);
  const tabla = () => ev(`(() => { const t = document.querySelector('#tablaCapas table'); if (!t) return null;
    return { cab: [...t.querySelectorAll('thead th')].map(h => h.textContent), filas: [...t.querySelectorAll('tbody tr')].map(r => [...r.cells].map(c => c.textContent)) }; })()`);
  // Cabecera que se pasa a Render al exportar la capa actual (sin esperar a la descarga).
  const cabeceraPng = async () => {
    await ev(`(() => { window.__cab = null; if (!window.__dibujarOrig) { window.__dibujarOrig = Render.dibujar; Render.dibujar = (cv, o) => { if (o.cabecera) window.__cab = o.cabecera; return window.__dibujarOrig(cv, o); }; } })()`);
    await ev(`document.getElementById('exportar').click()`); await esperar(700);
    return ev(`window.__cab`);
  };

  const conY = await tabla();
  ok(conY && conY.cab.join('|') === 'Capa|Y|Bloques|Stacks|Hechos' && conY.filas.length === 11 && conY.filas[0][1] === '64' && conY.filas[2][1] === '66' && conY.filas[10][1] === '74',
    `NUM-18: con la base en Y=64 la tabla por capas tiene la columna Y con 64 ... 74 (${conY && conY.cab.join('|')} · ${conY && conY.filas.map(f => f[1]).join(',')})`);
  const cabY = await cabeceraPng();
  ok(cabY && cabY[1].startsWith('Capa 3 de 11 · Y 66 · '), 'NUM-18: la cabecera del PNG de la capa 3 lleva «Y 66» -> ' + (cabY && cabY[1]));
  const etiqueta = await ev(`document.getElementById('lienzo').getAttribute('aria-label')`);
  ok(/^Dibujo de .*Capa 3 de 11, altura Y 66: /.test(etiqueta), 'NUM-18: la etiqueta accesible del dibujo anuncia la altura -> ' + etiqueta);

  // NUM-19: sin Y, la tabla, la cabecera y la etiqueta son las de siempre.
  await ponerCampo('baseY', ''); await esperar(400);
  const sinY = await tabla();
  ok(sinY && sinY.cab.join('|') === 'Capa|Bloques|Stacks|Hechos' && sinY.filas.every(f => f.length === 4) && sinY.filas[2][0] === '3',
    `NUM-19: sin Y la tabla no tiene la columna Y (${sinY && sinY.cab.join('|')})`);
  const cabSin = await cabeceraPng();
  ok(cabSin && /^Capa 3 de 11 · [0-9]+ bloques/.test(cabSin[1]) && !/Y -?[0-9]/.test(cabSin[1]), 'NUM-19: sin Y la cabecera del PNG es la de siempre -> ' + (cabSin && cabSin[1]));
  const etiquetaSin = await ev(`document.getElementById('lienzo').getAttribute('aria-label')`);
  ok(/Capa 3 de 11: /.test(etiquetaSin) && !/altura/.test(etiquetaSin), 'NUM-19: sin Y la etiqueta accesible es la de siempre -> ' + etiquetaSin);
  await ev(`localStorage.clear()`);
  await cargar();

  // MAT-11, MAT-12, MAT-13, INT-14: ficha imprimible. window.print se sustituye por un contador: no se abre el diálogo.
  await ev(`localStorage.clear()`); await cargar();
  await ev(`window.__prints = 0; window.print = () => { window.__prints++; }`);
  const prints = () => ev(`window.__prints`);
  const pedirFicha = async () => { await ev(`document.getElementById('imprimirFicha').click()`); await esperar(1800); };
  const fichaInfo = () => ev(`(() => { const f = document.getElementById('ficha'); return f ? {
    paginas: f.querySelectorAll('.ficha-pag').length, alts: [...f.querySelectorAll('img')].map(i => i.alt),
    cabTabla: [...f.querySelectorAll('thead th')].map(h => h.textContent).join('|'), texto: f.textContent,
    cargadas: [...f.querySelectorAll('img')].every(i => i.complete && i.naturalWidth > 0) } : null; })()`);
  const paginasPdf = async (extra = {}) => {
    const r = await send('Page.printToPDF', { preferCSSPageSize: true, printBackground: true, ...extra });
    return (Buffer.from(r.data, 'base64').toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  };
  const enImpresion = async fn => {
    await send('Emulation.setEmulatedMedia', { media: 'print' });
    try { return await fn(); } finally { await send('Emulation.setEmulatedMedia', { media: '' }); }
  };
  const medidasLienzo = () => ev(`(() => { const r = document.getElementById('lienzo').getBoundingClientRect(); return [r.width, r.height, document.documentElement.scrollHeight].join(); })()`);

  // MAT-11 (regresión): imprimir sin pedir la ficha (Ctrl+P) saca la app como siempre, no una página en blanco.
  const sinFicha = await enImpresion(() => ev(`['lienzo', 'secDibujo'].every(id => document.getElementById(id).getClientRects().length > 0) &&
    getComputedStyle(document.body).backgroundColor !== 'rgb(255, 255, 255)'`));
  ok(sinFicha, 'MAT-11: imprimir sin pedir la ficha (Ctrl+P) saca la app, no una página en blanco');

  // INT-14: el botón va en «Vista», a todo el ancho, tras los de PNG, con icono y texto.
  const boton = await ev(`(() => { const b = document.getElementById('imprimirFicha'); if (!b) return null;
    const hermanos = [...b.parentElement.children].map(e => e.id);
    return { ancho: b.classList.contains('ancho'), texto: b.textContent.trim(), icono: (b.querySelector('use') || { getAttribute: () => '' }).getAttribute('href'),
      ariaIcono: b.querySelector('svg') && b.querySelector('svg').getAttribute('aria-hidden'), hermanos, seccion: b.closest('section').getAttribute('aria-labelledby') }; })()`);
  ok(boton && boton.ancho && boton.texto === 'Imprimir ficha' && boton.icono === '#i-imprimir' && boton.ariaIcono === 'true' && boton.seccion === 't-vista' &&
    boton.hermanos.join() === 'exportar,exportarTodas,imprimirFicha', `INT-14: «Imprimir ficha» va en Vista, a todo el ancho, con icono y texto, tras los PNG (${JSON.stringify(boton)})`);

  // MAT-11, MAT-12: círculo (2D) con una marca hecha: una página, sin lo construido, materiales = total.
  await ev(`document.getElementById('marcarCapa').click()`); await esperar(200);
  await ev(`(() => { window.__hechos = []; if (!window.__dibOrig2) { window.__dibOrig2 = Render.dibujar; Render.dibujar = (cv, o) => { if (o.cabecera) window.__hechos.push(o.hechos.size); return window.__dibOrig2(cv, o); }; } })()`);
  const antesPantalla = await medidasLienzo();
  await pedirFicha();
  const f2D = await fichaInfo();
  ok(f2D && f2D.paginas === 1 && f2D.alts.length === 1 && f2D.cargadas && await prints() === 1,
    `MAT-11: un círculo da una sola página con su dibujo y abre la impresión una vez (${JSON.stringify(f2D && { p: f2D.paginas, a: f2D.alts.length })})`);
  ok(f2D && f2D.texto.includes('208') && f2D.texto.includes('Stacks') && f2D.texto.includes('Shulker') && f2D.texto.includes('Cofres dobles'),
    'MAT-11: la ficha trae el total de bloques, stacks, shulker boxes y cofres dobles');
  ok(f2D && !/Construidos|Faltan|Hechos/.test(f2D.texto) && await ev(`window.__hechos.length === 1 && window.__hechos.every(n => n === 0)`),
    'MAT-12: la ficha no lleva lo construido ni marcas en el dibujo, aunque haya marcas hechas');
  ok(f2D && /Círculo|Circulo/i.test(f2D.alts[0]) && !/construidos/.test(f2D.alts[0]), 'MAT-11: la cabecera del dibujo de la ficha no habla de lo construido -> ' + (f2D && f2D.alts[0]));
  ok(await ev(`getComputedStyle(document.getElementById('ficha')).display === 'none' && document.getElementById('ficha').getAttribute('aria-hidden') === 'true'`) &&
    await medidasLienzo() === antesPantalla, 'MAT-11: en pantalla la ficha no se ve y la app no cambia');
  const imp2D = await enImpresion(async () => ({
    ficha: await ev(`getComputedStyle(document.getElementById('ficha')).display`),
    ocultos: await ev(`['panel', 'lienzo', 'secDibujo', 'exportar', 'imprimirFicha', 'aviso'].every(id => document.getElementById(id).getClientRects().length === 0) && document.querySelector('.navmovil').getClientRects().length === 0`),
    paginas: await paginasPdf(),
  }));
  ok(imp2D.ficha === 'block' && imp2D.ocultos, `MAT-11: al imprimir la ficha se ve y los controles no (${JSON.stringify(imp2D)})`);
  ok(imp2D.paginas === 1, `MAT-11: el PDF del círculo tiene 1 página (${imp2D.paginas})`);

  // MAT-11: esfera de 11 con la base en 64: 1 + 11 páginas, columna Y y «Y 66» en la capa 3.
  await ev(`localStorage.clear()`); await cargar();
  await ev(`window.__prints = 0; window.print = () => { window.__prints++; }`);
  await ponerCampo('forma', 'esfera'); await ponerCampo('w', '11'); await ponerCampo('baseY', '64'); await esperar(500);
  await ev(`window.confirm = () => true; document.getElementById('marcarTodo').click()`); await esperar(300);
  await pedirFicha();
  const f3D = await fichaInfo();
  ok(f3D && f3D.paginas === 12 && f3D.alts.length === 11 && f3D.cargadas && await prints() === 1,
    `MAT-11: una esfera de 11 da 12 páginas: la forma y una por capa (${f3D && f3D.paginas} páginas, ${f3D && f3D.alts.length} imágenes)`);
  ok(f3D && f3D.cabTabla === 'Capa|Y|Bloques|Stacks' && f3D.texto.includes('Esfera'),
    `MAT-11, MAT-12: la primera página lleva la tabla por capas con la columna Y y sin «Hechos» (${f3D && f3D.cabTabla})`);
  ok(f3D && /Capa 3 de 11 · Y 66 · /.test(f3D.alts[2]) && !/Construidos|Faltan/.test(f3D.texto),
    'MAT-11: la cabecera de la capa 3 dice «Y 66» -> ' + (f3D && f3D.alts[2]));
  const encaja = await enImpresion(() => ev(`(() => { const im = [...document.querySelectorAll('#ficha .ficha-pag img')];
    return im.length === 11 && im.every(i => getComputedStyle(i).objectFit === 'contain' && getComputedStyle(i).maxWidth !== 'none' && getComputedStyle(i).maxHeight !== 'none'); })()`));
  ok(encaja, 'MAT-12: cada dibujo se ajusta a la página sin deformarse (object-fit: contain con ancho y alto máximos)');
  // Tras imprimir (afterprint) la ficha se libera; para cada papel se vuelve a pedir.
  const pdf3D = await enImpresion(paginasPdf);
  ok(pdf3D === 12, `MAT-11, MAT-12: el PDF de la esfera tiene 12 páginas, una por dibujo sin cortarse (${pdf3D})`);
  ok(await ev(`document.getElementById('ficha').children.length === 0`), 'MAT-11: tras imprimir (afterprint) la ficha se libera');
  await pedirFicha();
  const pdfCarta = await enImpresion(() => paginasPdf({ landscape: true, paperWidth: 11, paperHeight: 8.5 }));
  ok(pdfCarta === 12, `MAT-12: en Carta horizontal también sale una página por dibujo (${pdfCarta})`);

  // MAT-13: capas de más de 60 bloques avisan antes de imprimir; la ficha se genera igual.
  await ev(`localStorage.clear()`); await cargar();
  await ev(`window.__prints = 0; window.print = () => { window.__prints++; }`);
  await ponerCampo('w', '120'); await ponerCampo('h', '120'); await esperar(600);
  await ev(`document.getElementById('imprimirFicha').click()`); await esperar(2500);
  const avGrande = await aviso();
  ok(avGrande.visible && /60/.test(avGrande.texto) && await prints() === 1 && (await fichaInfo()).paginas === 1,
    `MAT-13: un círculo de 120 avisa antes del diálogo y la ficha se genera igual (${avGrande.texto})`);
  await ev(`localStorage.clear()`); await cargar();
  await ev(`window.__prints = 0; window.print = () => { window.__prints++; }`);
  await ponerCampo('w', '30'); await ponerCampo('h', '30'); await esperar(500);
  await pedirFicha();
  ok(!(await aviso()).visible && await prints() === 1, 'MAT-13: un círculo de 30 no avisa');

  // INT-14: en móvil el botón cabe y mide 44 px.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cargar(); await esperar(300);
  await ev(`document.getElementById('verMenu').click()`); await esperar(300);
  const movilBtn = await ev(`(() => { const b = document.getElementById('imprimirFicha'); b.scrollIntoView(); const r = b.getBoundingClientRect();
    return { alto: r.height, izq: r.left, der: r.right, vw: document.documentElement.clientWidth }; })()`);
  ok(movilBtn.alto >= 44 && movilBtn.izq >= 0 && movilBtn.der <= movilBtn.vw, `INT-14: a 390 px el botón cabe y mide al menos 44 px (${JSON.stringify(movilBtn)})`);
  await send('Emulation.clearDeviceMetricsOverride'); await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await ev(`localStorage.clear()`);
  await cargar();

  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 800, deviceScaleFactor: 1, mobile: true });
  await cargar(); await esperar(300);
  ok(await ev(`document.documentElement.scrollWidth <= 375`), 'INT-03: sin scroll horizontal a 375 px');
  ok(await ev(`document.getElementById('panel').hidden && document.querySelector('.area').getBoundingClientRect().top < 300`), 'INT-03, INT-04: en movil el menu arranca cerrado y el dibujo va primero');
  await ev(`document.getElementById('verMenu').click()`); await esperar(300);
  ok(await ev(`(() => { const r = document.getElementById('panel').getBoundingClientRect(); return r.top === 0 && r.width === 375 && document.activeElement.id === 'cerrarMenu' && document.getElementById('verMenu').getAttribute('aria-expanded') === 'true'; })()`), 'INT-04: el boton abre el menu a pantalla completa con foco en Cerrar');
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  ok(await ev(`document.getElementById('panel').hidden && document.activeElement.id === 'verMenu'`), 'INT-04: Esc cierra el menu y devuelve el foco');
  await ev(`document.querySelector('.navmovil a[href="#secMat"]').click()`); await esperar(800);
  // Materiales es la ultima seccion: si es corta, el menu queda desplazado hasta el final.
  ok(await ev(`(() => { const p = document.getElementById('panel');
    const llego = document.getElementById('secMat').getBoundingClientRect().top < 200 || p.scrollTop + p.clientHeight >= p.scrollHeight - 1;
    return !p.hidden && p.scrollTop > 0 && llego && document.querySelector('.navmovil a[href="#secMat"]').getAttribute('aria-current') === 'true'; })()`), 'INT-05: Materiales abre el menu en su seccion');
  await ev(`document.querySelector('.navmovil a[href="#secDibujo"]').click()`); await esperar(300);
  ok(await ev(`document.getElementById('panel').hidden`), 'INT-05: Dibujo cierra el menu');
  // INT-09 en movil: los botones de «Proyecto» se ven, caben y se pueden pulsar con el dedo (>= 44 px).
  await ev(`document.getElementById('verMenu').click()`); await esperar(300);
  await ev(`document.getElementById('secProyecto') && document.getElementById('secProyecto').scrollIntoView({ block: 'center' })`);
  await esperar(500);
  const botonesProyecto = await ev(`(() => {
    const caja = id => { const e = document.getElementById(id); if (!e) return null; const r = e.getBoundingClientRect(); return { izq: Math.round(r.left), der: Math.round(r.right), alto: Math.round(r.height), ancho: Math.round(r.width) }; };
    const nav = document.querySelector('.navmovil').getBoundingClientRect();
    const g = document.getElementById('guardarProyecto');
    return { guardar: caja('guardarProyecto'), cargar: caja('cargarProyecto'), vw: document.documentElement.clientWidth, bajoNav: g ? g.getBoundingClientRect().bottom > nav.top : null };
  })()`);
  ok(botonesProyecto.guardar && botonesProyecto.cargar &&
    botonesProyecto.guardar.alto >= 44 && botonesProyecto.cargar.alto >= 44 &&
    botonesProyecto.guardar.izq >= 0 && botonesProyecto.cargar.der <= botonesProyecto.vw && botonesProyecto.bajoNav === false,
  `INT-09: en movil los botones de Proyecto se ven, caben y miden al menos 44 px (${JSON.stringify(botonesProyecto)})`);
  const botonEnlaceMovil = await ev(`(() => { const b = document.getElementById('copiarEnlace'); if (!b) return null;
    const r = b.getBoundingClientRect(), vw = document.documentElement.clientWidth; return { alto: Math.round(r.height), izq: Math.round(r.left), der: Math.round(r.right), vw }; })()`);
  ok(botonEnlaceMovil && botonEnlaceMovil.alto >= 44 && botonEnlaceMovil.izq >= 0 && botonEnlaceMovil.der <= botonEnlaceMovil.vw,
    `INT-10: en movil «Copiar enlace» cabe y mide al menos 44 px (${JSON.stringify(botonEnlaceMovil)})`);
  // INT-10: la direccion larga del aviso de respaldo se parte en lineas y cabe en la pantalla.
  await sustituirPortapapeles(`() => Promise.reject(new Error('sin permiso'))`);
  await ev(`document.getElementById('copiarEnlace').click()`); await esperar(300);
  const avisoLargo = await ev(`(() => { const t = document.getElementById('avisoTxt'), a = document.getElementById('aviso').getBoundingClientRect();
    const r = document.createRange(); r.selectNodeContents(t);
    const derTexto = Math.max(...[...r.getClientRects()].map(c => c.right));
    return { desborda: derTexto > a.right + 1, izq: Math.round(a.left), der: Math.round(document.documentElement.clientWidth - a.right), texto: t.textContent.length }; })()`);
  ok(avisoLargo.texto > 60 && !avisoLargo.desborda && avisoLargo.izq >= 0 && avisoLargo.der >= 0,
    `INT-10: en movil el enlace del aviso de respaldo se parte en lineas y no se sale de la pantalla (${JSON.stringify(avisoLargo)})`);
  await shot('09-enlace-a-mano-movil.png');
  // INT-12 en movil: los campos de coordenadas aparecen, caben, tienen etiqueta y miden al menos 44 px.
  await ev(`(() => { const c = document.getElementById('guiasChunk'); c.checked = true; c.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await ev(`document.getElementById('centroX') && document.getElementById('centroX').scrollIntoView({ block: 'center' })`); await esperar(300);
  const camposMovil = await ev(`(() => { const vw = document.documentElement.clientWidth;
    const medir = id => { const e = document.getElementById(id); if (!e) return null; const r = e.getBoundingClientRect(); return { alto: Math.round(r.height), izq: Math.round(r.left), der: Math.round(r.right), etiqueta: e.closest('label').textContent.trim(), fuente: parseFloat(getComputedStyle(e).fontSize) }; };
    return { x: medir('centroX'), z: medir('centroZ'), vw }; })()`);
  ok(camposMovil.x && camposMovil.z && camposMovil.x.alto >= 44 && camposMovil.z.alto >= 44 && camposMovil.x.izq >= 0 && camposMovil.z.der <= camposMovil.vw &&
    camposMovil.x.etiqueta.includes('X del centro') && camposMovil.z.etiqueta.includes('Z del centro') && camposMovil.x.fuente >= 16,
  `INT-12: en movil «X del centro» y «Z del centro» caben, tienen etiqueta, 16 px y al menos 44 px (${JSON.stringify(camposMovil)})`);
  await shot('10-guias-movil.png');
  await ev(`(() => { const c = document.getElementById('guiasChunk'); c.checked = false; c.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  // INT-13 en movil: el campo «Y de la base» (solo 3D) cabe, tiene etiqueta, 16 px y al menos 44 px.
  await ev(`(() => { const f = document.getElementById('forma'); f.value = 'esfera'; f.dispatchEvent(new Event('input', { bubbles: true })); })()`); await esperar(500);
  await ev(`document.getElementById('baseY').scrollIntoView({ block: 'center' })`); await esperar(300);
  const campoYMovil = await ev(`(() => { const e = document.getElementById('baseY'); if (!e) return null; const r = e.getBoundingClientRect(), vw = document.documentElement.clientWidth;
    return { alto: Math.round(r.height), izq: Math.round(r.left), der: Math.round(r.right), vw, fuente: parseFloat(getComputedStyle(e).fontSize), etiqueta: e.closest('label').textContent.trim(), visible: !document.getElementById('rowBaseY').hidden }; })()`);
  ok(campoYMovil && campoYMovil.visible && campoYMovil.alto >= 44 && campoYMovil.izq >= 0 && campoYMovil.der <= campoYMovil.vw && campoYMovil.fuente >= 16 && campoYMovil.etiqueta.includes('Y de la base'),
    `INT-13: en movil «Y de la base» cabe, tiene etiqueta, 16 px y al menos 44 px (${JSON.stringify(campoYMovil)})`);
  await shot('11-base-y-movil.png');
  await ev(`(() => { const f = document.getElementById('forma'); f.value = 'circulo'; f.dispatchEvent(new Event('input', { bubbles: true })); })()`); await esperar(400);
  await shot('06-proyecto-movil.png');
  await ev(`document.getElementById('cerrarMenu').click()`); await esperar(300);

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
    `TAC-03: dedos escalonados -> pellizco (${zt} -> ${await zoom()})`);
  ok(await prog() === progTactil, 'TAC-08: el pellizco no marca bloques');
  // Un toque corto sigue marcando (el pellizco no deja el gesto bloqueado).
  await ev(`(() => { const w = document.getElementById('lienzo').parentElement; w.scrollLeft = 0; w.scrollTop = 0; const z = document.getElementById('zoom'); z.value = 26; z.dispatchEvent(new Event('input')); })()`);
  await esperar(150);
  const rect2 = await ev(`(() => { const r = document.getElementById('lienzo').getBoundingClientRect(); return [r.left, r.top]; })()`);
  const pTap = [rect2[0] + L + 8 * 26 + 13, rect2[1] + T + 7 * 26 + 13];
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pTap[0], y: pTap[1], id: 1 }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(200);
  ok(await prog() === 'Construidos: 1/208 (0 %)', 'TAC-01: un toque corto marca la celda -> ' + await prog());
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
    `TAC-01: arrastrar con un dedo desplaza el dibujo (${s0[0]},${s0[1]} -> ${s1[0]},${s1[1]})`);

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
    `TAC-04: con zoom 48 el pellizco sigue desplazando (${sA1[0]},${sA1[1]} -> ${sA1b[0]},${sA1b[1]})`);

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
    `TAC-05: pellizcar y arrastrar mantiene la celda bajo los dedos (${celdaA2a} -> ${celdaA2b})`);

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
    `TAC-07: al levantar el tercer dedo el pellizco continua (${zA3} -> ${await zoom()})`);

  // FORM: el campo de ancho se puede vaciar. Vacio no se rellena con el minimo ni cambia la forma.
  await ev(`(() => { const f = document.getElementById('forma'); f.value = 'circulo'; f.dispatchEvent(new Event('input')); const w = document.getElementById('w'); w.value = '16'; w.dispatchEvent(new Event('change')); })()`);
  await esperar(300);
  await ev(`(() => { const w = document.getElementById('w'); w.value = ''; w.dispatchEvent(new Event('input')); })()`);
  await esperar(350);
  ok(await ev(`document.getElementById('w').value === '' && document.querySelector('.tot').textContent.startsWith('208')`),
    'FOR-15: al borrar el ancho queda vacio y la forma no cambia');
  await ev(`(() => { const w = document.getElementById('w'); w.value = '2'; w.dispatchEvent(new Event('input')); })()`);
  await esperar(300);
  ok(await ev(`document.getElementById('w').value === '2' && document.querySelector('.tot').textContent.startsWith('4')`),
    'FOR-15: al teclear 2 se aplica 2 (no se queda en el minimo 1)');
  await ev(`(() => { const w = document.getElementById('w'); w.value = '20'; w.dispatchEvent(new Event('input')); })()`);
  await esperar(300);
  ok(await ev(`document.getElementById('w').value === '20' && document.querySelector('.tot').textContent.startsWith('316')`),
    'FOR-15: escribir 20 despues del 2 da 20');

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
    `TAC-09: a 3x el arrastre mueve el dibujo y no la pagina (scrollY ${yA5} -> ${await ev(`window.scrollY`)})`);

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
    `TAC-02: arrastre lento (0,8 px) sobre un dibujo que cabe desplaza la pagina (scrollY ${lento0.y} -> ${lentoY})`);

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
    `TAC-06: al perderse la captura el dedo se suelta y el siguiente toque marca (${progC5} -> ${await prog()})`);

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
    `TAC-02: a 1x un arrastre de 0,4 px por evento mueve el dibujo (${sB4[0]},${sB4[1]} -> ${sB4b[0]},${sB4b[1]}) sin mover la pagina`);

  // C6: en movil (390x844) tocar la banda de la regla marca la fila entera; otro toque la
  // desmarca. Un gesto que sale del margen (> 10 px) no cuenta como toque.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  // La ayuda tactil solo se muestra con puntero grueso (pointer: coarse).
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
  await ev(`localStorage.clear()`);
  await cargar(); await esperar(400);
  await ev(`(() => {
    const z = document.getElementById('zoom'); z.value = 26; z.dispatchEvent(new Event('input'));
  })()`);
  await esperar(300);
  // El cambio de zoom reancla el scroll del contenedor: se vuelve a poner a cero al final,
  // para que la regla izquierda quede visible (el lienzo es mas ancho que 390 px).
  await ev(`(() => {
    document.getElementById('lienzo').scrollIntoView({ block: 'center', inline: 'start' });
    const w = document.getElementById('lienzo').parentElement;
    w.scrollLeft = 0; w.scrollTop = 0;
  })()`);
  await esperar(150);
  const rgM = await ev(`(() => { const r = document.getElementById('lienzo').getBoundingClientRect(); return { l: r.left, t: r.top }; })()`);
  ok(rgM.l >= 0 && rgM.l + 20 <= 390 && rgM.t >= 0, `MAR-14: la regla izquierda se ve en movil (lienzo en ${Math.round(rgM.l)},${Math.round(rgM.t)})`);
  const bandaFila = async y => {
    // El aviso cambia de alto y mueve el lienzo: se mide la regla antes de cada toque.
    const r = await ev(`(() => { const b = document.getElementById('lienzo').getBoundingClientRect(); return { l: b.left, t: b.top }; })()`);
    return [r.l + 20, r.t + T + y * s + s / 2];
  };
  const toque = async (x, y) => {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await esperar(200);
  };
  await toque(...await bandaFila(7));
  ok(await prog() === 'Construidos: 16/208 (8 %)', 'MAR-14: tocar la banda de la fila 8 la marca entera -> ' + await prog());
  ok((await anuncio()).startsWith('Fila 8: 16 bloques marcados'), 'MAR-14: el toque se anuncia -> ' + await anuncio());
  await shot('07-movil-fila.png');
  await toque(...await bandaFila(7));
  ok(await prog() === 'Construidos: 0/208 (0 %)', 'MAR-14: otro toque en la fila la desmarca -> ' + await prog());

  // Arrastrar desde el margen: el dedo recorre mas de 10 px y no debe marcar nada.
  const filaM = await bandaFila(7);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: filaM[0], y: filaM[1], id: 1 }] });
  for (const d of [8, 20, 35, 50]) {
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: filaM[0] + d, y: filaM[1], id: 1 }] });
    await esperar(20);
  }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(200);
  ok(await prog() === 'Construidos: 0/208 (0 %)', 'MAR-14: un arrastre desde el margen no marca la fila -> ' + await prog());

  // INT-08: el aviso de una fila usa el ancho de la pantalla (no solo la mitad derecha).
  const filaAviso = await bandaFila(7);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: filaAviso[0], y: filaAviso[1], id: 1 }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(250);
  const avisoMov = await medirAviso();
  ok(avisoMov.visible && avisoMov.texto.includes('fila 8') && avisoMov.izq >= 15 && avisoMov.der >= 15 &&
    Math.abs(avisoMov.izq - avisoMov.der) <= 2 && avisoMov.lineas <= 2,
  `INT-08: en movil el aviso queda centrado, dentro de la pantalla y en dos lineas como mucho (${JSON.stringify(avisoMov)})`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: filaAviso[0], y: filaAviso[1], id: 1 }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(250);

  ok(await ev(`(() => { const s = document.querySelector('#ayudaLienzo .solo-tactil'); return getComputedStyle(s).display !== 'none' && s.getBoundingClientRect().height > 0 && s.textContent.includes('toca el número de una fila o columna para marcarla entera') && s.textContent.includes('si la fila es fina, acércate antes de tocarla'); })()`),
    'INT-07: la ayuda táctil explica el gesto de marcar filas y columnas y sugiere acercarse si la fila es fina');

  // NUM-15, MAR-14, MAR-15 en movil: con el dibujo desplazado, las reglas fijas se tocan con el dedo.
  await ev(`localStorage.setItem('mc-formas-v1', JSON.stringify({ forma: 'circulo', w: 60, h: 60, igualar: true, zoom: 26, rel: true }))`);
  await cargar(); await esperar(300);
  await ev(`(() => { const z = document.getElementById('zoom'); z.value = 26; z.dispatchEvent(new Event('input')); })()`);
  await esperar(300);
  await ev(`(() => { const w = document.querySelector('.lienzoWrap'); w.scrollLeft = 400; w.scrollTop = 300; document.getElementById('lienzo').scrollIntoView({ block: 'center' }); })()`);
  await esperar(300);
  const fijasMovil = await ev(`(() => ({
    sup: !document.getElementById('reglaSup').hidden, izq: !document.getElementById('reglaIzq').hidden,
    sl: document.querySelector('.lienzoWrap').scrollLeft, st: document.querySelector('.lienzoWrap').scrollTop,
  }))()`);
  ok(fijasMovil.sup && fijasMovil.izq && fijasMovil.sl > 0 && fijasMovil.st > 0,
    `NUM-15: en movil, desplazado el dibujo, hay reglas fijas arriba y a la izquierda (${JSON.stringify(fijasMovil)})`);
  // Punto del dibujo en pantalla a partir del ancla (borde visible del contenido).
  const puntoMovil = (ax, ay) => ev(`(() => { const r = document.querySelector('.reglasFijas').getBoundingClientRect(); return [r.left + ${ax}, r.top + ${ay}]; })()`);
  const progM = async () => +(await prog()).match(/([0-9]+)[/]/)[1];
  const toqueM = async (x, y) => {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await esperar(250);
  };
  const cuentaM = (eje, i) => ev(`(() => { const g = Formas.generar({ forma: 'circulo', w: 60, h: 60, modo: 'relleno', grosor: 1 }).capas[0];
    return ${JSON.stringify(eje)} === 'fila' ? g[${i}].filter(Boolean).length : g.filter(f => f[${i}]).length; })()`);
  const celdaM = 26, sl0 = fijasMovil.sl, st0 = fijasMovil.st;
  // Fila: banda izquierda fija (ancla x 5..80) a 80 px por debajo de la regla superior fija.
  const filaFijaM = Math.floor((st0 + 80) / celdaM);
  await toqueM(...await puntoMovil(40, 42 + 80));
  const nFilaM = await progM(), eFilaM = await cuentaM('fila', filaFijaM);
  ok(nFilaM === eFilaM && nFilaM > 1, `MAR-14: tocar la regla izquierda fija marca la fila ${filaFijaM + 1} entera en movil (${nFilaM} de ${eFilaM}), no un bloque`);
  await toqueM(...await puntoMovil(40, 42 + 80));
  ok(await progM() === 0, 'MAR-14: otro toque en la regla izquierda fija la desmarca');
  // Columna: banda superior fija a 90 px a la derecha de la regla izquierda fija.
  const colFijaM = Math.floor((sl0 + 90) / celdaM);
  await toqueM(...await puntoMovil(80 + 90, 20));
  const nColM = await progM(), eColM = await cuentaM('columna', colFijaM);
  ok(nColM === eColM && nColM > 1, `MAR-15: tocar la regla superior fija marca la columna ${colFijaM + 1} entera en movil (${nColM} de ${eColM}), no un bloque`);
  await toqueM(...await puntoMovil(80 + 90, 20));
  ok(await progM() === 0, 'MAR-15: otro toque en la regla superior fija la desmarca');
  await toqueM(...await puntoMovil(30, 20));
  ok(await progM() === 0, 'MAR-14, MAR-15: en movil, la esquina entre las reglas fijas no hace nada');
  await toqueM(...await puntoMovil(80 + 120, 42 + 120));
  ok(await progM() === 1, 'MAR-14: en movil, un toque en un bloque visible sigue marcando solo ese bloque');
  await toqueM(...await puntoMovil(80 + 120, 42 + 120));
  // Arrastrar desde el numero de una regla fija desplaza el dibujo y no marca nada.
  const [ax, ay] = await puntoMovil(40, 42 + 80);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: ax, y: ay, id: 1 }] });
  for (const d of [8, 20, 35, 50]) {
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: ax, y: ay - d, id: 1 }] });
    await esperar(20);
  }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await esperar(250);
  ok(await progM() === 0, 'MAR-14: en movil, arrastrar desde la regla fija desplaza y no marca');
  await ev(`localStorage.clear()`);

  ok(errores.length === 0, 'Consola sin errores ' + (errores.length ? JSON.stringify(errores) : ''));
  ws.close(); cerrar();
})().catch(e => { console.error(e); cerrar(); process.exit(1); });
