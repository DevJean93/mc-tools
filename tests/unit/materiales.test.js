// Materiales: conversion de bloques a stacks/shulkers/cofres y textos de progreso (sin DOM).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { Materiales } from '../../src/herramientas/formas/nucleo/materiales.js';

test('MAT-01: 208 bloques son 3 stacks y 16 sueltos', () => {
  const r = Materiales.resumen([208], [0]);
  assert.equal(r.total, 208);
  assert.equal(r.stacks, '3 × 64 + 16');
  assert.equal(r.faltan, 208);
});

test('MAT-01: sin resto no se anade el "+ N"', () => {
  assert.equal(Materiales.resumen([128], [0]).stacks, '2 × 64');
  assert.equal(Materiales.resumen([0], [0]).stacks, '0 × 64');
});

test('MAT-02: shulkers y cofres se redondean hacia arriba', () => {
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

test('MAT-03: porcentajes de una sola capa', () => {
  const r = Materiales.resumen([208], [16], 0);
  assert.equal(r.pctTotal, 8);
  assert.equal(r.pctCapa, 8);
  assert.equal(r.textoProgreso, 'Construidos: 16/208 (8 %)');
  assert.equal(r.enCapa, 16);
  assert.equal(r.totCapa, 208);
});

test('MAT-04: en 3D el progreso incluye capa y total', () => {
  const r = Materiales.resumen([8, 26, 46], [8, 0, 46], 1);
  assert.equal(r.total, 80);
  assert.equal(r.marcados, 54);
  assert.equal(r.pctTotal, 68);
  assert.equal(r.enCapa, 0);
  assert.equal(r.totCapa, 26);
  assert.equal(r.textoProgreso, 'Capa: 0/26 (0 %) · Total: 54/80 (68 %)');
});

test('MAT-05: cada capa sabe su total, lo hecho, su porcentaje y si esta completa', () => {
  const r = Materiales.resumen([8, 26, 0], [8, 1, 0], 0);
  assert.deepEqual(r.capas.map(c => [c.total, c.hechos, c.pct, c.completa]), [
    [8, 8, 100, true],
    [26, 1, 4, false],
    [0, 0, 0, false],
  ]);
  assert.deepEqual(r.capas.map(c => c.i), [0, 1, 2]);
});

test('NUM-12: resumen del centro: tamano del centro y distancias a los bordes', () => {
  const g = [
    [false, false, false],
    [true, true, true],
    [false, false, false],
  ];
  assert.equal(Materiales.textoResumenCentro(g),
    'Centro: 1×1 bloques · del centro al borde: ← 1 · → 1 · ↑ 0 · ↓ 0 bloques (sin contar el centro)');
});

test('NUM-12: resumen del centro con centro par 2x2', () => {
  const g = Array.from({ length: 2 }, () => [true, true, true, true]);
  assert.equal(Materiales.textoResumenCentro(g),
    'Centro: 2×2 bloques · del centro al borde: ← 1 · → 1 · ↑ 0 · ↓ 0 bloques (sin contar el centro)');
});

test('NUM-12: resumen del centro de una capa vacia no menciona bordes', () => {
  const g = [[false, false], [false, false]];
  assert.equal(Materiales.textoResumenCentro(g), 'Centro: 2×2 bloques');
});

test('MAT-06: las constantes de stack viven solo en materiales', () => {
  assert.equal(Materiales.STACK, 64);
  assert.equal(Materiales.SHULKER, 27 * 64);
  assert.equal(Materiales.COFRE_DOBLE, 54 * 64);
});

test('MAT-17: la lista de bloques del esquema es corta, con piedra primero y sus ID del juego', () => {
  assert.deepEqual(Materiales.BLOQUES.map(b => b.id), [
    'minecraft:stone', 'minecraft:stone_bricks', 'minecraft:bricks', 'minecraft:oak_planks',
    'minecraft:glass', 'minecraft:white_wool', 'minecraft:white_concrete', 'minecraft:smooth_stone',
  ]);
  assert.deepEqual(Materiales.BLOQUES.map(b => b.nombre), [
    'Piedra', 'Ladrillos de piedra', 'Ladrillos', 'Tablones de roble', 'Cristal', 'Lana blanca', 'Hormigón blanco', 'Piedra lisa',
  ]);
  assert.equal(Materiales.BLOQUE_DEFECTO, 'minecraft:stone');
});

// --- MAT-18, MAT-19: reparto entre borde y relleno ----------------------------------------------
import { Formas } from '../../src/herramientas/formas/nucleo/formas.js';
const generar = p => Formas.generar({ modo: 'relleno', grosor: 1, ...p }).capas;
const cuenta = capas => capas.map(g => g.flat().filter(Boolean).length);
// Cálculo independiente: ¿la celda toca el exterior por alguna cara?
const tocaFuera = (capas, c, y, x) => {
  const lleno = (cc, yy, xx) => !!(capas[cc] && capas[cc][yy] && capas[cc][yy][xx]);
  const caras = [[c, y - 1, x], [c, y + 1, x], [c, y, x - 1], [c, y, x + 1]];
  if (capas.length > 1) caras.push([c - 1, y, x], [c + 1, y, x]);
  return caras.some(([cc, yy, xx]) => !lleno(cc, yy, xx));
};

test('MAT-18: en un círculo sólido de 16 el relleno es el interior y borde + relleno son los 208 bloques', () => {
  const capas = generar({ forma: 'circulo', w: 16, h: 16 });
  const z = Materiales.rellenoDe(capas);
  assert.equal(z.celdas.length, 1);
  assert.equal(z.celdas[0].length, 16 * 16);
  let relleno = 0;
  capas[0].forEach((f, y) => f.forEach((v, x) => {
    const esRelleno = z.celdas[0][y * 16 + x] === 1;
    assert.equal(esRelleno, v && !tocaFuera(capas, 0, y, x), `celda ${x},${y}`);
    relleno += esRelleno ? 1 : 0;
  }));
  assert.equal(z.cuenta[0], relleno);
  assert.ok(relleno > 0 && relleno < 208);
  assert.equal(cuenta(capas)[0], 208);
});

test('MAT-18: una celda vacía nunca es relleno y solo cuenta como relleno lo que está rodeado', () => {
  const capas = [[[true, true, true], [true, true, true], [true, true, true]]];
  const z = Materiales.rellenoDe(capas);
  assert.deepEqual([...z.celdas[0]], [0, 0, 0, 0, 1, 0, 0, 0, 0]);
  assert.deepEqual(z.cuenta, [1]);
  assert.deepEqual(Materiales.rellenoDe([[[true, false, true], [true, true, true], [true, true, true]]]).cuenta, [0], 'un hueco al lado: ningún relleno');
});

test('MAT-18: en una esfera de 11 la capa 1 es toda borde (no hay nada debajo) y también la última', () => {
  const capas = generar({ forma: 'esfera', w: 11, esfera: 'esfera' });
  const z = Materiales.rellenoDe(capas);
  assert.equal(z.cuenta[0], 0);
  assert.equal(z.cuenta[capas.length - 1], 0);
  assert.ok(z.cuenta[5] > 0, 'la capa del medio sí tiene relleno');
});

test('MAT-18: en 3D el borde mira también arriba y abajo, y coincide con un cálculo independiente', () => {
  for (const p of [{ forma: 'esfera', w: 11, esfera: 'esfera' }, { forma: 'esfera', w: 12, esfera: 'cupula' }]) {
    const capas = generar(p), z = Materiales.rellenoDe(capas), w = capas[0][0].length;
    capas.forEach((g, c) => g.forEach((f, y) => f.forEach((v, x) => {
      assert.equal(z.celdas[c][y * w + x] === 1, v && !tocaFuera(capas, c, y, x), `${p.esfera} capa ${c + 1} ${x},${y}`);
    })));
  }
});

test('MAT-18: una esfera de 100 (cien capas de 100×100) se calcula en menos de un segundo', () => {
  const capas = generar({ forma: 'esfera', w: 100, esfera: 'esfera' });
  const t = performance.now();
  const z = Materiales.rellenoDe(capas);
  assert.ok(performance.now() - t < 1000, `tardó ${Math.round(performance.now() - t)} ms`);
  assert.ok(z.cuenta.reduce((a, b) => a + b, 0) > 0);
});

test('MAT-18: el reparto solo existe en formas sólidas y con un relleno distinto del borde', () => {
  const B = 'minecraft:bricks', S = 'minecraft:stone';
  assert.deepEqual(Materiales.repartoActivo({ modo: 'relleno', bloque: B, relleno: S }), { borde: B, relleno: S });
  assert.equal(Materiales.repartoActivo({ modo: 'relleno', bloque: B, relleno: '' }), null, 'sin relleno elegido');
  assert.equal(Materiales.repartoActivo({ modo: 'relleno', bloque: B, relleno: B }), null, 'mismo material');
  assert.equal(Materiales.repartoActivo({ modo: 'hueco', bloque: B, relleno: S }), null, 'en hueco todo es borde');
  assert.equal(Materiales.repartoActivo({ modo: 'relleno', bloque: B }), null, 'un guardado sin la clave');
});

const nombre = id => Materiales.BLOQUES.find(b => b.id === id).nombre;
const repartoDe = (capas, borde, relleno) => {
  const z = Materiales.rellenoDe(capas), t = cuenta(capas);
  return { materiales: [
    { id: borde, nombre: nombre(borde), porCapa: t.map((n, i) => n - z.cuenta[i]) },
    { id: relleno, nombre: nombre(relleno), porCapa: z.cuenta },
  ] };
};

test('MAT-19: círculo de 16 con ladrillos y piedra: cada material con sus bloques y stacks, y la suma es 208', () => {
  const capas = generar({ forma: 'circulo', w: 16, h: 16 });
  const r = Materiales.resumen(cuenta(capas), [0], 0, repartoDe(capas, 'minecraft:bricks', 'minecraft:stone'));
  assert.equal(r.total, 208);
  assert.equal(r.materiales.length, 2);
  const [b, s] = r.materiales;
  assert.deepEqual([b.id, s.id], ['minecraft:bricks', 'minecraft:stone']);
  assert.equal(b.total + s.total, 208);
  assert.equal(b.stacks, Materiales.fmtStacks(b.total));
  assert.equal(s.stacks, Materiales.fmtStacks(s.total));
  for (const m of r.materiales) {
    assert.equal(m.shulkers.cajas, Math.ceil(m.total / 1728));
    assert.equal(m.cofres.cajas, Math.ceil(m.total / 3456));
  }
  assert.equal(r.stacks, '3 × 64 + 16', 'el total de la forma sigue ahí');
});

test('MAT-19: en la tabla por capas cada capa lleva sus bloques por material y suman su total', () => {
  const capas = generar({ forma: 'esfera', w: 11, esfera: 'esfera' });
  const r = Materiales.resumen(cuenta(capas), cuenta(capas).map(() => 0), 0, repartoDe(capas, 'minecraft:glass', 'minecraft:stone'));
  for (const c of r.capas) assert.equal(c.porMaterial[0] + c.porMaterial[1], c.total, `capa ${c.i + 1}`);
  assert.equal(r.materiales[0].total + r.materiales[1].total, r.total);
});

test('MAT-19: sin reparto el resumen es el de siempre (sin materiales ni columnas extra)', () => {
  const sin = Materiales.resumen([208], [16], 0);
  assert.equal(sin.materiales, undefined);
  assert.equal(sin.capas[0].porMaterial, undefined);
  assert.deepEqual(Materiales.resumen([208], [16], 0, null), sin);
});
