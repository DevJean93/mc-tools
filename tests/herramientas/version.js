// Version de los archivos que carga index.html: una huella de su contenido en cada direccion local
// (?v=…) y en el pie, para que un navegador con la app guardada descargue lo nuevo al desplegar.
// Uso: npm run versionar  (calcula la huella y sella index.html; no hace nada si ya esta al dia).
// Las funciones son puras (texto de entrada, texto de salida) y se prueban sin tocar el disco.
const crypto = require('crypto');

const PIE = /(<span id="version">)[^<]*(<\/span>)/;
const ETIQUETA = /<(link|script)\b[^>]*>/g;
const externa = ruta => /^(https?:)?\/\//.test(ruta);

// Atributo con la direccion de una etiqueta: el href de una hoja de estilos o el src de un script.
function atributo(etiqueta, tipo) {
  if (tipo === 'link' && !/\brel="stylesheet"/.test(etiqueta)) return null;
  const m = etiqueta.match(tipo === 'link' ? /\bhref="([^"]*)"/ : /\bsrc="([^"]*)"/);
  return m ? m[1] : null;
}

// Direcciones locales en orden de carga: { ruta, v } (v es null si no lleva version).
function locales(html) {
  const lista = [];
  for (const [etiqueta, tipo] of html.matchAll(ETIQUETA)) {
    const dir = atributo(etiqueta, tipo);
    if (!dir || externa(dir)) continue;
    const [ruta, consulta = ''] = dir.split('?');
    const v = new URLSearchParams(consulta).get('v');
    lista.push({ ruta, v });
  }
  return lista;
}

// index.html sin sus marcas de version, para que la huella no dependa de si misma.
function marcasFuera(html) {
  return sellar(html, '').replace(PIE, '$1$2');
}

const lf = texto => texto.replace(/\r\n?/g, '\n');

// SHA-256 de index.html sin marcas y de cada archivo local con su ruta delante, con los saltos de
// linea en LF (git guarda LF; en Windows la copia de trabajo tiene CRLF). 8 hexadecimales.
function huella(html, leer) {
  const h = crypto.createHash('sha256');
  h.update('index.html\n' + lf(marcasFuera(html)));
  for (const { ruta } of locales(html)) h.update('\n\0' + ruta + '\n' + lf(leer(ruta)));
  return h.digest('hex').slice(0, 8);
}

// Pone ?v=<v> en cada direccion local (sustituye la que hubiera) y «Versión <v>» en el pie.
// Con v vacio quita las marcas. Las direcciones externas no se tocan.
function sellar(html, v) {
  const conDirecciones = html.replace(ETIQUETA, (etiqueta, tipo) => {
    const dir = atributo(etiqueta, tipo);
    if (!dir || externa(dir)) return etiqueta;
    const ruta = dir.split('?')[0];
    return etiqueta.replace(`"${dir}"`, `"${v ? `${ruta}?v=${v}` : ruta}"`);
  });
  return conDirecciones.replace(PIE, `$1${v ? `Versión ${v}` : ''}$2`);
}

// Problemas de version de index.html (lista vacia si esta al dia).
function revisar(html, leer) {
  const problemas = [];
  const lista = locales(html);
  for (const { ruta, v } of lista) if (!v) problemas.push(`Sin versión: ${ruta}`);
  const versiones = [...new Set(lista.filter(l => l.v).map(l => l.v))];
  if (versiones.length > 1) {
    const comun = versiones.sort((a, b) => lista.filter(l => l.v === b).length - lista.filter(l => l.v === a).length)[0];
    const otras = lista.filter(l => l.v && l.v !== comun).map(l => `${l.ruta} (${l.v})`);
    problemas.push(`Versiones distintas: la mayoría lleva ${comun}, pero ${otras.join(', ')} no.`);
  }
  const pie = html.match(/<span id="version">Versión ([^<]*)<\/span>/);
  const v = versiones.length === 1 ? versiones[0] : null;
  if (!pie) problemas.push('Falta la versión del pie (<span id="version">Versión …</span>).');
  else if (v && pie[1] !== v) problemas.push(`La versión del pie (${pie[1]}) no es la de las direcciones (${v}).`);
  const actual = huella(html, leer);
  if (v && v !== actual) problemas.push(`La versión no está al día (es ${v} y debería ser ${actual}): ejecuta npm run versionar.`);
  return problemas;
}

if (require.main === module) {
  const fs = require('fs'), path = require('path');
  const raiz = path.join(__dirname, '..', '..');
  const archivo = path.join(raiz, 'index.html');
  const html = fs.readFileSync(archivo, 'utf8');
  const leer = ruta => fs.readFileSync(path.join(raiz, ruta), 'utf8');
  const v = huella(html, leer);
  const nuevo = sellar(html, v);
  if (nuevo === html) console.log(`Versión ${v}: index.html ya estaba al día.`);
  else { fs.writeFileSync(archivo, nuevo); console.log(`Versión ${v}: index.html actualizado.`); }
}

module.exports = { locales, marcasFuera, huella, sellar, revisar };
