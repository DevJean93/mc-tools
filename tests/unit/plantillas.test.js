// Plantillas: formas guardadas con nombre en el navegador (FOR-20, FOR-22, FOR-23).
import { test } from 'vitest';
import assert from 'node:assert';
import { Plantillas } from '../../src/herramientas/formas/nucleo/plantillas.js';
import { Estado } from '../../src/herramientas/formas/nucleo/estado.js';
import { Almacen } from '../../src/herramientas/formas/nucleo/almacen.js';

const cupula = () => ({ ...Estado.cargar(Almacen.memoria()), forma: 'esfera', esfera: 'cupula', w: 30, modo: 'hueco', grosor: 2 });
const KEY = 'mc-plantillas-v1';

test('FOR-20: guarda solo los parametros de la forma, sin marcas, capa, zoom ni vista', () => {
  const almacen = Almacen.memoria(), p = Plantillas.crear({ almacen });
  const st = { ...cupula(), capa: 3, zoom: 40, rel: false, centroX: 5, baseY: 64 };
  const r = p.guardar('Cúpula grande', st);
  assert.equal(r.ok, true);
  const [una] = p.lista();
  assert.equal(una.nombre, 'Cúpula grande');
  assert.deepEqual(Object.keys(una.forma).sort(), [...Estado.CLAVES_GEO].sort());
  assert.equal(una.forma.esfera, 'cupula'); assert.equal(una.forma.w, 30); assert.equal(una.forma.modo, 'hueco'); assert.equal(una.forma.grosor, 2);
  assert.equal(una.reparto, undefined);
  const crudo = almacen.leer(KEY);
  assert.ok(!/zoom|capa|centroX|baseY|hechos|marcas/.test(crudo), 'nada de capa, zoom ni vista en lo guardado');
});

test('FOR-20: guarda el reparto de materiales solo cuando lo hay (y el bloque con el)', () => {
  const p = Plantillas.crear({ almacen: Almacen.memoria() });
  p.guardar('Solo forma', { ...cupula(), bloque: 'minecraft:glass', relleno: '' });
  p.guardar('Igual', { ...cupula(), bloque: 'minecraft:glass', relleno: 'minecraft:glass' });
  p.guardar('Con reparto', { ...cupula(), bloque: 'minecraft:bricks', relleno: 'minecraft:stone' });
  const [a, b, c] = p.lista();
  assert.equal(a.reparto, undefined); assert.equal(b.reparto, undefined);
  assert.deepEqual(c.reparto, { borde: 'minecraft:bricks', relleno: 'minecraft:stone' });
  assert.ok(!JSON.stringify(a).includes('glass'), 'sin reparto no se guarda el bloque');
});

test('FOR-20: el nombre se recorta y va de 1 a 40 caracteres', () => {
  const p = Plantillas.crear({ almacen: Almacen.memoria() });
  assert.equal(p.guardar('   ', cupula()).ok, false);
  assert.equal(p.guardar('', cupula()).motivo, 'nombre');
  assert.equal(p.guardar('x'.repeat(41), cupula()).motivo, 'nombre');
  assert.equal(p.guardar(null, cupula()).ok, false);
  assert.equal(p.guardar('x'.repeat(40), cupula()).ok, true);
  assert.equal(p.guardar('  Torre  ', cupula()).ok, true);
  assert.deepEqual(p.lista().map(t => t.nombre), ['x'.repeat(40), 'Torre']);
  assert.match(p.guardar('', cupula()).mensaje, /1 a 40/);
});

test('FOR-20: guardar con un nombre que ya existe sustituye esa plantilla en su sitio', () => {
  const p = Plantillas.crear({ almacen: Almacen.memoria() });
  p.guardar('A', cupula()); p.guardar('B', cupula());
  const r = p.guardar('A', { ...cupula(), w: 12 });
  assert.equal(r.ok, true); assert.equal(r.sustituida, true);
  assert.equal(r.anterior.forma.w, 30);
  assert.deepEqual(p.lista().map(t => t.nombre), ['A', 'B']);
  assert.equal(p.lista()[0].forma.w, 12);
  assert.equal(p.guardar('C', cupula()).sustituida, false);
});

test('FOR-22: borrar quita la plantilla y devuelve lo necesario para reponerla en su sitio', () => {
  const p = Plantillas.crear({ almacen: Almacen.memoria() });
  for (const n of ['A', 'B', 'C']) p.guardar(n, cupula());
  const r = p.borrar('B');
  assert.equal(r.ok, true); assert.equal(r.indice, 1);
  assert.deepEqual(p.lista().map(t => t.nombre), ['A', 'C']);
  assert.equal(p.borrar('no existe').ok, false);
  p.reponer(r.plantilla, r.indice);
  assert.deepEqual(p.lista().map(t => t.nombre), ['A', 'B', 'C']);
});

test('FOR-22: reponer una sustituida devuelve la anterior', () => {
  const p = Plantillas.crear({ almacen: Almacen.memoria() });
  p.guardar('A', cupula());
  const r = p.guardar('A', { ...cupula(), w: 12 });
  p.reponer(r.anterior);
  assert.equal(p.lista().length, 1); assert.equal(p.lista()[0].forma.w, 30);
});

test('FOR-22: con 20 plantillas no se guarda una nueva (y dice por que) pero si se sustituye una', () => {
  const almacen = Almacen.memoria(), p = Plantillas.crear({ almacen });
  for (let i = 1; i <= 20; i++) assert.equal(p.guardar('P' + i, cupula()).ok, true);
  const r = p.guardar('Una más', cupula());
  assert.equal(r.ok, false); assert.equal(r.motivo, 'lleno');
  assert.match(r.mensaje, /20/); assert.match(r.mensaje, /borra/i);
  assert.equal(p.lista().length, 20);
  assert.equal(p.guardar('P7', { ...cupula(), w: 9 }).ok, true);
  assert.equal(p.lista().length, 20); assert.equal(p.lista()[6].forma.w, 9);
  // Deshacer un borrado cuando ya no hay sitio no pasa de 20.
  const b = p.borrar('P1'); p.guardar('Otra', cupula());
  assert.equal(p.reponer(b.plantilla, b.indice).ok, false);
  assert.equal(p.lista().length, 20);
});

test('FOR-23: usa su propia clave, no toca mc-formas-v1* y sigue ahi al recrear', () => {
  const almacen = Almacen.memoria({ 'mc-formas-v1': '{"w":20}', 'mc-formas-v1:marcas': '{"firma":"x"}' });
  const p = Plantillas.crear({ almacen });
  assert.equal(p.guardar('Torre', { ...cupula(), bloque: 'minecraft:bricks', relleno: 'minecraft:stone' }).guardado, true);
  assert.equal(Plantillas.KEY, KEY);
  assert.equal(almacen.leer('mc-formas-v1'), '{"w":20}');
  assert.equal(almacen.leer('mc-formas-v1:marcas'), '{"firma":"x"}');
  const otra = Plantillas.crear({ almacen });
  assert.deepEqual(otra.lista(), p.lista());
  assert.equal(otra.lista()[0].reparto.borde, 'minecraft:bricks');
});

test('FOR-23: datos guardados corruptos o con plantillas invalidas se ignoran sin romper nada', () => {
  for (const crudo of ['no es json', '{', '[]', '"x"', '123', 'null', '{"plantillas":5}']) {
    assert.deepEqual(Plantillas.crear({ almacen: Almacen.memoria({ [KEY]: crudo }) }).lista(), [], crudo);
  }
  const mezcla = { version: 1, plantillas: [
    { nombre: 'Buena', forma: { forma: 'circulo', w: 20, h: 20, igualar: true, modo: 'relleno', grosor: 1 } },
    { nombre: '', forma: { forma: 'circulo' } },
    { nombre: 'x'.repeat(41), forma: { forma: 'circulo' } },
    { nombre: 7, forma: { forma: 'circulo' } },
    { nombre: 'Sin forma' },
    { nombre: 'Forma mala', forma: 'texto' },
    null, 'texto', 5, [],
    { nombre: 'Buena', forma: { forma: 'circulo', w: 99 } },
    { nombre: ' Recortes ', forma: { forma: 'esfera', w: 9999, modo: 'raro', esfera: 'nada' }, reparto: { borde: 'minecraft:mala', relleno: 'minecraft:stone' } },
  ] };
  const p = Plantillas.crear({ almacen: Almacen.memoria({ [KEY]: JSON.stringify(mezcla) }) });
  assert.deepEqual(p.lista().map(t => t.nombre), ['Buena', 'Recortes']);
  assert.equal(p.lista()[0].forma.w, 20);
  assert.equal(p.lista()[1].forma.w, 100, 'los valores se validan como en el enlace (recortados)');
  assert.equal(p.lista()[1].forma.modo, 'relleno');
  assert.equal(p.lista()[1].reparto, undefined, 'un reparto con un bloque fuera de la lista se descarta');
  // Y la app puede seguir guardando.
  assert.equal(p.guardar('Nueva', cupula()).ok, true);
});

test('FOR-23: se leen como mucho 20 aunque lo guardado lleve mas', () => {
  const muchas = Array.from({ length: 30 }, (_, i) => ({ nombre: 'P' + i, forma: { forma: 'circulo' } }));
  const p = Plantillas.crear({ almacen: Almacen.memoria({ [KEY]: JSON.stringify({ version: 1, plantillas: muchas }) }) });
  assert.equal(p.lista().length, 20);
});

test('FOR-23: si el navegador no deja guardar, guardar lo dice (la lista sigue en memoria esa sesion)', () => {
  const p = Plantillas.crear({ almacen: Almacen.desde(null) });
  const r = p.guardar('Torre', cupula());
  assert.equal(r.ok, true); assert.equal(r.guardado, false);
  assert.equal(p.lista().length, 1);
  const sin = Plantillas.crear({ almacen: { leer: () => { throw new Error('x'); }, escribir: () => false } });
  assert.deepEqual(sin.lista(), []);
});
