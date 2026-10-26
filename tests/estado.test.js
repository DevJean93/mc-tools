// Estado: validacion, valores por defecto y marcas, con un almacen en memoria (sin DOM).
const test = require('node:test');
const assert = require('node:assert/strict');
const Estado = require('../estado.js');
const Almacen = require('../almacen.js');
const Formas = require('../shapes.js');

const conDatos = (clave, valor) => Almacen.memoria({ [clave]: valor });

test('sin nada guardado devuelve los valores por defecto', () => {
  const st = Estado.cargar(Almacen.memoria());
  assert.deepEqual(st, Estado.DEFAULTS);
});

test('JSON corrupto se ignora y arranca con los valores por defecto', () => {
  const st = Estado.cargar(conDatos('mc-formas-v1', '{basura'));
  assert.deepEqual(st, Estado.DEFAULTS);
});

test('valores fuera de rango o de otro tipo se recortan o se descartan', () => {
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

test('en esfera el ancho se limita al maximo 3D', () => {
  const st = Estado.cargar(conDatos('mc-formas-v1', JSON.stringify({ forma: 'esfera', w: 300 })));
  assert.equal(st.forma, 'esfera');
  assert.equal(st.w, Estado.LIMITES.w3d);
});

test('el enum de formas sale del registro de geometria', () => {
  assert.deepEqual(Estado.ENUMS.forma, Formas.FORMAS);
  assert.equal(Estado.LIMITES.w2d, Formas.MAX_2D);
  assert.equal(Estado.LIMITES.grosor, Formas.MAX_GROSOR);
});

test('guardar y cargar conservan los valores validos', () => {
  const almacen = Almacen.memoria();
  const st = { ...Estado.DEFAULTS, forma: 'rombo', w: 42, h: 21, zoom: 12, distEjes: false };
  assert.equal(Estado.guardar(st, almacen), true);
  assert.deepEqual(Estado.cargar(almacen), st);
});

test('guardar informa del fallo si el almacen no escribe', () => {
  const roto = { leer: () => null, escribir: () => false };
  assert.equal(Estado.guardar(Estado.DEFAULTS, roto), false);
  assert.equal(Estado.guardarMarcas('x', new Set(), roto), false);
});

test('las marcas se guardan y se recuperan solo para su geometria', () => {
  const almacen = Almacen.memoria();
  const capas = [[[true, true], [true, false]]];   // 2x2 con (1,1) vacio
  const hechos = new Set(['0,0,0', '0,1,0']);
  assert.equal(Estado.guardarMarcas('f1', hechos, almacen), true);
  assert.deepEqual([...Estado.cargarMarcas('f1', capas, almacen)].sort(), ['0,0,0', '0,1,0']);
  assert.equal(Estado.cargarMarcas('f2', capas, almacen).size, 0, 'otra firma -> sin marcas');
});

test('al cargar marcas se descartan las celdas que no son bloque o no existen', () => {
  const almacen = Almacen.memoria({
    'mc-formas-v1:marcas': JSON.stringify({
      firma: 'f', porCapa: { 0: [0, 0, 1, 1, 9, 9], 5: [0, 0] },
    }),
  });
  const capas = [[[true, false], [false, false]]];
  assert.deepEqual([...Estado.cargarMarcas('f', capas, almacen)], ['0,0,0']);
});

test('marcas corruptas o con formato raro no rompen la carga', () => {
  const capas = [[[true]]];
  assert.equal(Estado.cargarMarcas('f', capas, conDatos('mc-formas-v1:marcas', '{basura')).size, 0);
  assert.equal(Estado.cargarMarcas('f', capas, conDatos('mc-formas-v1:marcas', '[1,2,3]')).size, 0);
  const sinPorCapa = JSON.stringify({ firma: 'f', porCapa: { 0: 'x' } });
  assert.equal(Estado.cargarMarcas('f', capas, conDatos('mc-formas-v1:marcas', sinPorCapa)).size, 0);
});

test('la firma solo cambia con la geometria', () => {
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

test('un almacen que lanza al leer no rompe la carga', () => {
  const roto = { leer: () => { throw new Error('sin acceso'); }, escribir: () => true };
  assert.deepEqual(Estado.cargar(roto), Estado.DEFAULTS);
});
