// Enlace entre el formulario y los parametros: leer el panel a st y volcar st al panel.
// No decide nada mas: quien llama sabe cuando regenerar.
const Panel = (() => {
  const TOGGLES = ['rel', 'tramos', 'tramosDentro', 'distEjes'];
  const CAMPOS = ['w', 'h', 'grosor'];
  const SELECTS = ['forma', 'igualar', 'modo', 'esfera', 'orient'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, Math.round(+v) || a));

  function crear({ st, limites, es3D }) {
    const $ = id => document.getElementById(id);
    const vacios = new Set();   // campos numericos que el usuario ha dejado en blanco

    // Si el campo esta vacio se conserva el valor actual y no se vuelve a escribir:
    // asi se puede borrar para teclear otro numero sin que aparezca el minimo.
    function numero(id, actual, min, max) {
      if ($(id).value === '') { vacios.add(id); return actual; }
      vacios.delete(id);
      return clamp($(id).value, min, max);
    }
    const ponerNum = (id, v) => { if (!vacios.has(id)) $(id).value = v; };

    function leer() {
      st.forma = $('forma').value;
      st.w = numero('w', st.w, 1, es3D() ? limites.w3d : limites.w2d);
      st.h = numero('h', st.h, 1, limites.h);
      st.igualar = $('igualar').checked;
      st.modo = $('modo').value;
      st.grosor = numero('grosor', st.grosor, 1, limites.grosor);
      st.esfera = $('esfera').value;
      st.orient = $('orient').value;
      st.zoom = clamp($('zoom').value, limites.zoomMin, limites.zoomMax);
      for (const k of TOGGLES) st[k] = $(k).checked;
    }

    function poner(grosorMax) {
      const maxW = es3D() ? limites.w3d : limites.w2d;
      $('forma').value = st.forma;
      ponerNum('w', st.w); ponerNum('h', st.h); ponerNum('grosor', st.grosor);
      $('w').max = maxW;
      $('lblW').textContent = es3D() ? 'Diámetro' : 'Ancho';
      $('maxW').textContent = `(máx. ${maxW})`;
      $('igualar').checked = st.igualar; $('modo').value = st.modo;
      $('esfera').value = st.esfera; $('orient').value = st.orient; $('zoom').value = st.zoom;
      for (const k of TOGGLES) $(k).checked = st[k];
      $('h').disabled = st.igualar;
      $('rowH').hidden = es3D();
      $('filaDims').classList.toggle('solo', es3D());
      $('rowIgualar').hidden = es3D();
      $('rowEsfera').hidden = !es3D();
      $('rowOrient').hidden = st.forma !== 'hexagono';
      $('rowGrosor').hidden = st.modo !== 'hueco';
      const maxG = grosorMax || limites.grosor;
      $('grosor').max = maxG;
      $('maxG').textContent = grosorMax ? `(máx. ${grosorMax})` : '';
    }

    return { leer, poner, TOGGLES, CAMPOS, SELECTS };
  }

  return { crear, TOGGLES, CAMPOS, SELECTS };
})();
if (typeof module !== 'undefined') module.exports = Panel; else globalThis.Panel = Panel;
