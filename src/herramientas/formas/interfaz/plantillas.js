// Plantillas en el panel «Forma» (FOR-20 a FOR-23): desplegable con «Aplicar» y «Borrar» y un campo de nombre en
// linea para guardar la forma actual. No decide nada: la lista y sus reglas son de nucleo/plantillas.js, aplicar es
// del documento y los avisos de la app. Los nombres entran siempre como texto (nunca como HTML).
export const InterfazPlantillas = (() => {

  function crear({ plantillas, st, leer, aplicar, avisos }) {
    const $ = id => document.getElementById(id);
    const sel = $('plantillaSel'), campo = $('plantillaCampo'), nombre = $('plantillaNombre'), error = $('plantillaError');
    const abrir = $('plantillaGuardar');

    // Reconstruye el desplegable. Opcion inicial sin valor: ni Aplicar ni Borrar actuan sin elegir una plantilla.
    function pintar(elegida = '') {
      const lista = plantillas.lista();
      sel.replaceChildren();
      const inicial = document.createElement('option');
      inicial.value = ''; inicial.textContent = 'Elige una plantilla…';
      sel.append(inicial);
      for (const p of lista) {
        const o = document.createElement('option');
        o.value = p.nombre; o.textContent = p.nombre;
        sel.append(o);
      }
      sel.value = lista.some(p => p.nombre === elegida) ? elegida : '';
      $('plantillaLista').hidden = !lista.length;
      $('plantillaAyuda').hidden = !!lista.length;
      botones();
    }
    function botones() { $('plantillaAplicar').disabled = $('plantillaBorrar').disabled = sel.value === ''; }

    function abrirCampo() {
      nombre.value = ''; error.textContent = '';
      campo.hidden = false; abrir.setAttribute('aria-expanded', 'true');
      nombre.focus();
    }
    function cerrarCampo(devolverFoco = true) {
      campo.hidden = true; abrir.setAttribute('aria-expanded', 'false'); error.textContent = '';
      if (devolverFoco) abrir.focus();
    }

    function guardar() {
      leer();   // lo que se esta tecleando en el panel entra en st antes de guardar
      const r = plantillas.guardar(nombre.value, st);
      if (!r.ok) { error.textContent = r.mensaje; nombre.focus(); return; }
      const n = nombre.value.trim();
      pintar(); cerrarCampo();
      if (!r.guardado) avisos.avisar(`Plantilla «${n}» guardada, pero el navegador no deja guardar: se perderá al recargar.`);
      else if (r.sustituida) avisos.avisar(`Plantilla «${n}» sustituida.`, () => { plantillas.reponer(r.anterior); pintar(); });
      else avisos.avisar(`Plantilla «${n}» guardada.`);
    }

    function aplicarElegida() {
      const p = plantillas.lista().find(q => q.nombre === sel.value);
      if (p) aplicar(p);
    }

    function borrarElegida() {
      const r = plantillas.borrar(sel.value);
      if (!r.ok) return;
      pintar();
      avisos.avisar(`Plantilla «${r.plantilla.nombre}» borrada.`, () => {
        const v = plantillas.reponer(r.plantilla, r.indice);
        if (v.ok) pintar(); else avisos.avisar(v.mensaje);
      });
    }

    sel.addEventListener('input', botones);
    sel.addEventListener('change', botones);
    $('plantillaAplicar').addEventListener('click', aplicarElegida);
    $('plantillaBorrar').addEventListener('click', borrarElegida);
    abrir.addEventListener('click', abrirCampo);
    $('plantillaOk').addEventListener('click', guardar);
    $('plantillaCancelar').addEventListener('click', () => cerrarCampo());
    // Escape no sube al menu del movil (que se cerraria con el): solo cancela el campo.
    nombre.addEventListener('keydown', ev => {
      if (ev.key === 'Enter') { ev.preventDefault(); guardar(); }
      else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); cerrarCampo(); }
    });
    nombre.addEventListener('input', () => { error.textContent = ''; });

    pintar();
    return { pintar };
  }

  return { crear };
})();
