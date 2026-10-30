const test = require('node:test');
const assert = require('node:assert/strict');
const Formas = require('../../src/nucleo/formas.js');

const { contar } = Formas;
const total = r => r.capas.reduce((a, g) => a + contar(g), 0);
const gen = p => Formas.generar({ grosor: 1, modo: 'relleno', ...p });

test('FOR-01: círculo 16×16: 208 bloques, simétrico en ambos ejes', () => {
  const g = gen({ forma: 'circulo', w: 16, h: 16 }).capas[0];
  assert.equal(contar(g), 208);
  assert.deepEqual(g, g.map(f => [...f].reverse()));
  assert.deepEqual(g, [...g].reverse());
});

test('FOR-02: totales coinciden con las capas', () => {
  const r = gen({ forma: 'esfera', w: 12, esfera: 'esfera', modo: 'hueco', grosor: 2 });
  assert.deepEqual(r.totales, r.capas.map(contar));
});

test('FOR-03: valores de referencia', () => {
  const casos = [
    [{ forma: 'circulo', w: 16, h: 16, modo: 'hueco', grosor: 2 }, 84],
    [{ forma: 'esfera', w: 16, esfera: 'esfera' }, 2176],
    [{ forma: 'esfera', w: 16, esfera: 'cupula' }, 1088],
    [{ forma: 'esfera', w: 16, esfera: 'esfera', modo: 'hueco', grosor: 2 }, 1136],
    [{ forma: 'esfera', w: 11, esfera: 'esfera', modo: 'hueco', grosor: 1 }, 278],
    [{ forma: 'circulo', w: 200, h: 200 }, 31428],
    [{ forma: 'hexagono', w: 200, h: 200, orient: 'plano' }, 30000],
    [{ forma: 'rectangulo', w: 10, h: 10, modo: 'hueco', grosor: 1 }, 36],
    [{ forma: 'rectangulo', w: 10, h: 10 }, 100],
  ];
  for (const [p, esperado] of casos) assert.equal(total(gen(p)), esperado, JSON.stringify(p));
});

test('FOR-03: hueco siempre es subconjunto del sólido', () => {
  const base = { forma: 'circulo', w: 16, h: 16 };
  const solido = gen(base).capas[0];
  for (const grosor of [1, 2, 3, 4]) {
    const hueco = gen({ ...base, modo: 'hueco', grosor }).capas[0];
    assert.ok(contar(hueco) > 0 && contar(hueco) < contar(solido));
    hueco.forEach((fila, y) => fila.forEach((v, x) => {
      if (v) assert.ok(solido[y][x], `celda fuera del sólido en ${x},${y}`);
    }));
  }
});

test('FOR-04: grosor excesivo se recorta y no devuelve el sólido', () => {
  const r = gen({ forma: 'circulo', w: 16, h: 16, modo: 'hueco', grosor: 50 });
  assert.equal(r.grosorRecortado, true);
  assert.equal(r.grosor, 7);
  assert.equal(r.grosorMax, 7);
  assert.ok(total(r) < 208);

  const e = gen({ forma: 'esfera', w: 16, esfera: 'esfera', modo: 'hueco', grosor: 50 });
  assert.equal(e.grosorRecortado, true);
  assert.ok(total(e) < 2176);
});

test('FOR-05: cúpula = mitad superior exacta de la esfera', () => {
  const esfera = gen({ forma: 'esfera', w: 16, esfera: 'esfera' });
  const cupula = gen({ forma: 'esfera', w: 16, esfera: 'cupula' });
  assert.equal(cupula.capas.length, 8);
  assert.deepEqual(cupula.capas, esfera.capas.slice(8));
});

test('FOR-06: centro par 2×2 e impar 1×1', () => {
  const par = gen({ forma: 'circulo', w: 16, h: 16 }).capas[0];
  assert.ok(par[7][7] && par[7][8] && par[8][7] && par[8][8]);
  const impar = gen({ forma: 'circulo', w: 15, h: 15 }).capas[0];
  assert.equal(impar.length, 15);
  assert.ok(impar[7][7]);
});

test('FOR-07: tamaños degenerados no fallan y respetan el marco', () => {
  for (const forma of ['circulo', 'rectangulo', 'triangulo', 'rombo', 'hexagono']) {
    for (const w of [1, 2, 3]) {
      const g = gen({ forma, w, h: w }).capas[0];
      assert.equal(g.length, w);
      g.forEach(f => assert.equal(f.length, w));
    }
  }
  assert.equal(total(gen({ forma: 'esfera', w: 1, esfera: 'esfera' })), 1);
});

test('FOR-08: parámetros inválidos fallan con mensaje claro o se recortan', () => {
  assert.throws(() => Formas.generar({ forma: 'foo', w: 4, h: 4 }), /Forma desconocida/);
  assert.throws(() => Formas.generar({ forma: 'circulo', w: 'abc', h: 4 }), /Ancho/);
  assert.equal(gen({ forma: 'circulo', w: 999, h: 999 }).capas[0].length, Formas.MAX_2D);
  assert.equal(gen({ forma: 'esfera', w: 999, esfera: 'esfera' }).capas.length, Formas.MAX_3D);
});

test('rendimiento: esfera Ø100 hueca (g=50)', { skip: !!process.env.CI }, () => {
  const t0 = performance.now();
  gen({ forma: 'esfera', w: 100, modo: 'hueco', grosor: 50, esfera: 'esfera' });
  assert.ok(performance.now() - t0 < 300);
});

// --- contrato comun del registro ------------------------------------------------------
test('FOR-11: contrato: todas las formas registradas generan, respetan su tamano y son simetricas', () => {
  assert.ok(Formas.FORMAS.length >= 6, 'estan todas las formas de la app');
  for (const id of Formas.FORMAS) {
    const def = Formas.obtener(id);
    assert.ok(def, `la forma ${id} esta registrada`);
    const dims = def.dimensiones({ forma: id, w: 16, h: 16 });
    const r = Formas.generar({ forma: id, w: 16, h: 16, modo: 'relleno', grosor: 1 });
    assert.equal(r.capas.length, dims.d, `${id}: numero de capas`);
    r.capas.forEach((g, z) => {
      assert.equal(g.length, dims.h, `${id}: alto de la capa ${z}`);
      g.forEach(f => assert.equal(f.length, dims.w, `${id}: ancho de la capa ${z}`));
    });
    assert.equal(def.es3D, r.capas.length > 1 || dims.d > 1, `${id}: es3D declara capas`);
    const g0 = r.capas[0];
    assert.ok(Formas.contar(g0) > 0, `${id}: al menos un bloque`);
    assert.deepEqual(g0, g0.map(f => [...f].reverse()), `${id}: simetria horizontal`);
    assert.deepEqual(r.totales, r.capas.map(Formas.contar), `${id}: totales por capa`);
  }
});

test('FOR-03: contrato: el hueco de cada forma es subconjunto de su solido', () => {
  for (const id of Formas.FORMAS) {
    const solido = Formas.generar({ forma: id, w: 16, h: 16, modo: 'relleno' });
    for (const grosor of [1, 2, 3, 5]) {
      const hueco = Formas.generar({ forma: id, w: 16, h: 16, modo: 'hueco', grosor });
      assert.ok(hueco.totales.some(n => n > 0), `${id}: el hueco no queda vacio`);
      hueco.capas.forEach((g, z) => g.forEach((fila, y) => fila.forEach((v, x) => {
        if (v) assert.ok(solido.capas[z][y][x], `${id}: celda ${x},${y},${z} del hueco fuera del solido`);
      })));
    }
  }
});

test('FOR-11: contrato: una forma mal definida no se registra', () => {
  assert.throws(() => Formas.registrar('sin-pintar', { dimensiones: () => ({ w: 1, h: 1, d: 1 }) }), /contrato/);
  assert.throws(() => Formas.registrar('', { dimensiones: () => ({}), llenar: () => true }), /identificador/);
  assert.throws(() => Formas.registrar('circulo', { dimensiones: () => ({}), llenar: () => true }), /duplicada/);
});

