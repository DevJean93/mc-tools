// Version de los archivos: huella del contenido en las direcciones locales de index.html y en el pie.
const test = require('node:test');
const assert = require('node:assert/strict');
const Version = require('../herramientas/version.js');

// Un index.html pequeño: una hoja de estilos local, las fuentes externas, dos scripts y el pie.
const HTML = [
  '<link rel="stylesheet" href="https://fonts.example/css?family=X">',
  '<link rel="stylesheet" href="src/estilos.css">',
  '<footer class="pie">Pie · <span id="version">Versión </span></footer>',
  '<script src="src/a.js"></script>',
  '<script src="src/b.js"></script>',
].join('\n');
const ARCHIVOS = { 'src/estilos.css': 'body{}\n', 'src/a.js': 'var a = 1;\n', 'src/b.js': 'var b = 2;\n' };
const leer = (archivos = ARCHIVOS) => ruta => {
  if (!(ruta in archivos)) throw new Error('no existe ' + ruta);
  return archivos[ruta];
};
// Huella de referencia de HTML + ARCHIVOS: fija el algoritmo (SHA-256 de index.html sin marcas y de cada
// archivo local con su ruta delante, saltos de linea en LF, 8 primeros hexadecimales). Sin marcas
// quiere decir sin ?v= en las direcciones y con el <span id="version"> del pie vacio.
const HUELLA_REF = '8017bf12';

test('PUB-01: las direcciones locales son la hoja de estilos y los scripts, en orden, sin las externas', () => {
  assert.deepEqual(Version.locales(HTML).map(l => l.ruta), ['src/estilos.css', 'src/a.js', 'src/b.js']);
});

test('PUB-01: sellar pone la version en las locales y no toca las externas', () => {
  const sellado = Version.sellar(HTML, 'abc12345');
  assert.match(sellado, /href="src\/estilos\.css\?v=abc12345"/);
  assert.match(sellado, /src="src\/a\.js\?v=abc12345"/);
  assert.match(sellado, /src="src\/b\.js\?v=abc12345"/);
  assert.match(sellado, /href="https:\/\/fonts\.example\/css\?family=X"/);
  assert.deepEqual(Version.locales(sellado).map(l => l.v), ['abc12345', 'abc12345', 'abc12345']);
});

test('PUB-02: la huella de un caso pequeño es la de referencia', () => {
  assert.equal(Version.huella(HTML, leer()), HUELLA_REF);
});

test('PUB-02: la huella cambia si cambia un script o solo el HTML', () => {
  assert.notEqual(Version.huella(HTML, leer({ ...ARCHIVOS, 'src/b.js': 'var b = 3;\n' })), HUELLA_REF);
  assert.notEqual(Version.huella(HTML.replace('Pie', 'Otro pie'), leer()), HUELLA_REF);
});

test('PUB-02: la huella no depende de las propias marcas de version', () => {
  assert.equal(Version.huella(Version.sellar(HTML, 'abc12345'), leer()), HUELLA_REF);
  assert.equal(Version.huella(Version.sellar(HTML, '00000000'), leer()), HUELLA_REF);
});

test('PUB-02: CRLF y LF dan la misma huella', () => {
  const crlf = {};
  for (const [k, v] of Object.entries(ARCHIVOS)) crlf[k] = v.replace(/\n/g, '\r\n');
  assert.equal(Version.huella(HTML.replace(/\n/g, '\r\n'), leer(crlf)), HUELLA_REF);
});

test('PUB-02: sellar es idempotente y sustituye una version vieja', () => {
  const una = Version.sellar(HTML, 'abc12345');
  assert.equal(Version.sellar(una, 'abc12345'), una);
  const otra = Version.sellar(una, 'def67890');
  assert.doesNotMatch(otra, /abc12345/);
  assert.match(otra, /<span id="version">Versión def67890<\/span>/);
});

test('PUB-02: sellar conserva los saltos de linea CRLF del archivo', () => {
  const crlf = HTML.replace(/\n/g, '\r\n');
  const sellado = Version.sellar(crlf, 'abc12345');
  assert.equal(sellado.split('\r\n').length, crlf.split('\r\n').length);
});

test('PUB-03: un index.html sellado con la huella actual no tiene problemas', () => {
  assert.deepEqual(Version.revisar(Version.sellar(HTML, HUELLA_REF), leer()), []);
});

test('PUB-03: una direccion local sin version se informa con su nombre', () => {
  const sellado = Version.sellar(HTML, HUELLA_REF).replace(`src/a.js?v=${HUELLA_REF}`, 'src/a.js');
  assert.ok(Version.revisar(sellado, leer()).some(p => p.includes('src/a.js')));
});

test('PUB-03: versiones distintas entre direcciones se informan', () => {
  const sellado = Version.sellar(HTML, HUELLA_REF).replace(`src/b.js?v=${HUELLA_REF}`, 'src/b.js?v=11111111');
  assert.ok(Version.revisar(sellado, leer()).some(p => /distintas/.test(p) && p.includes('src/b.js')));
});

test('PUB-03: un pie sin version o con otra se informa', () => {
  const sinPie = Version.sellar(HTML, HUELLA_REF).replace(/<span id="version">[^<]*<\/span>/, '');
  assert.ok(Version.revisar(sinPie, leer()).some(p => /pie/.test(p)));
  const otroPie = Version.sellar(HTML, HUELLA_REF).replace(`Versión ${HUELLA_REF}`, 'Versión 22222222');
  assert.ok(Version.revisar(otroPie, leer()).some(p => /pie/.test(p)));
});

test('PUB-03: una version que no es la huella actual dice que hay que ejecutar npm run versionar', () => {
  const viejo = Version.sellar(HTML, HUELLA_REF);
  const problemas = Version.revisar(viejo, leer({ ...ARCHIVOS, 'src/a.js': 'var a = 9;\n' }));
  assert.ok(problemas.some(p => /no está al día/.test(p) && /npm run versionar/.test(p)), problemas.join(' | '));
});

test('PUB-03: el index.html del repositorio esta al dia (si falla, ejecuta npm run versionar)', () => {
  const fs = require('fs'), path = require('path');
  const raiz = path.join(__dirname, '..', '..');
  const leerRepo = ruta => fs.readFileSync(path.join(raiz, ruta), 'utf8');
  const problemas = Version.revisar(leerRepo('index.html'), leerRepo);
  assert.deepEqual(problemas, [], problemas.join('\n'));
});
