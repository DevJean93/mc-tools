// Documento: la forma generada, sus marcas, su historial y el guardado del progreso.
// No toca el DOM: lee y pinta el panel por sus metodos y avisa a la app con `alCambiar`.
import { Estado } from './estado.js';
import { Formas } from './formas.js';
import { Marcas } from './marcas.js';
import { Historial } from './historial.js';
export const Documento = (() => {

  const MSG_BLOQUEADO = 'El navegador bloquea el almacenamiento: el progreso no se guardará al recargar.';
  const MSG_LLENO = 'El almacenamiento del navegador está lleno: lo que marques ahora no se guardará al recargar.';

  function crear({ st, almacen, avisos, panel, alCambiar, alCambiarTamano, alRestringir }) {
    const marcas = Marcas.crear(), historial = Historial.crear();
    let capas = [], totales = [], grosorMax = null;
    let firmaActual = null, firmaPedida = null, previos = null;
    let notaLlena = false;   // la nota fija visible es la de "almacenamiento lleno"

    // El estado del almacenamiento es una nota fija, no un aviso temporal: sigue siendo cierto
    // mientras dure y no lo tapa ningun otro aviso (p. ej. el de grosor recortado).
    if (!almacen.persistente) avisos.nota(MSG_BLOQUEADO);

    const definicion = () => Formas.obtener(st.forma) || {};
    const es3D = () => !!definicion().es3D;
    const params = () => Object.fromEntries(Estado.CLAVES_GEO.map(k => [k, st[k]]));
    const capaActual = () => capas[st.capa];
    const todas = () => capas.map((_, i) => i);

    const guardarEstado = () => Estado.guardar(st, almacen);
    function guardarMarcas() {
      if (Estado.guardarMarcas(firmaActual, marcas.conjunto(), almacen)) {
        if (notaLlena) { notaLlena = false; avisos.ocultarNota(); }   // vuelve a haber sitio
      } else if (almacen.persistente && !notaLlena) {
        notaLlena = true;
        avisos.nota(MSG_LLENO);
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

    // Alterna toda una fila o columna de la capa actual. Devuelve el resultado de Marcas para
    // que la entrada anuncie cuantos bloques cambiaron (o que la linea estaba vacia).
    function marcarLinea(eje, i) {
      antesDeMarcar();
      const r = marcas.alternarLinea(capas, st.capa, eje, i);
      if (!r.n) { historial.descartar(); return r; }
      trasMarcar();
      const nombre = eje === 'fila' ? 'la fila' : 'la columna';
      avisos.avisar(`${r.valor ? 'Marcados' : 'Desmarcados'} ${r.n} bloques de ${nombre} ${i + 1}.`, deshacer);
      return r;
    }

    // El proyecto actual como archivo: el texto y el nombre con el que se descarga.
    const proyecto = () => ({
      texto: Estado.aArchivo(st, firmaActual, marcas.conjunto()),
      nombre: Estado.nombreArchivoProyecto(st),
    });

    // Carga un archivo de proyecto. Un archivo no valido no cambia nada. Uno valido sustituye la forma
    // y las marcas en un solo paso de historial (un Deshacer lo devuelve todo). El zoom y la vista no
    // cambian. Las marcas se validan contra la forma ya generada; si no son de esa forma se descartan.
    function cargarProyecto(texto) {
      const r = Estado.desdeArchivo(texto);
      if (!r.ok) { avisos.avisar(r.mensaje); return r; }
      antesDeMarcar();
      Object.assign(st, r.forma);
      // El reparto (MAR-19) es una opcion, no entra en el historial: un archivo sin el deja un solo material.
      if (r.reparto) { st.bloque = r.reparto.borde; st.relleno = r.reparto.relleno; } else st.relleno = '';
      marcas.limpiar();
      regenerar({ sinLeer: true, conservar: true });
      const nueva = Estado.firma(st);
      const propias = !r.marcas || r.marcas.firma === nueva;
      marcas.restaurar(propias ? Estado.marcasDesde(r.marcas, nueva, capas) : []);
      trasMarcar();
      avisos.avisar(propias ? 'Proyecto cargado.' : 'Proyecto cargado. Sus marcas no correspondían a la forma y se descartaron.', deshacer);
      return r;
    }

    // La forma actual como fragmento de enlace (sin marcas, zoom ni vista).
    const enlace = () => Estado.aEnlace(st);

    // Aplica una forma ya validada (de un enlace o de un esquema) en un solo paso de historial. Si la
    // geometria cambia y habia marcas, estas se borran (el aviso lo da quien llama, con Deshacer). Con la
    // misma geometria las marcas siguen. El zoom y la vista no cambian. Devuelve { cambio, perdio }: si algo
    // cambio y si se perdieron marcas; una forma que deja todo igual no ocupa historial.
    function aplicarForma(forma) {
      const antes = JSON.stringify(params()) + st.capa;
      const firmaAntes = firmaActual;
      const habiaMarcas = marcas.total() > 0;
      antesDeMarcar();
      Object.assign(st, forma);
      regenerar({ sinLeer: true, conservar: true });
      // La geometria se compara ya normalizada (alto igualado, grosor recortado): una forma que acaba
      // en la misma geometria no puede borrar las marcas.
      const cambiaGeo = firmaActual !== firmaAntes;
      if (cambiaGeo && habiaMarcas) { marcas.limpiar(); trasMarcar(); }
      if (JSON.stringify(params()) + st.capa === antes) { descartarPaso(); return { cambio: false, perdio: false }; }
      return { cambio: true, perdio: cambiaGeo && habiaMarcas };
    }

    // Abre la forma de un enlace. Un fragmento que no es de forma no cambia nada (devuelve false).
    function abrirEnlace(fragmento) {
      const forma = Estado.desdeEnlace(fragmento);
      if (!forma) return false;
      const r = aplicarForma(forma);
      if (r.perdio) avisos.avisar('Se abrió la forma del enlace. Tu progreso anterior se borró.', deshacer);
      return true;
    }

    // Importa un esquema de Litematica ya leido (Litematica.leer): { ok, forma, bloque, relleno } o { ok: false,
    // mensaje }. Uno no valido solo avisa del motivo. Uno valido pone la forma con la misma regla que un
    // enlace y el bloque (una opcion de vista: no entra en el historial ni en las marcas).
    function importarEsquema(r) {
      if (!r.ok) { avisos.avisar(r.mensaje); return false; }
      st.bloque = r.bloque;
      st.relleno = r.relleno || '';
      const res = aplicarForma(r.forma);
      guardarEstado();
      if (res.perdio) avisos.avisar('Se importó la forma del esquema. Tu progreso anterior se borró.', deshacer);
      else avisos.avisar('Esquema importado.', res.cambio ? deshacer : null);
      return true;
    }

    return {
      capas: () => capas, capaActual, totales: () => totales, grosorMax: () => grosorMax,
      capa: () => st.capa, irCapa, todas, definicion, es3D, params,
      regenerar, fijar, hecho, hayBloque, antesDeMarcar, trasMarcar, descartarPaso,
      deshacer, rehacer, marcarCapas, marcarLinea, guardarEstado, proyecto, cargarProyecto, enlace, abrirEnlace, importarEsquema,
      hechos: marcas.conjunto, porCapa: n => marcas.porCapa(n),
      puedeDeshacer: historial.puedeDeshacer, puedeRehacer: historial.puedeRehacer,
    };
  }

  return { crear };
})();
