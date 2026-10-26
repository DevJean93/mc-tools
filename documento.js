// Documento: la forma generada, sus marcas, su historial y el guardado del progreso.
// No toca el DOM: lee y pinta el panel por sus metodos y avisa a la app con `alCambiar`.
const Documento = (() => {
  const Estado = typeof module !== 'undefined' ? require('./estado.js') : globalThis.Estado;
  const Formas = typeof module !== 'undefined' ? require('./shapes.js') : globalThis.Formas;
  const Marcas = typeof module !== 'undefined' ? require('./marcas.js') : globalThis.Marcas;
  const Historial = typeof module !== 'undefined' ? require('./historial.js') : globalThis.Historial;

  function crear({ st, almacen, avisos, panel, alCambiar, alCambiarTamano, alRestringir }) {
    const marcas = Marcas.crear(), historial = Historial.crear();
    let capas = [], totales = [], grosorMax = null;
    let firmaActual = null, firmaPedida = null, previos = null;
    let avisoAlmacenamiento = false;

    if (!almacen.persistente) {
      avisoAlmacenamiento = true;
      avisos.avisar('El navegador bloquea el almacenamiento: el progreso no se guardará al recargar.');
    }

    const definicion = () => Formas.obtener(st.forma) || {};
    const es3D = () => !!definicion().es3D;
    const params = () => Object.fromEntries(Estado.CLAVES_GEO.map(k => [k, st[k]]));
    const capaActual = () => capas[st.capa];
    const todas = () => capas.map((_, i) => i);

    const guardarEstado = () => Estado.guardar(st, almacen);
    function guardarMarcas() {
      if (!Estado.guardarMarcas(firmaActual, marcas.conjunto(), almacen) && !avisoAlmacenamiento) {
        avisoAlmacenamiento = true;
        avisos.avisar(almacen.persistente
          ? 'No se pudo guardar el progreso: el almacenamiento del navegador está lleno.'
          : 'No se pudo guardar el progreso: el navegador bloquea el almacenamiento.');
      }
    }

    // Si la forma pedida no se puede generar, se vuelve al circulo por defecto.
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
      if (pedida === firmaPedida && capas.length && !opts.sinLeer) {
        panel.poner(grosorMax); guardarEstado(); return;
      }
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
      previos = params();
      st.capa = Estado.clamp(st.capa, 0, capas.length - 1);
      alRestringir(capas[0][0].length, capas[0].length);
      panel.poner(grosorMax); guardarEstado(); guardarMarcas();
      alCambiar();
      if (cambioTamano) alCambiarTamano();
    }

    function irCapa(i) {
      st.capa = Estado.clamp(i, 0, capas.length - 1);
      guardarEstado();
      alCambiar();
    }

    const fijar = (x, y, valor) => marcas.fijar(capas, st.capa, x, y, valor);
    const hecho = (x, y) => marcas.tiene(st.capa, x, y);
    const hayBloque = (x, y) => !!(capas[st.capa][y] && capas[st.capa][y][x]);
    const instantanea = () => ({ params: params(), hechos: marcas.instantanea() });
    const antesDeMarcar = () => historial.apilar(instantanea());
    const descartarPaso = () => historial.descartar();
    const trasMarcar = () => { guardarMarcas(); alCambiar(); };

    function restaurar(snap) {
      const cambiaGeo = Estado.firma({ ...st, ...snap.params }) !== firmaActual;
      Object.assign(st, snap.params);
      marcas.restaurar(snap.hechos);
      if (cambiaGeo) regenerar({ sinLeer: true, conservar: true });
      else { guardarMarcas(); alCambiar(); }
    }
    function deshacer() { const s = historial.deshacer(instantanea()); if (!s) return; restaurar(s); avisos.anunciar('Deshecho'); }
    function rehacer() { const s = historial.rehacer(instantanea()); if (!s) return; restaurar(s); avisos.anunciar('Rehecho'); }

    function marcarCapas(indices, valor) {
      antesDeMarcar();
      const n = marcas.marcarCapas(capas, indices, valor);
      if (!n) { historial.descartar(); return; }
      trasMarcar();
      avisos.avisar(`${valor ? 'Marcados' : 'Desmarcados'} ${n} bloques.`, deshacer);
    }

    return {
      capas: () => capas, capaActual, totales: () => totales, grosorMax: () => grosorMax,
      capa: () => st.capa, irCapa, todas, definicion, es3D, params,
      regenerar, fijar, hecho, hayBloque, antesDeMarcar, trasMarcar, descartarPaso,
      deshacer, rehacer, marcarCapas, guardarEstado,
      hechos: marcas.conjunto, porCapa: n => marcas.porCapa(n),
      puedeDeshacer: historial.puedeDeshacer, puedeRehacer: historial.puedeRehacer,
    };
  }

  return { crear };
})();
if (typeof module !== 'undefined') module.exports = Documento; else globalThis.Documento = Documento;
