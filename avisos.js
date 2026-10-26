// Avisos de la interfaz: mensaje flotante con accion, error de cabecera y avisos para lectores.
// Todo el DOM se inyecta, asi el resto de modulos no lo toca directamente.
const Avisos = (() => {
  function crear({ caja, texto, boton, error, anuncio }) {
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

    return { avisar, ocultar, mostrarError, ocultarError, anunciar };
  }

  return { crear };
})();
if (typeof module !== 'undefined') module.exports = Avisos; else globalThis.Avisos = Avisos;
