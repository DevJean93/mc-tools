// Zoom del dibujo: niveles, anclaje al puntero, ajuste a la ventana y alejado automatico.
// No conoce el estado global: pide el zoom actual y lo fija con funciones inyectadas.
const Zoom = (() => {
  const Estado = typeof module !== 'undefined' ? require('./estado.js') : globalThis.Estado;
  const NIVELES = [2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48];

  function crear({ lienzo, contenedor, medir, geometria, obtener, definir, control, redibujar, guardar, opciones, capa, limites }) {
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
      const { w, h } = espacioVisible(), g = capa();
      for (let s = limites.zoomMax; s > limites.zoomMin; s--) {
        const m = medir(g, s, opciones());
        if (m.W <= w && m.H <= h) return s;
      }
      return limites.zoomMin;
    }

    // Cambia el zoom manteniendo quieta la celda bajo el punto (clientX/Y); sin punto, el centro visible.
    function fijar(nuevo, punto) {
      nuevo = Estado.clamp(nuevo, limites.zoomMin, limites.zoomMax);
      const g0 = geometria();
      if (!g0 || nuevo === obtener()) return;
      const r = lienzo.getBoundingClientRect(), rw = contenedor.getBoundingClientRect();
      const px = (punto ? punto.clientX : rw.left + rw.width / 2) - r.left;
      const py = (punto ? punto.clientY : rw.top + rw.height / 2) - r.top;
      const fx = (px - g0.L) / g0.s, fy = (py - g0.T) / g0.s;
      definir(nuevo);
      if (control) control.value = nuevo;
      redibujar();
      const g1 = geometria();
      contenedor.scrollLeft += g1.L + fx * g1.s - px;
      contenedor.scrollTop += g1.T + fy * g1.s - py;
      if (guardar) guardar();
    }

    function paso(dir, punto) {
      const actual = obtener();
      const n = dir > 0
        ? NIVELES.find(v => v > actual) || limites.zoomMax
        : [...NIVELES].reverse().find(v => v < actual) || limites.zoomMin;
      fijar(n, punto);
    }

    function ajustar() {
      fijar(zoomAjustado());
      contenedor.scrollLeft = 0;
      contenedor.scrollTop = 0;
    }

    // Al crecer la forma: si ya no cabe, alejar hasta que quepa (nunca acerca solo).
    function alejarSiNoCabe() {
      const g = capa();
      const { w, h } = espacioVisible(), m = medir(g, obtener(), opciones());
      if (m.W <= w && m.H <= h) return;
      const s = zoomAjustado();
      if (s < obtener()) { fijar(s); contenedor.scrollLeft = 0; contenedor.scrollTop = 0; }
    }

    return { fijar, paso, ajustar, alejarSiNoCabe };
  }

  return { crear };
})();
if (typeof module !== 'undefined') module.exports = Zoom; else globalThis.Zoom = Zoom;
