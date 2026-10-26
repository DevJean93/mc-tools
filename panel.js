// Enlace entre el formulario y los parametros: leer el panel a st y volcar st al panel.
// No decide nada mas: quien llama sabe cuando regenerar.
const Panel = (() => {
  const Estado = typeof module !== 'undefined' ? require('./estado.js') : globalThis.Estado;
  const Formas = typeof module !== 'undefined' ? require('./shapes.js') : globalThis.Formas;
  const TOGGLES = Estado.VISTA;
  const CAMPOS = ['w', 'h', 'grosor'];
  const SELECTS = ['forma', 'igualar', 'modo', 'esfera', 'orient'];

  function crear({ st, limites, es3D }) {
    const $ = id => document.getElementById(id);
    const vacios = new Set();   // campos numericos que el usuario ha dejado en blanco

    // Si el campo esta vacio se conserva el valor actual y no se vuelve a escribir:
    // asi se puede borrar para teclear otro numero sin que aparezca el minimo.
    function numero(id, actual, min, max) {
      if ($(id).value === '') { vacios.add(id); return actual; }
      vacios.delete(id);
      return Estado.clamp($(id).value, min, max);
    }
    const ponerNum = (id, v) => { if (!vacios.has(id)) $(id).value = v; };

    function leer() {
      st.forma = $('forma').value;
      st.w = numero('w', st.w, 1, es3D() ? limites.w3d : limites.w2d);
      st.h = numero('h', st.h, 1, limites.h);
      st.igualar = $('igualar').checked;
      st.modo = $('modo').value;
      st.grosor = numero('grosor', st.grosor, 1, limites.grosor);
      st.esfera = $('esfera').value || st.esfera;
      st.orient = $('orient').value;
      st.zoom = Estado.clamp($('zoom').value, limites.zoomMin, limites.zoomMax);
      for (const k of TOGGLES) st[k] = $(k).checked;
    }

    // El selector de formas sale del registro: una forma registrada aparece sin tocar el HTML.
    function ponerFormas() {
      const sel = $('forma');
      sel.innerHTML = Formas.FORMAS.map(id => `<option value="${id}">${(Formas.obtener(id) || {}).nombre || id}</option>`).join('');
      sel.value = st.forma;
    }

    // El selector de variante sale de la definicion de la forma (la esfera trae esfera/cupula).
    function ponerVariantes() {
      const def = Formas.obtener(st.forma);
      const variantes = (def && def.variantes) || [];
      $('rowEsfera').hidden = !variantes.length;
      $('esfera').innerHTML = variantes.map(v => `<option value="${v.valor}">${v.etiqueta}</option>`).join('');
      if (variantes.some(v => v.valor === st.esfera)) $('esfera').value = st.esfera;
    }

    function poner(grosorMax) {
      const maxW = es3D() ? limites.w3d : limites.w2d;
      ponerFormas();
      ponerNum('w', st.w); ponerNum('h', st.h); ponerNum('grosor', st.grosor);
      $('w').max = maxW;
      $('lblW').textContent = es3D() ? 'Diámetro' : 'Ancho';
      $('maxW').textContent = `(máx. ${maxW})`;
      $('igualar').checked = st.igualar; $('modo').value = st.modo;
      ponerVariantes(); $('orient').value = st.orient; $('zoom').value = st.zoom;
      for (const k of TOGGLES) $(k).checked = st[k];
      $('h').disabled = st.igualar;
      $('rowH').hidden = es3D();
      $('filaDims').classList.toggle('solo', es3D());
      $('rowIgualar').hidden = es3D();
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
