// Raiz de composicion: crea los modulos, inyecta sus dependencias, conecta los eventos y arranca.
// Aqui no hay reglas de negocio: solo cableado entre estado, vistas y entradas.
(() => {
  const $ = id => document.getElementById(id);
  const al = (id, evento, fn) => $(id).addEventListener(evento, fn);
  const cv = $('lienzo'), wrap = cv.parentElement;
  const almacen = Almacen.local();
  const { LIMITES, CLAVES_GEO } = Estado;

  const avisos = Avisos.crear({
    caja: $('aviso'), texto: $('avisoTxt'), boton: $('avisoAccion'), error: $('error'), anuncio: $('anuncio'),
  });

  const st = Estado.cargar(almacen);
  let capas = [], totales = [], grosorMax = null;
  const marcas = Marcas.crear(), historial = Historial.crear();
  let firmaActual = null, firmaPedida = null, previos = null;
  let geo = null;                   // geometria del ultimo dibujo (para las entradas)
  let avisoAlmacenamiento = false;

  const es3D = () => st.forma === 'esfera';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, Math.round(+v) || a));
  const paramsGeo = () => Object.fromEntries(CLAVES_GEO.map(k => [k, st[k]]));
  const todas = () => capas.map((_, i) => i);

  const panel = Panel.crear({ st, limites: LIMITES, es3D });
  const vista = VistaMateriales.crear({
    materiales: $('materiales'), tabla: $('tablaCapas'), barra: $('barraProg'), progreso: $('progTxt'),
  });

  // --- persistencia -----------------------------------------------------------------
  function guardarEstado() { Estado.guardar(st, almacen); }
  function guardarMarcas() {
    if (!Estado.guardarMarcas(firmaActual, marcas.conjunto(), almacen) && !avisoAlmacenamiento) {
      avisoAlmacenamiento = true;
      avisos.avisar('No se pudo guardar el progreso: el almacenamiento del navegador está lleno.');
    }
  }

  // --- geometria --------------------------------------------------------------------
  function generar() {
    try {
      const r = Formas.generar(st);
      avisos.ocultarError();
      return r;
    } catch (e) {
      avisos.mostrarError(`No se pudo generar la forma (${e.message}). Se volvió al círculo por defecto.`);
      Object.assign(st, { forma: 'circulo', w: 16, h: 16, modo: 'relleno', grosor: 1 });
      return Formas.generar(st);
    }
  }

  // opts.sinLeer: usar st tal cual (deshacer); opts.conservar: no limpiar marcas.
  function regenerar(opts = {}) {
    if (!opts.sinLeer) panel.leer();
    if (st.igualar && !es3D()) st.h = st.w;
    const pedida = Estado.firma(st);
    if (pedida === firmaPedida && capas.length && !opts.sinLeer) { panel.poner(grosorMax); guardarEstado(); return; }
    firmaPedida = pedida;

    const r = generar();
    capas = r.capas; totales = r.totales; grosorMax = r.grosorMax;
    if (r.grosorRecortado) {
      avisos.avisar(`Grosor máximo para este tamaño: ${r.grosor}. Con más, la forma quedaría sólida.`);
    }
    st.grosor = r.grosor;

    const nueva = Estado.firma(st);
    if (firmaActual === null) {
      marcas.restaurar(Estado.cargarMarcas(nueva, capas, almacen));   // arranque: recuperar el progreso
    } else if (nueva !== firmaActual && marcas.total() && !opts.conservar) {
      historial.apilar({ params: previos, hechos: marcas.instantanea() });
      marcas.limpiar();
      avisos.avisar('La forma cambió: se limpiaron las marcas.', deshacer);
    }
    const cambioTamano = !previos || previos.forma !== st.forma || previos.w !== st.w || previos.h !== st.h;
    firmaActual = nueva;
    previos = paramsGeo();
    st.capa = clamp(st.capa, 0, capas.length - 1);
    if (teclado) teclado.restringir(capas[0][0].length, capas[0].length);
    panel.poner(grosorMax); guardarEstado(); guardarMarcas();
    refrescar();
    if (cambioTamano) zoom.alejarSiNoCabe();
  }

  const aplazar = (fn, ms) => { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; };
  const regenerarDiferido = aplazar(regenerar, 150);

  // --- marcas e historial -----------------------------------------------------------
  const instantanea = () => ({ params: paramsGeo(), hechos: marcas.instantanea() });
  const antesDeMarcar = () => historial.apilar(instantanea());
  const descartarPaso = () => historial.descartar();
  const trasMarcar = () => { guardarMarcas(); refrescar(); };

  function restaurar(snap) {
    const cambiaGeo = Estado.firma({ ...st, ...snap.params }) !== firmaActual;
    Object.assign(st, snap.params);
    marcas.restaurar(snap.hechos);
    if (cambiaGeo) regenerar({ sinLeer: true, conservar: true });
    else { guardarMarcas(); refrescar(); }
  }
  function deshacer() { const s = historial.deshacer(instantanea()); if (!s) return; restaurar(s); avisos.anunciar('Deshecho'); }
  function rehacer() { const s = historial.rehacer(instantanea()); if (!s) return; restaurar(s); avisos.anunciar('Rehecho'); }

  const fijar = (x, y, valor) => marcas.fijar(capas, st.capa, x, y, valor);
  const hayBloque = (x, y) => !!(capas[st.capa][y] && capas[st.capa][y][x]);

  function marcarCapas(indices, valor) {
    antesDeMarcar();
    const n = marcas.marcarCapas(capas, indices, valor);
    if (!n) { historial.descartar(); return; }
    trasMarcar();
    avisos.avisar(`${valor ? 'Marcados' : 'Desmarcados'} ${n} bloques.`, deshacer);
  }

  // --- dibujo -----------------------------------------------------------------------
  let rafPendiente = false;
  function programarDibujo() {
    if (rafPendiente) return;
    rafPendiente = true;
    requestAnimationFrame(() => { rafPendiente = false; dibujar(); });
  }

  function dibujar() {
    geo = Render.dibujar(cv, {
      g: capas[st.capa], capa: st.capa, hechos: marcas.conjunto(), s: st.zoom, op: st,
      cursor: document.activeElement === cv && teclado ? teclado.cursor() : null,
      dpr: window.devicePixelRatio || 1,
    });
    $('zoomTxt').textContent = `${st.zoom} px/bloque` + (geo.ocultos ? ' · acércate para ver todos los números' : '');
    $('zoomMenos').disabled = st.zoom <= LIMITES.zoomMin;
    $('zoomMas').disabled = st.zoom >= LIMITES.zoomMax;
  }

  const zoom = Zoom.crear({
    lienzo: cv, contenedor: wrap, limites: LIMITES, medir: Render.medir,
    geometria: () => geo, obtener: () => st.zoom, definir: n => { st.zoom = n; },
    control: $('zoom'), redibujar: dibujar, guardar: guardarEstado,
    opciones: () => st, capa: () => capas[st.capa],
  });

  const nombreForma = () => (es3D() ? (st.esfera === 'cupula' ? 'Cúpula' : 'Esfera') : $('forma').selectedOptions[0].textContent);
  const dimensiones = () => (es3D() ? `Ø${st.w}` : `${st.w}×${st.h}`);
  const textoModo = () => (st.modo === 'hueco' ? `hueco, grosor ${st.grosor}` : 'sólido');

  function refrescar() {
    const n = capas.length;
    $('selCapa').hidden = n < 2;
    $('capa').max = n - 1; $('capa').value = st.capa;
    $('capaTxt').textContent = `Capa ${st.capa + 1} de ${n}` + (st.capa === 0 ? ' (base)' : '');
    for (const id of ['marcarCapa', 'desmarcarCapa']) $(id).hidden = n < 2;
    $('deshacer').disabled = !historial.puedeDeshacer();
    $('rehacer').disabled = !historial.puedeRehacer();
    dibujar();

    const r = Materiales.resumen(totales, marcas.porCapa(n), st.capa);
    vista.pintar(r, st.capa);
    $('resumen').textContent = Materiales.textoResumenCentro(capas[st.capa], Render.centro);
    cv.setAttribute('aria-label',
      `Dibujo de ${nombreForma()} ${dimensiones()}, ${textoModo()}. Capa ${st.capa + 1} de ${n}: ${r.totCapa} bloques, ${r.enCapa} construidos.`);
  }

  function irCapa(i) { st.capa = clamp(i, 0, capas.length - 1); guardarEstado(); refrescar(); }

  // --- interpretacion del puntero ---------------------------------------------------
  function celda(ev) {
    if (!geo) return null;
    const r = cv.getBoundingClientRect();
    const x = Math.floor((ev.clientX - r.left - geo.L) / geo.s), y = Math.floor((ev.clientY - r.top - geo.T) / geo.s);
    return x >= 0 && y >= 0 && x < geo.w && y < geo.h ? { x, y } : null;
  }

  function describir(c) {
    const g = capas[st.capa];
    const estado = !g[c.y][c.x] ? 'vacío' : marcas.tiene(st.capa, c.x, c.y) ? 'bloque construido' : 'bloque';
    return `Columna ${c.x + 1}, fila ${c.y + 1} · relativo al centro (${Render.etiquetaRel(Render.relativo(c.x, geo.w))}, ` +
      `${Render.etiquetaRel(Render.relativo(c.y, geo.h))}) · ${estado}`;
  }

  const INFO_INICIAL = matchMedia('(pointer: coarse)').matches
    ? 'Toca un bloque para ver su posición y marcarlo.'
    : 'Pasa el ratón por el dibujo para ver la posición de cada bloque.';
  $('info').textContent = INFO_INICIAL;

  const informar = txt => { $('info').textContent = txt; };
  const cursorInicial = () => ({ x: Render.centro(capas[st.capa][0].length)[0], y: Render.centro(capas[st.capa].length)[0] });
  const dimensionesCapa = () => ({ w: capas[st.capa][0].length, h: capas[st.capa].length });

  // Mantiene visible la celda activa del teclado.
  function verCursor(c) {
    const px = geo.L + c.x * geo.s, py = geo.T + c.y * geo.s;
    if (px < wrap.scrollLeft || px + geo.s > wrap.scrollLeft + wrap.clientWidth) wrap.scrollLeft = px - wrap.clientWidth / 2;
    if (py < wrap.scrollTop || py + geo.s > wrap.scrollTop + wrap.clientHeight) wrap.scrollTop = py - wrap.clientHeight / 2;
  }

  // Interfaz pequena que comparten raton, tactil y teclado (no ven st ni capas).
  const acciones = {
    celda, describir, informar, programarDibujo, refrescar, dibujar,
    infoInicial: INFO_INICIAL,
    estaHecho: (x, y) => marcas.tiene(st.capa, x, y),
    hayBloque, fijar, antesDeMarcar, trasMarcar, descartarPaso,
    zoom: (n, punto) => zoom.fijar(n, punto), zoomActual: () => st.zoom,
    pasoZoom: dir => zoom.paso(dir), ajustarZoom: () => zoom.ajustar(),
    irCapa, capaActual: () => st.capa, capaTexto: () => $('capaTxt').textContent,
    anunciar: avisos.anunciar, cursorInicial, dimensionesCapa, verCursor, deshacer, rehacer,
  };

  const teclado = EntradaTeclado.conectar({ lienzo: cv, acciones });
  EntradaRaton.conectar({ lienzo: cv, contenedor: wrap, acciones });
  EntradaTactil.conectar({ lienzo: cv, acciones });

  // --- exportacion ------------------------------------------------------------------
  const exportador = Exportar.crear({
    render: Render, descargar: Exportar.descargar, avisos,
    contexto: () => ({
      capas, totales, hechos: marcas.conjunto(), op: st, zoom: st.zoom,
      nombre: nombreForma(), dimensiones: dimensiones(), modoTexto: textoModo(),
      variante: es3D() ? st.esfera : st.forma, modo: st.modo, grosor: st.grosor, es3D: es3D(),
      w: st.w, h: st.h, porCapa: marcas.porCapa(capas.length), stacks: Materiales.fmtStacks,
    }),
  });

  // --- panel y menu -----------------------------------------------------------------
  for (const id of Panel.CAMPOS) { al(id, 'input', regenerarDiferido); al(id, 'change', () => regenerar()); }
  for (const id of Panel.SELECTS) al(id, 'input', () => regenerar());
  for (const k of Panel.TOGGLES) al(k, 'input', () => { panel.leer(); guardarEstado(); programarDibujo(); });
  al('zoom', 'input', () => zoom.fijar(+$('zoom').value));
  al('zoomMenos', 'click', () => zoom.paso(-1));
  al('zoomMas', 'click', () => zoom.paso(1));
  al('zoomAjustar', 'click', () => zoom.ajustar());
  al('capa', 'input', () => irCapa($('capa').value));
  al('prev', 'click', () => irCapa(st.capa - 1));
  al('next', 'click', () => irCapa(st.capa + 1));
  al('tablaCapas', 'click', ev => { const tr = ev.target.closest('tr[data-i]'); if (tr) irCapa(+tr.dataset.i); });
  al('deshacer', 'click', deshacer);
  al('rehacer', 'click', rehacer);
  al('marcarCapa', 'click', () => marcarCapas([st.capa], true));
  al('desmarcarCapa', 'click', () => marcarCapas([st.capa], false));
  al('marcarTodo', 'click', () => {
    const total = totales.reduce((a, b) => a + b, 0);
    if (capas.length > 1 && !confirm(`¿Marcar los ${total} bloques de las ${capas.length} capas como construidos?`)) return;
    marcarCapas(todas(), true);
  });
  al('limpiar', 'click', () => marcarCapas(todas(), false));
  al('exportar', 'click', () => exportador.capa(st.capa));
  al('exportarTodas', 'click', () => exportador.todas());

  Menu.crear({
    panel: $('panel'), boton: $('verMenu'), botonTexto: $('verMenuTxt'), cerrar: $('cerrarMenu'),
    nav: document.querySelectorAll('.navmovil a'), main: document.querySelector('main'),
    cuerpo: document.body, almacen,
  });

  // --- arranque ---------------------------------------------------------------------
  panel.poner(grosorMax);
  regenerar();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dibujar);
})();
