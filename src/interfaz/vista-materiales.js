// Pinta en HTML el resultado de Materiales: totales, tabla por capa y barra de progreso.
// Solo presentacion: los numeros los calcula materiales.js.
const VistaMateriales = (() => {
  function crear({ materiales, tabla, barra, progreso, lienzo }) {
    function pintar(r, capa, textos = {}) {
      materiales.innerHTML =
        `<div class="tot">${r.total} <small>bloques</small></div><div class="mat">` +
        `<span>Stacks</span><b>${r.stacks}</b>` +
        `<span>Shulker boxes</span><b>${r.shulkers.valor.toFixed(2)} → ${r.shulkers.cajas}</b>` +
        `<span>Cofres dobles</span><b>${r.cofres.valor.toFixed(2)} → ${r.cofres.cajas}</b>` +
        `<span>Construidos</span><b>${r.marcados}</b><span>Faltan</span><b>${r.faltan}</b></div>` +
        `<p class="formula">1 stack = ${Materiales.STACK} · 1 shulker = 27 stacks = ${Materiales.SHULKER} · ` +
        `1 cofre doble = 54 stacks = ${Materiales.COFRE_DOBLE}</p>`;

      // `textos.altura(i)` da la Y de la capa i, o null si no hay (sin Y de la base o en 2D): sin ella la
      // tabla es la de siempre; con ella lleva una columna «Y» tras «Capa».
      const altura = textos.altura || (() => null);
      const conY = altura(0) !== null;
      if (r.capas.length > 1) {
        let t = '<table><thead><tr><th scope="col">Capa</th>' + (conY ? '<th scope="col">Y</th>' : '') +
          '<th scope="col">Bloques</th><th scope="col">Stacks</th><th scope="col">Hechos</th></tr></thead><tbody>';
        for (const c of r.capas) {
          const cls = [c.i === capa ? 'sel' : '', c.completa ? 'completa' : ''].join(' ');
          t += `<tr data-i="${c.i}" class="${cls}"${c.i === capa ? ' aria-current="true"' : ''}>` +
            `<td>${c.i + 1}</td>${conY ? `<td>${altura(c.i)}</td>` : ''}<td>${c.total}</td><td>${Materiales.fmtStacks(c.total)}</td><td>${c.pct} %</td></tr>`;
        }
        tabla.innerHTML = t + '</tbody></table>';
      } else {
        tabla.innerHTML = '';
      }

      barra.style.width = r.pctTotal + '%';
      progreso.textContent = r.textoProgreso;

      // Texto para lectores de pantalla: resume forma, capa y avance.
      if (lienzo && textos.nombre) {
        lienzo.setAttribute('aria-label',
          `Dibujo de ${textos.nombre} ${textos.dimensiones}, ${textos.modo}. ` +
          `Capa ${capa + 1} de ${r.capas.length}${altura(capa) === null ? '' : `, altura Y ${altura(capa)}`}: ` +
          `${r.totCapa} bloques, ${r.enCapa} construidos.`);
      }
    }

    return { pintar };
  }

  return { crear };
})();
if (typeof module !== 'undefined') module.exports = VistaMateriales; else globalThis.VistaMateriales = VistaMateriales;
