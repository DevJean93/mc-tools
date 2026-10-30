// Bloques marcados como construidos. Sin DOM: recibe las capas y valida contra ellas.
// Clave de cada bloque: "capa,x,y".
const Marcas = (() => {
  const clave = (c, x, y) => `${c},${x},${y}`;

  function crear(inicial = []) {
    const hechos = new Set(inicial);
    const hayBloque = (capas, c, x, y) => !!(capas[c] && capas[c][y] && capas[c][y][x]);

    // Marca o desmarca; false si la celda no es un bloque o ya estaba como se pide.
    function fijar(capas, c, x, y, valor) {
      if (!hayBloque(capas, c, x, y)) return false;
      const k = clave(c, x, y);
      if (valor === hechos.has(k)) return false;
      if (valor) hechos.add(k); else hechos.delete(k);
      return true;
    }

    return {
      fijar,
      // Invierte la celda. null si no hay bloque; si no, { valor, cambio }.
      alternar(capas, c, x, y) {
        if (!hayBloque(capas, c, x, y)) return null;
        const valor = !hechos.has(clave(c, x, y));
        return { valor, cambio: fijar(capas, c, x, y, valor) };
      },
      // Marca/desmarca varias capas enteras; devuelve cuantos bloques cambiaron.
      marcarCapas(capas, indices, valor) {
        let n = 0;
        for (const c of indices) {
          const g = capas[c];
          if (!g) continue;
          for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
            if (fijar(capas, c, x, y, valor)) n++;
          }
        }
        return n;
      },
      // Bloques marcados por capa (array de longitud n).
      porCapa(n) {
        const a = new Array(n).fill(0);
        for (const k of hechos) a[+k.slice(0, k.indexOf(','))]++;
        return a;
      },
      tiene: (c, x, y) => hechos.has(clave(c, x, y)),
      total: () => hechos.size,
      instantanea: () => [...hechos],
      restaurar(lista) { hechos.clear(); for (const k of lista) hechos.add(k); },
      limpiar() { hechos.clear(); },
      conjunto: () => hechos,
    };
  }

  return { crear, clave };
})();
if (typeof module !== 'undefined') module.exports = Marcas; else globalThis.Marcas = Marcas;
