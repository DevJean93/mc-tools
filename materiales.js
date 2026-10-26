// Calculo puro de materiales: bloques -> stacks, shulkers, cofres y porcentajes. Sin DOM.
const Materiales = (() => {
  const STACK = 64;
  const SHULKER = 27 * STACK;      // 1728
  const COFRE_DOBLE = 54 * STACK;  // 3456

  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const fmtStacks = n => `${Math.floor(n / STACK)} × ${STACK}${n % STACK ? ' + ' + (n % STACK) : ''}`;
  const unidades = (n, porCaja) => ({ valor: n / porCaja, cajas: Math.ceil(n / porCaja) });

  /**
   * @param {number[]} totales bloques por capa
   * @param {number[]} porCapa bloques marcados por capa
   * @param {number} capa capa visible (0..n-1)
   */
  function resumen(totales, porCapa, capa = 0) {
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
      })),
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

  return { STACK, SHULKER, COFRE_DOBLE, resumen, textoResumenCentro, pct, fmtStacks };
})();
if (typeof module !== 'undefined') module.exports = Materiales; else globalThis.Materiales = Materiales;
