// Entrada de teclado: cursor de celdas, marcar, capas, zoom y atajos de deshacer.
// El cursor vive aqui; la app solo lo consulta para dibujarlo.
// Recibe solo los grupos de acciones que usa (dibujo, marcas, zoom, capas, historial).
const EntradaTeclado = (() => {
  function conectar({ lienzo, dibujo, marcas, zoom, capas, historial, documento = document }) {
    let cursor = null;

    lienzo.addEventListener('focus', () => {
      if (!cursor) cursor = dibujo.cursorInicial();
      dibujo.dibujar();
    });
    lienzo.addEventListener('blur', () => dibujo.dibujar());

    lienzo.addEventListener('keydown', ev => {
      const { w, h } = dibujo.dimensionesCapa();
      if (!cursor) cursor = dibujo.cursorInicial();
      const paso = ev.shiftKey ? 5 : 1;
      switch (ev.key) {
        case 'ArrowLeft': cursor.x = Math.max(0, cursor.x - paso); break;
        case 'ArrowRight': cursor.x = Math.min(w - 1, cursor.x + paso); break;
        case 'ArrowUp': cursor.y = Math.max(0, cursor.y - paso); break;
        case 'ArrowDown': cursor.y = Math.min(h - 1, cursor.y + paso); break;
        case '+': case '=': ev.preventDefault(); zoom.pasoZoom(1); return;
        case '-': ev.preventDefault(); zoom.pasoZoom(-1); return;
        case '0': ev.preventDefault(); zoom.ajustarZoom(); return;
        case 'PageUp': ev.preventDefault(); capas.irCapa(capas.capaActual() + 1); dibujo.anunciar(capas.capaTexto()); return;
        case 'PageDown': ev.preventDefault(); capas.irCapa(capas.capaActual() - 1); dibujo.anunciar(capas.capaTexto()); return;
        case 'f': case 'F': case 'c': case 'C': {
          if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
          const eje = ev.key.toLowerCase() === 'f' ? 'fila' : 'columna';
          const i = eje === 'fila' ? cursor.y : cursor.x;
          const r = marcas.marcarLinea(eje, i);
          dibujo.anunciarLinea(eje, i, r);
          ev.preventDefault();
          dibujo.dibujar();
          return;
        }
        case ' ': case 'Enter': {
          const { x, y } = cursor;
          if (!marcas.hayBloque(x, y)) { dibujo.anunciar('Celda vacía: no hay bloque que marcar.'); ev.preventDefault(); return; }
          marcas.antesDeMarcar();
          marcas.fijar(x, y, !marcas.estaHecho(x, y));
          marcas.trasMarcar();
          break;
        }
        default: return;
      }
      ev.preventDefault();
      const txt = dibujo.describir(cursor);
      dibujo.informar(txt);
      dibujo.anunciar(txt);
      dibujo.dibujar();
      dibujo.verCursor(cursor);
    });

    documento.addEventListener('keydown', ev => {
      const enCampo = ev.target instanceof Element && ev.target.matches('input[type=number], select');
      if (!(ev.ctrlKey || ev.metaKey) || enCampo) return;
      const k = ev.key.toLowerCase();
      if (k === 'z' && !ev.shiftKey) { ev.preventDefault(); historial.deshacer(); }
      else if (k === 'y' || (k === 'z' && ev.shiftKey)) { ev.preventDefault(); historial.rehacer(); }
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
