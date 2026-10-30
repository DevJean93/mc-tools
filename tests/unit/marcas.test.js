// Marcas: solo bloques reales, por capa, con instantanea/restauracion (sin DOM).
const test = require('node:test');
const assert = require('node:assert/strict');
const Marcas = require('../../src/nucleo/marcas.js');

// Capa 0: 2x2 con (1,1) vacio. Capa 1: 1x1 llena.
const CAPAS = [
  [[true, true], [true, false]],
  [[true]],
];

test('MAR-01: fijar solo actua sobre bloques y avisa si no cambia nada', () => {
  const m = Marcas.crear();
  assert.equal(m.fijar(CAPAS, 0, 0, 0, true), true);
  assert.equal(m.fijar(CAPAS, 0, 0, 0, true), false, 'ya estaba marcado');
  assert.equal(m.fijar(CAPAS, 0, 1, 1, true), false, 'celda vacia');
  assert.equal(m.fijar(CAPAS, 9, 0, 0, true), false, 'capa inexistente');
  assert.equal(m.fijar(CAPAS, 0, 0, 0, false), true);
  assert.equal(m.total(), 0);
});

test('MAR-01: alternar devuelve null en vacio y el valor nuevo en bloque', () => {
  const m = Marcas.crear();
  assert.equal(m.alternar(CAPAS, 0, 1, 1), null);
  assert.deepEqual(m.alternar(CAPAS, 0, 0, 0), { valor: true, cambio: true });
  assert.ok(m.tiene(0, 0, 0));
  assert.deepEqual(m.alternar(CAPAS, 0, 0, 0), { valor: false, cambio: true });
  assert.equal(m.tiene(0, 0, 0), false);
});

test('MAR-02: marcarCapas cuenta solo los bloques que cambian', () => {
  const m = Marcas.crear();
  assert.equal(m.marcarCapas(CAPAS, [0], true), 3);
  assert.equal(m.marcarCapas(CAPAS, [0], true), 0, 'repetir no cambia nada');
  assert.equal(m.marcarCapas(CAPAS, [0, 1], true), 1);
  assert.equal(m.marcarCapas(CAPAS, [0, 1], false), 4);
  assert.equal(m.total(), 0);
  assert.equal(m.marcarCapas(CAPAS, [7], true), 0, 'capa inexistente');
});

test('MAR-02: porCapa reparte los marcados por indice de capa', () => {
  const m = Marcas.crear(['0,0,0', '0,1,0', '1,0,0']);
  assert.deepEqual(m.porCapa(3), [2, 1, 0]);
  assert.equal(m.total(), 3);
});

test('MAR-03: instantanea y restaurar respetan el contenido', () => {
  const m = Marcas.crear(['0,0,0']);
  const snap = m.instantanea();
  assert.deepEqual(snap, ['0,0,0']);
  m.limpiar();
  assert.equal(m.total(), 0);
  m.restaurar(snap);
  assert.deepEqual(m.instantanea(), ['0,0,0']);
  m.restaurar([]);
  assert.equal(m.total(), 0);
});

test('MAR-03: la instantanea es una copia: cambiarla no toca las marcas', () => {
  const m = Marcas.crear();
  m.fijar(CAPAS, 0, 0, 0, true);
  const snap = m.instantanea();
  snap.push('falso');
  assert.equal(m.total(), 1);
  assert.equal(m.conjunto().has('falso'), false);
});

test('MAR-01: el conjunto expuesto es el vivo (lo usa el dibujo)', () => {
  const m = Marcas.crear();
  m.fijar(CAPAS, 1, 0, 0, true);
  assert.ok(m.conjunto() instanceof Set);
  assert.ok(m.conjunto().has('1,0,0'));
});
