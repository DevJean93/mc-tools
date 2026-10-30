// Etiquetas de los tramos dentro del dibujo (calculo puro, sin canvas).
const test = require('node:test');
const assert = require('node:assert/strict');
const Render = require('../../src/dibujo/render.js');
const Formas = require('../../src/nucleo/formas.js');

const capa = p => Formas.generar({ modo: 'relleno', grosor: 1, ...p }).capas[0];
const etiquetas = (p, distEjes = true) => Render.etiquetasTramosDentro(capa(p), distEjes);
const fila = (e, y) => e.filter(t => t.y === y).sort((a, b) => a.x - b.x);
const anchoFila = (g, y) => g[y].filter(Boolean).length;

test('circulo de 30: el total de 14 de la fila 2 son 6 por lado, sin contar los 2 bloques del centro', () => {
  const g = capa({ forma: 'circulo', w: 30, h: 30 });
  assert.equal(anchoFila(g, 1), 14, 'la fila tiene 14 bloques');
  const f = fila(etiquetas({ forma: 'circulo', w: 30, h: 30 }), 1);
  assert.deepEqual(f.map(t => t.n), [6, 6]);
  assert.equal(f[0].n + f[1].n + 2, 14, 'izquierda + derecha + franja = total');
});

test('en cada fila numerada, izquierda + derecha + franja central = bloques de la fila', () => {
  for (const [forma, w, h] of [['circulo', 30, 30], ['circulo', 31, 31], ['rombo', 21, 21], ['hexagono', 24, 20]]) {
    const g = capa({ forma, w, h });
    const banda = Render.centro(w)[1] - Render.centro(w)[0] + 1;
    const e = etiquetas({ forma, w, h });
    for (let y = 0; y < h; y++) {
      const f = fila(e, y);
      if (f.length !== 2) continue;
      assert.equal(f[0].n + f[1].n + banda, anchoFila(g, y), `${forma} ${w}x${h} fila ${y + 1}`);
    }
  }
});

test('los numeros de cada lado quedan alineados en dos columnas simetricas respecto a la franja', () => {
  const w = 30, h = 30;
  const e = etiquetas({ forma: 'circulo', w, h });
  const interiores = e.filter(t => t.y > 0 && t.y < h - 1);
  const izq = new Set(interiores.filter(t => t.x < w / 2).map(t => t.x));
  const der = new Set(interiores.filter(t => t.x > w / 2).map(t => t.x));
  assert.equal(izq.size, 1, 'una sola columna a la izquierda');
  assert.equal(der.size, 1, 'una sola columna a la derecha');
  assert.equal([...izq][0] + [...der][0], w, 'simetricas');
});

test('las filas de los extremos llevan la cifra centrada en cada lado', () => {
  const f = fila(etiquetas({ forma: 'circulo', w: 30, h: 30 }), 0);
  assert.deepEqual(f.map(t => t.n), [3, 3], 'un total de 8 son 3 por lado');
  assert.equal(f[0].x + f[1].x, 30, 'simetricas');
  assert.ok(f[0].x > 11 && f[0].x < 14, 'dentro de su parte, a la izquierda de la franja');
});

test('ningun numero cae sobre la franja ni sobre las filas centrales (son del eje)', () => {
  const w = 30, h = 30;
  const [cx0, cx1] = Render.centro(w), [cy0, cy1] = Render.centro(h);
  for (const t of etiquetas({ forma: 'circulo', w, h })) {
    assert.ok(t.y < cy0 || t.y > cy1, 'fuera de las filas centrales');
    assert.ok(t.x < cx0 || t.x > cx1 + 1, 'fuera de la franja central');
  }
});

test('con franja de 1 bloque (tamano impar) tampoco se cuenta el del centro', () => {
  const w = 31, g = capa({ forma: 'circulo', w, h: w });
  const f = fila(etiquetas({ forma: 'circulo', w, h: w }), 2);
  assert.equal(f.length, 2);
  assert.equal(f[0].n + f[1].n + 1, anchoFila(g, 2));
});

test('sin distancias de eje cada tramo lleva su total, centrado en el tramo', () => {
  const g = capa({ forma: 'circulo', w: 30, h: 30 });
  const f = fila(Render.etiquetasTramosDentro(g, false), 1);
  assert.deepEqual(f.map(t => t.n), [14]);
  assert.equal(f[0].x, (g[1].indexOf(true) + g[1].lastIndexOf(true) + 1) / 2);
});

test('un tramo estrecho que no llega a las columnas no se numera junto al eje', () => {
  // Triangulo 21x15: las filas 2 y 3 (3 bloques) no dejan sitio entre el eje y el borde, y la
  // punta solo tiene el bloque central: ninguna lleva cifras dentro.
  const w = 21, h = 15;
  const g = capa({ forma: 'triangulo', w, h });
  const e = etiquetas({ forma: 'triangulo', w, h });
  for (const y of [0, 1, 2]) assert.deepEqual(fila(e, y), [], `fila ${y + 1} sin cifras`);
  // Desde que hay sitio, izquierda + derecha + la franja de 1 bloque = el total de la fila.
  const f = fila(e, 4);
  assert.equal(f.length, 2);
  assert.equal(f[0].n + f[1].n + 1, anchoFila(g, 4));
  assert.ok(e.every(t => t.n > 0), 'nunca se escriben ceros');
});

// --- numeros de los ejes -----------------------------------------------------------------
const eje = (e, y) => e.filter(t => t.y === y).sort((a, b) => a.x - b.x).map(t => t.n);

test('ejes: la cuenta empieza en 1 en la franja y llega hasta el bloque del borde (15 en un circulo de 30)', () => {
  const e = Render.etiquetasEjes(capa({ forma: 'circulo', w: 30, h: 30 }));
  // 14 bloques a cada lado de la franja de 2: franja = 1, el ultimo de cada lado = 15.
  assert.deepEqual(eje(e, 14), [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  const col = e.filter(t => t.x === 14 && (t.y < 14 || t.y > 15)).sort((a, b) => a.y - b.y).map(t => t.n);
  assert.deepEqual(col, [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
});

test('ejes: el maximo es el numero de bloques por lado + 1, tambien con franja de 1 bloque', () => {
  for (const w of [16, 20, 30, 31, 40]) {
    const g = capa({ forma: 'circulo', w, h: w });
    const [cx0, cx1] = Render.centro(w), banda = cx1 - cx0 + 1;
    const porLado = (w - banda) / 2;
    const max = Math.max(...Render.etiquetasEjes(g).map(t => t.n));
    assert.equal(max, porLado + 1, `circulo ${w}: ${porLado} bloques por lado`);
  }
});

test('ejes: cada celda se numera una sola vez (los dos ejes no se pisan en la franja)', () => {
  const e = Render.etiquetasEjes(capa({ forma: 'circulo', w: 30, h: 30 }));
  const vistas = new Set(e.map(t => `${t.x},${t.y}`));
  assert.equal(vistas.size, e.length);
});

test('ejes: en modo hueco tambien se numera el interior vacio, hasta el borde', () => {
  const g = capa({ forma: 'circulo', w: 20, h: 20, modo: 'hueco', grosor: 1 });
  const e = Render.etiquetasEjes(g);
  const f = e.filter(t => t.y === 9).sort((a, b) => a.x - b.x);
  assert.equal(f.length, g[9].lastIndexOf(true) - g[9].indexOf(true) + 1, 'todas las celdas entre los dos bordes');
  assert.equal(f[0].n, 10, 'el borde es el 10 (9 bloques por lado + 1)');
  assert.equal(f[0].lleno, true, 'el borde es bloque');
  assert.equal(f[1].lleno, false, 'el interior esta vacio');
});

test('ejes: la forma sin bloques en la franja no numera nada', () => {
  const vacia = [[false, false], [false, false]];
  assert.deepEqual(Render.etiquetasEjes(vacia), []);
});
