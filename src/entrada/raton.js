// Entrada de raton y lapiz: clic/arrastre marca, clic derecho desmarca, Ctrl+rueda hace zoom.
// No conoce el estado: recibe solo los grupos de acciones que usa (dibujo, marcas, zoom).
const EntradaRaton = (() => {
  function conectar({ lienzo, contenedor, dibujo, marcas, zoom }) {
    let trazo = null;   // { valor, cambio, id } mientras se pinta

    function pintar(c) {
      if (!trazo || !c) return;
      if (marcas.fijar(c.x, c.y, trazo.valor)) { trazo.cambio = true; dibujo.programarDibujo(); }
    }

    lienzo.addEventListener('contextmenu', ev => ev.preventDefault());

    lienzo.addEventListener('pointerdown', ev => {
      if (ev.pointerType === 'touch') return;   // eso lo lleva entrada-tactil
      const c = dibujo.celda(ev);
      if (!c || (ev.button !== 0 && ev.button !== 2)) return;
      ev.preventDefault();
      lienzo.focus({ preventScroll: true });
      trazo = { valor: ev.button === 2 ? false : !marcas.estaHecho(c.x, c.y), cambio: false, id: ev.pointerId };
      marcas.antesDeMarcar();
      lienzo.setPointerCapture(ev.pointerId);
      pintar(c);
    });

    lienzo.addEventListener('pointermove', ev => {
      if (ev.pointerType === 'touch') return;
      const c = dibujo.celda(ev);
      dibujo.informar(c ? dibujo.describir(c) : dibujo.infoInicial);
      if (trazo && ev.pointerId === trazo.id) pintar(c);
    });

    function fin(ev) {
      if (ev.pointerType === 'touch') return;
      if (!trazo || ev.pointerId !== trazo.id) return;
      if (trazo.cambio) marcas.trasMarcar(); else marcas.descartarPaso();
      trazo = null;
      dibujo.refrescar();
    }
    lienzo.addEventListener('pointerup', fin);
    lienzo.addEventListener('pointercancel', fin);

    // Ctrl + rueda (o pellizco en el touchpad, que llega igual): zoom proporcional hacia el puntero.
    contenedor.addEventListener('wheel', ev => {
      if (!ev.ctrlKey) return;
      ev.preventDefault();
      const actual = zoom.zoomActual();
      let nuevo = Math.round(actual * Math.exp(-ev.deltaY * 0.0025));
      if (nuevo === actual) nuevo += ev.deltaY < 0 ? 1 : -1;
      zoom.zoom(nuevo, ev);
    }, { passive: false });
  }

  return { conectar };
})();
if (typeof module !== 'undefined') module.exports = EntradaRaton; else globalThis.EntradaRaton = EntradaRaton;
