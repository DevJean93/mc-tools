// Comprueba la sintaxis de todos los scripts (raiz y tests) sin ejecutarlos.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const archivos = [
  ...fs.readdirSync(raiz).filter(f => f.endsWith('.js')).map(f => path.join(raiz, f)),
  ...fs.readdirSync(__dirname).filter(f => f.endsWith('.js')).map(f => path.join(__dirname, f)),
];

let fallos = 0;
for (const archivo of archivos) {
  try {
    new vm.Script(fs.readFileSync(archivo, 'utf8'), { filename: archivo });
  } catch (e) {
    fallos++;
    console.error(`FALLO ${path.relative(raiz, archivo)}: ${e.message}`);
  }
}
console.log(`${archivos.length - fallos}/${archivos.length} scripts con sintaxis válida`);
process.exit(fallos ? 1 : 0);
