// Entrada tactil. El lienzo usa touch-action: none, asi que el navegador no se lleva el
// gesto: lo resolvemos aqui.
//   1 dedo  -> desplaza el contenedor (y la pagina si el contenedor ya no puede moverse);
//              si apenas se movio, es un toque y marca la celda.
//   2 dedos -> pellizco con zoom anclado al punto medio; si la distancia no cambia, los
//              dedos desplazan el dibujo. Los dedos pueden llegar en momentos distintos.
// Las acciones se inyectan: no conoce el estado ni el resto de entradas.
const EntradaTactil = (() => {
  const UMBRAL_TOQUE = 10;   // px de movimiento que convierten un toque en arrastre

  function conectar({ lienzo, contenedor, limites, acciones }) {
    const a = acciones;
    const limitar = (v, min, max) => Math.max(min, Math.min(max, v));
    const toques = new Map();   // id -> { x, y } ultima posicion de cada dedo
    let toque = null;           // { id, x0, y0, c } dedo que puede acabar en toque corto
    let pellizco = null;        // { d, z, mx, my } distancia, zoom y punto medio de partida

    const dedos = () => [...toques.values()];
    const distancia = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
    const medio = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });

    // Arrastra el dibujo. Lo que el contenedor ya no puede desplazar, lo desplaza la pagina.
    function desplazar(dx, dy) {
      const l0 = contenedor.scrollLeft, t0 = contenedor.scrollTop;
      contenedor.scrollLeft = l0 - dx;
      contenedor.scrollTop = t0 - dy;
      const restoY = -dy - (contenedor.scrollTop - t0);
      if (restoY) window.scrollBy(0, restoY);
    }

    function empezarPellizco() {
      const [p, q] = dedos();
      const m = medio(p, q);
      pellizco = { d: Math.max(1, distancia(p, q)), z: a.zoomActual(), mx: m.x, my: m.y };
      toque = null;
    }

    function seguirPellizco() {
      const [p, q] = dedos();
      const m = medio(p, q);
      // Primero los dedos mueven el dibujo: el punto medio manda y la celda que estaba
      // debajo sigue debajo al cambiar el zoom (que se ancla al nuevo punto medio).
      desplazar(m.x - pellizco.mx, m.y - pellizco.my);
      pellizco.mx = m.x; pellizco.my = m.y;
      // El zoom se recorta ya aqui: en los limites, el pellizco sigue moviendo el dibujo.
      const nuevo = limitar(Math.round(pellizco.z * distancia(p, q) / pellizco.d), limites.zoomMin, limites.zoomMax);
      if (nuevo !== a.zoomActual()) a.zoom(nuevo, { clientX: m.x, clientY: m.y });
    }

    lienzo.addEventListener('pointerdown', ev => {
      if (ev.pointerType !== 'touch') return;
      ev.preventDefault();
      try { lienzo.setPointerCapture(ev.pointerId); } catch (e) { /* sin captura */ }
      toques.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });

      if (toques.size === 2) empezarPellizco();
      else if (toques.size === 1) toque = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, c: a.celda(ev) };
      else { toque = null; pellizco = null; }   // tres o mas dedos: se ignora el gesto
    });

    lienzo.addEventListener('pointermove', ev => {
      if (ev.pointerType !== 'touch') return;
      const t = toques.get(ev.pointerId);
      if (!t) return;
      const dx = ev.clientX - t.x, dy = ev.clientY - t.y;
      t.x = ev.clientX; t.y = ev.clientY;

      if (pellizco && toques.size === 2) seguirPellizco();
      else if (toques.size === 1) desplazar(dx, dy);
    });

    function fin(ev) {
      if (ev.pointerType !== 'touch') return;
      toques.delete(ev.pointerId);
      try { lienzo.releasePointerCapture(ev.pointerId); } catch (e) { /* ya liberado */ }
      if (toques.size < 2) pellizco = null;

      // Toque corto (sin arrastrar ni pellizcar): marca o desmarca la celda.
      const corto = ev.type === 'pointerup' && toque && toque.id === ev.pointerId && toque.c &&
        Math.hypot(ev.clientX - toque.x0, ev.clientY - toque.y0) <= UMBRAL_TOQUE;
      const celda = corto ? toque.c : null;
      toque = null;
      if (!celda) return;

      a.informar(a.describir(celda));
      a.antesDeMarcar();
      if (a.fijar(celda.x, celda.y, !a.estaHecho(celda.x, celda.y))) a.trasMarcar();
      else a.descartarPaso();
    }
    lienzo.addEventListener('pointerup', fin);
    lienzo.addEventListener('pointercancel', fin);

    return { dedos: () => toques.size, pellizcando: () => !!pellizco };
  }

  return { conectar, UMBRAL_TOQUE };
})();
if (typeof module !== 'undefined') module.exports = EntradaTactil; else globalThis.EntradaTactil = EntradaTactil;
