// Enlace entre el formulario y los parametros: leer el panel a st y volcar st al panel.
// No decide nada mas: quien llama sabe cuando regenerar.
import { Estado } from '../nucleo/estado.js';
import { Formas } from '../nucleo/formas.js';
import { Materiales } from '../nucleo/materiales.js';
export const Panel = (() => {
  const TOGGLES = Estado.VISTA;
  const CAMPOS = ['w', 'h', 'grosor'];
  const SELECTS = ['forma', 'igualar', 'modo', 'esfera', 'orient'];
  const COORDS = ['centroX', 'centroZ'];   // coordenadas del bloque central en el mundo (guias de chunk)

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
      st.bloque = Materiales.BLOQUES.some(b => b.id === $('bloque').value) ? $('bloque').value : st.bloque;   // MAT-17
      const rel = $('relleno').value;   // MAT-18: '' = igual que el borde
      st.relleno = rel === '' || Materiales.BLOQUES.some(b => b.id === rel) ? rel : st.relleno;
      for (const id of COORDS) st[id] = Estado.coordenada($(id).value);   // vacio -> sin coordenada
      st.baseY = Estado.coordenada($('baseY').value);                    // vacio -> sin altura
      ponerGuias();
    }

    // Guias de chunk: los campos y la ayuda solo se ven con la casilla activada; sin las dos coordenadas
    // la ayuda las pide, y la leyenda solo aparece cuando de verdad hay guias dibujadas.
    function ponerGuias() {
      const sinCoords = st.centroX === null || st.centroZ === null;
      $('filaCentroMundo').hidden = !st.guiasChunk;
      $('ayudaGuias').hidden = !st.guiasChunk;
      $('ayudaGuias').textContent = sinCoords
        ? 'Escribe la X y la Z del bloque central (las ves con F3 en el juego) para ver las guías.'
        : 'Coordenadas del bloque central; si el centro es de 2×2, las del bloque de arriba a la izquierda. La X crece hacia la derecha y la Z hacia abajo.';
      $('leyendaGuias').hidden = !(st.guiasChunk && !sinCoords);
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

    // Bloque del esquema de Litematica: las opciones salen de la lista corta, una sola vez.
    function ponerBloque() {
      const sel = $('bloque');
      if (!sel.options.length) sel.innerHTML = Materiales.BLOQUES.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
      sel.value = st.bloque;
    }

    // Material del relleno (MAT-18): «Igual que el borde» (sin reparto) y la misma lista de bloques. En una forma
    // hueca todo es borde: el selector se deshabilita (no se oculta) y la ayuda lo dice; lo elegido se conserva.
    function ponerRelleno() {
      const sel = $('relleno'), hueco = st.modo === 'hueco';
      if (!sel.options.length) {
        sel.innerHTML = '<option value="">Igual que el borde</option>' + Materiales.BLOQUES.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
      }
      sel.value = st.relleno;
      sel.disabled = hueco;
      $('ayudaRelleno').textContent = hueco
        ? 'En una forma hueca todo es borde: el relleno solo se usa en las sólidas.'
        : 'El bloque de arriba es el del borde. Con otro material de relleno, el desglose, el dibujo y el esquema los separan.';
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
      ponerBloque(); ponerRelleno();
      // No se pisa un campo mientras se teclea en el (un "-" a medias se perderia).
      for (const id of COORDS) if (document.activeElement !== $(id)) $(id).value = st[id] === null ? '' : st[id];
      ponerGuias();
      if (document.activeElement !== $('baseY')) $('baseY').value = st.baseY === null ? '' : st.baseY;
      $('rowBaseY').hidden = !es3D();   // la altura de la base solo tiene sentido con varias capas
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
    function conectar({ alCambiarGeo, alCambiarVista, alCambiarAltura, alCambiarMateriales }) {
      for (const id of CAMPOS) {
        $(id).addEventListener('input', () => alCambiarGeo({ diferido: true }));
        $(id).addEventListener('change', () => alCambiarGeo({ diferido: false }));
      }
      for (const id of SELECTS) $(id).addEventListener('input', () => alCambiarGeo({ diferido: false }));
      for (const k of TOGGLES) $(k).addEventListener('input', () => alCambiarVista());
      // Los materiales no tocan la forma ni las marcas, pero cambian el desglose y la leyenda ademas del dibujo.
      for (const id of ['bloque', 'relleno']) $(id).addEventListener('input', () => alCambiarMateriales());
      for (const id of COORDS) $(id).addEventListener('input', () => alCambiarVista());
      $('baseY').addEventListener('input', () => alCambiarAltura());
    }

    return { leer, poner, conectar };
  }

  return { crear };
})();
