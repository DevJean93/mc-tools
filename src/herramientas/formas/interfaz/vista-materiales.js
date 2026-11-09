// Pinta en HTML el resultado de Materiales: totales, tabla por capa y barra de progreso.
// Solo presentacion: los numeros los calcula materiales.js.
import { Materiales } from '../nucleo/materiales.js';
export const VistaMateriales = (() => {
  function crear({ materiales, tabla, barra, progreso, lienzo }) {
    function pintar(r, capa, textos = {}) {
      // `textos.sinMarcas` (la ficha impresa) quita todo lo que habla de lo construido: solo el total.
      const sinMarcas = !!textos.sinMarcas;
      const cajas = m => `<span>Stacks</span><b>${m.stacks}</b>` +
        `<span>Shulker boxes</span><b>${m.shulkers.valor.toFixed(2)} → ${m.shulkers.cajas}</b>` +
        `<span>Cofres dobles</span><b>${m.cofres.valor.toFixed(2)} → ${m.cofres.cajas}</b>`;
      // Con reparto (MAT-19): tras el total de la forma, un bloque por material (borde y luego relleno), con su
      // muestra de color y su nombre; sin el, nada de esto y el HTML es el de siempre.
      const clases = ['borde', 'relleno'];
      const porMaterial = (r.materiales || []).map((m, i) =>
        `<h3 class="mat-nombre"><span class="mat-m ${clases[i]}" aria-hidden="true"></span>${m.nombre} <small>${m.total} bloques</small></h3>` +
        `<div class="mat">${cajas(m)}</div>`).join('');
      materiales.innerHTML =
        `<div class="tot">${r.total} <small>bloques</small></div><div class="mat">` + cajas(r) +
        (sinMarcas ? '' : `<span>Construidos</span><b>${r.marcados}</b><span>Faltan</span><b>${r.faltan}</b>`) + '</div>' + porMaterial +
        `<p class="formula">1 stack = ${Materiales.STACK} · 1 shulker = 27 stacks = ${Materiales.SHULKER} · ` +
        `1 cofre doble = 54 stacks = ${Materiales.COFRE_DOBLE}</p>`;

      // `textos.altura(i)` da la Y de la capa i, o null si no hay (sin Y de la base o en 2D): sin ella la
      // tabla es la de siempre; con ella lleva una columna «Y» tras «Capa».
      const altura = textos.altura || (() => null);
      const conY = altura(0) !== null;
      if (r.capas.length > 1) {
        let t = '<table><thead><tr><th scope="col">Capa</th>' + (conY ? '<th scope="col">Y</th>' : '') +
          '<th scope="col">Bloques</th><th scope="col">Stacks</th>' + (r.materiales || []).map(m => `<th scope="col">${m.nombre}</th>`).join('') + (sinMarcas ? '' : '<th scope="col">Hechos</th>') + '</tr></thead><tbody>';
        for (const c of r.capas) {
          const cls = [c.i === capa ? 'sel' : '', c.completa ? 'completa' : ''].join(' ');
          t += `<tr data-i="${c.i}" class="${cls}"${c.i === capa ? ' aria-current="true"' : ''}>` +
            `<td>${c.i + 1}</td>${conY ? `<td>${altura(c.i)}</td>` : ''}<td>${c.total}</td><td>${Materiales.fmtStacks(c.total)}</td>${(c.porMaterial || []).map(n => `<td>${n}</td>`).join('')}${sinMarcas ? '' : `<td>${c.pct} %</td>`}</tr>`;
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
