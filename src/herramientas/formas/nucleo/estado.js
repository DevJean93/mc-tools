// Parametros de la aplicacion: valores por defecto, validacion, persistencia y firma de geometria.
// El almacen se inyecta: Almacen.local() en la app, Almacen.memoria() en los tests.
import { Formas } from './formas.js';
import { Materiales } from './materiales.js';
export const Estado = (() => {

  const KEY = 'mc-formas-v1';
  const KEY_MARCAS = KEY + ':marcas';

  const LIMITES = {
    w2d: Formas.MAX_2D, w3d: Formas.MAX_3D, h: Formas.MAX_2D,
    grosor: Formas.MAX_GROSOR, zoomMin: 2, zoomMax: 48,
    mundo: 30000000,   // las coordenadas del mundo de Minecraft llegan a +-30 000 000
  };

  // Las formas validas salen del registro de geometria: una sola lista, no dos.
  // Las variantes tambien: se leen al acceder para ver las formas registradas despues.
  // Los parametros propios de cada forma (variante -> `esfera`, orientacion -> `orient`) los declara
  // su definicion. `propios(id, campo)` son los valores de una forma; `todos(campo)` los de todas.
  const propios = (id, campo) => ((Formas.obtener(id) || {})[campo] || []).map(v => v.valor);
  const todos = campo => [...new Set(Formas.FORMAS.flatMap(id => propios(id, campo)))];
  const variantes = () => todos('variantes');
  const orientaciones = () => todos('orientaciones');
  const ENUMS = {
    forma: Formas.FORMAS,
    modo: ['relleno', 'hueco'],
    get orient() { return orientaciones(); },
    get esfera() { return variantes(); },
  };
  // Valor de un parametro propio de la forma activa: tiene que ser uno de los suyos (si no, el
  // primero). Una forma que no ofrece ese parametro recuerda la preferencia valida de otra,
  // para cuando se vuelva a ella.
  const elegir = (crudo, deLaForma, deTodas, defecto) => {
    if (deLaForma.length) return deLaForma.includes(crudo) ? crudo : deLaForma[0];
    return deTodas.includes(crudo) ? crudo : defecto;
  };
  // Opciones que solo cambian la vista (no la geometria ni las marcas).
  const VISTA = ['rel', 'tramos', 'tramosDentro', 'distEjes', 'guiasChunk'];
  const BOOLEANOS = ['igualar', ...VISTA];
  // Parametros que definen la geometria (los demas son solo de vista).
  const CLAVES_GEO = ['forma', 'w', 'h', 'igualar', 'modo', 'grosor', 'esfera', 'orient'];

  const DEFAULTS = {
    forma: 'circulo', w: 16, h: 16, igualar: true, modo: 'relleno', grosor: 1,
    esfera: variantes()[0] || '', orient: orientaciones()[0] || '', zoom: 26, rel: true, tramos: true,
    tramosDentro: false, distEjes: true, guiasChunk: false, centroX: null, centroZ: null, baseY: null, capa: 0,
    bloque: Materiales.BLOQUE_DEFECTO,   // al final: lo guardado antes es un prefijo de lo de ahora
    relleno: '',                         // material del relleno (011, MAT-21): '' = igual que el borde, un solo material
  };

  const num = (v, min, max, def) => {
    const n = Number(v);
    return v !== null && v !== '' && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : def;
  };

  // Coordenada del mundo: entero dentro de +-LIMITES.mundo o null si no hay valor (vacio o no numerico).
  // Un texto vacio no es un cero: Number('') da 0, asi que se descarta antes.
  const coordenada = v => {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(LIMITES.mundo, Math.max(-LIMITES.mundo, Math.round(n))) : null;
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
    for (const clave of ['forma', 'modo']) {
      if (ENUMS[clave].includes(raw[clave])) st[clave] = raw[clave];
    }
    st.esfera = elegir(raw.esfera, propios(st.forma, 'variantes'), variantes(), DEFAULTS.esfera);
    st.orient = elegir(raw.orient, propios(st.forma, 'orientaciones'), orientaciones(), DEFAULTS.orient);
    st.w = num(raw.w, 1, (Formas.obtener(st.forma) || {}).es3D ? LIMITES.w3d : LIMITES.w2d, st.w);
    st.h = num(raw.h, 1, LIMITES.h, st.h);
    st.grosor = num(raw.grosor, 1, LIMITES.grosor, st.grosor);
    st.zoom = num(raw.zoom, LIMITES.zoomMin, LIMITES.zoomMax, st.zoom);
    st.capa = num(raw.capa, 0, 999, 0);
    st.centroX = coordenada(raw.centroX);
    st.centroZ = coordenada(raw.centroZ);
    st.baseY = coordenada(raw.baseY);   // altura Y de la capa 1 (solo formas 3D), opcional
    for (const k of BOOLEANOS) if (typeof raw[k] === 'boolean') st[k] = raw[k];
    // Bloque del esquema de Litematica (MAT-17): una opcion de vista mas, solo de la lista corta.
    if (Materiales.BLOQUES.some(b => b.id === raw.bloque)) st.bloque = raw.bloque;
    // Material del relleno (MAT-21): otra opcion mas, solo de la lista corta; cualquier otra cosa es «sin reparto».
    if (Materiales.BLOQUES.some(b => b.id === raw.relleno)) st.relleno = raw.relleno;
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
  function compactarMarcas(firma, hechos) {
    const porCapa = {};
    for (const k of hechos) {
      const [c, x, y] = k.split(',');
      (porCapa[c] || (porCapa[c] = [])).push(+x, +y);
    }
    return { firma, porCapa };
  }

  function guardarMarcas(f, hechos, almacen) {
    return almacenValido(almacen).escribir(KEY_MARCAS, JSON.stringify(compactarMarcas(f, hechos)));
  }

  // Devuelve solo las marcas validas para la geometria actual.
  function marcasDesde(raw, firma, capas) {
    const hechos = new Set();
    if (!raw || raw.firma !== firma || !raw.porCapa || typeof raw.porCapa !== 'object') return hechos;
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

  function cargarMarcas(f, capas, almacen) {
    return marcasDesde(leerJSON(almacen, KEY_MARCAS), f, capas);
  }

  // --- archivo de proyecto ---------------------------------------------------------------
  // Un proyecto es la forma (sus parametros de geometria y la capa actual) y las marcas, en el mismo
  // formato compacto que el navegador. No lleva el zoom ni la vista: son preferencias del dispositivo.
  const APP_ARCHIVO = 'formas-mc';
  const VERSION_ARCHIVO = 1;

  function aArchivo(st, firma, hechos) {
    const forma = {};
    for (const k of CLAVES_GEO) forma[k] = st[k];
    forma.capa = st.capa;
    const archivo = { app: APP_ARCHIVO, version: VERSION_ARCHIVO, forma, marcas: compactarMarcas(firma, hechos) };
    // El reparto (MAR-19) va al final y solo si lo hay: sin el, el archivo es el de siempre.
    if (st.relleno && st.relleno !== st.bloque) archivo.reparto = { borde: st.bloque, relleno: st.relleno };
    return JSON.stringify(archivo);
  }

  // Reparto de un archivo: { borde, relleno } con dos bloques distintos de la lista, o null.
  function repartoValido(r) {
    const esBloque = id => Materiales.BLOQUES.some(b => b.id === id);
    return r && typeof r === 'object' && esBloque(r.borde) && esBloque(r.relleno) && r.borde !== r.relleno
      ? { borde: r.borde, relleno: r.relleno } : null;
  }

  const MSG_NO_PROYECTO = 'No es un proyecto de Formas MC. Elige un archivo guardado con «Guardar proyecto».';
  const MSG_VERSION_NUEVA = 'Este proyecto es de una versión más nueva de Formas MC. Actualiza la app para abrirlo.';

  // Forma validada a partir de un objeto crudo (de un archivo o de un enlace): los parametros de
  // geometria y la capa, con las mismas reglas que lo guardado en el navegador. Se reutiliza
  // `cargar` con un almacen de solo lectura, asi no hay dos validaciones que puedan divergir.
  function formaValidada(crudo) {
    const st = cargar({ leer: k => (k === KEY ? JSON.stringify(crudo) : null), escribir: () => false });
    const forma = {};
    for (const k of [...CLAVES_GEO, 'capa']) forma[k] = st[k];
    return forma;
  }

  // Lee el texto de un archivo de proyecto. Devuelve { ok: true, forma, marcas, reparto } o
  // { ok: false, motivo, mensaje } sin tocar nada. Los valores de la forma se validan con las
  // mismas reglas que lo guardado en el navegador (los fuera de rango se recortan y los desconocidos
  // se descartan): se reutiliza `cargar` con un almacen de solo lectura. Las marcas se devuelven
  // tal cual: solo se pueden validar contra la forma ya generada.
  function desdeArchivo(texto) {
    let o;
    try { o = JSON.parse(texto); } catch (e) { o = null; }
    if (!o || typeof o !== 'object' || Array.isArray(o) || o.app !== APP_ARCHIVO || !Number.isInteger(o.version) || o.version < 1) {
      return { ok: false, motivo: 'no-proyecto', mensaje: MSG_NO_PROYECTO };
    }
    if (o.version > VERSION_ARCHIVO) return { ok: false, motivo: 'version-nueva', mensaje: MSG_VERSION_NUEVA };
    const crudo = o.forma && typeof o.forma === 'object' && !Array.isArray(o.forma) ? o.forma : {};
    return { ok: true, forma: formaValidada(crudo), marcas: o.marcas && typeof o.marcas === 'object' ? o.marcas : null, reparto: repartoValido(o.reparto) };
  }

  // --- enlace para compartir -------------------------------------------------------------
  // La forma en el fragmento de la direccion: los parametros de geometria y la capa, sin marcas, zoom
  // ni vista. Los booleanos van como 1 y 0.
  const CLAVES_ENLACE = [...CLAVES_GEO, 'capa'];

  function aEnlace(st) {
    return CLAVES_ENLACE.map(k => `${k}=${encodeURIComponent(typeof st[k] === 'boolean' ? +st[k] : st[k])}`).join('&');
  }

  // Forma validada de un fragmento, o null si no es de forma (vacio o sin ninguna de sus claves).
  // Lo que falta toma el valor por defecto de la app y no lo guardado en el navegador, para que un
  // mismo enlace dé la misma forma en cualquier sitio.
  function desdeEnlace(fragmento) {
    if (typeof fragmento !== 'string') return null;
    const p = new URLSearchParams(fragmento.replace(/^#/, ''));
    const crudo = {};
    for (const k of CLAVES_ENLACE) {
      if (!p.has(k)) continue;
      const v = p.get(k);
      crudo[k] = k === 'igualar' ? (v === '1' ? true : v === '0' ? false : v) : v;
    }
    return Object.keys(crudo).length ? formaValidada(crudo) : null;
  }

  // Altura Y de la capa i (0 = la base, la capa 1 que muestra la app, tambien en la cupula): la Y de la
  // base mas i. Es null si la forma no es 3D o no hay Y de la base. No es geometria: no entra en la
  // firma, el enlace ni el archivo de proyecto.
  function alturaCapa(st, i) {
    const def = Formas.obtener(st.forma) || {};
    return def.es3D && st.baseY !== null && st.baseY !== undefined ? st.baseY + i : null;
  }

  // formas-mc-circulo-30x30.json, formas-mc-esfera-11.json, formas-mc-cupula-16.json
  function nombreArchivoProyecto(st) {
    const def = Formas.obtener(st.forma) || {};
    const que = def.variantes ? st.esfera : st.forma;
    return `formas-mc-${que}-${def.es3D ? st.w : st.w + 'x' + st.h}.json`;
  }

  return {
    LIMITES, ENUMS, DEFAULTS, BOOLEANOS, VISTA, CLAVES_GEO, clamp, coordenada, alturaCapa,
    cargar, guardar, firma, compactarMarcas, marcasDesde, guardarMarcas, cargarMarcas,
    VERSION_ARCHIVO, aArchivo, desdeArchivo, nombreArchivoProyecto, aEnlace, desdeEnlace,
  };
})();
