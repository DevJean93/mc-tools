// Comprueba la sintaxis de todos los scripts (src y tests) sin ejecutarlos.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

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
  // node --check entiende tanto scripts clasicos como modulos ES (los tests ya usan import).
  const r = spawnSync(process.execPath, ['--check', archivo], { encoding: 'utf8' });
  if (r.status !== 0) {
    fallos++;
    console.error(`FALLO ${path.relative(raiz, archivo)}: ${r.stderr}`);
  }
}
console.log(`${archivos.length - fallos}/${archivos.length} scripts con sintaxis válida`);
process.exit(fallos ? 1 : 0);
