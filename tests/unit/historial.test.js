// Historial: pilas de deshacer/rehacer con limite (sin DOM).
const test = require('node:test');
const assert = require('node:assert/strict');
const Historial = require('../../src/nucleo/historial.js');

test('MAR-04: empieza vacio y no devuelve nada que deshacer', () => {
  const h = Historial.crear();
  assert.equal(h.puedeDeshacer(), false);
  assert.equal(h.puedeRehacer(), false);
  assert.equal(h.deshacer('actual'), null);
  assert.equal(h.rehacer('actual'), null);
});

test('MAR-04: deshacer devuelve la instantanea anterior y rehacer la recupera', () => {
  const h = Historial.crear();
  h.apilar('a');
  h.apilar('b');
  assert.deepEqual(h.deshacer('c'), 'b');
  assert.deepEqual(h.deshacer('b'), 'a');
  assert.equal(h.deshacer('a'), null);
  assert.deepEqual(h.rehacer('a'), 'b');
  assert.deepEqual(h.rehacer('b'), 'c');
  assert.equal(h.rehacer('c'), null);
});

test('MAR-04: una accion nueva descarta lo que habia para rehacer', () => {
  const h = Historial.crear();
  h.apilar('a');
  h.deshacer('b');
  assert.equal(h.puedeRehacer(), true);
  h.apilar('x');
  assert.equal(h.puedeRehacer(), false);
});

test('MAR-04: descartar quita la ultima instantanea (accion sin cambios)', () => {
  const h = Historial.crear();
  h.apilar('a');
  h.descartar();
  assert.equal(h.puedeDeshacer(), false);
  h.apilar('a');
  h.descartar();
  assert.equal(h.puedeDeshacer(), false);
  assert.equal(h.pendientes().deshacer, 0);
});

test('MAR-04: respeta el limite de 50 y tira lo mas antiguo', () => {
  const h = Historial.crear();
  for (let i = 0; i < 80; i++) h.apilar(i);
  assert.equal(h.pendientes().deshacer, Historial.MAX);
  let ultimo = null;
  for (let i = 0; i < Historial.MAX; i++) ultimo = h.deshacer('x');
  assert.equal(ultimo, 30, 'se conservan las 50 ultimas instantaneas');
  assert.equal(h.deshacer('x'), null);
});

test('MAR-04: el limite es configurable', () => {
  const h = Historial.crear(3);
  for (let i = 0; i < 5; i++) h.apilar(i);
  assert.equal(h.pendientes().deshacer, 3);
});

test('MAR-04: las instantaneas son opacas: arrays y objetos se guardan tal cual', () => {
  const h = Historial.crear();
  const snap = { params: { w: 16 }, hechos: ['0,1,2'] };
  h.apilar(snap);
  assert.equal(h.deshacer({ params: {}, hechos: [] }), snap);
});
