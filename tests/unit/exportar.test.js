// Partes puras de la exportacion: la cabecera de cada capa y el aviso de capas muy grandes.
const test = require('node:test');
const assert = require('node:assert/strict');
const Exportar = require('../../src/interfaz/exportar.js');
const Formas = require('../../src/nucleo/formas.js');

const ctx = extra => ({
  nombre: 'Esfera', dimensiones: '11 × 11 × 11', modoTexto: 'relleno', altura: () => null,
  totales: [4, 40, 88], porCapa: [1, 0, 0], stacks: n => `${n} stacks`, capas: [[], [], []], ...extra,
});

test('MAT-11: la cabecera de la ficha dice capa, Y y bloques, sin lo construido', () => {
  const c = Exportar.cabecera(ctx({ altura: i => 64 + i }), 2, { construidos: false });
  assert.equal(c[0], 'Esfera 11 × 11 × 11 · relleno');
  assert.equal(c[1], 'Capa 3 de 3 · Y 66 · 88 bloques (88 stacks)');
  assert.match(c[2], /^Formas MC · /);
});

test('MAT-11: sin Y de la base la cabecera de la ficha solo lleva el numero de capa', () => {
  const c = Exportar.cabecera(ctx(), 0, { construidos: false });
  assert.equal(c[1], 'Capa 1 de 3 · 4 bloques (4 stacks)');
});

test('MAT-09: la cabecera del PNG sigue llevando los construidos', () => {
  const c = Exportar.cabecera(ctx({ altura: i => 64 + i }), 0);
  assert.equal(c[1], 'Capa 1 de 3 · Y 64 · 4 bloques (4 stacks) · construidos 1');
});

const capas = p => Formas.generar({ modo: 'relleno', grosor: 1, ...p }).capas;

test('MAT-13: una capa de 60 cabe, de 61 o mas no', () => {
  assert.equal(Exportar.capaMasAnchaQue(capas({ forma: 'circulo', w: 60, h: 60 }), 60), false);
  assert.equal(Exportar.capaMasAnchaQue(capas({ forma: 'circulo', w: 61, h: 61 }), 60), true);
  assert.equal(Exportar.capaMasAnchaQue(capas({ forma: 'circulo', w: 120, h: 120 }), 60), true);
});

test('MAT-13: cuenta el ancho y tambien el alto', () => {
  assert.equal(Exportar.capaMasAnchaQue(capas({ forma: 'rectangulo', w: 30, h: 70 }), 60), true);
  assert.equal(Exportar.capaMasAnchaQue(capas({ forma: 'rectangulo', w: 70, h: 30 }), 60), true);
  assert.equal(Exportar.capaMasAnchaQue(capas({ forma: 'rectangulo', w: 60, h: 30 }), 60), false);
});

test('MAT-13: una esfera de 11 no avisa', () => {
  assert.equal(Exportar.capaMasAnchaQue(capas({ forma: 'esfera', w: 11, h: 11 }), 60), false);
});
