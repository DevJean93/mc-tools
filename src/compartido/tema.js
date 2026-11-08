// Tema claro u oscuro (INT-16, INT-17): el tema es el atributo `data-tema` de <html>; el CSS y el lienzo
// lo leen de ahí. Sin elección guardada se sigue `prefers-color-scheme` (también en vivo); al tocar el
// botón la elección se guarda en `mc-tema` y manda desde entonces. El script en línea del <head> de
// Base.astro hace lo mismo antes de pintar (sin destello); esto añade el botón y el seguimiento en vivo.
export const Tema = (() => {
  const CLAVE = 'mc-tema';
  // Color de la barra del navegador (<meta name="theme-color">): el fondo de la cabecera de cada tema.
  const COLOR = { oscuro: '#1B2336', claro: '#FFFFFF' };

  const esTema = v => v === 'claro' || v === 'oscuro';
  const resolver = (guardado, sistemaClaro) => (esTema(guardado) ? guardado : (sistemaClaro ? 'claro' : 'oscuro'));
  const otro = tema => (tema === 'claro' ? 'oscuro' : 'claro');
  const etiqueta = tema => `Cambiar a tema ${otro(tema)}`;

  // raiz: <html>; boton: el botón de tema; almacen: Almacen; media: matchMedia('(prefers-color-scheme: light)');
  // meta: <meta name="theme-color">; documento: donde se avisa del cambio (evento `mc-tema`).
  function iniciar({ raiz, boton, almacen, media, meta, documento }) {
    let elegido = esTema(almacen.leer(CLAVE));

    function aplicar(tema) {
      raiz.dataset.tema = tema;
      if (meta) meta.content = COLOR[tema];
      if (boton) {
        boton.setAttribute('aria-label', etiqueta(tema));
        boton.setAttribute('aria-pressed', String(tema === 'oscuro'));
      }
      if (documento) documento.dispatchEvent(new CustomEvent('mc-tema', { detail: { tema } }));
    }

    aplicar(resolver(almacen.leer(CLAVE), media.matches));
    if (boton) boton.addEventListener('click', () => {
      const nuevo = otro(raiz.dataset.tema);
      elegido = true;
      almacen.escribir(CLAVE, nuevo);   // si no deja guardar, el cambio vale igual durante la visita
      aplicar(nuevo);
    });
    media.addEventListener('change', e => { if (!elegido) aplicar(e.matches ? 'claro' : 'oscuro'); });
    return { aplicar };
  }

  return { CLAVE, COLOR, resolver, otro, etiqueta, iniciar };
})();
