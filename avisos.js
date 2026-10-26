// Avisos de la interfaz: mensaje flotante con accion, error y nota fijas de cabecera y avisos para lectores.
// Todo el DOM se inyecta, asi el resto de modulos no lo toca directamente.
const Avisos = (() => {
  function crear({ caja, texto, boton, error, anuncio, nota, notaTexto }) {
    let temporizador = null;

    function ocultar() { caja.hidden = true; }

    function avisar(msg, accion) {
      texto.textContent = msg;
      boton.hidden = !accion;
      boton.onclick = accion ? () => { ocultar(); accion(); } : null;
      caja.hidden = false;
      clearTimeout(temporizador);
      temporizador = setTimeout(ocultar, accion ? 8000 : 5000);
    }

    function mostrarError(msg) { error.textContent = msg; error.hidden = false; }
    function ocultarError() { error.hidden = true; }
    function anunciar(msg) { anuncio.textContent = msg; }

    // Nota fija: no se oculta sola ni la pisa un aviso. Para un estado que sigue siendo cierto
    // (el almacenamiento no guarda), a diferencia del aviso temporal de una accion.
    function mostrarNota(msg) { notaTexto.textContent = msg; nota.hidden = false; }
    function ocultarNota() { nota.hidden = true; }

    return { avisar, ocultar, mostrarError, ocultarError, anunciar, nota: mostrarNota, ocultarNota };
  }

  return { crear };
})();
if (typeof module !== 'undefined') module.exports = Avisos; else globalThis.Avisos = Avisos;
