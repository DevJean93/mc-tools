// Parametros de la aplicacion: valores por defecto, validacion, persistencia y firma de geometria.
// El almacen se inyecta: Almacen.local() en la app, Almacen.memoria() en los tests.
const Estado = (() => {
  const Formas = typeof module !== 'undefined' ? require('./shapes.js') : globalThis.Formas;

  const KEY = 'mc-formas-v1';
  const KEY_MARCAS = KEY + ':marcas';

  const LIMITES = {
    w2d: Formas.MAX_2D, w3d: Formas.MAX_3D, h: Formas.MAX_2D,
    grosor: Formas.MAX_GROSOR, zoomMin: 2, zoomMax: 48,
  };

  // Las formas validas salen del registro de geometria: una sola lista, no dos.
  // Las variantes tambien: se leen al acceder para ver las formas registradas despues.
  const variantes = () => [...new Set(Formas.FORMAS.flatMap(id => ((Formas.obtener(id) || {}).variantes || []).map(v => v.valor)))];
  const ENUMS = {
    forma: Formas.FORMAS,
    modo: ['relleno', 'hueco'],
    orient: ['plano', 'punta'],
    get esfera() { return variantes(); },
  };
  // Opciones que solo cambian la vista (no la geometria ni las marcas).
  const VISTA = ['rel', 'tramos', 'tramosDentro', 'distEjes'];
  const BOOLEANOS = ['igualar', ...VISTA];
  // Parametros que definen la geometria (los demas son solo de vista).
  const CLAVES_GEO = ['forma', 'w', 'h', 'igualar', 'modo', 'grosor', 'esfera', 'orient'];

  const DEFAULTS = {
    forma: 'circulo', w: 16, h: 16, igualar: true, modo: 'relleno', grosor: 1,
    esfera: variantes()[0] || '', orient: 'plano', zoom: 26, rel: true, tramos: true,
    tramosDentro: false, distEjes: true, capa: 0,
  };

  const num = (v, min, max, def) => {
    const n = Number(v);
    return v !== null && v !== '' && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : def;
  };

  // Numero entero dentro de [min, max]; si no es un numero, el minimo.
  const clamp = (v, min, max) => Math.max(min, Math.min(max, Math.round(+v) || min));

  // El almacen se inyecta siempre: un fallo de cableado debe verse, no caer en memoria.
  function almacenValido(almacen) {
    if (!almacen || typeof almacen.leer !== 'function' || typeof almacen.escribir !== 'function') {
      throw new Error('Estado necesita un almacen con leer() y escribir()');
    }
    return almacen;
  }

  function leerJSON(almacen, clave) {
    almacenValido(almacen);
    try {
      const raw = JSON.parse(almacen.leer(clave) || 'null');
      return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : null;
    } catch (e) { return null; }
  }

  // Mezcla lo guardado con los valores por defecto, aceptando solo valores validos.
  function cargar(almacen) {
    const st = { ...DEFAULTS };
    const raw = leerJSON(almacen, KEY) || {};
    for (const [clave, valores] of Object.entries(ENUMS)) {
      if (valores.includes(raw[clave])) st[clave] = raw[clave];
    }
    st.w = num(raw.w, 1, (Formas.obtener(st.forma) || {}).es3D ? LIMITES.w3d : LIMITES.w2d, st.w);
    st.h = num(raw.h, 1, LIMITES.h, st.h);
    st.grosor = num(raw.grosor, 1, LIMITES.grosor, st.grosor);
    st.zoom = num(raw.zoom, LIMITES.zoomMin, LIMITES.zoomMax, st.zoom);
    st.capa = num(raw.capa, 0, 999, 0);
    for (const k of BOOLEANOS) if (typeof raw[k] === 'boolean') st[k] = raw[k];
    return st;
  }

  function guardar(st, almacen) {
    return almacenValido(almacen).escribir(KEY, JSON.stringify(st));
  }

  // Identifica la geometria; solo cuenta lo que de verdad la cambia. Los dos ultimos huecos
  // son los parametros propios de cada forma (variante 3D y orientacion): se mantienen
  // siempre para que las marcas ya guardadas sigan valiendo.
  function firma(p) {
    const def = Formas.obtener(p.forma) || {};
    const opciones = def.opciones || [];
    const propios = [];
    for (let i = 0; i < Math.max(2, opciones.length); i++) propios.push(opciones[i] ? p[opciones[i]] : '');
    return [
      p.forma, p.w, def.es3D ? p.w : p.h, p.modo,
      p.modo === 'hueco' ? p.grosor : '',
      ...propios,
    ].join('|');
  }

  // Marcas en formato compacto: { firma, porCapa: { "c": [x0, y0, x1, y1, ...] } }.
  function guardarMarcas(f, hechos, almacen) {
    const porCapa = {};
    for (const k of hechos) {
      const [c, x, y] = k.split(',');
      (porCapa[c] || (porCapa[c] = [])).push(+x, +y);
    }
    return almacenValido(almacen).escribir(KEY_MARCAS, JSON.stringify({ firma: f, porCapa }));
  }

  // Devuelve solo las marcas validas para la geometria actual.
  function cargarMarcas(f, capas, almacen) {
    const hechos = new Set();
    const raw = leerJSON(almacen, KEY_MARCAS);
    if (!raw || raw.firma !== f || !raw.porCapa || typeof raw.porCapa !== 'object') return hechos;
    for (const [c, xy] of Object.entries(raw.porCapa)) {
      const g = capas[+c];
      if (!g || !Array.isArray(xy)) continue;
      for (let i = 0; i + 1 < xy.length; i += 2) {
        const x = xy[i], y = xy[i + 1];
        if (Number.isInteger(x) && Number.isInteger(y) && g[y] && g[y][x]) hechos.add(`${c},${x},${y}`);
      }
    }
    return hechos;
  }

  return {
    LIMITES, ENUMS, DEFAULTS, BOOLEANOS, VISTA, CLAVES_GEO, clamp,
    cargar, guardar, firma, guardarMarcas, cargarMarcas,
  };
})();
if (typeof module !== 'undefined') module.exports = Estado; else globalThis.Estado = Estado;
