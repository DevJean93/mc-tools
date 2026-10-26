// Entrada tactil: toque corto marca, dos dedos hacen pellizco (zoom). Las acciones se inyectan.
const EntradaTactil = (() => {
  const UMBRAL_TOQUE = 10;   // px de movimiento que convierten un toque en arrastre

  function conectar({ lienzo, acciones }) {
    const a = acciones;
    const toques = new Map();   // dedos sobre el dibujo
    let toque = null;           // { x, y, c } inicio de un toque
    let pellizco = null;        // { d, z } distancia y zoom al empezar

    const dedos = () => [...toques.values()];
    const distancia = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
    const medio = (p, q) => ({ clientX: (p.x + q.x) / 2, clientY: (p.y + q.y) / 2 });

    lienzo.addEventListener('pointerdown', ev => {
      if (ev.pointerType !== 'touch') return;
      toques.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (toques.size === 2) {
        const [p, q] = dedos();
        toque = null;
        pellizco = { d: distancia(p, q) || 1, z: a.zoomActual() };
      } else if (toques.size === 1) {
        toque = { x: ev.clientX, y: ev.clientY, c: a.celda(ev) };
      }
    });

    lienzo.addEventListener('pointermove', ev => {
      if (ev.pointerType !== 'touch' || !toques.has(ev.pointerId)) return;
      toques.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (!pellizco || toques.size !== 2) return;
      const [p, q] = dedos();
      a.zoom(Math.round(pellizco.z * distancia(p, q) / pellizco.d), medio(p, q));
    });

    function fin(ev) {
      if (ev.pointerType !== 'touch') return;
      toques.delete(ev.pointerId);
      if (toques.size < 2) pellizco = null;
      if (!toque) return;
      const movido = Math.hypot(ev.clientX - toque.x, ev.clientY - toque.y) > UMBRAL_TOQUE;
      if (!movido && ev.type === 'pointerup' && toque.c) {
        const { x, y } = toque.c;
        a.informar(a.describir(toque.c));
        a.antesDeMarcar();
        if (a.fijar(x, y, !a.estaHecho(x, y))) a.trasMarcar(); else a.descartarPaso();
      }
      toque = null;
    }
    lienzo.addEventListener('pointerup', fin);
    lienzo.addEventListener('pointercancel', fin);

    return { dedos: () => toques.size };
  }

  return { conectar, UMBRAL_TOQUE };
})();
if (typeof module !== 'undefined') module.exports = EntradaTactil; else globalThis.EntradaTactil = EntradaTactil;
