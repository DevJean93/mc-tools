// Dibujo en vivo de la portada (SIT-03): una esfera de 11 bloques que recorre sus capas sola, hecha con el
// mismo código de la app (Formas.generar y Render.dibujar) y los colores del tema activo. No es interactivo.
// Con prefers-reduced-motion se queda en una capa fija; se detiene fuera de pantalla y con la pestaña oculta.
import { Formas } from '../herramientas/formas/nucleo/formas.js';
import { Render } from '../herramientas/formas/dibujo/render.js';

export const DibujoVivo = (() => {
  const PARAMS = { forma: 'esfera', w: 11, h: 11, igualar: true, modo: 'hueco', grosor: 1, esfera: 'esfera', orient: 'plano' };
  const N = PARAMS.w;
  const CAPA_FIJA = 5;           // la capa del ecuador: la que mejor enseña la forma sin animación
  const INTERVALO = 800;         // ms entre capas (propuesta: 0,6–1 s)
  const CELDA_MIN = 16, CELDA_MAX = 26;   // desde 16 px el lienzo pinta las cifras dentro de las celdas
  const MARGEN = 52;             // regla izquierda y margen derecho que añade Render.dibujar sin opciones
  const OPCIONES = { rel: false, tramos: false, tramosDentro: false, distEjes: false };
  const TEXTO_ALTERNO = 'Dibujo de una esfera de 11 bloques de ancho, vista capa a capa de la base a la cima: ' +
    'cada capa muestra qué bloques colocar.';

  const siguienteCapa = (capa, total) => (capa + 1) % total;
  const anchoDe = s => MARGEN + N * s;
  const celdaPara = ancho => Math.max(CELDA_MIN, Math.min(CELDA_MAX, Math.floor((ancho - MARGEN) / N)));

  // Parte con DOM: `canvas` es el lienzo, `contenedor` da el ancho disponible y `pie` (opcional) recibe
  // «Capa n de N». Devuelve { parar } para los tests y la limpieza.
  function iniciar({ canvas, contenedor, pie }) {
    const { capas } = Formas.generar(PARAMS);
    const reducido = matchMedia('(prefers-reduced-motion: reduce)');
    let capa = reducido.matches ? CAPA_FIJA : 0;
    let celda = 0, visible = true, temporizador = null;

    function pintar() {
      celda = celdaPara(contenedor.clientWidth || anchoDe(CELDA_MAX));
      Render.dibujar(canvas, { g: capas[capa], capa, hechos: new Set(), s: celda, op: OPCIONES, dpr: window.devicePixelRatio || 1 });
      canvas.dataset.capa = String(capa);
      if (pie) pie.textContent = `Esfera de ${N} · Capa ${capa + 1} de ${N}`;
    }

    const debeMoverse = () => !reducido.matches && visible && !document.hidden;
    function ajustar() {
      if (debeMoverse() && temporizador === null) {
        temporizador = setInterval(() => { capa = siguienteCapa(capa, N); pintar(); }, INTERVALO);
      } else if (!debeMoverse() && temporizador !== null) {
        clearInterval(temporizador); temporizador = null;
      }
    }

    reducido.addEventListener('change', () => { capa = reducido.matches ? CAPA_FIJA : capa; pintar(); ajustar(); });
    document.addEventListener('visibilitychange', ajustar);
    document.addEventListener('mc-tema', pintar);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; ajustar(); }).observe(canvas);
    }
    let anchoPrevio = 0;
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => { const a = contenedor.clientWidth; if (a !== anchoPrevio) { anchoPrevio = a; pintar(); } }).observe(contenedor);
    }
    pintar(); ajustar();
    return { parar: () => { if (temporizador !== null) clearInterval(temporizador); temporizador = null; } };
  }

  return { PARAMS, CAPA_FIJA, INTERVALO, TEXTO_ALTERNO, siguienteCapa, anchoDe, celdaPara, iniciar };
})();
