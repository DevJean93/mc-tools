// Estado: validacion, valores por defecto y marcas, con un almacen en memoria (sin DOM).
import { test } from 'vitest';
const assert = require('node:assert/strict');
const Estado = require('../../src/nucleo/estado.js');
const Almacen = require('../../src/nucleo/almacen.js');
const Formas = require('../../src/nucleo/formas.js');

const conDatos = (clave, valor) => Almacen.memoria({ [clave]: valor });

test('MAR-10: sin nada guardado devuelve los valores por defecto', () => {
  const st = Estado.cargar(Almacen.memoria());
  assert.deepEqual(st, Estado.DEFAULTS);
});

test('MAR-10: JSON corrupto se ignora y arranca con los valores por defecto', () => {
  const st = Estado.cargar(conDatos('mc-formas-v1', '{basura'));
  assert.deepEqual(st, Estado.DEFAULTS);
});

test('MAR-10: valores fuera de rango o de otro tipo se recortan o se descartan', () => {
  const st = Estado.cargar(conDatos('mc-formas-v1', JSON.stringify({
    forma: 'foo', w: 999, h: -5, zoom: 9999, grosor: -3, capa: 4, rel: 'si',
  })));
  assert.equal(st.forma, 'circulo', 'forma desconocida -> por defecto');
  assert.equal(st.w, Estado.LIMITES.w2d, 'ancho recortado al maximo');
  assert.equal(st.h, 1, 'alto recortado al minimo');
  assert.equal(st.zoom, Estado.LIMITES.zoomMax, 'zoom recortado');
  assert.equal(st.grosor, 1, 'grosor recortado');
  assert.equal(st.capa, 4, 'la capa se acepta (se limita al generar)');
  assert.equal(st.rel, true, 'un booleano que no es boolean no se acepta');
});

test('MAR-10: en esfera el ancho se limita al maximo 3D', () => {
  const st = Estado.cargar(conDatos('mc-formas-v1', JSON.stringify({ forma: 'esfera', w: 300 })));
  assert.equal(st.forma, 'esfera');
  assert.equal(st.w, Estado.LIMITES.w3d);
});

test('FOR-09: el enum de formas sale del registro de geometria', () => {
  assert.deepEqual(Estado.ENUMS.forma, Formas.FORMAS);
  assert.equal(Estado.LIMITES.w2d, Formas.MAX_2D);
  assert.equal(Estado.LIMITES.grosor, Formas.MAX_GROSOR);
});

test('MAR-10: guardar y cargar conservan los valores validos', () => {
  const almacen = Almacen.memoria();
  const st = { ...Estado.DEFAULTS, forma: 'rombo', w: 42, h: 21, zoom: 12, distEjes: false };
  assert.equal(Estado.guardar(st, almacen), true);
  assert.deepEqual(Estado.cargar(almacen), st);
});

test('MAR-10: guardar informa del fallo si el almacen no escribe', () => {
  const roto = { leer: () => null, escribir: () => false };
  assert.equal(Estado.guardar(Estado.DEFAULTS, roto), false);
  assert.equal(Estado.guardarMarcas('x', new Set(), roto), false);
});

test('MAR-05: el formato compacto de las marcas guardadas no cambia (los datos de los usuarios siguen valiendo)', () => {
  const almacen = Almacen.memoria();
  const hechos = new Set(['0,0,0', '0,2,1', '1,3,3']);
  assert.equal(Estado.guardarMarcas('circulo|4|4|relleno|||', hechos, almacen), true);
  assert.equal(almacen.leer('mc-formas-v1:marcas'),
    '{"firma":"circulo|4|4|relleno|||","porCapa":{"0":[0,0,2,1],"1":[3,3]}}');
});

test('MAR-05: las marcas se guardan y se recuperan solo para su geometria', () => {
  const almacen = Almacen.memoria();
  const capas = [[[true, true], [true, false]]];   // 2x2 con (1,1) vacio
  const hechos = new Set(['0,0,0', '0,1,0']);
  assert.equal(Estado.guardarMarcas('f1', hechos, almacen), true);
  assert.deepEqual([...Estado.cargarMarcas('f1', capas, almacen)].sort(), ['0,0,0', '0,1,0']);
  assert.equal(Estado.cargarMarcas('f2', capas, almacen).size, 0, 'otra firma -> sin marcas');
});

test('MAR-06: al cargar marcas se descartan las celdas que no son bloque o no existen', () => {
  const almacen = Almacen.memoria({
    'mc-formas-v1:marcas': JSON.stringify({
      firma: 'f', porCapa: { 0: [0, 0, 1, 1, 9, 9], 5: [0, 0] },
    }),
  });
  const capas = [[[true, false], [false, false]]];
  assert.deepEqual([...Estado.cargarMarcas('f', capas, almacen)], ['0,0,0']);
});

test('MAR-06: marcas corruptas o con formato raro no rompen la carga', () => {
  const capas = [[[true]]];
  assert.equal(Estado.cargarMarcas('f', capas, conDatos('mc-formas-v1:marcas', '{basura')).size, 0);
  assert.equal(Estado.cargarMarcas('f', capas, conDatos('mc-formas-v1:marcas', '[1,2,3]')).size, 0);
  const sinPorCapa = JSON.stringify({ firma: 'f', porCapa: { 0: 'x' } });
  assert.equal(Estado.cargarMarcas('f', capas, conDatos('mc-formas-v1:marcas', sinPorCapa)).size, 0);
});

test('MAR-07: la firma solo cambia con la geometria', () => {
  const base = { forma: 'circulo', w: 16, h: 16, modo: 'relleno', grosor: 1, esfera: 'esfera', orient: 'plano' };
  assert.equal(Estado.firma(base), Estado.firma({ ...base, zoom: 40, rel: false }));
  assert.notEqual(Estado.firma(base), Estado.firma({ ...base, w: 20 }));
  assert.notEqual(Estado.firma(base), Estado.firma({ ...base, modo: 'hueco', grosor: 2 }));
  assert.notEqual(Estado.firma({ ...base, modo: 'hueco', grosor: 2 }), Estado.firma({ ...base, modo: 'hueco', grosor: 5 }));
  assert.equal(Estado.firma({ ...base, modo: 'hueco', grosor: 2 }), Estado.firma({ ...base, modo: 'hueco', grosor: 2, zoom: 30 }));
  assert.notEqual(
    Estado.firma({ ...base, forma: 'hexagono', orient: 'plano' }),
    Estado.firma({ ...base, forma: 'hexagono', orient: 'punta' }),
  );
});

test('MAR-07: la firma de las marcas guardadas no cambia (los datos de los usuarios siguen valiendo)', () => {
  // Valores de referencia de antes de declarar orientaciones y variantes por forma.
  const base = { w: 16, h: 16, modo: 'relleno', grosor: 1, esfera: 'esfera', orient: 'plano' };
  const casos = [
    [{ forma: 'circulo', w: 16, h: 16 }, 'circulo|16|16|relleno|||'],
    [{ forma: 'circulo', w: 20, h: 20, modo: 'hueco', grosor: 2 }, 'circulo|20|20|hueco|2||'],
    [{ forma: 'rectangulo', w: 14, h: 10 }, 'rectangulo|14|10|relleno|||'],
    [{ forma: 'triangulo', w: 21, h: 15 }, 'triangulo|21|15|relleno|||'],
    [{ forma: 'rombo', w: 15, h: 11 }, 'rombo|15|11|relleno|||'],
    [{ forma: 'hexagono', w: 20, h: 18, orient: 'punta' }, 'hexagono|20|18|relleno|||punta'],
    [{ forma: 'hexagono', w: 20, h: 18, modo: 'hueco', grosor: 3 }, 'hexagono|20|18|hueco|3||plano'],
    [{ forma: 'esfera', w: 16, esfera: 'cupula' }, 'esfera|16|16|relleno||cupula|'],
    [{ forma: 'esfera', w: 11, modo: 'hueco', grosor: 1 }, 'esfera|11|11|hueco|1|esfera|'],
  ];
  for (const [c, esperada] of casos) assert.equal(Estado.firma({ ...base, ...c }), esperada, JSON.stringify(c));
});

test('FOR-10: la orientacion del hexagono sale de su definicion y se valida contra ella', () => {
  const carga = o => Estado.cargar(conDatos('mc-formas-v1', JSON.stringify(o)));
  assert.deepEqual(Formas.obtener('hexagono').orientaciones.map(o => o.valor), ['plano', 'punta']);
  assert.equal(Estado.DEFAULTS.orient, 'plano', 'el valor por defecto es la primera orientacion');
  assert.equal(carga({ forma: 'hexagono', orient: 'punta' }).orient, 'punta');
  assert.equal(carga({ forma: 'hexagono', orient: 'raro' }).orient, 'plano', 'una orientacion invalida cae en la primera');
  assert.equal(carga({ forma: 'circulo', orient: 'punta' }).orient, 'punta', 'sin orientaciones se recuerda la preferencia valida');
  assert.equal(carga({ forma: 'circulo', orient: 'raro' }).orient, 'plano', 'y una invalida no se recuerda');
});

test('FOR-10: la variante se valida contra las de la forma activa', () => {
  const carga = o => Estado.cargar(conDatos('mc-formas-v1', JSON.stringify(o)));
  assert.equal(carga({ forma: 'esfera', esfera: 'cupula' }).esfera, 'cupula');
  assert.equal(carga({ forma: 'esfera', esfera: 'raro' }).esfera, 'esfera');
  assert.equal(carga({ forma: 'circulo', esfera: 'cupula' }).esfera, 'cupula', 'sin variantes se recuerda la preferencia');
});

test('MAR-08: un almacen que lanza al leer no rompe la carga', () => {
  const roto = { leer: () => { throw new Error('sin acceso'); }, escribir: () => true };
  assert.deepEqual(Estado.cargar(roto), Estado.DEFAULTS);
});

test('MAR-08: con el almacenamiento bloqueado no se guarda y el almacen lo declara', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('bloqueado'); } });
  try {
    const almacen = Almacen.local();
    assert.equal(almacen.persistente, false, 'asi la app puede avisar al arrancar');
    assert.equal(almacen.leer('mc-formas-v1'), null);
    assert.equal(Estado.guardar(Estado.DEFAULTS, almacen), false);
    assert.equal(Estado.guardarMarcas('x', new Set(), almacen), false);
  } finally {
    delete globalThis.localStorage;
  }
});

test('MAR-08: con localStorage disponible, local() guarda y se declara persistente', () => {
  const datos = new Map();
  const storage = { getItem: k => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)) };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  try {
    const almacen = Almacen.local();
    assert.equal(almacen.persistente, true);
    assert.equal(Estado.guardar(Estado.DEFAULTS, almacen), true);
    assert.deepEqual(Estado.cargar(almacen), Estado.DEFAULTS);
  } finally {
    delete globalThis.localStorage;
  }
});

test('MAR-08: un almacen que lee pero no escribe se declara no persistente', () => {
  const storage = {
    getItem: () => null,
    setItem: () => { throw new Error('cuota 0'); },
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  try {
    const almacen = Almacen.local();
    assert.equal(almacen.persistente, false, 'no es "lleno": el almacen no sirve para guardar');
    assert.equal(almacen.escribir('mc-formas-v1', '{}'), false);
  } finally {
    delete globalThis.localStorage;
  }
});

// --- archivo de proyecto (cambio 006) --------------------------------------------------------
const stCirculo4 = { ...Estado.DEFAULTS, forma: 'circulo', w: 4, h: 4, igualar: true, modo: 'relleno', grosor: 1, capa: 0, zoom: 40, rel: false };

test('MAR-19: el archivo de proyecto lleva la app, la version, la forma y las marcas (cadena de referencia)', () => {
  const texto = Estado.aArchivo(stCirculo4, 'circulo|4|4|relleno|||', new Set(['0,0,0', '0,2,1']));
  assert.equal(texto,
    '{"app":"formas-mc","version":1,"forma":{"forma":"circulo","w":4,"h":4,"igualar":true,"modo":"relleno",' +
    '"grosor":1,"esfera":"esfera","orient":"plano","capa":0},"marcas":{"firma":"circulo|4|4|relleno|||","porCapa":{"0":[0,0,2,1]}}}');
});

test('MAR-19: el archivo lleva solo los parametros de geometria y la capa, no el zoom ni la vista', () => {
  const o = JSON.parse(Estado.aArchivo(stCirculo4, 'f', new Set()));
  assert.deepEqual(Object.keys(o.forma), [...Estado.CLAVES_GEO, 'capa']);
  for (const k of ['zoom', ...Estado.VISTA]) assert.equal(k in o.forma, false, `${k} no va en el archivo`);
  assert.equal(o.app, 'formas-mc');
  assert.equal(o.version, Estado.VERSION_ARCHIVO);
});

test('MAR-19: el formato del archivo usa el mismo formato compacto de marcas que el navegador', () => {
  const hechos = new Set(['0,1,1', '1,3,3']);
  const o = JSON.parse(Estado.aArchivo(stCirculo4, 'circulo|4|4|relleno|||', hechos));
  assert.deepEqual(o.marcas, Estado.compactarMarcas('circulo|4|4|relleno|||', hechos));
});

test('MAR-19: el nombre del archivo dice la forma y el tamano', () => {
  const nombre = o => Estado.nombreArchivoProyecto({ ...Estado.DEFAULTS, ...o });
  assert.equal(nombre({ forma: 'circulo', w: 30, h: 30 }), 'formas-mc-circulo-30x30.json');
  assert.equal(nombre({ forma: 'rectangulo', w: 14, h: 10 }), 'formas-mc-rectangulo-14x10.json');
  assert.equal(nombre({ forma: 'esfera', w: 11, esfera: 'esfera' }), 'formas-mc-esfera-11.json');
  assert.equal(nombre({ forma: 'esfera', w: 16, esfera: 'cupula' }), 'formas-mc-cupula-16.json');
});

const archivoOk = o => JSON.stringify({ app: 'formas-mc', version: 1, ...o });

test('MAR-21: un archivo que no es un proyecto de Formas MC se rechaza con su mensaje', () => {
  for (const texto of ['{basura', '', '[1,2,3]', 'null', '42', '{"version":1}', '{"app":"otra","version":1}']) {
    const r = Estado.desdeArchivo(texto);
    assert.equal(r.ok, false, JSON.stringify(texto));
    assert.equal(r.motivo, 'no-proyecto', JSON.stringify(texto));
    assert.equal(r.mensaje, 'No es un proyecto de Formas MC. Elige un archivo guardado con «Guardar proyecto».');
  }
});

test('MAR-21: una version invalida (falta, no es un entero o es menor que 1) tampoco es un proyecto', () => {
  for (const v of [undefined, 0, -1, 1.5, '1', null]) {
    const r = Estado.desdeArchivo(JSON.stringify({ app: 'formas-mc', version: v, forma: {} }));
    assert.equal(r.ok, false, String(v));
    assert.equal(r.motivo, 'no-proyecto', String(v));
  }
});

test('MAR-21: un archivo de una version mas nueva se rechaza y dice que hay que actualizar', () => {
  const r = Estado.desdeArchivo(archivoOk({ version: Estado.VERSION_ARCHIVO + 1, forma: {} }));
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'version-nueva');
  assert.equal(r.mensaje, 'Este proyecto es de una versión más nueva de Formas MC. Actualiza la app para abrirlo.');
});

test('MAR-21: los valores de un archivo valido se validan como lo guardado en el navegador', () => {
  const r = Estado.desdeArchivo(archivoOk({ forma: { forma: 'foo', w: 999, h: -5, grosor: -3, capa: 4, zoom: 40, rel: false } }));
  assert.equal(r.ok, true);
  assert.equal(r.forma.forma, 'circulo', 'forma desconocida -> por defecto');
  assert.equal(r.forma.w, Estado.LIMITES.w2d, 'ancho recortado al maximo');
  assert.equal(r.forma.h, 1, 'alto recortado al minimo');
  assert.equal(r.forma.grosor, 1);
  assert.equal(r.forma.capa, 4);
  assert.deepEqual(Object.keys(r.forma), [...Estado.CLAVES_GEO, 'capa'], 'solo geometria y capa: el zoom y la vista no entran');
  const esf = Estado.desdeArchivo(archivoOk({ forma: { forma: 'esfera', w: 300, esfera: 'cupula' } }));
  assert.equal(esf.forma.w, Estado.LIMITES.w3d, 'en esfera el ancho se limita al maximo 3D');
  assert.equal(esf.forma.esfera, 'cupula');
});

test('MAR-21: sin forma o sin marcas se abre igualmente, con los valores por defecto y sin marcas', () => {
  const r = Estado.desdeArchivo(archivoOk({}));
  assert.equal(r.ok, true);
  assert.equal(r.forma.forma, Estado.DEFAULTS.forma);
  assert.equal(r.marcas, null);
});

test('MAR-21: las marcas del archivo se devuelven tal cual (se validan contra la forma generada)', () => {
  const marcas = { firma: 'circulo|4|4|relleno|||', porCapa: { 0: [0, 0, 2, 1] } };
  assert.deepEqual(Estado.desdeArchivo(archivoOk({ forma: { forma: 'circulo', w: 4, h: 4 }, marcas })).marcas, marcas);
});

test('MAR-19, MAR-21: guardar y leer devuelve la misma forma y las mismas marcas (ida y vuelta)', () => {
  const st = { ...Estado.DEFAULTS, forma: 'hexagono', w: 20, h: 18, igualar: false, modo: 'hueco', grosor: 3, orient: 'punta', capa: 0 };
  const firma = Estado.firma(st), hechos = new Set(['0,3,0', '0,4,1']);
  const r = Estado.desdeArchivo(Estado.aArchivo(st, firma, hechos));
  assert.equal(r.ok, true);
  for (const k of [...Estado.CLAVES_GEO, 'capa']) assert.equal(r.forma[k], st[k], k);
  assert.deepEqual(r.marcas, Estado.compactarMarcas(firma, hechos));
});

// Enlace para compartir: la forma en el fragmento de la direccion (sin marcas, zoom ni vista).
const FORMA_ENLACE = { ...Estado.DEFAULTS, forma: 'circulo', w: 30, h: 30, igualar: true, modo: 'hueco', grosor: 2, capa: 0 };
const FRAGMENTO_REF = 'forma=circulo&w=30&h=30&igualar=1&modo=hueco&grosor=2&esfera=esfera&orient=plano&capa=0';

test('FOR-16: la forma actual se escribe como la cadena de referencia', () => {
  assert.equal(Estado.aEnlace(FORMA_ENLACE), FRAGMENTO_REF);
});

test('FOR-16: el enlace lleva los parametros de geometria y la capa, y nada de zoom ni vista', () => {
  const claves = [...new URLSearchParams(Estado.aEnlace({ ...FORMA_ENLACE, zoom: 40, rel: false, tramos: false, distEjes: false })).keys()];
  assert.deepEqual(claves, [...Estado.CLAVES_GEO, 'capa']);
});

test('FOR-16: los booleanos van como 1 y 0', () => {
  assert.match(Estado.aEnlace({ ...FORMA_ENLACE, igualar: false }), /&igualar=0&/);
  assert.match(Estado.aEnlace({ ...FORMA_ENLACE, igualar: true }), /&igualar=1&/);
});

test('FOR-17: la cadena de referencia se lee como la misma forma (ida y vuelta)', () => {
  const r = Estado.desdeEnlace(FRAGMENTO_REF);
  for (const k of [...Estado.CLAVES_GEO, 'capa']) assert.equal(r[k], FORMA_ENLACE[k], k);
  assert.deepEqual(Estado.desdeEnlace(Estado.aEnlace(FORMA_ENLACE)), Estado.desdeEnlace(FRAGMENTO_REF));
});

test('FOR-17: una esfera con capa y variante tambien hace el viaje de ida y vuelta', () => {
  const st = { ...Estado.DEFAULTS, forma: 'esfera', w: 11, h: 11, esfera: 'cupula', capa: 4 };
  const r = Estado.desdeEnlace(Estado.aEnlace(st));
  assert.equal(r.forma, 'esfera'); assert.equal(r.w, 11); assert.equal(r.esfera, 'cupula'); assert.equal(r.capa, 4);
});

test('FOR-17: los valores no validos se recortan o caen en el valor por defecto', () => {
  const r = Estado.desdeEnlace('forma=nada&w=999&modo=raro&grosor=-3&capa=zzz&orient=zigzag');
  assert.equal(r.forma, 'circulo');
  assert.equal(r.w, 200);
  assert.equal(r.modo, 'relleno');
  assert.equal(r.grosor, 1);
  assert.equal(r.capa, 0);
  assert.equal(r.orient, Estado.DEFAULTS.orient);
  assert.equal(Estado.desdeEnlace('forma=circulo&w=abc').w, Estado.DEFAULTS.w);
});

test('FOR-17: una esfera de mas de 100 se recorta a 100', () => {
  assert.equal(Estado.desdeEnlace('forma=esfera&w=150').w, 100);
});

test('FOR-17: lo que falta toma el valor por defecto de la app, no lo guardado', () => {
  const r = Estado.desdeEnlace('forma=rombo&w=20');
  assert.equal(r.forma, 'rombo'); assert.equal(r.w, 20);
  assert.equal(r.modo, Estado.DEFAULTS.modo); assert.equal(r.grosor, Estado.DEFAULTS.grosor);
});

test('FOR-17: un fragmento que no es de forma se ignora (devuelve null)', () => {
  for (const f of ['', '#', 'hola', 'x=1', 'zoom=40&rel=0', undefined, null]) assert.equal(Estado.desdeEnlace(f), null, String(f));
});

test('FOR-17: con # delante, claves repetidas o texto raro no falla', () => {
  assert.equal(Estado.desdeEnlace('#' + FRAGMENTO_REF).w, 30);
  assert.equal(Estado.desdeEnlace('forma=rombo&forma=circulo').forma, 'rombo');
  assert.doesNotThrow(() => Estado.desdeEnlace('forma=%E0%A4%A&w=%&=&&'));
  assert.equal(Estado.desdeEnlace('forma=<script>&w=20').forma, 'circulo');
});

test('FOR-17: el enlace no trae zoom ni vista aunque se pidan', () => {
  const r = Estado.desdeEnlace('forma=circulo&zoom=40&rel=0&tramos=0');
  assert.deepEqual(Object.keys(r), [...Estado.CLAVES_GEO, 'capa']);
});

// Guias de chunk (cambio 008): una opcion de vista y las coordenadas del bloque central en el mundo.
test('NUM-17: por defecto las guias estan apagadas y no hay coordenadas', () => {
  const st = Estado.cargar(Almacen.memoria());
  assert.equal(st.guiasChunk, false);
  assert.equal(st.centroX, null);
  assert.equal(st.centroZ, null);
  assert.equal(Estado.DEFAULTS.guiasChunk, false);
});

test('NUM-17: un estado guardado antes de este cambio carga igual y con las guias apagadas', () => {
  // Cadena literal del formato anterior: sin guiasChunk, centroX ni centroZ.
  const antiguo = '{"forma":"rombo","w":20,"h":20,"igualar":true,"modo":"hueco","grosor":3,"esfera":"esfera","orient":"plano","zoom":30,"rel":false,"tramos":true,"tramosDentro":true,"distEjes":false,"capa":0}';
  const st = Estado.cargar(conDatos('mc-formas-v1', antiguo));
  assert.equal(st.forma, 'rombo'); assert.equal(st.w, 20); assert.equal(st.modo, 'hueco'); assert.equal(st.grosor, 3);
  assert.equal(st.zoom, 30); assert.equal(st.rel, false); assert.equal(st.tramosDentro, true); assert.equal(st.distEjes, false);
  assert.equal(st.guiasChunk, false); assert.equal(st.centroX, null); assert.equal(st.centroZ, null);
});

test('NUM-17: la opcion y las coordenadas se guardan y se recuperan', () => {
  const almacen = Almacen.memoria();
  const st = Estado.cargar(almacen);
  Object.assign(st, { guiasChunk: true, centroX: 100, centroZ: -40 });
  Estado.guardar(st, almacen);
  const otra = Estado.cargar(almacen);
  assert.equal(otra.guiasChunk, true); assert.equal(otra.centroX, 100); assert.equal(otra.centroZ, -40);
});

test('NUM-17: las coordenadas se redondean, se recortan a +-30 000 000 y un texto o vacio es null', () => {
  const con = obj => Estado.cargar(conDatos('mc-formas-v1', JSON.stringify(obj)));
  assert.equal(con({ centroX: 12.6 }).centroX, 13);
  assert.equal(con({ centroX: '-7' }).centroX, -7);
  assert.equal(con({ centroX: 99999999999 }).centroX, 30000000);
  assert.equal(con({ centroZ: -99999999999 }).centroZ, -30000000);
  assert.equal(con({ centroZ: 0 }).centroZ, 0, 'el cero es una coordenada valida');
  for (const malo of ['', 'abc', null, true, [], {}]) assert.equal(con({ centroX: malo }).centroX, null, JSON.stringify(malo));
  assert.equal(con({ guiasChunk: 'si' }).guiasChunk, false, 'solo un booleano activa la opcion');
});

test('NUM-17: las guias son una opcion de vista: no entran en la geometria, la firma, el enlace ni el proyecto', () => {
  assert.ok(Estado.VISTA.includes('guiasChunk'));
  assert.ok(!Estado.CLAVES_GEO.includes('guiasChunk') && !Estado.CLAVES_GEO.includes('centroX') && !Estado.CLAVES_GEO.includes('centroZ'));
  const base = { ...Estado.DEFAULTS };
  const con = { ...base, guiasChunk: true, centroX: 100, centroZ: -40 };
  assert.equal(Estado.firma(con), Estado.firma(base));
  assert.equal(Estado.aEnlace(con), Estado.aEnlace(base));
  assert.equal(Estado.aArchivo(con, Estado.firma(con), new Set()), Estado.aArchivo(base, Estado.firma(base), new Set()));
});

// Altura Y de la base (cambio 009): una opcion de vista que da la altura de cada capa en las formas 3D.
const forma3D = (extra = {}) => ({ ...Estado.DEFAULTS, forma: 'esfera', w: 11, h: 11, ...extra });

test('NUM-19: por defecto no hay altura de la base', () => {
  assert.equal(Estado.cargar(Almacen.memoria()).baseY, null);
  assert.equal(Estado.DEFAULTS.baseY, null);
});

test('NUM-19: un estado guardado antes de este cambio carga igual y sin altura', () => {
  // Cadena literal del formato anterior (con las guias de chunk de la 008, pero sin baseY).
  const antiguo = '{"forma":"esfera","w":11,"h":11,"igualar":true,"modo":"relleno","grosor":1,"esfera":"cupula","orient":"plano","zoom":20,"rel":true,"tramos":true,"tramosDentro":false,"distEjes":true,"guiasChunk":false,"centroX":null,"centroZ":null,"capa":3}';
  const st = Estado.cargar(conDatos('mc-formas-v1', antiguo));
  assert.equal(st.forma, 'esfera'); assert.equal(st.w, 11); assert.equal(st.esfera, 'cupula'); assert.equal(st.capa, 3); assert.equal(st.zoom, 20);
  assert.equal(st.baseY, null);
});

test('NUM-19: la altura se guarda y se recupera, tambien negativa y cero', () => {
  for (const y of [64, -60, 0]) {
    const almacen = Almacen.memoria();
    const st = Estado.cargar(almacen);
    st.baseY = y;
    Estado.guardar(st, almacen);
    assert.equal(Estado.cargar(almacen).baseY, y, String(y));
  }
});

test('NUM-19: la altura se redondea, se recorta a +-30 000 000 y un texto o vacio es null', () => {
  const con = obj => Estado.cargar(conDatos('mc-formas-v1', JSON.stringify(obj)));
  assert.equal(con({ baseY: 63.6 }).baseY, 64);
  assert.equal(con({ baseY: '-60' }).baseY, -60);
  assert.equal(con({ baseY: 99999999999 }).baseY, 30000000);
  assert.equal(con({ baseY: -99999999999 }).baseY, -30000000);
  for (const malo of ['', 'alto', null, true, [], {}]) assert.equal(con({ baseY: malo }).baseY, null, JSON.stringify(malo));
});

test('NUM-19: la altura no entra en la geometria, la firma, el enlace ni el proyecto', () => {
  assert.ok(!Estado.CLAVES_GEO.includes('baseY'));
  const base = forma3D(), con = forma3D({ baseY: 64 });
  assert.equal(Estado.firma(con), Estado.firma(base));
  assert.equal(Estado.aEnlace(con), Estado.aEnlace(base));
  assert.equal(Estado.aArchivo(con, Estado.firma(con), new Set()), Estado.aArchivo(base, Estado.firma(base), new Set()));
});

test('NUM-18: una esfera de 11 con la base en Y=64 tiene la capa 3 en Y=66 y la 11 en Y=74', () => {
  const st = forma3D({ baseY: 64 });
  assert.equal(Estado.alturaCapa(st, 0), 64);
  assert.equal(Estado.alturaCapa(st, 2), 66);
  assert.equal(Estado.alturaCapa(st, 10), 74);
});

test('NUM-18: en una cupula la base es su propia capa 1 (la que se apoya en el suelo)', () => {
  const st = forma3D({ w: 16, h: 16, esfera: 'cupula', baseY: 70 });
  assert.equal(Estado.alturaCapa(st, 0), 70);
  assert.equal(Estado.alturaCapa(st, 7), 77);
});

test('NUM-18: con la base negativa la altura sigue contando hacia arriba', () => {
  const st = forma3D({ baseY: -60 });
  assert.equal(Estado.alturaCapa(st, 0), -60);
  assert.equal(Estado.alturaCapa(st, 4), -56);
  assert.equal(Estado.alturaCapa(st, 10), -50);
});

test('NUM-19: sin altura de la base, o en una forma 2D aunque haya una guardada, no hay altura de capa', () => {
  assert.equal(Estado.alturaCapa(forma3D({ baseY: null }), 3), null);
  assert.equal(Estado.alturaCapa({ ...Estado.DEFAULTS, forma: 'circulo', baseY: 64 }, 0), null);
  assert.equal(Estado.alturaCapa({ ...Estado.DEFAULTS, forma: 'hexagono', baseY: 64 }, 0), null);
});

test('MAR-10: clamp redondea y recorta; si no es un numero, el minimo', () => {
  assert.equal(Estado.clamp('42', 1, 200), 42);
  assert.equal(Estado.clamp('42.6', 1, 200), 43);
  assert.equal(Estado.clamp(0, 1, 200), 1);
  assert.equal(Estado.clamp(999, 1, 200), 200);
  assert.equal(Estado.clamp('', 1, 200), 1);
  assert.equal(Estado.clamp('x', 1, 200), 1);
});

test('MAR-07: las vistas son los booleanos que no son geometria', () => {
  assert.deepEqual(Estado.VISTA, ['rel', 'tramos', 'tramosDentro', 'distEjes', 'guiasChunk']);
  assert.deepEqual(Estado.BOOLEANOS, ['igualar', ...Estado.VISTA]);
});

test('MAR-08: el almacen es obligatorio: sin el, error claro', () => {
  assert.throws(() => Estado.cargar(), /almacen/i);
  assert.throws(() => Estado.guardar(Estado.DEFAULTS), /almacen/i);
  assert.throws(() => Estado.guardarMarcas('f', new Set()), /almacen/i);
  assert.throws(() => Estado.cargarMarcas('f', [[[true]]]), /almacen/i);
});
