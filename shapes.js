// Generadores de formas. Puro: sin DOM, se puede usar desde Node (tests).
//
// Registro abierto: cualquier forma se anade con Formas.registrar(id, definicion) y pasa a
// estar disponible en el selector, en la validacion de Estado y en la generacion, sin tocar
// el resto del archivo. El id es el valor que viaja en los parametros.
//
// Contrato de una definicion (todas las formas cumplen lo mismo, incluidas las 3D):
//   nombre: etiqueta para el selector
//   es3D: boolean
//   dimensiones(p) -> { w, h, d }     ya validado y recortado a los maximos
//   preparar(p, dims) -> datos        opcional; se calcula una vez por generar()
//   llenar(x, y, z, p, dims, prep) -> boolean   x, y, z son el centro de la celda
//   opciones: claves de los parametros propios, por hueco de la firma (null = hueco vacio)
//   variantes: [{ valor, nombre, etiqueta }]    opcional; variantes que ofrece el panel
//   variante(r, p, dims) -> { capas, totales }  opcional; ajusta el volumen ya generado
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
  const MAX_2D = 200, MAX_3D = 100, MAX_GROSOR = 50;

  /** @type {Map<string, {es3D:boolean, dimensiones:Function, llenar:Function}>} */
  const registro = new Map();
  const FORMAS = [];   // identidades en orden de registro (lo usa Estado.ENUMS.forma)

  function registrar(id, definicion) {
    if (typeof id !== 'string' || !id) throw new Error('Forma sin identificador');
    if (registro.has(id)) throw new Error(`Forma duplicada: ${id}`);
    if (!definicion || typeof definicion.dimensiones !== 'function' || typeof definicion.llenar !== 'function') {
      throw new Error(`La forma ${id} no cumple el contrato (dimensiones + llenar)`);
    }
    registro.set(id, { es3D: false, ...definicion });
    FORMAS.push(id);
    return definicion;
  }
  const obtener = id => registro.get(id);
  const existe = id => registro.has(id);

  function entero(v, nombre, min, max) {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error(`${nombre} no es un número`);
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  function dentroPoligono(px, py, pts) {
    let dentro = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) dentro = !dentro;
    }
    return dentro;
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

  /** @param {Parametros} p */
  function generar(p) {
    const def = p && registro.get(p.forma);
    if (!def) throw new Error('Forma desconocida: ' + (p && p.forma));
    const dims = def.dimensiones(p);
    const { w, h, d } = dims;
    const prep = def.preparar ? def.preparar(p, dims) : undefined;
    const hueco = p.modo === 'hueco';
    let grosor = hueco ? entero(p.grosor == null ? 1 : p.grosor, 'Grosor', 1, MAX_GROSOR) : 1;

    // Volumen plano: en 3D, z es el nivel vertical (capa) y y la profundidad.
    const lleno = new Uint8Array(w * h * d);
    for (let z = 0; z < d; z++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (def.llenar(x + 0.5, y + 0.5, z + 0.5, p, dims, prep)) lleno[x + w * (y + h * z)] = 1;
    }

    let grosorMax = null, grosorRecortado = false;
    if (hueco) {
      const { dist, max } = distancias(lleno, w, h, d);
      grosorMax = grosorMaximoDe(max);
      if (grosor > grosorMax) { grosor = grosorMax; grosorRecortado = true; }
      for (let i = 0; i < lleno.length; i++) if (lleno[i] && dist[i] > grosor) lleno[i] = 0;
    }

    let { capas, totales } = aCapas(lleno, w, h, d);
    if (def.variante) ({ capas, totales } = def.variante({ capas, totales }, p, dims));
    return { capas, totales, grosor, grosorMax, grosorRecortado };
  }

  const contar = g => g.reduce((a, f) => a + f.filter(Boolean).length, 0);

  // --- registro de las formas que trae la app --------------------------------------
  // Las 2D comparten dimensiones: ancho y alto libres, una sola capa.
  const dimensiones2D = p => ({
    w: entero(p.w, 'Ancho', 1, MAX_2D),
    h: entero(p.h, 'Alto', 1, MAX_2D),
    d: 1,
  });
  const forma2D = (llenar, preparar) => ({ es3D: false, dimensiones: dimensiones2D, llenar, preparar });

  registrar('circulo', forma2D((x, y, z, p, { w, h }) =>
    ((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2 <= 1));

  registrar('rectangulo', forma2D(() => true));

  registrar('rombo', forma2D((x, y, z, p, { w, h }) =>
    Math.abs(x - w / 2) / (w / 2) + Math.abs(y - h / 2) / (h / 2) <= 1));

  // Los poligonos se construyen una sola vez por generar(), no en cada celda.
  const puntosTriangulo = (p, { w, h }) => [[w / 2, 0], [w, h], [0, h]];
  registrar('triangulo', forma2D(
    (x, y, z, p, dims, pts) => dentroPoligono(x, y, pts),
    puntosTriangulo,
  ));

  const puntosHexagono = (p, { w, h }) => {
    const cx = w / 2, cy = h / 2, rx = w / 2, ry = h / 2;
    return p.orient === 'punta'
      ? [[cx, cy - ry], [cx + rx, cy - ry / 2], [cx + rx, cy + ry / 2], [cx, cy + ry], [cx - rx, cy + ry / 2], [cx - rx, cy - ry / 2]]
      : [[cx + rx, cy], [cx + rx / 2, cy + ry], [cx - rx / 2, cy + ry], [cx - rx, cy], [cx - rx / 2, cy - ry], [cx + rx / 2, cy - ry]];
  };
  registrar('hexagono', forma2D(
    (x, y, z, p, dims, pts) => dentroPoligono(x, y, pts),
    puntosHexagono,
  ));

  registrar('esfera', {
    es3D: true,
    dimensiones: p => {
      const n = entero(p.w, 'Ancho', 1, MAX_3D);
      return { w: n, h: n, d: n };
    },
    llenar: (x, y, z, p, { w }) => {
      const c = w / 2, r2 = c * c;
      return (x - c) ** 2 + (y - c) ** 2 + (z - c) ** 2 <= r2;
    },
  });

  return { generar, contar, registrar, obtener, existe, FORMAS, MAX_2D, MAX_3D, MAX_GROSOR };
})();
if (typeof module !== 'undefined') module.exports = Formas; else globalThis.Formas = Formas;
