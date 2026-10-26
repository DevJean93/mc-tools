// Materiales: conversion de bloques a stacks/shulkers/cofres y textos de progreso (sin DOM).
const test = require('node:test');
const assert = require('node:assert/strict');
const Materiales = require('../materiales.js');

test('208 bloques son 3 stacks y 16 sueltos', () => {
  const r = Materiales.resumen([208], [0]);
  assert.equal(r.total, 208);
  assert.equal(r.stacks, '3 × 64 + 16');
  assert.equal(r.faltan, 208);
});

test('sin resto no se anade el "+ N"', () => {
  assert.equal(Materiales.resumen([128], [0]).stacks, '2 × 64');
  assert.equal(Materiales.resumen([0], [0]).stacks, '0 × 64');
});

test('shulkers y cofres se redondean hacia arriba', () => {
  const r = Materiales.resumen([1728], [0]);
  assert.deepEqual(r.shulkers, { valor: 1, cajas: 1 });
  assert.deepEqual(r.cofres, { valor: 0.5, cajas: 1 });

  const r2 = Materiales.resumen([1729], [0]);
  assert.equal(r2.shulkers.cajas, 2);
  assert.equal(r2.cofres.cajas, 1);

  const r3 = Materiales.resumen([3457], [0]);
  assert.equal(r3.cofres.cajas, 2);
  assert.equal(Materiales.resumen([0], [0]).shulkers.cajas, 0, 'sin bloques no hace falta nada');
});

test('porcentajes de una sola capa', () => {
  const r = Materiales.resumen([208], [16], 0);
  assert.equal(r.pctTotal, 8);
  assert.equal(r.pctCapa, 8);
  assert.equal(r.textoProgreso, 'Construidos: 16/208 (8 %)');
  assert.equal(r.enCapa, 16);
  assert.equal(r.totCapa, 208);
});

test('en 3D el progreso incluye capa y total', () => {
  const r = Materiales.resumen([8, 26, 46], [8, 0, 46], 1);
  assert.equal(r.total, 80);
  assert.equal(r.marcados, 54);
  assert.equal(r.pctTotal, 68);
  assert.equal(r.enCapa, 0);
  assert.equal(r.totCapa, 26);
  assert.equal(r.textoProgreso, 'Capa: 0/26 (0 %) · Total: 54/80 (68 %)');
});

test('cada capa sabe su total, lo hecho, su porcentaje y si esta completa', () => {
  const r = Materiales.resumen([8, 26, 0], [8, 1, 0], 0);
  assert.deepEqual(r.capas.map(c => [c.total, c.hechos, c.pct, c.completa]), [
    [8, 8, 100, true],
    [26, 1, 4, false],
    [0, 0, 0, false],
  ]);
  assert.deepEqual(r.capas.map(c => c.i), [0, 1, 2]);
});

test('resumen del centro: tamano del centro y distancias a los bordes', () => {
  const g = [
    [false, false, false],
    [true, true, true],
    [false, false, false],
  ];
  assert.equal(Materiales.textoResumenCentro(g),
    'Centro: 1×1 bloques · del centro al borde: ← 1 · → 1 · ↑ 0 · ↓ 0 bloques (sin contar el centro)');
});

test('resumen del centro con centro par 2x2', () => {
  const g = Array.from({ length: 2 }, () => [true, true, true, true]);
  assert.equal(Materiales.textoResumenCentro(g),
    'Centro: 2×2 bloques · del centro al borde: ← 1 · → 1 · ↑ 0 · ↓ 0 bloques (sin contar el centro)');
});

test('resumen del centro de una capa vacia no menciona bordes', () => {
  const g = [[false, false], [false, false]];
  assert.equal(Materiales.textoResumenCentro(g), 'Centro: 2×2 bloques');
});

test('la constante de stack coincide con la del estado', () => {
  const Estado = require('../estado.js');
  assert.equal(Materiales.STACK, Estado.STACK);
  assert.equal(Materiales.SHULKER, Estado.SHULKER);
  assert.equal(Materiales.COFRE_DOBLE, Estado.COFRE_DOBLE);
});
