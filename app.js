// Interfaz: lee el panel, genera la forma, dibuja, gestiona marcas, deshacer y exportacion.
(() => {
  const { STACK, SHULKER, COFRE_DOBLE, LIMITES, CLAVES_GEO } = Estado;
  const $ = id => document.getElementById(id);
  const cv = $('lienzo');

  const st = Estado.cargar();
  let capas = [], totales = [], grosorMax = null;
  let hechos = new Set();          // "capa,x,y" de bloques marcados como construidos
  let firmaActual = null, firmaPedida = null, previos = null;
  const pilaDeshacer = [], pilaRehacer = [];
  const MAX_HISTORIAL = 50;
  let geo = null;                  // geometria del ultimo dibujo (para el raton)
  let cursor = null;               // celda activa del teclado
  let avisoAlmacenamiento = false;

  const TOGGLES = ['rel', 'tramos', 'tramosDentro', 'distEjes'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, Math.round(+v) || a));
  const es3D = () => st.forma === 'esfera';
  const clave = (c, x, y) => `${c},${x},${y}`;
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const fmtStacks = n => `${Math.floor(n / STACK)} × ${STACK}${n % STACK ? ' + ' + (n % STACK) : ''}`;

  // --- avisos ----------------------------------------------------------------------
  let avisoTimer = null;
  function avisar(msg, accion) {
    $('avisoTxt').textContent = msg;
    const b = $('avisoAccion');
    b.hidden = !accion;
    b.onclick = accion ? () => { ocultarAviso(); accion(); } : null;
    $('aviso').hidden = false;
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(ocultarAviso, accion ? 8000 : 5000);
  }
  function ocultarAviso() { $('aviso').hidden = true; }
  function mostrarError(msg) { $('error').textContent = msg; $('error').hidden = false; }
  function anunciar(msg) { $('anuncio').textContent = msg; }

  // --- UI <-> estado ------------------------------------------------------------
  function leerUI() {
    st.forma = $('forma').value;
    st.w = clamp($('w').value, 1, es3D() ? LIMITES.w3d : LIMITES.w2d);
    st.h = clamp($('h').value, 1, LIMITES.h);
    st.igualar = $('igualar').checked;
    st.modo = $('modo').value;
    st.grosor = clamp($('grosor').value, 1, LIMITES.grosor);
    st.esfera = $('esfera').value;
    st.orient = $('orient').value;
    st.zoom = clamp($('zoom').value, LIMITES.zoomMin, LIMITES.zoomMax);
    for (const k of TOGGLES) st[k] = $(k).checked;
  }

  function ponerUI() {
    const maxW = es3D() ? LIMITES.w3d : LIMITES.w2d;
    $('forma').value = st.forma; $('w').value = st.w; $('h').value = st.h;
    $('w').max = maxW;
    $('lblW').textContent = es3D() ? 'Diámetro' : 'Ancho';
    $('maxW').textContent = `(máx. ${maxW})`;
    $('igualar').checked = st.igualar; $('modo').value = st.modo; $('grosor').value = st.grosor;
    $('esfera').value = st.esfera; $('orient').value = st.orient; $('zoom').value = st.zoom;
    for (const k of TOGGLES) $(k).checked = st[k];
    $('h').disabled = st.igualar;
    $('rowH').hidden = es3D();
    $('filaDims').classList.toggle('solo', es3D());
    $('rowIgualar').hidden = es3D();
    $('rowEsfera').hidden = !es3D();
    $('rowOrient').hidden = st.forma !== 'hexagono';
    $('rowGrosor').hidden = st.modo !== 'hueco';
    const maxG = grosorMax || LIMITES.grosor;
    $('grosor').max = maxG;
    $('maxG').textContent = grosorMax ? `(máx. ${grosorMax})` : '';
  }

  function guardarEstado() { Estado.guardar(st); }
  function guardarMarcas() {
    if (!Estado.guardarMarcas(firmaActual, hechos) && !avisoAlmacenamiento) {
      avisoAlmacenamiento = true;
      avisar('No se pudo guardar el progreso: el almacenamiento del navegador está lleno.');
    }
  }

  // --- generacion ------------------------------------------------------------------
  const paramsGeo = () => Object.fromEntries(CLAVES_GEO.map(k => [k, st[k]]));

  function generar() {
    try {
      const r = Formas.generar(st);
      $('error').hidden = true;
      return r;
    } catch (e) {
      mostrarError(`No se pudo generar la forma (${e.message}). Se volvió al círculo por defecto.`);
      Object.assign(st, { forma: 'circulo', w: 16, h: 16, modo: 'relleno', grosor: 1 });
      return Formas.generar(st);
    }
  }

  // opts.sinLeer: usar st tal cual (deshacer); opts.conservar: no limpiar marcas.
  function regenerar(opts = {}) {
    if (!opts.sinLeer) leerUI();
    if (st.igualar && !es3D()) st.h = st.w;
    const pedida = Estado.firma(st);
    if (pedida === firmaPedida && capas.length && !opts.sinLeer) { ponerUI(); guardarEstado(); return; }
    firmaPedida = pedida;

    const r = generar();
    capas = r.capas; totales = r.totales; grosorMax = r.grosorMax;
    if (r.grosorRecortado) {
      avisar(`Grosor máximo para este tamaño: ${r.grosor}. Con más, la forma quedaría sólida.`);
    }
    st.grosor = r.grosor;

    const nueva = Estado.firma(st);
    if (firmaActual === null) {
      hechos = Estado.cargarMarcas(nueva, capas);   // arranque: recuperar el progreso guardado
    } else if (nueva !== firmaActual && hechos.size && !opts.conservar) {
      apilar(pilaDeshacer, { params: previos, hechos: [...hechos] });
      pilaRehacer.length = 0;
      hechos = new Set();
      avisar('La forma cambió: se limpiaron las marcas.', deshacer);
    }
    const cambioTamano = !previos || previos.forma !== st.forma || previos.w !== st.w || previos.h !== st.h;
    firmaActual = nueva;
    previos = paramsGeo();
    st.capa = clamp(st.capa, 0, capas.length - 1);
    if (cursor) cursor = { x: Math.min(cursor.x, capas[0][0].length - 1), y: Math.min(cursor.y, capas[0].length - 1) };
    ponerUI(); guardarEstado(); guardarMarcas();
    refrescar();
    if (cambioTamano) alejarSiNoCabe();
  }

  function aplazar(fn, ms) {
    let t;
    return () => { clearTimeout(t); t = setTimeout(fn, ms); };
  }
  const regenerarDiferido = aplazar(regenerar, 150);

  // --- historial -------------------------------------------------------------------
  function apilar(pila, snap) { pila.push(snap); if (pila.length > MAX_HISTORIAL) pila.shift(); }
  const instantanea = () => ({ params: paramsGeo(), hechos: [...hechos] });

  function restaurar(snap) {
    const cambiaGeo = Estado.firma({ ...st, ...snap.params }) !== firmaActual;
    Object.assign(st, snap.params);
    hechos = new Set(snap.hechos);
    if (cambiaGeo) regenerar({ sinLeer: true, conservar: true });
    else { guardarMarcas(); refrescar(); }
  }
  function deshacer() {
    const s = pilaDeshacer.pop(); if (!s) return;
    apilar(pilaRehacer, instantanea()); restaurar(s); anunciar('Deshecho');
  }
  function rehacer() {
    const s = pilaRehacer.pop(); if (!s) return;
    apilar(pilaDeshacer, instantanea()); restaurar(s); anunciar('Rehecho');
  }
  function antesDeMarcar() { apilar(pilaDeshacer, instantanea()); pilaRehacer.length = 0; }
  function trasMarcar() { guardarMarcas(); refrescar(); }

  // --- marcas ----------------------------------------------------------------------
  function fijar(c, x, y, valor) {
    if (!capas[c][y][x]) return false;
    const k = clave(c, x, y);
    if (valor === hechos.has(k)) return false;
    if (valor) hechos.add(k); else hechos.delete(k);
    return true;
  }

  function marcarCapas(indices, valor) {
    antesDeMarcar();
    let n = 0;
    for (const c of indices) {
      const g = capas[c];
      for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (fijar(c, x, y, valor)) n++;
    }
    if (!n) { pilaDeshacer.pop(); return; }
    trasMarcar();
    avisar(`${valor ? 'Marcados' : 'Desmarcados'} ${n} bloques.`, deshacer);
  }
  const todas = () => capas.map((_, i) => i);

  function porCapa() {
    const a = new Array(capas.length).fill(0);
    for (const k of hechos) a[+k.slice(0, k.indexOf(','))]++;
    return a;
  }

  // --- vista -----------------------------------------------------------------------
  let rafPendiente = false;
  function programarDibujo() {
    if (rafPendiente) return;
    rafPendiente = true;
    requestAnimationFrame(() => { rafPendiente = false; dibujar(); });
  }

  function dibujar() {
    geo = Render.dibujar(cv, {
      g: capas[st.capa], capa: st.capa, hechos, s: st.zoom, op: st,
      cursor: document.activeElement === cv ? cursor : null,
      dpr: window.devicePixelRatio || 1,
    });
    $('zoomTxt').textContent = `${st.zoom} px/bloque` + (geo.ocultos ? ' · acércate para ver todos los números' : '');
    $('zoomMenos').disabled = st.zoom <= LIMITES.zoomMin;
    $('zoomMas').disabled = st.zoom >= LIMITES.zoomMax;
  }

  // --- zoom ------------------------------------------------------------------------
  const wrap = cv.parentElement;
  const NIVELES = [2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48];

  // Cambia el zoom manteniendo quieta la celda bajo el punto (clientX/Y); sin punto, el centro visible.
  function fijarZoom(nuevo, punto) {
    nuevo = clamp(nuevo, LIMITES.zoomMin, LIMITES.zoomMax);
    if (nuevo === st.zoom) return;
    const r = cv.getBoundingClientRect(), rw = wrap.getBoundingClientRect();
    const px = (punto ? punto.clientX : rw.left + rw.width / 2) - r.left;
    const py = (punto ? punto.clientY : rw.top + rw.height / 2) - r.top;
    const fx = (px - geo.L) / geo.s, fy = (py - geo.T) / geo.s;
    st.zoom = nuevo; $('zoom').value = nuevo;
    dibujar();
    wrap.scrollLeft += geo.L + fx * geo.s - px;
    wrap.scrollTop += geo.T + fy * geo.s - py;
    guardarEstado();
  }

  function zoomPaso(dir, punto) {
    const n = dir > 0
      ? NIVELES.find(v => v > st.zoom) || LIMITES.zoomMax
      : [...NIVELES].reverse().find(v => v < st.zoom) || LIMITES.zoomMin;
    fijarZoom(n, punto);
  }

  // Espacio util del contenedor del dibujo (su alto maximo, no el actual).
  function espacioVisible() {
    const cs = getComputedStyle(wrap);
    const padH = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padV = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + 2;
    const maxH = parseFloat(cs.maxHeight);
    return { w: wrap.clientWidth - padH, h: (Number.isFinite(maxH) ? maxH : window.innerHeight * 0.6) - padV };
  }

  // Mayor zoom con el que la capa actual cabe entera.
  function zoomAjustado() {
    const { w, h } = espacioVisible(), g = capas[st.capa];
    for (let s = LIMITES.zoomMax; s > LIMITES.zoomMin; s--) {
      const m = Render.medir(g, s, st);
      if (m.W <= w && m.H <= h) return s;
    }
    return LIMITES.zoomMin;
  }

  function ajustar() {
    fijarZoom(zoomAjustado());
    wrap.scrollLeft = 0; wrap.scrollTop = 0;
  }

  // Al crecer la forma: si ya no cabe, alejar hasta que quepa (nunca acerca solo).
  function alejarSiNoCabe() {
    const { w, h } = espacioVisible(), m = Render.medir(capas[st.capa], st.zoom, st);
    if (m.W <= w && m.H <= h) return;
    const s = zoomAjustado();
    if (s < st.zoom) { fijarZoom(s); wrap.scrollLeft = 0; wrap.scrollTop = 0; }
  }

  function nombreForma() {
    if (es3D()) return st.esfera === 'cupula' ? 'Cúpula' : 'Esfera';
    return $('forma').selectedOptions[0].textContent;
  }
  const dimensiones = () => (es3D() ? `Ø${st.w}` : `${st.w}×${st.h}`);
  const textoModo = () => (st.modo === 'hueco' ? `hueco, grosor ${st.grosor}` : 'sólido');

  function refrescar() {
    const n = capas.length;
    $('selCapa').hidden = n < 2;
    $('capa').max = n - 1; $('capa').value = st.capa;
    $('capaTxt').textContent = `Capa ${st.capa + 1} de ${n}` + (st.capa === 0 ? ' (base)' : '');
    for (const id of ['marcarCapa', 'desmarcarCapa']) $(id).hidden = n < 2;
    $('deshacer').disabled = !pilaDeshacer.length;
    $('rehacer').disabled = !pilaRehacer.length;
    dibujar(); materiales(); resumen();
  }

  function resumen() {
    const g = capas[st.capa], h = g.length, w = g[0].length;
    const [cx0, cx1] = Render.centro(w), [cy0, cy1] = Render.centro(h);
    let minX = Infinity, maxX = -1, minY = Infinity, maxY = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!g[y][x]) continue;
      if (y >= cy0 && y <= cy1) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
      if (x >= cx0 && x <= cx1) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    }
    let txt = `Centro: ${cx1 - cx0 + 1}×${cy1 - cy0 + 1} bloques`;
    if (maxX >= 0) {
      txt += ` · del centro al borde: ← ${cx0 - minX} · → ${maxX - cx1}`;
      if (maxY >= 0) txt += ` · ↑ ${cy0 - minY} · ↓ ${maxY - cy1}`;
      txt += ' bloques (sin contar el centro)';
    }
    $('resumen').textContent = txt;
  }

  function materiales() {
    const total = totales.reduce((a, b) => a + b, 0);
    const hechosCapa = porCapa();
    const marcados = hechos.size;
    let html = `<div class="tot">${total} <small>bloques</small></div><div class="mat">` +
      `<span>Stacks</span><b>${fmtStacks(total)}</b>` +
      `<span>Shulker boxes</span><b>${(total / SHULKER).toFixed(2)} → ${Math.ceil(total / SHULKER)}</b>` +
      `<span>Cofres dobles</span><b>${(total / COFRE_DOBLE).toFixed(2)} → ${Math.ceil(total / COFRE_DOBLE)}</b>` +
      `<span>Construidos</span><b>${marcados}</b><span>Faltan</span><b>${total - marcados}</b></div>` +
      `<p class="formula">1 stack = ${STACK} · 1 shulker = 27 stacks = ${SHULKER} · 1 cofre doble = 54 stacks = ${COFRE_DOBLE}</p>`;
    $('materiales').innerHTML = html;

    if (capas.length > 1) {
      let t = '<table><thead><tr><th scope="col">Capa</th><th scope="col">Bloques</th><th scope="col">Stacks</th><th scope="col">Hechos</th></tr></thead><tbody>';
      totales.forEach((c, i) => {
        const cls = [i === st.capa ? 'sel' : '', c && hechosCapa[i] === c ? 'completa' : ''].join(' ');
        t += `<tr data-i="${i}" class="${cls}"${i === st.capa ? ' aria-current="true"' : ''}><td>${i + 1}</td><td>${c}</td><td>${fmtStacks(c)}</td><td>${pct(hechosCapa[i], c)} %</td></tr>`;
      });
      $('tablaCapas').innerHTML = t + '</tbody></table>';
    } else {
      $('tablaCapas').innerHTML = '';
    }

    const enCapa = hechosCapa[st.capa], totCapa = totales[st.capa];
    $('barraProg').style.width = pct(marcados, total) + '%';
    $('progTxt').textContent = capas.length > 1
      ? `Capa: ${enCapa}/${totCapa} (${pct(enCapa, totCapa)} %) · Total: ${marcados}/${total} (${pct(marcados, total)} %)`
      : `Construidos: ${marcados}/${total} (${pct(marcados, total)} %)`;
    cv.setAttribute('aria-label',
      `Dibujo de ${nombreForma()} ${dimensiones()}, ${textoModo()}. Capa ${st.capa + 1} de ${capas.length}: ${totCapa} bloques, ${enCapa} construidos.`);
  }

  function irCapa(i) {
    st.capa = clamp(i, 0, capas.length - 1);
    guardarEstado(); refrescar();
  }

  // --- raton y tactil -------------------------------------------------------------------
  function celda(ev) {
    if (!geo) return null;
    const r = cv.getBoundingClientRect();
    const x = Math.floor((ev.clientX - r.left - geo.L) / geo.s), y = Math.floor((ev.clientY - r.top - geo.T) / geo.s);
    return x >= 0 && y >= 0 && x < geo.w && y < geo.h ? { x, y } : null;
  }

  function describir(c) {
    const g = capas[st.capa];
    const estado = !g[c.y][c.x] ? 'vacío' : hechos.has(clave(st.capa, c.x, c.y)) ? 'bloque construido' : 'bloque';
    return `Columna ${c.x + 1}, fila ${c.y + 1} · relativo al centro (${Render.etiquetaRel(Render.relativo(c.x, geo.w))}, ` +
      `${Render.etiquetaRel(Render.relativo(c.y, geo.h))}) · ${estado}`;
  }

  const INFO_INICIAL = matchMedia('(pointer: coarse)').matches
    ? 'Toca un bloque para ver su posición y marcarlo.'
    : 'Pasa el ratón por el dibujo para ver la posición de cada bloque.';
  $('info').textContent = INFO_INICIAL;

  let trazo = null;   // { valor, cambio, id } mientras se pinta con raton/lapiz
  let toque = null;   // { x, y, c } inicio de un toque
  const toques = new Map();   // dedos sobre el dibujo (para pellizcar)
  let pellizco = null;        // { d, z } distancia y zoom al empezar
  const dedos = () => [...toques.values()];
  cv.addEventListener('contextmenu', ev => ev.preventDefault());
  cv.addEventListener('pointerdown', ev => {
    const c = celda(ev);
    if (ev.pointerType === 'touch') {
      toques.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (toques.size === 2) {
        const [a, b] = dedos();
        toque = null;
        pellizco = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: st.zoom };
      } else {
        toque = { x: ev.clientX, y: ev.clientY, c };
      }
      return;
    }
    if (!c || (ev.button !== 0 && ev.button !== 2)) return;
    ev.preventDefault();
    cv.focus({ preventScroll: true });
    const valor = ev.button === 2 ? false : !hechos.has(clave(st.capa, c.x, c.y));
    trazo = { valor, cambio: false, id: ev.pointerId };
    antesDeMarcar();
    cv.setPointerCapture(ev.pointerId);
    pintar(c);
  });
  function pintar(c) {
    if (c && fijar(st.capa, c.x, c.y, trazo.valor)) { trazo.cambio = true; programarDibujo(); }
  }
  cv.addEventListener('pointermove', ev => {
    if (ev.pointerType === 'touch' && toques.has(ev.pointerId)) {
      toques.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pellizco && toques.size === 2) {
        const [a, b] = dedos();
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        fijarZoom(Math.round(pellizco.z * d / pellizco.d), { clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
        return;
      }
    }
    const c = celda(ev);
    if (ev.pointerType === 'touch') return;
    $('info').textContent = c ? describir(c) : INFO_INICIAL;
    if (trazo && ev.pointerId === trazo.id) pintar(c);
  });
  function finTrazo(ev) {
    if (ev.pointerType === 'touch') {
      toques.delete(ev.pointerId);
      if (toques.size < 2) pellizco = null;
    }
    if (toque && ev.pointerType === 'touch') {
      const movido = Math.hypot(ev.clientX - toque.x, ev.clientY - toque.y) > 10;
      if (!movido && ev.type === 'pointerup' && toque.c) {
        const { x, y } = toque.c;
        $('info').textContent = describir(toque.c);
        antesDeMarcar();
        if (fijar(st.capa, x, y, !hechos.has(clave(st.capa, x, y)))) trasMarcar(); else pilaDeshacer.pop();
      }
      toque = null;
      return;
    }
    if (!trazo || ev.pointerId !== trazo.id) return;
    if (trazo.cambio) trasMarcar(); else pilaDeshacer.pop();
    trazo = null;
    refrescar();
  }
  cv.addEventListener('pointerup', finTrazo);
  cv.addEventListener('pointercancel', finTrazo);

  // Ctrl + rueda (o pellizco en el touchpad, que llega igual): zoom proporcional hacia el puntero.
  wrap.addEventListener('wheel', ev => {
    if (!ev.ctrlKey) return;
    ev.preventDefault();
    let nuevo = Math.round(st.zoom * Math.exp(-ev.deltaY * 0.0025));
    if (nuevo === st.zoom) nuevo += ev.deltaY < 0 ? 1 : -1;
    fijarZoom(nuevo, ev);
  }, { passive: false });

  // --- teclado ---------------------------------------------------------------------
  function cursorInicial() {
    const g = capas[st.capa];
    return { x: Render.centro(g[0].length)[0], y: Render.centro(g.length)[0] };
  }
  cv.addEventListener('focus', () => { if (!cursor) cursor = cursorInicial(); dibujar(); });
  cv.addEventListener('blur', dibujar);
  cv.addEventListener('keydown', ev => {
    const g = capas[st.capa], w = g[0].length, h = g.length;
    if (!cursor) cursor = cursorInicial();
    const paso = ev.shiftKey ? 5 : 1;
    switch (ev.key) {
      case 'ArrowLeft': cursor.x = Math.max(0, cursor.x - paso); break;
      case 'ArrowRight': cursor.x = Math.min(w - 1, cursor.x + paso); break;
      case 'ArrowUp': cursor.y = Math.max(0, cursor.y - paso); break;
      case 'ArrowDown': cursor.y = Math.min(h - 1, cursor.y + paso); break;
      case '+': case '=': ev.preventDefault(); zoomPaso(1); return;
      case '-': ev.preventDefault(); zoomPaso(-1); return;
      case '0': ev.preventDefault(); ajustar(); return;
      case 'PageUp': ev.preventDefault(); irCapa(st.capa + 1); anunciar($('capaTxt').textContent); return;
      case 'PageDown': ev.preventDefault(); irCapa(st.capa - 1); anunciar($('capaTxt').textContent); return;
      case ' ': case 'Enter': {
        const { x, y } = cursor;
        if (!g[y][x]) { anunciar('Celda vacía: no hay bloque que marcar.'); ev.preventDefault(); return; }
        antesDeMarcar();
        fijar(st.capa, x, y, !hechos.has(clave(st.capa, x, y)));
        trasMarcar();
        break;
      }
      default: return;
    }
    ev.preventDefault();
    const txt = describir(cursor);
    $('info').textContent = txt; anunciar(txt);
    dibujar();
    // mantener visible la celda activa
    const wrap = cv.parentElement, px = geo.L + cursor.x * geo.s, py = geo.T + cursor.y * geo.s;
    if (px < wrap.scrollLeft || px + geo.s > wrap.scrollLeft + wrap.clientWidth) wrap.scrollLeft = px - wrap.clientWidth / 2;
    if (py < wrap.scrollTop || py + geo.s > wrap.scrollTop + wrap.clientHeight) wrap.scrollTop = py - wrap.clientHeight / 2;
  });

  document.addEventListener('keydown', ev => {
    const enCampo = ev.target instanceof Element && ev.target.matches('input[type=number], select');
    if (!(ev.ctrlKey || ev.metaKey) || enCampo) return;
    const k = ev.key.toLowerCase();
    if (k === 'z' && !ev.shiftKey) { ev.preventDefault(); deshacer(); }
    else if (k === 'y' || (k === 'z' && ev.shiftKey)) { ev.preventDefault(); rehacer(); }
  });

  // --- exportacion -----------------------------------------------------------------
  function nombreArchivo(c) {
    const variante = es3D() ? st.esfera : st.forma;
    const hueco = st.modo === 'hueco' ? `-hueco-g${st.grosor}` : '';
    const capa = capas.length > 1 ? `-capas${capas.length}-capa${c + 1}` : '';
    return `${variante}-${es3D() ? st.w : st.w + 'x' + st.h}${hueco}${capa}.png`;
  }

  function exportarCapa(c) {
    return new Promise(resolve => {
      try {
        const aux = document.createElement('canvas');
        const enCapa = porCapa()[c];
        Render.dibujar(aux, {
          g: capas[c], capa: c, hechos, s: st.zoom, op: st, dpr: 1,
          cabecera: [
            `${nombreForma()} ${dimensiones()} · ${textoModo()}`,
            `Capa ${c + 1} de ${capas.length} · ${totales[c]} bloques (${fmtStacks(totales[c])}) · construidos ${enCapa}`,
            `Formas MC · ${new Date().toLocaleDateString('es')}`,
          ],
        });
        aux.toBlob(blob => {
          if (!blob) {
            mostrarError('No se pudo exportar la imagen (demasiado grande). Reduce el zoom y vuelve a intentarlo.');
            return resolve(false);
          }
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = nombreArchivo(c);
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 1000);
          resolve(true);
        }, 'image/png');
      } catch (e) {
        mostrarError(`No se pudo exportar la imagen (${e.message}). Reduce el zoom y vuelve a intentarlo.`);
        resolve(false);
      }
    });
  }

  $('exportar').addEventListener('click', () => exportarCapa(st.capa));
  $('exportarTodas').addEventListener('click', async () => {
    const n = capas.length;
    if (n > 10 && !confirm(`Se descargarán ${n} imágenes, una por capa. El navegador puede pedir permiso para descargas múltiples. ¿Continuar?`)) return;
    for (let c = 0; c < n; c++) {
      if (!(await exportarCapa(c))) return;
      await new Promise(r => setTimeout(r, 350));
    }
    avisar(`Exportadas ${n} capa${n > 1 ? 's' : ''}.`);
  });

  // --- eventos del panel -------------------------------------------------------------
  for (const id of ['w', 'h', 'grosor']) {
    $(id).addEventListener('input', regenerarDiferido);
    $(id).addEventListener('change', () => regenerar());
  }
  for (const id of ['forma', 'igualar', 'modo', 'esfera', 'orient']) {
    $(id).addEventListener('input', () => regenerar());
  }
  for (const id of TOGGLES) {
    $(id).addEventListener('input', () => { leerUI(); guardarEstado(); programarDibujo(); });
  }
  $('zoom').addEventListener('input', () => fijarZoom(+$('zoom').value));
  $('zoomMenos').addEventListener('click', () => zoomPaso(-1));
  $('zoomMas').addEventListener('click', () => zoomPaso(1));
  $('zoomAjustar').addEventListener('click', ajustar);
  $('capa').addEventListener('input', () => irCapa($('capa').value));
  $('prev').addEventListener('click', () => irCapa(st.capa - 1));
  $('next').addEventListener('click', () => irCapa(st.capa + 1));
  $('tablaCapas').addEventListener('click', ev => {
    const tr = ev.target.closest('tr[data-i]');
    if (tr) irCapa(+tr.dataset.i);
  });
  $('deshacer').addEventListener('click', deshacer);
  $('rehacer').addEventListener('click', rehacer);
  $('marcarCapa').addEventListener('click', () => marcarCapas([st.capa], true));
  $('desmarcarCapa').addEventListener('click', () => marcarCapas([st.capa], false));
  $('marcarTodo').addEventListener('click', () => {
    const total = totales.reduce((a, b) => a + b, 0);
    if (capas.length > 1 && !confirm(`¿Marcar los ${total} bloques de las ${capas.length} capas como construidos?`)) return;
    marcarCapas(todas(), true);
  });
  $('limpiar').addEventListener('click', () => marcarCapas(todas(), false));

  // --- navegacion inferior (movil): resalta la seccion visible ------------------------------
  const enlacesNav = [...document.querySelectorAll('.navmovil a')];
  if ('IntersectionObserver' in window) {
    const visibles = new Map();
    const io = new IntersectionObserver(entradas => {
      for (const e of entradas) visibles.set(e.target.id, e.intersectionRatio);
      let mejor = null, max = 0;
      for (const [id, r] of visibles) if (r > max) { max = r; mejor = id; }
      for (const a of enlacesNav) {
        if (a.hash === '#' + mejor) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    for (const a of enlacesNav) io.observe($(a.hash.slice(1)));
  }

  // --- arranque ----------------------------------------------------------------------
  ponerUI();
  regenerar();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dibujar);
})();
