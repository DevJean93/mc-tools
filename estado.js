// Estado de la aplicacion: valores por defecto, validacion, persistencia y firma de geometria.
const Estado = (() => {
  const KEY = 'mc-formas-v1';
  const KEY_MARCAS = KEY + ':marcas';

  const STACK = 64;
  const SHULKER = 27 * STACK;      // 1728
  const COFRE_DOBLE = 54 * STACK;  // 3456
  const LIMITES = { w2d: 200, w3d: 100, h: 200, grosor: 50, zoomMin: 2, zoomMax: 48 };

  const ENUMS = {
    forma: ['circulo', 'rectangulo', 'triangulo', 'rombo', 'hexagono', 'esfera'],
    modo: ['relleno', 'hueco'],
    orient: ['plano', 'punta'],
    esfera: ['esfera', 'cupula'],
  };
  const BOOLEANOS = ['igualar', 'rel', 'tramos', 'tramosDentro', 'distEjes'];
  // Parametros que definen la geometria (los demas son solo de vista).
  const CLAVES_GEO = ['forma', 'w', 'h', 'igualar', 'modo', 'grosor', 'esfera', 'orient'];

  const DEFAULTS = {
    forma: 'circulo', w: 16, h: 16, igualar: true, modo: 'relleno', grosor: 1,
    esfera: 'esfera', orient: 'plano', zoom: 26, rel: true, tramos: true,
    tramosDentro: false, distEjes: true, capa: 0,
  };

  const num = (v, min, max, def) => {
    const n = Number(v);
    return v !== null && v !== '' && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : def;
  };

  function leerJSON(clave) {
    try {
      const raw = JSON.parse(localStorage.getItem(clave) || 'null');
      return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : null;
    } catch (e) { return null; }
  }

  // Mezcla lo guardado con los valores por defecto, aceptando solo valores validos.
  function cargar() {
    const st = { ...DEFAULTS };
    const raw = leerJSON(KEY) || {};
    for (const [clave, valores] of Object.entries(ENUMS)) {
      if (valores.includes(raw[clave])) st[clave] = raw[clave];
    }
    st.w = num(raw.w, 1, st.forma === 'esfera' ? LIMITES.w3d : LIMITES.w2d, st.w);
    st.h = num(raw.h, 1, LIMITES.h, st.h);
    st.grosor = num(raw.grosor, 1, LIMITES.grosor, st.grosor);
    st.zoom = num(raw.zoom, LIMITES.zoomMin, LIMITES.zoomMax, st.zoom);
    st.capa = num(raw.capa, 0, 999, 0);
    for (const k of BOOLEANOS) if (typeof raw[k] === 'boolean') st[k] = raw[k];
    return st;
  }

  function guardar(st) {
    try { localStorage.setItem(KEY, JSON.stringify(st)); return true; } catch (e) { return false; }
  }

  // Identifica la geometria; solo cuenta lo que de verdad la cambia.
  function firma(p) {
    const es3D = p.forma === 'esfera';
    return [
      p.forma, p.w, es3D ? p.w : p.h, p.modo,
      p.modo === 'hueco' ? p.grosor : '',
      es3D ? p.esfera : '',
      p.forma === 'hexagono' ? p.orient : '',
    ].join('|');
  }

  // Marcas en formato compacto: { firma, porCapa: { "c": [x0, y0, x1, y1, ...] } }.
  function guardarMarcas(f, hechos) {
    const porCapa = {};
    for (const k of hechos) {
      const [c, x, y] = k.split(',');
      (porCapa[c] || (porCapa[c] = [])).push(+x, +y);
    }
    try { localStorage.setItem(KEY_MARCAS, JSON.stringify({ firma: f, porCapa })); return true; } catch (e) { return false; }
  }

  // Devuelve solo las marcas validas para la geometria actual.
  function cargarMarcas(f, capas) {
    const hechos = new Set();
    const raw = leerJSON(KEY_MARCAS);
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

  return { STACK, SHULKER, COFRE_DOBLE, LIMITES, CLAVES_GEO, cargar, guardar, firma, guardarMarcas, cargarMarcas };
})();
