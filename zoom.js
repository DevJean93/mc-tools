// Zoom del dibujo: anclaje al puntero, ajuste a la ventana y alejado automatico.
// No conoce el estado global: mide y consulta la geometria por `dibujo`, pide y fija el
// zoom por `zoom` (obtener/fijar); avisa del redibujo con `alDibujar()`.
const Zoom = (() => {
  const Estado = typeof module !== 'undefined' ? require('./estado.js') : globalThis.Estado;
  const NIVELES = [2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48];

  function crear({ lienzo, contenedor, limites, dibujo, zoom, alDibujar }) {
    // Espacio util del contenedor del dibujo (su alto maximo, no el actual).
    function espacioVisible() {
      const cs = getComputedStyle(contenedor);
      const padH = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const padV = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + 2;
      const maxH = parseFloat(cs.maxHeight);
      return {
        w: contenedor.clientWidth - padH,
        h: (Number.isFinite(maxH) ? maxH : window.innerHeight * 0.6) - padV,
      };
    }

    // Mayor zoom con el que la capa actual cabe entera.
    function zoomAjustado() {
      const { w, h } = espacioVisible();
      for (let s = limites.zoomMax; s > limites.zoomMin; s--) {
        const m = dibujo.medir(s);
        if (m.W <= w && m.H <= h) return s;
      }
      return limites.zoomMin;
    }

    // Cambia el zoom manteniendo quieta la celda bajo el punto (clientX/Y); sin punto, el centro visible.
    function aplicar(nuevo, punto) {
      nuevo = Estado.clamp(nuevo, limites.zoomMin, limites.zoomMax);
      const g0 = dibujo.geometria();
      if (!g0 || nuevo === zoom.obtener()) return;
      const r = lienzo.getBoundingClientRect(), rw = contenedor.getBoundingClientRect();
      const px = (punto ? punto.clientX : rw.left + rw.width / 2) - r.left;
      const py = (punto ? punto.clientY : rw.top + rw.height / 2) - r.top;
      const fx = (px - g0.L) / g0.s, fy = (py - g0.T) / g0.s;
      zoom.fijar(nuevo);
      alDibujar();
      const g1 = dibujo.geometria();
      contenedor.scrollLeft += g1.L + fx * g1.s - px;
      contenedor.scrollTop += g1.T + fy * g1.s - py;
    }

    function paso(dir, punto) {
      const actual = zoom.obtener();
      const n = dir > 0
        ? NIVELES.find(v => v > actual) || limites.zoomMax
        : [...NIVELES].reverse().find(v => v < actual) || limites.zoomMin;
      aplicar(n, punto);
    }

    function ajustar() {
      aplicar(zoomAjustado());
      contenedor.scrollLeft = 0;
      contenedor.scrollTop = 0;
    }

    // Al crecer la forma: si ya no cabe, alejar hasta que quepa (nunca acerca solo).
    function alejarSiNoCabe() {
      const { w, h } = espacioVisible(), m = dibujo.medir(zoom.obtener());
      if (m.W <= w && m.H <= h) return;
      const s = zoomAjustado();
      if (s < zoom.obtener()) { aplicar(s); contenedor.scrollLeft = 0; contenedor.scrollTop = 0; }
    }

    return { aplicar, paso, ajustar, alejarSiNoCabe };
  }

  return { crear };
})();
if (typeof module !== 'undefined') module.exports = Zoom; else globalThis.Zoom = Zoom;
