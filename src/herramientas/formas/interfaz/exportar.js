// Exportacion a PNG de una capa o de todas. El navegador solo entra por `descargar(blob, nombre)`.
export const Exportar = (() => {
  // Descarga real en el navegador: enlace temporal con el blob.
  function descargar(blob, nombre) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // Las tres lineas de la cabecera de una capa. Con `construidos: false` (la ficha) no habla de lo hecho.
  function cabecera(d, c, { construidos = true } = {}) {
    const y = d.altura && d.altura(c) !== null ? ` · Y ${d.altura(c)}` : '';
    const hechos = construidos ? ` · construidos ${d.porCapa[c]}` : '';
    return [
      `${d.nombre} ${d.dimensiones} · ${d.modoTexto}`,
      `Capa ${c + 1} de ${d.capas.length}${y} · ${d.totales[c]} bloques (${d.stacks(d.totales[c])})${hechos}`,
      `Formas MC · ${new Date().toLocaleDateString('es')}`,
    ];
  }

  // ¿Alguna capa mide mas de `limite` bloques de ancho o de alto? (aviso de la ficha, MAT-13)
  const capaMasAnchaQue = (capas, limite) => capas.some(g => g.length > limite || (g[0] || []).length > limite);

  const LIMITE_FICHA = 60;      // bloques de ancho o alto a partir de los que una capa no se lee en un A4
  const CELDA_FICHA = 20;       // px por bloque en las imagenes de la ficha (independiente del zoom de pantalla)

  function crear({ render, descargar: bajar, avisos, contexto, ficha, imprimir, vista, materiales }) {
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
            cabecera: cabecera(d, c), relleno: d.rellenoCapa && d.rellenoCapa(c),
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

    // --- ficha imprimible (MAT-11..13) ---------------------------------------------------
    // La ficha es la forma limpia: sin marcas, materiales = total. Vive en `#ficha`, oculto en pantalla
    // y visible solo al imprimir. Cada capa es una imagen (blob URL) con la cabecera del PNG; una esfera
    // de 100 son 100 imagenes, asi que se generan una a una con un solo lienzo auxiliar y se revocan al
    // regenerar la ficha o tras imprimir.
    let ocupada = false;
    const urls = [];

    function limpiarFicha() {
      if (!ficha) return;
      ficha.textContent = '';
      while (urls.length) URL.revokeObjectURL(urls.pop());
    }

    const crearEl = (tag, clase, texto) => {
      const e = document.createElement(tag);
      if (clase) e.className = clase;
      if (texto !== undefined) e.textContent = texto;
      return e;
    };

    function paginaResumen(d) {
      const pag = crearEl('section', 'ficha-pag ficha-resumen');
      pag.appendChild(crearEl('h1', '', d.nombre));
      pag.appendChild(crearEl('p', 'ficha-datos', `${d.dimensiones} · ${d.modoTexto}`));
      const mat = crearEl('div'), tabla = crearEl('div');
      pag.append(mat, tabla);
      const totales = d.totales;
      vista.crear({ materiales: mat, tabla, barra: crearEl('div'), progreso: crearEl('span'), lienzo: null })
        .pintar(materiales.resumen(totales, totales.map(() => 0), -1, d.reparto), -1, { altura: d.altura, sinMarcas: true });
      pag.appendChild(crearEl('p', 'ficha-pie', `Formas MC · ${new Date().toLocaleDateString('es')}`));
      return pag;
    }

    function aBlob(cv) {
      return new Promise((resolve, reject) => cv.toBlob(b => (b ? resolve(b) : reject(new Error('demasiado grande'))), 'image/png'));
    }

    async function imagenCapa(d, c, aux) {
      const lineas = cabecera(d, c, { construidos: false });
      render.dibujar(aux, { g: d.capas[c], capa: c, hechos: new Set(), s: CELDA_FICHA, op: d.op, dpr: 1, cabecera: lineas, paleta: render.PAPEL, relleno: d.rellenoCapa && d.rellenoCapa(c) });   // siempre en papel (MAT-14)
      const url = URL.createObjectURL(await aBlob(aux));
      urls.push(url);
      const img = crearEl('img');
      img.alt = lineas.join(' — ');
      img.src = url;
      return img;
    }

    async function imprimirFicha() {
      if (ocupada || !ficha) return false;
      ocupada = true;
      try {
        const d = contexto();
        if (capaMasAnchaQue(d.capas, LIMITE_FICHA)) {
          avisos.avisar(`Alguna capa mide más de ${LIMITE_FICHA} bloques: en un A4 sus cifras no se leerán (menos de 3 mm por bloque). Para imprimir legible, mejor el PNG por capa.`, null, 9000);
        }
        limpiarFicha();
        const resumen = paginaResumen(d), aux = document.createElement('canvas'), imgs = [];
        ficha.appendChild(resumen);
        for (let c = 0; c < d.capas.length; c++) {
          const img = await imagenCapa(d, c, aux);
          imgs.push(img);
          const fig = crearEl('figure', d.capas.length > 1 ? 'ficha-pag ficha-capa' : 'ficha-dibujo');
          fig.appendChild(img);
          if (d.capas.length > 1) ficha.appendChild(fig); else resumen.appendChild(fig);
        }
        await Promise.all(imgs.map(i => i.decode()));
        await new Promise(r => setTimeout(r, 80));   // deja pintar el aviso antes de que el dialogo bloquee la pagina
        imprimir();
        return true;
      } catch (e) {
        limpiarFicha();
        avisos.mostrarError(`No se pudo preparar la ficha (${e.message}).`);
        return false;
      } finally {
        ocupada = false;
      }
    }

    return { capa, todas, ficha: imprimirFicha, limpiarFicha };
  }

  return { crear, descargar, cabecera, capaMasAnchaQue };
})();
