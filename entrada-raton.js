// Entrada de raton y lapiz: clic/arrastre marca, clic derecho desmarca, Ctrl+rueda hace zoom.
// No conoce el estado: todo pasa por el objeto `acciones` que inyecta la app.
const EntradaRaton = (() => {
  function conectar({ lienzo, contenedor, acciones }) {
    const a = acciones;
    let trazo = null;   // { valor, cambio, id } mientras se pinta

    function pintar(c) {
      if (!trazo || !c) return;
      if (a.fijar(c.x, c.y, trazo.valor)) { trazo.cambio = true; a.programarDibujo(); }
    }

    lienzo.addEventListener('contextmenu', ev => ev.preventDefault());

    lienzo.addEventListener('pointerdown', ev => {
      if (ev.pointerType === 'touch') return;   // eso lo lleva entrada-tactil
      const c = a.celda(ev);
      if (!c || (ev.button !== 0 && ev.button !== 2)) return;
      ev.preventDefault();
      lienzo.focus({ preventScroll: true });
      trazo = { valor: ev.button === 2 ? false : !a.estaHecho(c.x, c.y), cambio: false, id: ev.pointerId };
      a.antesDeMarcar();
      lienzo.setPointerCapture(ev.pointerId);
      pintar(c);
    });

    lienzo.addEventListener('pointermove', ev => {
      if (ev.pointerType === 'touch') return;
      const c = a.celda(ev);
      a.informar(c ? a.describir(c) : a.infoInicial);
      if (trazo && ev.pointerId === trazo.id) pintar(c);
    });

    function fin(ev) {
      if (ev.pointerType === 'touch') return;
      if (!trazo || ev.pointerId !== trazo.id) return;
      if (trazo.cambio) a.trasMarcar(); else a.descartarPaso();
      trazo = null;
      a.refrescar();
    }
    lienzo.addEventListener('pointerup', fin);
    lienzo.addEventListener('pointercancel', fin);

    // Ctrl + rueda (o pellizco en el touchpad, que llega igual): zoom proporcional hacia el puntero.
    contenedor.addEventListener('wheel', ev => {
      if (!ev.ctrlKey) return;
      ev.preventDefault();
      const actual = a.zoomActual();
      let nuevo = Math.round(actual * Math.exp(-ev.deltaY * 0.0025));
      if (nuevo === actual) nuevo += ev.deltaY < 0 ? 1 : -1;
      a.zoom(nuevo, ev);
    }, { passive: false });
  }

  return { conectar };
})();
if (typeof module !== 'undefined') module.exports = EntradaRaton; else globalThis.EntradaRaton = EntradaRaton;
