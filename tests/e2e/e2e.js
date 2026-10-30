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

  ok(errores.length === 0, 'Consola sin errores ' + (errores.length ? JSON.stringify(errores) : ''));
  ws.close(); cerrar();
})().catch(e => { console.error(e); cerrar(); process.exit(1); });
