// Comprueba la sintaxis de todos los scripts (src y tests) sin ejecutarlos.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..', '..');

function buscar(carpeta) {
  const encontrados = [];
  for (const entrada of fs.readdirSync(carpeta, { withFileTypes: true })) {
    if (entrada.name === 'node_modules' || entrada.name.startsWith('.')) continue;
    const ruta = path.join(carpeta, entrada.name);
    if (entrada.isDirectory()) encontrados.push(...buscar(ruta));
    else if (entrada.name.endsWith('.js')) encontrados.push(ruta);
  }
  return encontrados;
}

const archivos = [...buscar(path.join(raiz, 'src')), ...buscar(path.join(raiz, 'tests'))];

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
