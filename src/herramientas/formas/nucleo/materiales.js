// Calculo puro de materiales: bloques -> stacks, shulkers, cofres y porcentajes. Sin DOM.
export const Materiales = (() => {
  const STACK = 64;
  const SHULKER = 27 * STACK;      // 1728
  const COFRE_DOBLE = 54 * STACK;  // 3456

  // Bloques que se pueden elegir para el esquema de Litematica (MAT-17): lista corta con sus ID del juego.
  // El primero es el de por defecto.
  const BLOQUES = [
    { id: 'minecraft:stone', nombre: 'Piedra' },
    { id: 'minecraft:stone_bricks', nombre: 'Ladrillos de piedra' },
    { id: 'minecraft:bricks', nombre: 'Ladrillos' },
    { id: 'minecraft:oak_planks', nombre: 'Tablones de roble' },
    { id: 'minecraft:glass', nombre: 'Cristal' },
    { id: 'minecraft:white_wool', nombre: 'Lana blanca' },
    { id: 'minecraft:white_concrete', nombre: 'Hormigón blanco' },
    { id: 'minecraft:smooth_stone', nombre: 'Piedra lisa' },
  ];
  const BLOQUE_DEFECTO = BLOQUES[0].id;

  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const fmtStacks = n => `${Math.floor(n / STACK)} × ${STACK}${n % STACK ? ' + ' + (n % STACK) : ''}`;
  const unidades = (n, porCaja) => ({ valor: n / porCaja, cajas: Math.ceil(n / porCaja) });

  // Reparto entre borde y relleno (MAT-18). El borde son los bloques que tocan el exterior por alguna cara: los
  // 4 vecinos de la capa y, con varias capas (3D), la de arriba y la de abajo; el relleno, el resto.
  // Devuelve, por capa, un Uint8Array (indice y * ancho + x, 1 = relleno) y cuantos bloques de relleno tiene.
  function rellenoDe(capas) {
    const celdas = [], cuenta = [], h = capas[0].length, w = capas[0][0].length, tres = capas.length > 1;
    for (let c = 0; c < capas.length; c++) {
      const g = capas[c], abajo = tres ? capas[c - 1] : null, arriba = tres ? capas[c + 1] : null;
      const z = new Uint8Array(w * h);
      let n = 0;
      if (!tres || (abajo && arriba)) {
        for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
          if (g[y][x] && g[y - 1][x] && g[y + 1][x] && g[y][x - 1] && g[y][x + 1]
            && (!tres || (abajo[y][x] && arriba[y][x]))) { z[y * w + x] = 1; n++; }
        }
      }
      celdas.push(z); cuenta.push(n);
    }
    return { celdas, cuenta };
  }

  // Materiales de la forma: { borde, relleno } (ID de bloque) o null si es uno solo. Solo hay reparto en formas
  // solidas (en hueco todo es borde) y con un relleno elegido distinto del borde.
  function repartoActivo({ modo, bloque, relleno }) {
    return modo !== 'hueco' && relleno && relleno !== bloque ? { borde: bloque, relleno } : null;
  }

  /**
   * @param {number[]} totales bloques por capa
   * @param {number[]} porCapa bloques marcados por capa
   * @param {number} capa capa visible (0..n-1)
   * @param {{ materiales: { id: string, nombre: string, porCapa: number[] }[] }} [reparto] bloques de cada
   *   material por capa (borde y relleno); sin el, un solo material
   */
  function resumen(totales, porCapa, capa = 0, reparto = null) {
    const total = totales.reduce((a, b) => a + b, 0);
    const marcados = porCapa.reduce((a, b) => a + b, 0);
    const enCapa = porCapa[capa] || 0, totCapa = totales[capa] || 0;
    const dosDigitos = (a, b) => `${pct(a, b)} %`;
    return {
      total, marcados, faltan: total - marcados,
      pctTotal: pct(marcados, total),
      stacks: fmtStacks(total),
      shulkers: unidades(total, SHULKER),
      cofres: unidades(total, COFRE_DOBLE),
      enCapa, totCapa,
      pctCapa: pct(enCapa, totCapa),
      capas: totales.map((n, i) => ({
        i, total: n, hechos: porCapa[i] || 0, pct: pct(porCapa[i] || 0, n),
        completa: n > 0 && porCapa[i] === n,
        ...(reparto ? { porMaterial: reparto.materiales.map(m => m.porCapa[i] || 0) } : {}),
      })),
      ...(reparto ? { materiales: reparto.materiales.map(m => {
        const t = m.porCapa.reduce((a, b) => a + b, 0);
        return { id: m.id, nombre: m.nombre, total: t, stacks: fmtStacks(t), shulkers: unidades(t, SHULKER), cofres: unidades(t, COFRE_DOBLE) };
      }) } : {}),
      // Texto de la barra de progreso: en 3D incluye la capa y el total.
      textoProgreso: totales.length > 1
        ? `Capa: ${enCapa}/${totCapa} (${dosDigitos(enCapa, totCapa)}) · Total: ${marcados}/${total} (${dosDigitos(marcados, total)})`
        : `Construidos: ${marcados}/${total} (${dosDigitos(marcados, total)})`,
    };
  }

  const centroPorDefecto = n => [Math.floor((n - 1) / 2), Math.floor(n / 2)];

  // Tamaño del centro y distancia del centro a cada borde (sin contar el centro).
  function textoResumenCentro(g, centro = centroPorDefecto) {
    const h = g.length, w = g[0].length;
    const [cx0, cx1] = centro(w), [cy0, cy1] = centro(h);
    let minX = Infinity, maxX = -1, minY = Infinity, maxY = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!g[y][x]) continue;
      if (y >= cy0 && y <= cy1) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
      if (x >= cx0 && x <= cx1) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    }
    let txt = `Centro: ${cx1 - cx0 + 1}×${cy1 - cy0 + 1} bloques`;
    if (maxX >= 0) {
      txt += ` · del centro al borde: ← ${cx0 - minX} · → ${maxX - cx1}`;
      if (maxY >= 0) txt += ` · ↑ ${cy0 - minY} · ↓ ${maxY - cy1}`;
      txt += ' bloques (sin contar el centro)';
    }
    return txt;
  }

  return { STACK, SHULKER, COFRE_DOBLE, BLOQUES, BLOQUE_DEFECTO, rellenoDe, repartoActivo, resumen, textoResumenCentro, pct, fmtStacks };
})();
