// Exportacion a PNG de una capa o de todas. El navegador solo entra por `descargar(blob, nombre)`.
const Exportar = (() => {
  // Descarga real en el navegador: enlace temporal con el blob.
  function descargar(blob, nombre) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function crear({ render, descargar: bajar, avisos, contexto }) {
    function nombreArchivo(c, d) {
      const hueco = d.modo === 'hueco' ? `-hueco-g${d.grosor}` : '';
      const capa = d.capas.length > 1 ? `-capas${d.capas.length}-capa${c + 1}` : '';
      return `${d.variante}-${d.es3D ? d.w : d.w + 'x' + d.h}${hueco}${capa}.png`;
    }

    function capa(c) {
      return new Promise(resolve => {
        try {
          const d = contexto();
          const aux = document.createElement('canvas');
          render.dibujar(aux, {
            g: d.capas[c], capa: c, hechos: d.hechos, s: d.zoom, op: d.op, dpr: 1,
            cabecera: [
              `${d.nombre} ${d.dimensiones} · ${d.modoTexto}`,
              `Capa ${c + 1} de ${d.capas.length} · ${d.totales[c]} bloques (${d.stacks(d.totales[c])}) · construidos ${d.porCapa[c]}`,
              `Formas MC · ${new Date().toLocaleDateString('es')}`,
            ],
          });
          aux.toBlob(blob => {
            if (!blob) {
              avisos.mostrarError('No se pudo exportar la imagen (demasiado grande). Reduce el zoom y vuelve a intentarlo.');
              return resolve(false);
            }
            bajar(blob, nombreArchivo(c, d));
            resolve(true);
          }, 'image/png');
        } catch (e) {
          avisos.mostrarError(`No se pudo exportar la imagen (${e.message}). Reduce el zoom y vuelve a intentarlo.`);
          resolve(false);
        }
      });
    }

    async function todas() {
      const n = contexto().capas.length;
      if (n > 10 && !confirm(`Se descargarán ${n} imágenes, una por capa. El navegador puede pedir permiso para descargas múltiples. ¿Continuar?`)) return false;
      for (let c = 0; c < n; c++) {
        if (!(await capa(c))) return false;
        await new Promise(r => setTimeout(r, 350));
      }
      avisos.avisar(`Exportadas ${n} capa${n > 1 ? 's' : ''}.`);
      return true;
    }

    return { capa, todas };
  }

  return { crear, descargar };
})();
if (typeof module !== 'undefined') module.exports = Exportar; else globalThis.Exportar = Exportar;
