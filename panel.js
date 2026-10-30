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
      leerPropios();
      st.zoom = Estado.clamp($('zoom').value, limites.zoomMin, limites.zoomMax);
      for (const k of TOGGLES) st[k] = $(k).checked;
    }

    // El selector de formas sale del registro: una forma registrada aparece sin tocar el HTML.
    // Se construye una sola vez: `poner()` se llama en cada cambio y no debe rehacer el DOM.
    let formasListas = false;
    function ponerFormas() {
      const sel = $('forma');
      if (!formasListas) {
        sel.innerHTML = Formas.FORMAS.map(id => `<option value="${id}">${(Formas.obtener(id) || {}).nombre || id}</option>`).join('');
        formasListas = true;
      }
      sel.value = st.forma;
    }

    // Los selectores propios de cada forma (variante, orientacion) salen de su definicion y se
    // guardan en st con la clave de siempre (`esfera`, `orient`). Cada uno solo se rehace al
    // cambiar de forma, no en cada `poner()`.
    const PROPIOS = [
      { select: 'esfera', fila: 'rowEsfera', clave: 'esfera', lista: def => def.variantes },
      { select: 'orient', fila: 'rowOrient', clave: 'orient', lista: def => def.orientaciones },
    ];
    const construidoPara = {};   // select -> forma para la que se hicieron sus opciones
    const listaDe = (p, forma) => p.lista(Formas.obtener(forma) || {}) || [];

    function ponerPropios() {
      for (const p of PROPIOS) {
        const lista = listaDe(p, st.forma);
        $(p.fila).hidden = !lista.length;
        if (construidoPara[p.select] !== st.forma) {
          construidoPara[p.select] = st.forma;
          $(p.select).innerHTML = lista.map(v => `<option value="${v.valor}">${v.etiqueta}</option>`).join('');
        }
        if (lista.some(v => v.valor === st[p.clave])) $(p.select).value = st[p.clave];
      }
    }

    // Lo elegido solo vale si es de la forma activa: al cambiar de forma el selector aun tiene las
    // opciones de la anterior. Una forma sin ese parametro conserva el valor (se recuerda).
    function leerPropios() {
      for (const p of PROPIOS) {
        const lista = listaDe(p, st.forma), el = $(p.select);
        if (!lista.length || !el.options.length) continue;
        st[p.clave] = lista.some(v => v.valor === el.value) ? el.value : lista[0].valor;
      }
    }

    function poner(grosorMax) {
      const maxW = es3D() ? limites.w3d : limites.w2d;
      ponerFormas();
      ponerNum('w', st.w); ponerNum('h', st.h); ponerNum('grosor', st.grosor);
      $('w').max = maxW;
      $('lblW').textContent = es3D() ? 'Diámetro' : 'Ancho';
      $('maxW').textContent = `(máx. ${maxW})`;
      $('igualar').checked = st.igualar; $('modo').value = st.modo;
      ponerPropios(); $('zoom').value = st.zoom;
      for (const k of TOGGLES) $(k).checked = st[k];
      $('h').disabled = st.igualar;
      $('rowH').hidden = es3D();
      $('filaDims').classList.toggle('solo', es3D());
      $('rowIgualar').hidden = es3D();
      $('rowGrosor').hidden = st.modo !== 'hueco';
      const maxG = grosorMax || limites.grosor;
      $('grosor').max = maxG;
      $('maxG').textContent = grosorMax ? `(máx. ${grosorMax})` : '';
    }

    // Conecta el formulario con la app: cada cambio avisa de si toca regenerar (diferido
    // mientras se teclea) o solo repintar.
    function conectar({ alCambiarGeo, alCambiarVista }) {
      for (const id of CAMPOS) {
        $(id).addEventListener('input', () => alCambiarGeo({ diferido: true }));
        $(id).addEventListener('change', () => alCambiarGeo({ diferido: false }));
      }
      for (const id of SELECTS) $(id).addEventListener('input', () => alCambiarGeo({ diferido: false }));
      for (const k of TOGGLES) $(k).addEventListener('input', () => alCambiarVista());
    }

    return { leer, poner, conectar };
  }

  return { crear };
})();
if (typeof module !== 'undefined') module.exports = Panel; else globalThis.Panel = Panel;
