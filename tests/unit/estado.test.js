// Estado: validacion, valores por defecto y marcas, con un almacen en memoria (sin DOM).
const test = require('node:test');
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

test('MAR-10: clamp redondea y recorta; si no es un numero, el minimo', () => {
  assert.equal(Estado.clamp('42', 1, 200), 42);
  assert.equal(Estado.clamp('42.6', 1, 200), 43);
  assert.equal(Estado.clamp(0, 1, 200), 1);
  assert.equal(Estado.clamp(999, 1, 200), 200);
  assert.equal(Estado.clamp('', 1, 200), 1);
  assert.equal(Estado.clamp('x', 1, 200), 1);
});

test('MAR-07: las vistas son los booleanos que no son geometria', () => {
  assert.deepEqual(Estado.VISTA, ['rel', 'tramos', 'tramosDentro', 'distEjes']);
  assert.deepEqual(Estado.BOOLEANOS, ['igualar', ...Estado.VISTA]);
});

test('MAR-08: el almacen es obligatorio: sin el, error claro', () => {
  assert.throws(() => Estado.cargar(), /almacen/i);
  assert.throws(() => Estado.guardar(Estado.DEFAULTS), /almacen/i);
  assert.throws(() => Estado.guardarMarcas('f', new Set()), /almacen/i);
  assert.throws(() => Estado.cargarMarcas('f', [[[true]]]), /almacen/i);
});
