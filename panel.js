// Enlace entre el formulario y los parametros: leer el panel a st y volcar st al panel.
// No decide nada mas: quien llama sabe cuando regenerar.
const Panel = (() => {
  const TOGGLES = ['rel', 'tramos', 'tramosDentro', 'distEjes'];
  const CAMPOS = ['w', 'h', 'grosor'];
  const SELECTS = ['forma', 'igualar', 'modo', 'esfera', 'orient'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, Math.round(+v) || a));

  function crear({ st, limites, es3D }) {
    const $ = id => document.getElementById(id);

    function leer() {
      st.forma = $('forma').value;
      st.w = clamp($('w').value, 1, es3D() ? limites.w3d : limites.w2d);
      st.h = clamp($('h').value, 1, limites.h);
      st.igualar = $('igualar').checked;
      st.modo = $('modo').value;
      st.grosor = clamp($('grosor').value, 1, limites.grosor);
      st.esfera = $('esfera').value;
      st.orient = $('orient').value;
      st.zoom = clamp($('zoom').value, limites.zoomMin, limites.zoomMax);
      for (const k of TOGGLES) st[k] = $(k).checked;
    }

    function poner(grosorMax) {
      const maxW = es3D() ? limites.w3d : limites.w2d;
      $('forma').value = st.forma; $('w').value = st.w; $('h').value = st.h;
      $('w').max = maxW;
      $('lblW').textContent = es3D() ? 'Diámetro' : 'Ancho';
      $('maxW').textContent = `(máx. ${maxW})`;
      $('igualar').checked = st.igualar; $('modo').value = st.modo; $('grosor').value = st.grosor;
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
