// Etiquetas de los tramos dentro del dibujo (calculo puro, sin canvas).
const test = require('node:test');
const assert = require('node:assert/strict');
const Render = require('../../src/dibujo/render.js');
const Formas = require('../../src/nucleo/formas.js');

const capa = p => Formas.generar({ modo: 'relleno', grosor: 1, ...p }).capas[0];
const etiquetas = (p, distEjes = true) => Render.etiquetasTramosDentro(capa(p), distEjes);
const fila = (e, y) => e.filter(t => t.y === y).sort((a, b) => a.x - b.x);
const anchoFila = (g, y) => g[y].filter(Boolean).length;

test('NUM-06: circulo de 30: el total de 14 de la fila 2 son 6 por lado, sin contar los 2 bloques del centro', () => {
  const g = capa({ forma: 'circulo', w: 30, h: 30 });
  assert.equal(anchoFila(g, 1), 14, 'la fila tiene 14 bloques');
  const f = fila(etiquetas({ forma: 'circulo', w: 30, h: 30 }), 1);
  assert.deepEqual(f.map(t => t.n), [6, 6]);
  assert.equal(f[0].n + f[1].n + 2, 14, 'izquierda + derecha + franja = total');
});

test('NUM-06: en cada fila numerada, izquierda + derecha + franja central = bloques de la fila', () => {
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

test('NUM-07: los numeros de cada lado quedan alineados en dos columnas simetricas respecto a la franja', () => {
  const w = 30, h = 30;
  const e = etiquetas({ forma: 'circulo', w, h });
  const interiores = e.filter(t => t.y > 0 && t.y < h - 1);
  const izq = new Set(interiores.filter(t => t.x < w / 2).map(t => t.x));
  const der = new Set(interiores.filter(t => t.x > w / 2).map(t => t.x));
  assert.equal(izq.size, 1, 'una sola columna a la izquierda');
  assert.equal(der.size, 1, 'una sola columna a la derecha');
  assert.equal([...izq][0] + [...der][0], w, 'simetricas');
});

test('NUM-07: las filas de los extremos llevan la cifra centrada en cada lado', () => {
  const f = fila(etiquetas({ forma: 'circulo', w: 30, h: 30 }), 0);
  assert.deepEqual(f.map(t => t.n), [3, 3], 'un total de 8 son 3 por lado');
  assert.equal(f[0].x + f[1].x, 30, 'simetricas');
  assert.ok(f[0].x > 11 && f[0].x < 14, 'dentro de su parte, a la izquierda de la franja');
});

test('NUM-08: ningun numero cae sobre la franja ni sobre las filas centrales (son del eje)', () => {
  const w = 30, h = 30;
  const [cx0, cx1] = Render.centro(w), [cy0, cy1] = Render.centro(h);
  for (const t of etiquetas({ forma: 'circulo', w, h })) {
    assert.ok(t.y < cy0 || t.y > cy1, 'fuera de las filas centrales');
    assert.ok(t.x < cx0 || t.x > cx1 + 1, 'fuera de la franja central');
  }
});

test('NUM-06: con franja de 1 bloque (tamano impar) tampoco se cuenta el del centro', () => {
  const w = 31, g = capa({ forma: 'circulo', w, h: w });
  const f = fila(etiquetas({ forma: 'circulo', w, h: w }), 2);
  assert.equal(f.length, 2);
  assert.equal(f[0].n + f[1].n + 1, anchoFila(g, 2));
});

test('NUM-05: sin distancias de eje cada tramo lleva su total, centrado en el tramo', () => {
  const g = capa({ forma: 'circulo', w: 30, h: 30 });
  const f = fila(Render.etiquetasTramosDentro(g, false), 1);
  assert.deepEqual(f.map(t => t.n), [14]);
  assert.equal(f[0].x, (g[1].indexOf(true) + g[1].lastIndexOf(true) + 1) / 2);
});

test('NUM-09: un tramo estrecho que no llega a las columnas no se numera junto al eje', () => {
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

test('NUM-01: ejes: la cuenta empieza en 1 en la franja y llega hasta el bloque del borde (15 en un circulo de 30)', () => {
  const e = Render.etiquetasEjes(capa({ forma: 'circulo', w: 30, h: 30 }));
  // 14 bloques a cada lado de la franja de 2: franja = 1, el ultimo de cada lado = 15.
  assert.deepEqual(eje(e, 14), [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  const col = e.filter(t => t.x === 14 && (t.y < 14 || t.y > 15)).sort((a, b) => a.y - b.y).map(t => t.n);
  assert.deepEqual(col, [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
});

test('NUM-01: ejes: el maximo es el numero de bloques por lado + 1, tambien con franja de 1 bloque', () => {
  for (const w of [16, 20, 30, 31, 40]) {
    const g = capa({ forma: 'circulo', w, h: w });
    const [cx0, cx1] = Render.centro(w), banda = cx1 - cx0 + 1;
    const porLado = (w - banda) / 2;
    const max = Math.max(...Render.etiquetasEjes(g).map(t => t.n));
    assert.equal(max, porLado + 1, `circulo ${w}: ${porLado} bloques por lado`);
  }
});

test('NUM-02: ejes: cada celda se numera una sola vez (los dos ejes no se pisan en la franja)', () => {
  const e = Render.etiquetasEjes(capa({ forma: 'circulo', w: 30, h: 30 }));
  const vistas = new Set(e.map(t => `${t.x},${t.y}`));
  assert.equal(vistas.size, e.length);
});

test('NUM-03: ejes: en modo hueco tambien se numera el interior vacio, hasta el borde', () => {
  const g = capa({ forma: 'circulo', w: 20, h: 20, modo: 'hueco', grosor: 1 });
  const e = Render.etiquetasEjes(g);
  const f = e.filter(t => t.y === 9).sort((a, b) => a.x - b.x);
  assert.equal(f.length, g[9].lastIndexOf(true) - g[9].indexOf(true) + 1, 'todas las celdas entre los dos bordes');
  assert.equal(f[0].n, 10, 'el borde es el 10 (9 bloques por lado + 1)');
  assert.equal(f[0].lleno, true, 'el borde es bloque');
  assert.equal(f[1].lleno, false, 'el interior esta vacio');
});

test('NUM-04: ejes: la forma sin bloques en la franja no numera nada', () => {
  const vacia = [[false, false], [false, false]];
  assert.deepEqual(Render.etiquetasEjes(vacia), []);
});

// Zona sensible de las reglas: geometria de un lienzo de 16x16 con celdas de 26 px.
const GEO = { L: 80, T: 42, s: 26, w: 16, h: 16 };

test('MAR-14: la banda izquierda devuelve la fila, tambien en el primer y ultimo bloque', () => {
  assert.deepEqual(Render.zonaRegla(GEO, 10, GEO.T + 7 * GEO.s + 5), { eje: 'fila', i: 7 });
  assert.deepEqual(Render.zonaRegla(GEO, 10, GEO.T), { eje: 'fila', i: 0 });
  assert.deepEqual(Render.zonaRegla(GEO, GEO.L - 1, GEO.T + 16 * GEO.s - 1), { eje: 'fila', i: 15 });
});

test('MAR-15: la banda superior devuelve la columna, tambien en el primer y ultimo bloque', () => {
  assert.deepEqual(Render.zonaRegla(GEO, GEO.L + 7 * GEO.s + 5, 10), { eje: 'columna', i: 7 });
  assert.deepEqual(Render.zonaRegla(GEO, GEO.L, GEO.T - 1), { eje: 'columna', i: 0 });
  assert.deepEqual(Render.zonaRegla(GEO, GEO.L + 16 * GEO.s - 1, 1), { eje: 'columna', i: 15 });
});

test('MAR-18: la esquina, el dibujo y los margenes derecho e inferior no son regla', () => {
  assert.equal(Render.zonaRegla(GEO, 10, 10), null, 'esquina');
  assert.equal(Render.zonaRegla(GEO, GEO.L + 100, GEO.T + 100), null, 'dibujo');
  assert.equal(Render.zonaRegla(GEO, GEO.L + GEO.w * GEO.s, GEO.T + 10), null, 'margen derecho');
  assert.equal(Render.zonaRegla(GEO, GEO.L + 10, GEO.T + GEO.h * GEO.s), null, 'margen inferior');
  assert.equal(Render.zonaRegla(GEO, -1, GEO.T + 10), null, 'fuera del lienzo');
  assert.equal(Render.zonaRegla(GEO, 10, GEO.T + GEO.h * GEO.s), null, 'banda izquierda por debajo');
  assert.equal(Render.zonaRegla(null, 10, 10), null, 'sin geometria');
});

test('MAR-14: con la regla relativa (margen mas ancho) la banda sigue siendo la fila', () => {
  const ancho = { L: 118, T: 62, s: 20, w: 30, h: 30 };
  assert.deepEqual(Render.zonaRegla(ancho, 5, 62 + 29 * 20 + 1), { eje: 'fila', i: 29 });
  assert.deepEqual(Render.zonaRegla(ancho, 118 + 29 * 20 + 1, 5), { eje: 'columna', i: 29 });
  assert.equal(Render.zonaRegla(ancho, 5, 5), null, 'esquina con margen ancho');
});

// --- regla relativa al centro -------------------------------------------------------------
const cuentaRegla = n => Array.from({ length: n }, (_, i) => Render.reglaRelativa(i, n));

test('NUM-10: la regla relativa cuenta como los ejes, sin signo ni C (franja de 2)', () => {
  assert.deepEqual(cuentaRegla(16), [8, 7, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(cuentaRegla(30)[0], 15, 'circulo de 30: 14 bloques por lado + 1');
  assert.deepEqual(cuentaRegla(2), [1, 1]);
});

test('NUM-10: con franja de 1 bloque el bloque central vale 1 y a cada lado se cuenta 2…', () => {
  assert.deepEqual(cuentaRegla(15), [8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(cuentaRegla(1), [1]);
  assert.deepEqual(cuentaRegla(3), [2, 1, 2]);
});

test('NUM-10: la regla relativa coincide con los numeros de los ejes y nunca es negativa', () => {
  for (const n of [1, 2, 7, 16, 30, 31]) {
    const g = capa({ forma: 'rectangulo', w: n, h: n });
    const [cx0] = Render.centro(n), fila = cx0;
    const ejes = Render.etiquetasEjes(g).filter(t => t.y === fila).sort((a, b) => a.x - b.x).map(t => t.n);
    assert.deepEqual(cuentaRegla(n), ejes, `rectangulo ${n}: regla = eje`);
    assert.ok(cuentaRegla(n).every(k => k >= 1), 'sin ceros ni negativos');
  }
});

test('NUM-10: ya no se exportan el indice con signo ni la etiqueta C', () => {
  assert.equal(Render.relativo, undefined);
  assert.equal(Render.etiquetaRel, undefined);
});

const visibles = (n, paso) => Render.cifrasReglaRelativa(n, paso).map(c => c.i);

test('NUM-13: con todo el zoom (paso 1) se ven todas las cifras', () => {
  assert.equal(visibles(16, 1).length, 16);
  assert.equal(visibles(15, 1).length, 15);
});

test('NUM-13: con paso mayor se ve el 1 de la franja una sola vez y los multiplos del paso', () => {
  const c = Render.cifrasReglaRelativa(16, 2);
  assert.equal(c.filter(x => x.n === 1).length, 1, 'la franja de 2 se muestra una vez');
  assert.equal(c.find(x => x.n === 1).i, Render.centro(16)[1], 'en el ultimo bloque de la franja');
  assert.ok(c.every(x => x.n === 1 || x.n % 2 === 0), 'el resto, multiplos del paso');
  assert.deepEqual(c.map(x => x.n), [8, 6, 4, 2, 1, 2, 4, 6, 8]);
});

test('NUM-13: con franja de 1 y paso 5 se ven el centro y los multiplos de 5', () => {
  assert.deepEqual(Render.cifrasReglaRelativa(15, 5).map(x => x.n), [5, 1, 5]);
});

test('NUM-13: con paso mayor que 1 solo pueden ir contiguas el 1 y el 2 (cifras sueltas, como en la regla absoluta)', () => {
  for (const n of [14, 15, 16, 30, 31, 60]) for (const paso of [2, 5, 10]) {
    const c = Render.cifrasReglaRelativa(n, paso);
    for (let k = 1; k < c.length; k++) {
      if (c[k].i - c[k - 1].i === 1) {
        assert.ok(Math.max(c[k].n, c[k - 1].n) <= 2 && Math.min(c[k].n, c[k - 1].n) === 1, `n=${n} paso=${paso}: ${c[k - 1].n} y ${c[k].n} pegadas`);
      }
    }
    assert.equal(c.filter(x => x.n === 1).length, 1, `n=${n} paso=${paso}: la franja una sola vez`);
  }
});

test('NUM-14: el texto de posicion usa flechas y la cuenta de la regla, sin signo', () => {
  // Circulo de 30: franja de 2 (indices 14 y 15), 14 bloques por lado.
  assert.equal(Render.textoRelativo(2, 30, 'x'), '← 13', 'columna 3');
  assert.equal(Render.textoRelativo(4, 30, 'y'), '↑ 11', 'fila 5');
  assert.equal(Render.textoRelativo(29, 30, 'x'), '→ 15');
  assert.equal(Render.textoRelativo(25, 30, 'y'), '↓ 11');
  assert.equal(Render.textoRelativo(0, 30, 'x'), '← 15', 'el bloque del borde cuenta');
});

test('NUM-14: en la franja central el texto es solo 1, sin flecha, y con franja de 1 tambien', () => {
  assert.equal(Render.textoRelativo(14, 30, 'x'), '1');
  assert.equal(Render.textoRelativo(15, 30, 'y'), '1');
  assert.equal(Render.textoRelativo(7, 15, 'x'), '1', 'tamaño impar: sin C');
  assert.equal(Render.textoRelativo(6, 15, 'y'), '↑ 2');
});

test('NUM-14: ninguna posicion lleva un signo menos', () => {
  for (const n of [1, 2, 15, 16, 30]) for (let i = 0; i < n; i++) {
    for (const eje of ['x', 'y']) assert.ok(!/[-−]/.test(Render.textoRelativo(i, n, eje)), `n=${n} i=${i}`);
  }
});

// --- reglas fijas al desplazar: el origen visible { x0, y0 } desplaza las bandas -----------------
// Con el dibujo desplazado, las reglas fijas ocupan [x0, x0+L) y [y0, y0+T) en coordenadas del dibujo.
const ORIGEN = { x0: 100, y0: 60 };

test('NUM-15: sin desplazamiento (origen 0 u omitido) la geometria es la de siempre', () => {
  const cero = { x0: 0, y0: 0 };
  for (const [px, py] of [[10, GEO.T + 40], [GEO.L + 40, 10], [GEO.L + 40, GEO.T + 40], [10, 10]]) {
    assert.deepEqual(Render.zonaRegla(GEO, px, py, cero), Render.zonaRegla(GEO, px, py));
    assert.deepEqual(Render.zonaCelda(GEO, px, py, cero), Render.zonaCelda(GEO, px, py));
  }
  assert.deepEqual(Render.zonaCelda(GEO, GEO.L, GEO.T), { x: 0, y: 0 });
  assert.deepEqual(Render.zonaCelda(GEO, GEO.L + 15 * GEO.s + 1, GEO.T + 15 * GEO.s + 1), { x: 15, y: 15 });
  assert.equal(Render.zonaCelda(GEO, GEO.L - 1, GEO.T + 10), null, 'sobre la regla izquierda');
  assert.equal(Render.zonaCelda(GEO, GEO.L + 16 * GEO.s, GEO.T + 10), null, 'fuera del dibujo');
});

test('MAR-14: la regla izquierda fija desplazada da la fila de ese punto del dibujo', () => {
  const py = ORIGEN.y0 + GEO.T + 5 * GEO.s + 3;   // por debajo de la regla superior fija
  assert.deepEqual(Render.zonaRegla(GEO, ORIGEN.x0 + 4, py, ORIGEN), { eje: 'fila', i: Math.floor((py - GEO.T) / GEO.s) });
  assert.equal(Render.zonaRegla(GEO, ORIGEN.x0 + GEO.L - 1, py, ORIGEN).eje, 'fila', 'hasta el final de la banda');
  assert.equal(Render.zonaRegla(GEO, ORIGEN.x0 + GEO.L, py, ORIGEN), null, 'a partir de ahi es dibujo');
  assert.equal(Render.zonaRegla(GEO, ORIGEN.x0 - 1, py, ORIGEN), null, 'a la izquierda de la banda fija ya no hay regla');
});

test('MAR-15: la regla superior fija desplazada da la columna de ese punto del dibujo', () => {
  const px = ORIGEN.x0 + GEO.L + 4 * GEO.s + 3;   // a la derecha de la regla izquierda fija
  assert.deepEqual(Render.zonaRegla(GEO, px, ORIGEN.y0 + 5, ORIGEN), { eje: 'columna', i: Math.floor((px - GEO.L) / GEO.s) });
  assert.equal(Render.zonaRegla(GEO, px, ORIGEN.y0 + GEO.T - 1, ORIGEN).eje, 'columna');
  assert.equal(Render.zonaRegla(GEO, px, ORIGEN.y0 + GEO.T, ORIGEN), null, 'a partir de ahi es dibujo');
  assert.equal(Render.zonaRegla(GEO, px, ORIGEN.y0 - 1, ORIGEN), null);
});

test('MAR-14, MAR-15: la esquina entre las dos reglas fijas no es regla ni celda', () => {
  const [px, py] = [ORIGEN.x0 + GEO.L - 1, ORIGEN.y0 + GEO.T - 1];
  assert.equal(Render.zonaRegla(GEO, px, py, ORIGEN), null);
  assert.equal(Render.zonaCelda(GEO, px, py, ORIGEN), null);
});

test('MAR-14, MAR-15: una fila o columna oculta bajo la otra regla fija no se puede tocar', () => {
  // Bajo la regla superior fija ([y0, y0+T)) la banda izquierda no devuelve ninguna fila...
  assert.equal(Render.zonaRegla(GEO, ORIGEN.x0 + 4, ORIGEN.y0 + GEO.T - 1, ORIGEN), null);
  // ...y bajo la izquierda ([x0, x0+L)) la superior no devuelve ninguna columna.
  assert.equal(Render.zonaRegla(GEO, ORIGEN.x0 + GEO.L - 1, ORIGEN.y0 + 4, ORIGEN), null);
});

test('NUM-15: bajo una regla fija no hay celda, y fuera de ellas la celda es la de ese punto', () => {
  assert.equal(Render.zonaCelda(GEO, ORIGEN.x0 + GEO.L - 1, ORIGEN.y0 + GEO.T + 30, ORIGEN), null, 'bajo la izquierda');
  assert.equal(Render.zonaCelda(GEO, ORIGEN.x0 + GEO.L + 30, ORIGEN.y0 + GEO.T - 1, ORIGEN), null, 'bajo la superior');
  const px = ORIGEN.x0 + GEO.L + 30, py = ORIGEN.y0 + GEO.T + 30;
  assert.deepEqual(Render.zonaCelda(GEO, px, py, ORIGEN), { x: Math.floor((px - GEO.L) / GEO.s), y: Math.floor((py - GEO.T) / GEO.s) });
});
