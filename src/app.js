// Raiz de composicion: crea los modulos, inyecta sus dependencias, conecta los eventos y arranca.
// Aqui no hay reglas de negocio: solo cableado entre estado, documento, vistas y entradas.
(() => {
  const $ = id => document.getElementById(id);
  const al = (id, evento, fn) => $(id).addEventListener(evento, fn);
  const cv = $('lienzo'), wrap = cv.parentElement;
  const almacen = Almacen.local();
  const { LIMITES } = Estado;

  const avisos = Avisos.crear({
    caja: $('aviso'), texto: $('avisoTxt'), boton: $('avisoAccion'), error: $('error'), anuncio: $('anuncio'),
    nota: $('nota'), notaTexto: $('notaTxt'),
  });

  const st = Estado.cargar(almacen);
  const panel = Panel.crear({ st, limites: LIMITES, es3D: () => doc.es3D() });
  const vista = VistaMateriales.crear({
    materiales: $('materiales'), tabla: $('tablaCapas'), barra: $('barraProg'), progreso: $('progTxt'), lienzo: cv,
  });
  let teclado = null;               // se conecta mas abajo, antes de regenerar
  let geo = null;                   // geometria del ultimo dibujo (para las entradas)

  const doc = Documento.crear({
    st, almacen, avisos, panel,
    alCambiar: () => refrescar(),
    alCambiarTamano: () => zoom.alejarSiNoCabe(),
    alRestringir: (w, h) => teclado.restringir(w, h),
  });

  const aplazar = (fn, ms) => { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; };
  const regenerarDiferido = aplazar(() => doc.regenerar(), 150);

  // --- dibujo -----------------------------------------------------------------------
  let rafPendiente = false;
  function programarDibujo() {
    if (rafPendiente) return;
    rafPendiente = true;
    requestAnimationFrame(() => { rafPendiente = false; dibujar(); });
  }

  function dibujar() {
    geo = Render.dibujar(cv, {
      g: doc.capaActual(), capa: doc.capa(), hechos: doc.hechos(), s: st.zoom, op: st,
      cursor: document.activeElement === cv && teclado ? teclado.cursor() : null,
      dpr: window.devicePixelRatio || 1,
    });
    $('zoom').value = st.zoom;
    $('zoomTxt').textContent = `${st.zoom} px/bloque` + (geo.ocultos ? ' · acércate para ver todos los números' : '');
    $('zoomMenos').disabled = st.zoom <= LIMITES.zoomMin;
    $('zoomMas').disabled = st.zoom >= LIMITES.zoomMax;
  }

  const zoom = Zoom.crear({
    lienzo: cv, contenedor: wrap, limites: LIMITES,
    dibujo: {
      medir: s => Render.medir(doc.capaActual(), s, st),
      geometria: () => geo,
    },
    zoom: {
      obtener: () => st.zoom,
      fijar: n => { st.zoom = n; doc.guardarEstado(); },
    },
    alDibujar: dibujar,
  });

  // --- textos de la forma -----------------------------------------------------------
  function nombreForma() {
    const def = doc.definicion();
    const variante = (def.variantes || []).find(v => v.valor === st.esfera);
    return (variante && variante.nombre) || def.nombre || $('forma').selectedOptions[0].textContent;
  }
  const dimensiones = () => (doc.es3D() ? `Ø${st.w}` : `${st.w}×${st.h}`);
  const textoModo = () => (st.modo === 'hueco' ? `hueco, grosor ${st.grosor}` : 'sólido');

  // --- vista ------------------------------------------------------------------------
  function refrescar() {
    const n = doc.capas().length, capa = doc.capa();
    $('selCapa').hidden = n < 2;
    $('capa').max = n - 1; $('capa').value = capa;
    $('capaTxt').textContent = `Capa ${capa + 1} de ${n}` + (capa === 0 ? ' (base)' : '');
    for (const id of ['marcarCapa', 'desmarcarCapa']) $(id).hidden = n < 2;
    $('deshacer').disabled = !doc.puedeDeshacer();
    $('rehacer').disabled = !doc.puedeRehacer();
    dibujar();

    const r = Materiales.resumen(doc.totales(), doc.porCapa(n), capa);
    vista.pintar(r, capa, { nombre: nombreForma(), dimensiones: dimensiones(), modo: textoModo() });
    $('resumen').textContent = Materiales.textoResumenCentro(doc.capaActual(), Render.centro);
  }

  // --- interpretacion del puntero ---------------------------------------------------
  function celda(ev) {
    if (!geo) return null;
    const r = cv.getBoundingClientRect();
    const x = Math.floor((ev.clientX - r.left - geo.L) / geo.s), y = Math.floor((ev.clientY - r.top - geo.T) / geo.s);
    return x >= 0 && y >= 0 && x < geo.w && y < geo.h ? { x, y } : null;
  }

  // Banda de la regla bajo el puntero, si la hay.
  function regla(ev) {
    if (!geo) return null;
    const r = cv.getBoundingClientRect();
    return Render.zonaRegla(geo, ev.clientX - r.left, ev.clientY - r.top);
  }

  // Anuncio para lectores de pantalla del resultado de alternar una linea.
  function anunciarLinea(eje, i, r) {
    const nombre = eje === 'fila' ? 'Fila' : 'Columna';
    if (!r.bloques) avisos.anunciar(`La ${eje} ${i + 1} no tiene bloques.`);
    else avisos.anunciar(`${nombre} ${i + 1}: ${r.n} bloques ${r.valor ? 'marcados' : 'desmarcados'}.`);
  }

  function describir(c) {
    const g = doc.capaActual();
    const estado = !g[c.y][c.x] ? 'vacío' : doc.hecho(c.x, c.y) ? 'bloque construido' : 'bloque';
    return `Columna ${c.x + 1}, fila ${c.y + 1} · relativo al centro (${Render.textoRelativo(c.x, geo.w, 'x')}, ` +
      `${Render.textoRelativo(c.y, geo.h, 'y')}) · ${estado}`;
  }

  const INFO_INICIAL = matchMedia('(pointer: coarse)').matches
    ? 'Toca un bloque para ver su posición y marcarlo.'
    : 'Pasa el ratón por el dibujo para ver la posición de cada bloque.';
  $('info').textContent = INFO_INICIAL;

  const informar = txt => { $('info').textContent = txt; };
  const cursorInicial = () => ({ x: Render.centro(doc.capaActual()[0].length)[0], y: Render.centro(doc.capaActual().length)[0] });
  const dimensionesCapa = () => ({ w: doc.capaActual()[0].length, h: doc.capaActual().length });

  // Mantiene visible la celda activa del teclado.
  function verCursor(c) {
    const px = geo.L + c.x * geo.s, py = geo.T + c.y * geo.s;
    if (px < wrap.scrollLeft || px + geo.s > wrap.scrollLeft + wrap.clientWidth) wrap.scrollLeft = px - wrap.clientWidth / 2;
    if (py < wrap.scrollTop || py + geo.s > wrap.scrollTop + wrap.clientHeight) wrap.scrollTop = py - wrap.clientHeight / 2;
  }

  // Interfaz pequena que comparten raton, tactil y teclado (no ven st ni el documento).
  // Cada entrada recibe solo los grupos que usa.
  const accionesDibujo = {
    celda, regla, describir, informar, programarDibujo, refrescar, dibujar,
    infoInicial: INFO_INICIAL, anunciar: avisos.anunciar, anunciarLinea,
    cursorInicial, dimensionesCapa, verCursor,
  };
  const accionesMarcas = {
    estaHecho: doc.hecho, hayBloque: doc.hayBloque, fijar: doc.fijar,
    antesDeMarcar: doc.antesDeMarcar, trasMarcar: doc.trasMarcar, descartarPaso: doc.descartarPaso,
    marcarLinea: doc.marcarLinea,
  };
  const accionesZoom = {
    zoom: (n, punto) => zoom.aplicar(n, punto), zoomActual: () => st.zoom,
    pasoZoom: dir => zoom.paso(dir), ajustarZoom: () => zoom.ajustar(),
  };
  const accionesCapas = { irCapa: doc.irCapa, capaActual: doc.capa, capaTexto: () => $('capaTxt').textContent };
  const accionesHistorial = { deshacer: doc.deshacer, rehacer: doc.rehacer };

  teclado = EntradaTeclado.conectar({
    lienzo: cv,
    dibujo: accionesDibujo, marcas: accionesMarcas, zoom: accionesZoom,
    capas: accionesCapas, historial: accionesHistorial,
  });
  EntradaRaton.conectar({
    lienzo: cv, contenedor: wrap,
    dibujo: accionesDibujo, marcas: accionesMarcas, zoom: accionesZoom,
  });
  EntradaTactil.conectar({
    lienzo: cv, contenedor: wrap, limites: LIMITES, limitar: Estado.clamp,
    dibujo: accionesDibujo, marcas: accionesMarcas, zoom: accionesZoom,
  });

  // --- exportacion ------------------------------------------------------------------
  const exportador = Exportar.crear({
    render: Render, descargar: Exportar.descargar, avisos,
    contexto: () => ({
      capas: doc.capas(), totales: doc.totales(), hechos: doc.hechos(), op: st, zoom: st.zoom,
      nombre: nombreForma(), dimensiones: dimensiones(), modoTexto: textoModo(),
      variante: doc.definicion().variantes ? st.esfera : st.forma, modo: st.modo, grosor: st.grosor, es3D: doc.es3D(),
      w: st.w, h: st.h, porCapa: doc.porCapa(doc.capas().length), stacks: Materiales.fmtStacks,
    }),
  });

  // --- panel y controles ------------------------------------------------------------
  panel.conectar({
    alCambiarGeo: ({ diferido }) => (diferido ? regenerarDiferido() : doc.regenerar()),
    alCambiarVista: () => { panel.leer(); doc.guardarEstado(); programarDibujo(); },
  });
  al('zoom', 'input', () => zoom.aplicar(+$('zoom').value));
  al('zoomMenos', 'click', () => zoom.paso(-1));
  al('zoomMas', 'click', () => zoom.paso(1));
  al('zoomAjustar', 'click', () => zoom.ajustar());
  al('capa', 'input', () => doc.irCapa($('capa').value));
  al('prev', 'click', () => doc.irCapa(doc.capa() - 1));
  al('next', 'click', () => doc.irCapa(doc.capa() + 1));
  al('tablaCapas', 'click', ev => { const tr = ev.target.closest('tr[data-i]'); if (tr) doc.irCapa(+tr.dataset.i); });
  al('deshacer', 'click', doc.deshacer);
  al('rehacer', 'click', doc.rehacer);
  al('marcarCapa', 'click', () => doc.marcarCapas([doc.capa()], true));
  al('desmarcarCapa', 'click', () => doc.marcarCapas([doc.capa()], false));
  al('marcarTodo', 'click', () => {
    const total = doc.totales().reduce((a, b) => a + b, 0), n = doc.capas().length;
    if (n > 1 && !confirm(`¿Marcar los ${total} bloques de las ${n} capas como construidos?`)) return;
    doc.marcarCapas(doc.todas(), true);
  });
  al('limpiar', 'click', () => doc.marcarCapas(doc.todas(), false));
  al('exportar', 'click', () => exportador.capa(doc.capa()));
  al('exportarTodas', 'click', () => exportador.todas());

  Menu.crear({
    panel: $('panel'), boton: $('verMenu'), botonTexto: $('verMenuTxt'), cerrar: $('cerrarMenu'),
    nav: document.querySelectorAll('.navmovil a'), main: document.querySelector('main'),
    cuerpo: document.body, almacen,
  });

  // --- arranque ---------------------------------------------------------------------
  panel.poner(doc.grosorMax());
  doc.regenerar();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dibujar);
})();
