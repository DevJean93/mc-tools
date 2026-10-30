// Pila de deshacer/rehacer con limite. Guarda instantaneas opacas: no sabe que contienen.
const Historial = (() => {
  const MAX = 50;

  function crear(max = MAX) {
    const deshacer = [], rehacer = [];
    const apilar = (pila, snap) => { pila.push(snap); if (pila.length > max) pila.shift(); };

    return {
      // Accion nueva: la pila de rehacer deja de tener sentido.
      apilar(snap) { apilar(deshacer, snap); rehacer.length = 0; },
      // Devuelve la instantanea anterior y guarda la actual para poder rehacerla.
      deshacer(actual) {
        if (!deshacer.length) return null;
        apilar(rehacer, actual);
        return deshacer.pop();
      },
      rehacer(actual) {
        if (!rehacer.length) return null;
        apilar(deshacer, actual);
        return rehacer.pop();
      },
      // La accion apilada no cambio nada: se descarta.
      descartar() { deshacer.pop(); },
      puedeDeshacer: () => deshacer.length > 0,
      puedeRehacer: () => rehacer.length > 0,
      pendientes: () => ({ deshacer: deshacer.length, rehacer: rehacer.length }),
    };
  }

  return { crear, MAX };
})();
if (typeof module !== 'undefined') module.exports = Historial; else globalThis.Historial = Historial;
