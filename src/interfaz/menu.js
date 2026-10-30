// Menu lateral: mostrar/ocultar en escritorio (con preferencia recordada), hoja a pantalla
// completa en movil, foco, Escape y barra inferior de secciones.
const Menu = (() => {
  const CLAVE = 'mc-formas-v1:menu';

  function crear({ panel, boton, botonTexto, cerrar, nav, main, cuerpo, almacen, clave = CLAVE, consulta = '(max-width: 800px)' }) {
    const enlaces = [...nav];
    const visibles = new Map();   // seccion -> fraccion visible (para la barra inferior)
    const movil = matchMedia(consulta);

    const pref = () => almacen.leer(clave) !== '0';

    function marcarNav() {
      let mejor = 'secDibujo';
      if (!panel.hidden) {
        let max = 0;
        for (const [id, r] of visibles) if (id !== 'secDibujo' && r > max) { max = r; mejor = id; }
        if (!max) mejor = 'secForma';
      }
      for (const a of enlaces) {
        if (a.hash === '#' + mejor) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      }
    }

    function mostrar(visible) {
      panel.hidden = !visible;
      main.classList.toggle('sin-menu', !visible);
      cuerpo.classList.toggle('menu-abierto', visible && movil.matches);
      boton.setAttribute('aria-expanded', String(visible));
      botonTexto.textContent = visible ? 'Ocultar menú' : 'Mostrar menú';
      if (!movil.matches) almacen.escribir(clave, visible ? '1' : '0');
      marcarNav();
    }

    // En movil el foco va al boton Cerrar al abrir y vuelve al de la cabecera al cerrar.
    function abrirCerrar(visible) {
      mostrar(visible);
      if (movil.matches) (visible ? cerrar : boton).focus({ preventScroll: true });
    }

    boton.addEventListener('click', () => abrirCerrar(panel.hidden));
    cerrar.addEventListener('click', () => abrirCerrar(false));
    document.addEventListener('keydown', ev => {
      if (ev.key === 'Escape' && movil.matches && !panel.hidden) abrirCerrar(false);
    });
    movil.addEventListener('change', () => mostrar(movil.matches ? false : pref()));

    // Barra inferior: Dibujo cierra el menu; Forma y Materiales lo abren en su seccion.
    const suave = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
    for (const a of enlaces) {
      a.addEventListener('click', ev => {
        ev.preventDefault();
        const destino = document.getElementById(a.hash.slice(1)), enPanel = panel.contains(destino);
        if (panel.hidden === enPanel) mostrar(enPanel);
        destino.scrollIntoView({ block: 'start', behavior: suave() });
        for (const b of enlaces) {
          if (b === a) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
        }
      });
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entradas => {
        for (const e of entradas) visibles.set(e.target.id, e.intersectionRatio);
        marcarNav();
      }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
      for (const a of enlaces) io.observe(document.getElementById(a.hash.slice(1)));
    }

    mostrar(movil.matches ? false : pref());
    return { mostrar, abrirCerrar, movil, marcarNav };
  }

  return { crear, CLAVE };
})();
if (typeof module !== 'undefined') module.exports = Menu; else globalThis.Menu = Menu;
