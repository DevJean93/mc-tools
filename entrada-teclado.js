// Entrada de teclado: cursor de celdas, marcar, capas, zoom y atajos de deshacer.
// El cursor vive aqui; la app solo lo consulta para dibujarlo.
const EntradaTeclado = (() => {
  function conectar({ lienzo, acciones, documento = document }) {
    const a = acciones;
    let cursor = null;

    lienzo.addEventListener('focus', () => {
      if (!cursor) cursor = a.cursorInicial();
      a.dibujar();
    });
    lienzo.addEventListener('blur', () => a.dibujar());

    lienzo.addEventListener('keydown', ev => {
      const { w, h } = a.dimensionesCapa();
      if (!cursor) cursor = a.cursorInicial();
      const paso = ev.shiftKey ? 5 : 1;
      switch (ev.key) {
        case 'ArrowLeft': cursor.x = Math.max(0, cursor.x - paso); break;
        case 'ArrowRight': cursor.x = Math.min(w - 1, cursor.x + paso); break;
        case 'ArrowUp': cursor.y = Math.max(0, cursor.y - paso); break;
        case 'ArrowDown': cursor.y = Math.min(h - 1, cursor.y + paso); break;
        case '+': case '=': ev.preventDefault(); a.pasoZoom(1); return;
        case '-': ev.preventDefault(); a.pasoZoom(-1); return;
        case '0': ev.preventDefault(); a.ajustarZoom(); return;
        case 'PageUp': ev.preventDefault(); a.irCapa(a.capaActual() + 1); a.anunciar(a.capaTexto()); return;
        case 'PageDown': ev.preventDefault(); a.irCapa(a.capaActual() - 1); a.anunciar(a.capaTexto()); return;
        case ' ': case 'Enter': {
          const { x, y } = cursor;
          if (!a.hayBloque(x, y)) { a.anunciar('Celda vacía: no hay bloque que marcar.'); ev.preventDefault(); return; }
          a.antesDeMarcar();
          a.fijar(x, y, !a.estaHecho(x, y));
          a.trasMarcar();
          break;
        }
        default: return;
      }
      ev.preventDefault();
      const txt = a.describir(cursor);
      a.informar(txt);
      a.anunciar(txt);
      a.dibujar();
      a.verCursor(cursor);
    });

    documento.addEventListener('keydown', ev => {
      const enCampo = ev.target instanceof Element && ev.target.matches('input[type=number], select');
      if (!(ev.ctrlKey || ev.metaKey) || enCampo) return;
      const k = ev.key.toLowerCase();
      if (k === 'z' && !ev.shiftKey) { ev.preventDefault(); a.deshacer(); }
      else if (k === 'y' || (k === 'z' && ev.shiftKey)) { ev.preventDefault(); a.rehacer(); }
    });

    return {
      cursor: () => cursor,
      // Tras regenerar: el cursor no puede quedar fuera de la nueva rejilla.
      restringir(w, h) { if (cursor) cursor = { x: Math.min(cursor.x, w - 1), y: Math.min(cursor.y, h - 1) }; },
    };
  }

  return { conectar };
})();
if (typeof module !== 'undefined') module.exports = EntradaTeclado; else globalThis.EntradaTeclado = EntradaTeclado;
