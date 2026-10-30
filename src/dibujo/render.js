// Dibujo de una capa en un <canvas>: medidas y una lista de capas de dibujo encadenables.
// Anadir una superposicion nueva = Render.registrar(nombre, pintar, { despuesDe: 'otra' }),
// sin tocar las capas existentes. Cada capa recibe (ctx, medidas, opciones, paleta).
const Render = (() => {
  // Margenes del dibujo (px). abs/rel: columnas de la regla izquierda; top*: filas de la regla superior.
  const LAYOUT = {
    abs: 34, rel: 38, sep: 8,
    topAbs: 22, topRel: 20,
    tramosSep: 10, minR: 10, minB: 8,
    cabLinea: 20, cabPad: 14,
    celdaTexto: 16,           // por debajo de este tamano de celda no se escribe dentro
  };
  const FUENTE = '"JetBrains Mono", ui-monospace, Consolas, monospace';

  let PAL = null;
  function paleta() {
    if (PAL) return PAL;
    const css = getComputedStyle(document.documentElement);
    const v = n => css.getPropertyValue(n).trim();
    PAL = {
      lienzo: v('--lienzo'), vacia: v('--vacia'), bloque: v('--bloque'), hecho: v('--hecho'),
      banda: v('--centro-banda'), oro: v('--oro'), regla: v('--regla'), tramo: v('--tramo'),
      sobreBloque: v('--sobre-bloque'), rejilla: v('--rejilla'), rejilla5: v('--rejilla-5'), texto: v('--fg'),
    };
    return PAL;
  }

  function tramos(arr) {
    const r = []; let ini = -1;
    for (let i = 0; i <= arr.length; i++) {
      if (arr[i]) { if (ini < 0) ini = i; }
      else if (ini >= 0) { r.push({ s: ini, l: i - ini }); ini = -1; }
    }
    return r;
  }

  // Indice relativo al centro: con tamano par no existe el 0 (centro de 2 bloques: -1 | 1).
  function relativo(i, n) {
    if (n % 2) return i - (n - 1) / 2;
    return i < n / 2 ? -(n / 2 - i) : i - n / 2 + 1;
  }
  const etiquetaRel = k => (k === 0 ? 'C' : String(k));
  const centro = n => [Math.floor((n - 1) / 2), Math.floor(n / 2)];
  // Bloques que separan i de la franja central [a, b] (0 dentro de la franja).
  const distFranja = (i, a, b) => (i < a ? a - i : i > b ? i - b : 0);

  const txtFila = f => (f.length ? f.map(r => r.l).join(' · ') : '—');

  // Medidas del dibujo para un tamano de celda s. Con poco zoom se ocultan los
  // tramos que ya no caben (filas mas bajas que el texto, columnas mas estrechas que el numero).
  function medidas(ctx, g, s, op, cab) {
    const h = g.length, w = g[0].length;
    const fh = Math.max(11, Math.min(14, Math.round(s * 0.5)));
    const fuente = `600 ${fh}px ${FUENTE}`;
    ctx.font = fuente;
    const filas = g.map(f => tramos(f));
    const cols = Array.from({ length: w }, (_, x) => tramos(g.map(f => f[x])));
    const anchoNum = ctx.measureText('000'.slice(0, String(Math.max(w, h)).length)).width;
    const tramosFilas = op.tramos && s >= fh;
    const tramosCols = op.tramos && s >= anchoNum + 2;

    const H0 = cab.length ? cab.length * LAYOUT.cabLinea + LAYOUT.cabPad : 0;
    const L = op.rel ? LAYOUT.abs + LAYOUT.rel + LAYOUT.sep : LAYOUT.abs + LAYOUT.sep;
    const T = H0 + (op.rel ? LAYOUT.topAbs + LAYOUT.topRel : LAYOUT.topAbs);
    const R = tramosFilas ? LAYOUT.tramosSep * 2 + Math.max(...filas.map(f => ctx.measureText(txtFila(f)).width)) : LAYOUT.minR;
    const B = tramosCols ? LAYOUT.tramosSep + Math.max(1, ...cols.map(c => c.length)) * (fh + 2) : LAYOUT.minB;
    let W = Math.ceil(L + w * s + R);
    const H = Math.ceil(T + h * s + B);
    if (cab.length) { ctx.font = `600 14px ${FUENTE}`; W = Math.max(W, ...cab.map(t => Math.ceil(ctx.measureText(t).width) + 24)); }
    // Cada cuantas celdas se numera la regla para que las etiquetas no se pisen.
    const minSep = Math.max(fh + 4, anchoNum + (op.rel ? 14 : 8));
    const paso = [1, 2, 5, 10, 20, 25, 50, 100].find(p => p * s >= minSep) || 100;
    return { w, h, s, fh, fuente, filas, cols, tramosFilas, tramosCols, H0, L, T, W, H, paso,
      ocultos: op.tramos && (!tramosFilas || !tramosCols) || s < LAYOUT.celdaTexto };
  }

  let ctxMedir = null;
  /** Tamano en px que tendria el dibujo con celdas de s px (sin dibujar). */
  function medir(g, s, op) {
    ctxMedir = ctxMedir || document.createElement('canvas').getContext('2d');
    const m = medidas(ctxMedir, g, s, op, []);
    return { W: m.W, H: m.H };
  }

  // Area maxima del lienzo (px reales). Por encima, se reduce la densidad de pixeles.
  const MAX_AREA = 16e6;

  // --- capas de dibujo -----------------------------------------------------------------
  // Cada capa pinta sobre el canvas ya preparado (tamano, transform y fondo).
  const CAPAS = [];

  function registrar(nombre, pintar, { despuesDe } = {}) {
    if (typeof pintar !== 'function') throw new Error(`La capa ${nombre} no trae funcion de dibujo`);
    if (CAPAS.some(c => c.nombre === nombre)) throw new Error(`Capa duplicada: ${nombre}`);
    const capa = { nombre, pintar };
    if (despuesDe === undefined) {
      CAPAS.push(capa);
    } else {
      const i = CAPAS.findIndex(c => c.nombre === despuesDe);
      if (i < 0) throw new Error(`No existe la capa ${despuesDe}`);
      CAPAS.splice(i + 1, 0, capa);
    }
    return capa;
  }

  const franjas = m => [...centro(m.w), ...centro(m.h)];   // cx0, cx1, cy0, cy1

  const capaCeldas = (ctx, m, o, P) => {
    const { g, capa, hechos } = o;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      ctx.fillStyle = g[y][x] ? (hechos.has(`${capa},${x},${y}`) ? P.hecho : P.bloque) : P.vacia;
      ctx.fillRect(m.L + x * m.s, m.T + y * m.s, m.s, m.s);
    }
  };

  const capaBandas = (ctx, m, o, P) => {
    const [cx0, cx1, cy0, cy1] = franjas(m);
    ctx.fillStyle = P.banda;
    ctx.fillRect(m.L + cx0 * m.s, m.T, (cx1 - cx0 + 1) * m.s, m.h * m.s);
    ctx.fillRect(m.L, m.T + cy0 * m.s, m.w * m.s, (cy1 - cy0 + 1) * m.s);
  };

  // Marca no cromatica de "construido": esquina superior derecha.
  const capaMarcas = (ctx, m, o, P) => {
    const s = m.s, e = Math.max(Math.min(s, 4), s * 0.35);
    ctx.fillStyle = P.texto;
    for (const k of o.hechos) {
      const [c, x, y] = k.split(',').map(Number);
      if (c !== o.capa) continue;
      const px = m.L + (x + 1) * s, py = m.T + y * s;
      ctx.beginPath(); ctx.moveTo(px - e, py); ctx.lineTo(px, py); ctx.lineTo(px, py + e); ctx.closePath(); ctx.fill();
    }
  };

  // Cuadricula (mas marcada cada 5; con celdas muy pequenas solo la de 5).
  const capaRejilla = (ctx, m, o, P) => {
    const { L, T, s, w, h } = m;
    ctx.lineWidth = 1;
    const fina = s >= 6;
    for (let i = 0; i <= w; i++) {
      if (i % 5 && !fina) continue;
      ctx.strokeStyle = i % 5 === 0 ? P.rejilla5 : P.rejilla;
      ctx.beginPath(); ctx.moveTo(L + i * s + .5, T); ctx.lineTo(L + i * s + .5, T + h * s); ctx.stroke();
    }
    for (let i = 0; i <= h; i++) {
      if (i % 5 && !fina) continue;
      ctx.strokeStyle = i % 5 === 0 ? P.rejilla5 : P.rejilla;
      ctx.beginPath(); ctx.moveTo(L, T + i * s + .5); ctx.lineTo(L + w * s, T + i * s + .5); ctx.stroke();
    }
  };

  const capaCentro = (ctx, m, o, P) => {
    const [cx0, cx1, cy0, cy1] = franjas(m);
    ctx.strokeStyle = P.oro; ctx.lineWidth = 2;
    ctx.strokeRect(m.L + cx0 * m.s + 1, m.T + cy0 * m.s + 1, (cx1 - cx0 + 1) * m.s - 2, (cy1 - cy0 + 1) * m.s - 2);
  };

  // Reglas: numeracion 1..N y, opcionalmente, relativa al centro.
  const capaReglas = (ctx, m, o, P) => {
    const { L, T, s, w, h, H0, paso, fuente } = m;
    ctx.font = fuente;
    const verAbs = n => n === 1 || n % paso === 0;
    // con paso > 1 el -1 y el 1 quedan pegados: se marca solo el 1 (o la C si es impar)
    const verRel = k => paso === 1 || k === 0 || k === 1 || Math.abs(k) % paso === 0;
    ctx.textAlign = 'center';
    for (let x = 0; x < w; x++) {
      const px = L + x * s + s / 2;
      if (verAbs(x + 1)) {
        ctx.fillStyle = P.regla;
        ctx.fillText(String(x + 1), px, H0 + LAYOUT.topAbs / 2);
      }
      if (o.op.rel) {
        const k = relativo(x, w);
        if (verRel(k)) { ctx.fillStyle = P.oro; ctx.fillText(etiquetaRel(k), px, H0 + LAYOUT.topAbs + LAYOUT.topRel / 2); }
      }
    }
    ctx.textAlign = 'right';
    for (let y = 0; y < h; y++) {
      const py = T + y * s + s / 2;
      if (verAbs(y + 1)) { ctx.fillStyle = P.regla; ctx.fillText(String(y + 1), LAYOUT.abs, py); }
      if (o.op.rel) {
        const k = relativo(y, h);
        if (verRel(k)) { ctx.fillStyle = P.oro; ctx.fillText(etiquetaRel(k), L - LAYOUT.sep, py); }
      }
    }
  };

  // Tramos por fila (derecha) y por columna (abajo).
  const capaTramos = (ctx, m, o, P) => {
    const { L, T, s, w, h, fh, filas, cols, fuente } = m;
    ctx.font = fuente;
    ctx.fillStyle = P.tramo;
    if (m.tramosFilas) {
      ctx.textAlign = 'left';
      filas.forEach((f, y) => ctx.fillText(txtFila(f), L + w * s + LAYOUT.tramosSep, T + y * s + s / 2));
    }
    if (m.tramosCols) {
      ctx.textAlign = 'center';
      cols.forEach((c, x) => c.forEach((r, i) =>
        ctx.fillText(String(r.l), L + x * s + s / 2, T + h * s + LAYOUT.tramosSep / 2 + fh / 2 + 2 + i * (fh + 2))));
    }
  };

  // Etiquetas de los tramos dentro del dibujo: [{ x, y, n }], con x el centro en celdas.
  // Sin distancias de eje cada tramo lleva su total. Con ellas, un tramo que cruza la franja
  // central no lleva su total sino lo que hay a cada lado, sin contar los bloques de la franja
  // (un total de 14 con franja de 2 son 6 a la izquierda y 6 a la derecha). Esos numeros van en
  // dos columnas fijas, simetricas respecto a la franja, para que no se pisen con los del eje:
  // la de la izquierda queda centrada entre el eje y el inicio del tramo mas corto con sitio. Un
  // tramo que no llega a esas columnas no se numera dentro en las filas interiores (se
  // confundirian con los numeros del eje); en las filas de los extremos cada lado lleva su cifra
  // centrada en su parte.
  function etiquetasTramosDentro(g, distEjes) {
    const h = g.length, w = g[0].length;
    const filas = g.map(f => tramos(f));
    const etiquetas = [];
    const poner = (x, y, n) => { if (n > 0) etiquetas.push({ x, y, n }); };
    if (!distEjes) {
      filas.forEach((f, y) => f.forEach(r => poner(r.s + r.l / 2, y, r.l)));
      return etiquetas;
    }

    const [cx0, cx1] = centro(w), [cy0, cy1] = centro(h);
    const enEjeY = y => y >= cy0 && y <= cy1;
    const colCentro = g.map(f => f[cx0]);
    const ya = colCentro.indexOf(true), yb = colCentro.lastIndexOf(true);
    const interior = y => y > ya && y < yb;   // filas entre los extremos de la columna central
    const cruzaEje = r => r.s <= cx1 && r.s + r.l > cx0;

    let maxIni = -1;
    filas.forEach((f, y) => {
      if (interior(y) && !enEjeY(y)) f.forEach(r => { if (cruzaEje(r) && r.s <= cx0 - 3) maxIni = Math.max(maxIni, r.s); });
    });
    const colIzq = maxIni < 0 ? -1 : Math.floor((maxIni + cx0 - 1) / 2);
    const colDer = colIzq < 0 ? -1 : cx1 + (cx0 - colIzq);   // espejo de la izquierda

    filas.forEach((f, y) => {
      if (enEjeY(y)) return;   // las filas centrales solo llevan los numeros del eje
      f.forEach(r => {
        if (!cruzaEje(r)) { poner(r.s + r.l / 2, y, r.l); return; }
        const fin = r.s + r.l - 1;
        const izq = Math.max(0, cx0 - r.s), der = Math.max(0, fin - cx1);
        const llegaIzq = colIzq >= 0 && r.s <= colIzq, llegaDer = colIzq >= 0 && fin >= colDer;
        if (llegaIzq || llegaDer) {
          if (llegaIzq) poner(colIzq + 0.5, y, izq);
          if (llegaDer) poner(colDer + 0.5, y, der);
        } else if (!interior(y)) {
          // Fila del extremo: un lado de un solo bloque queda pegado al numero de eje de la franja
          // y no se numera.
          if (izq > 1) poner((r.s + cx0) / 2, y, izq);
          if (der > 1) poner((cx1 + 1 + fin + 1) / 2, y, der);
        }
      });
    });
    return etiquetas;
  }

  // Tramos dentro del dibujo, sin pisar las distancias de los ejes.
  const capaTramosDentro = (ctx, m, o, P) => {
    if (!o.op.tramosDentro || m.s < LAYOUT.celdaTexto) return;
    const { L, T, s, fuente } = m;
    ctx.font = fuente; ctx.fillStyle = P.sobreBloque; ctx.textAlign = 'center';
    for (const e of etiquetasTramosDentro(o.g, o.op.distEjes)) {
      ctx.fillText(String(e.n), L + e.x * s, T + e.y * s + s / 2);
    }
  };

  // Numeros de los ejes: [{ x, y, n, lleno }]. n cuenta desde la franja central (1) hacia fuera
  // hasta el bloque del borde de la forma, incluido: con 14 bloques a cada lado de una franja de 2
  // el ultimo es el 15. En modo hueco tambien se numera el interior vacio (lleno = false).
  function etiquetasEjes(g) {
    const h = g.length, w = g[0].length;
    const [cx0, cx1] = centro(w), [cy0, cy1] = centro(h);
    const etiquetas = [];
    for (let y = cy0; y <= cy1; y++) {
      const a = g[y].indexOf(true), b = g[y].lastIndexOf(true);
      for (let x = a; a >= 0 && x <= b; x++) etiquetas.push({ x, y, n: distFranja(x, cx0, cx1) + 1, lleno: g[y][x] });
    }
    for (let x = cx0; x <= cx1; x++) {
      const col = g.map(f => f[x]);
      const a = col.indexOf(true), b = col.lastIndexOf(true);
      for (let y = a; a >= 0 && y <= b; y++) {
        if (y < cy0 || y > cy1) etiquetas.push({ x, y, n: distFranja(y, cy0, cy1) + 1, lleno: g[y][x] });
      }
    }
    return etiquetas;
  }

  // Distancia sobre los ejes centrales.
  const capaDistEjes = (ctx, m, o, P) => {
    if (!o.op.distEjes || m.s < LAYOUT.celdaTexto) return;
    const { L, T, s, fuente } = m;
    ctx.font = fuente; ctx.textAlign = 'center';
    for (const e of etiquetasEjes(o.g)) {
      ctx.fillStyle = e.lleno ? P.sobreBloque : P.regla;
      ctx.fillText(String(e.n), L + e.x * s + s / 2, T + e.y * s + s / 2);
    }
  };

  const capaCursor = (ctx, m, o, P) => {
    if (!o.cursor) return;
    ctx.save();
    ctx.strokeStyle = P.texto; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
    ctx.strokeRect(m.L + o.cursor.x * m.s + 1, m.T + o.cursor.y * m.s + 1, m.s - 2, m.s - 2);
    ctx.restore();
  };

  registrar('celdas', capaCeldas);
  registrar('bandas', capaBandas);
  registrar('marcasHechas', capaMarcas);
  registrar('rejilla', capaRejilla);
  registrar('centro', capaCentro);
  registrar('reglas', capaReglas);
  registrar('tramos', capaTramos);
  registrar('tramosDentro', capaTramosDentro);
  registrar('distEjes', capaDistEjes);
  registrar('cursor', capaCursor);

  /**
   * @param {HTMLCanvasElement} cv
   * @param {{ g: boolean[][], capa: number, hechos: Set<string>, s: number,
   *           op: {rel:boolean, tramos:boolean, tramosDentro:boolean, distEjes:boolean},
   *           cursor?: {x:number,y:number}|null, cabecera?: string[], dpr?: number }} o
   * @returns {{L:number, T:number, s:number, w:number, h:number, ocultos:boolean}}
   */
  function dibujar(cv, o) {
    const { g, s, op } = o;
    const P = paleta();
    const ctx = cv.getContext('2d');
    const cab = o.cabecera || [];
    const m = medidas(ctx, g, s, op, cab);
    const { W, H, L, T } = m;
    const dpr = Math.min(o.dpr || 1, Math.sqrt(MAX_AREA / (W * H)));

    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = P.lienzo; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'middle';

    if (cab.length) {
      ctx.textAlign = 'left';
      cab.forEach((t, i) => {
        ctx.font = i === 0 ? `600 14px ${FUENTE}` : `13px ${FUENTE}`;
        ctx.fillStyle = i === 0 ? P.texto : P.regla;
        ctx.fillText(t, 12, LAYOUT.cabPad / 2 + i * LAYOUT.cabLinea + LAYOUT.cabLinea / 2);
      });
    }

    for (const capa of CAPAS) capa.pintar(ctx, m, o, P);

    return { L, T, s: m.s, w: m.w, h: m.h, ocultos: m.ocultos };
  }

  return {
    dibujar, medir, relativo, etiquetaRel, centro, registrar, etiquetasTramosDentro, etiquetasEjes,
  };
})();
if (typeof module !== 'undefined') module.exports = Render; else globalThis.Render = Render;
