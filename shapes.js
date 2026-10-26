// Generadores de formas. Puro: sin DOM, se puede usar desde Node (tests).
//
// generar(params) -> { capas, totales, grosor, grosorMax, grosorRecortado }
//   capas[c][y][x] = true/false. 2D = una sola capa. Esfera/Cupula = una capa por nivel (de abajo arriba).
//
/**
 * @typedef {'circulo'|'rectangulo'|'triangulo'|'rombo'|'hexagono'|'esfera'} Forma
 * @typedef {{
 *   forma: Forma, w: number, h: number,
 *   modo: 'relleno'|'hueco', grosor: number,
 *   orient: 'plano'|'punta', esfera: 'esfera'|'cupula'
 * }} Parametros
 */
const Formas = (() => {
  const FORMAS = ['circulo', 'rectangulo', 'triangulo', 'rombo', 'hexagono', 'esfera'];
  const MAX_2D = 200, MAX_3D = 100, MAX_GROSOR = 50;

  function dentroPoligono(px, py, pts) {
    let dentro = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) dentro = !dentro;
    }
    return dentro;
  }

  // Prueba de pertenencia sobre el centro de cada celda (x+0.5, y+0.5).
  function prueba2D(p) {
    const w = p.w, h = p.h, cx = w / 2, cy = h / 2, rx = w / 2, ry = h / 2;
    switch (p.forma) {
      case 'circulo': return (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
      case 'rectangulo': return () => true;
      case 'rombo': return (x, y) => Math.abs(x - cx) / rx + Math.abs(y - cy) / ry <= 1;
      case 'triangulo': {
        const pts = [[cx, 0], [w, h], [0, h]];
        return (x, y) => dentroPoligono(x, y, pts);
      }
      case 'hexagono': {
        const pts = p.orient === 'punta'
          ? [[cx, cy - ry], [cx + rx, cy - ry / 2], [cx + rx, cy + ry / 2], [cx, cy + ry], [cx - rx, cy + ry / 2], [cx - rx, cy - ry / 2]]
          : [[cx + rx, cy], [cx + rx / 2, cy + ry], [cx - rx / 2, cy + ry], [cx - rx, cy], [cx - rx / 2, cy - ry], [cx + rx / 2, cy - ry]];
        return (x, y) => dentroPoligono(x, y, pts);
      }
    }
  }

  // Distancia (en pasos ortogonales) de cada celda llena al exterior: 1 = borde.
  // Equivale a erosionar repetidamente con vecinos 4 (2D) o 6 (3D), pero en una sola pasada.
  // El volumen plano se indexa i = x + w * (y + h * z); con d = 1 es 2D.
  function distancias(lleno, w, h, d) {
    const n = w * h * d, wh = w * h;
    const dist = new Int32Array(n), cola = new Int32Array(n);
    let fin = 0;
    for (let i = 0; i < n; i++) {
      if (!lleno[i]) continue;
      const x = i % w, y = ((i / w) | 0) % h, z = (i / wh) | 0;
      const borde = x === 0 || x === w - 1 || y === 0 || y === h - 1 ||
        !lleno[i - 1] || !lleno[i + 1] || !lleno[i - w] || !lleno[i + w] ||
        (d > 1 && (z === 0 || z === d - 1 || !lleno[i - wh] || !lleno[i + wh]));
      if (borde) { dist[i] = 1; cola[fin++] = i; }
    }
    let max = 0;
    for (let ini = 0; ini < fin; ini++) {
      const i = cola[ini], v = dist[i] + 1;
      if (v - 1 > max) max = v - 1;
      const x = i % w, y = ((i / w) | 0) % h, z = (i / wh) | 0;
      const visitar = j => { if (lleno[j] && !dist[j]) { dist[j] = v; cola[fin++] = j; } };
      if (x > 0) visitar(i - 1);
      if (x < w - 1) visitar(i + 1);
      if (y > 0) visitar(i - w);
      if (y < h - 1) visitar(i + w);
      if (d > 1) { if (z > 0) visitar(i - wh); if (z < d - 1) visitar(i + wh); }
    }
    return { dist, max };
  }

  // Grosor maximo que aun deja interior vacio; mas que eso produce el solido.
  const grosorMaximoDe = maxDist => Math.max(1, maxDist - 1);

  function aCapas(lleno, w, h, d) {
    const capas = [], totales = [];
    for (let z = 0; z < d; z++) {
      let t = 0;
      const g = [];
      for (let y = 0; y < h; y++) {
        const fila = new Array(w);
        for (let x = 0; x < w; x++) {
          const v = lleno[x + w * (y + h * z)] === 1;
          fila[x] = v; if (v) t++;
        }
        g.push(fila);
      }
      capas.push(g); totales.push(t);
    }
    return { capas, totales };
  }

  function entero(v, nombre, min, max) {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error(`${nombre} no es un número`);
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  /** @param {Parametros} p */
  function generar(p) {
    if (!p || !FORMAS.includes(p.forma)) throw new Error('Forma desconocida: ' + (p && p.forma));
    const es3D = p.forma === 'esfera';
    const w = entero(p.w, 'Ancho', 1, es3D ? MAX_3D : MAX_2D);
    const h = es3D ? w : entero(p.h, 'Alto', 1, MAX_2D);
    const d = es3D ? w : 1;
    const hueco = p.modo === 'hueco';
    let grosor = hueco ? entero(p.grosor == null ? 1 : p.grosor, 'Grosor', 1, MAX_GROSOR) : 1;

    // Volumen plano: en 3D, z es el nivel vertical (capa) y y la profundidad.
    const lleno = new Uint8Array(w * h * d);
    if (es3D) {
      const c = w / 2, r2 = c * c;
      for (let z = 0; z < d; z++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if ((x + 0.5 - c) ** 2 + (y + 0.5 - c) ** 2 + (z + 0.5 - c) ** 2 <= r2) lleno[x + w * (y + h * z)] = 1;
      }
    } else {
      const dentro = prueba2D({ ...p, w, h });
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (dentro(x + 0.5, y + 0.5)) lleno[x + w * y] = 1;
      }
    }

    let grosorMax = null, grosorRecortado = false;
    if (hueco) {
      const { dist, max } = distancias(lleno, w, h, d);
      grosorMax = grosorMaximoDe(max);
      if (grosor > grosorMax) { grosor = grosorMax; grosorRecortado = true; }
      for (let i = 0; i < lleno.length; i++) if (lleno[i] && dist[i] > grosor) lleno[i] = 0;
    }

    let { capas, totales } = aCapas(lleno, w, h, d);
    if (es3D && p.esfera === 'cupula') {
      const desde = Math.floor(d / 2);
      capas = capas.slice(desde); totales = totales.slice(desde);
    }
    return { capas, totales, grosor, grosorMax, grosorRecortado };
  }

  const contar = g => g.reduce((a, f) => a + f.filter(Boolean).length, 0);

  return { generar, contar, FORMAS, MAX_2D, MAX_3D, MAX_GROSOR };
})();
if (typeof module !== 'undefined') module.exports = Formas;
