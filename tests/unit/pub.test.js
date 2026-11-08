// Publicación: versión del pie y datos de antes de la migración a Astro.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Estado } from '../../src/herramientas/formas/nucleo/estado.js';
import { Almacen } from '../../src/herramientas/formas/nucleo/almacen.js';
import { Formas } from '../../src/herramientas/formas/nucleo/formas.js';
import { versionDe } from '../../src/compartido/version.js';

const SHA = '8b03d4ea1f2c3b4d5e6f708192a3b4c5d6e7f809';

test('PUB-06: con el commit de GitHub Actions la versión es su forma corta', () => {
  assert.equal(versionDe({ GITHUB_SHA: SHA }), '8b03d4e');
});

test('PUB-06: sin commit (en local) la versión es «dev»', () => {
  assert.equal(versionDe({}), 'dev');
  assert.equal(versionDe({ GITHUB_SHA: '' }), 'dev');
});

test('PUB-06: un valor que no es un commit no se muestra', () => {
  assert.equal(versionDe({ GITHUB_SHA: 'no es un commit' }), 'dev');
  assert.equal(versionDe({ GITHUB_SHA: '<script>' }), 'dev');
});

// --- datos de antes de la migración -----------------------------------------------------------
// Cadenas de referencia escritas por la versión anterior (sin Astro) con la misma forma: cúpula
// hueca de 11, grosor 2, capa 4, y seis bloques marcados.
const GUARDADO = '{"forma":"esfera","w":11,"h":11,"igualar":true,"modo":"hueco","grosor":2,"esfera":"cupula","orient":"plano","zoom":30,"rel":false,"tramos":true,"tramosDentro":false,"distEjes":true,"guiasChunk":false,"centroX":null,"centroZ":null,"baseY":64,"capa":3}';
const MARCAS = '{"firma":"esfera|11|11|hueco|2|cupula|","porCapa":{"0":[3,0,4,0,5,0],"3":[3,1,4,1,5,1]}}';
const PROYECTO = '{"app":"formas-mc","version":1,"forma":{"forma":"esfera","w":11,"h":11,"igualar":true,"modo":"hueco","grosor":2,"esfera":"cupula","orient":"plano","capa":3},"marcas":{"firma":"esfera|11|11|hueco|2|cupula|","porCapa":{"0":[3,0,4,0,5,0],"3":[3,1,4,1,5,1]}}}';
const MARCADOS = ['0,3,0', '0,4,0', '0,5,0', '3,3,1', '3,4,1', '3,5,1'];

test('PUB-09: lo guardado en el navegador por la versión anterior (mc-formas-v1) carga igual', () => {
  const almacen = Almacen.memoria({ 'mc-formas-v1': GUARDADO, 'mc-formas-v1:marcas': MARCAS });
  const st = Estado.cargar(almacen);
  assert.deepEqual({ forma: st.forma, w: st.w, h: st.h, modo: st.modo, grosor: st.grosor, esfera: st.esfera, capa: st.capa, zoom: st.zoom, rel: st.rel, baseY: st.baseY },
    { forma: 'esfera', w: 11, h: 11, modo: 'hueco', grosor: 2, esfera: 'cupula', capa: 3, zoom: 30, rel: false, baseY: 64 });
  const firma = Estado.firma(st);
  assert.equal(firma, 'esfera|11|11|hueco|2|cupula|', 'la firma de las marcas no cambia');
  const capas = Formas.generar(st).capas;
  assert.deepEqual([...Estado.cargarMarcas(firma, capas, almacen)].sort(), MARCADOS);
});

test('PUB-09: las claves del navegador y el formato de lo guardado no cambian', () => {
  const escrito = {};
  const almacen = { persistente: true, leer: k => escrito[k] ?? null, escribir: (k, v) => { escrito[k] = v; return true; } };
  const st = Estado.cargar(Almacen.memoria({ 'mc-formas-v1': GUARDADO }));
  Estado.guardar(st, almacen);
  Estado.guardarMarcas(Estado.firma(st), new Set(MARCADOS), almacen);
  assert.deepEqual(Object.keys(escrito).sort(), ['mc-formas-v1', 'mc-formas-v1:marcas']);
  // Solo se añade la clave `bloque` (016, MAT-17), al final: todo lo anterior queda igual, byte a byte.
  assert.equal(escrito['mc-formas-v1'], GUARDADO.replace(/}$/, ',"bloque":"minecraft:stone"}'));
  assert.equal(escrito['mc-formas-v1:marcas'], MARCAS);
});

test('PUB-09: un archivo de proyecto de la versión anterior (006) se carga igual', () => {
  const r = Estado.desdeArchivo(PROYECTO);
  assert.equal(r.ok, true);
  assert.deepEqual(r.forma, { forma: 'esfera', w: 11, h: 11, igualar: true, modo: 'hueco', grosor: 2, esfera: 'cupula', orient: 'plano', capa: 3 });
  const st = { ...Estado.DEFAULTS, ...r.forma };
  const capas = Formas.generar(st).capas;
  assert.deepEqual([...Estado.marcasDesde(r.marcas, Estado.firma(st), capas)].sort(), MARCADOS);
});

test('PUB-09: guardar un proyecto hoy da el mismo archivo que la versión anterior', () => {
  const st = { ...Estado.DEFAULTS, forma: 'esfera', w: 11, h: 11, esfera: 'cupula', modo: 'hueco', grosor: 2, capa: 3 };
  assert.equal(Estado.aArchivo(st, Estado.firma(st), new Set(MARCADOS)), PROYECTO);
});

// --- despliegue -------------------------------------------------------------------------------
// No se puede ejecutar GitHub Actions aquí: se comprueba la forma del flujo (qué lo dispara, el orden
// de las comprobaciones y que cada acción lleva una versión exacta). La prueba real es el primer push a main.
const raiz = path.join(import.meta.dirname, '..', '..');
const flujo = () => fs.readFileSync(path.join(raiz, '.github', 'workflows', 'deploy.yml'), 'utf8').replace(/\r\n/g, '\n');

test('PUB-07: el despliegue solo corre al subir a main', () => {
  const y = flujo();
  const on = y.slice(y.indexOf('\non:'), y.indexOf('\njobs:'));
  assert.match(on, /push:\n\s+branches: \[main\]/);
  assert.doesNotMatch(on, /pull_request/);
});

test('PUB-07: antes de construir se comprueban tipos y pruebas, y desplegar depende de construir', () => {
  const y = flujo();
  const iCheck = y.indexOf('npm run check'), iTest = y.indexOf('npm test'), iBuild = y.indexOf('withastro/action@');
  assert.ok(iCheck > 0 && iTest > iCheck && iBuild > iTest, 'check, test y luego la construcción');
  const desplegar = y.slice(y.indexOf('\n  desplegar:'));
  assert.match(desplegar, /needs: construir/);
  assert.match(desplegar, /actions\/deploy-pages@/);
  assert.ok(y.indexOf('npm ci') > 0 && y.indexOf('npm ci') < iCheck, 'las dependencias se instalan del lockfile');
});

test('PUB-07: cada acción usada lleva una versión exacta (vX.Y.Z)', () => {
  const usos = [...flujo().matchAll(/uses: (\S+)/g)].map(m => m[1]);
  assert.ok(usos.length >= 4);
  for (const u of usos) assert.match(u, /@v\d+\.\d+\.\d+$/, `${u} sin versión exacta`);
});

test('PUB-07: Jekyll ya no aplica: no queda _config.yml', () => {
  assert.equal(fs.existsSync(path.join(raiz, '_config.yml')), false);
});
