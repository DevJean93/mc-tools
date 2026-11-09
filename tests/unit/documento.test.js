// Flujo del documento: generar, marcas, historial, capas y guardado.
import { test } from 'vitest';
import assert from 'node:assert';
import { Documento } from '../../src/herramientas/formas/nucleo/documento.js';
import { Estado } from '../../src/herramientas/formas/nucleo/estado.js';
import { Almacen } from '../../src/herramientas/formas/nucleo/almacen.js';

function montar(almacen = Almacen.memoria()) {
  const st = Estado.cargar(almacen);
  const avisos = {
    dichos: [],
    acciones: [],       // acciones ofrecidas por los avisos (p. ej. Deshacer)
    notas: [],          // notas fijas visibles, en orden (null = se ocultó)
    nota(t) { this.notas.push(t); },
    ocultarNota() { this.notas.push(null); },
    avisar(t, accion) { this.dichos.push(t); this.acciones.push(accion); },
    anunciar(t) { this.dichos.push(t); },
    ocultarError() {},
    mostrarError(t) { this.dichos.push(t); },
  };
  const cambios = [];
  const doc = Documento.crear({
    st, almacen, avisos, panel: { leer() {}, poner() {} },
    alCambiar: () => cambios.push('vista'),
    alCambiarTamano: () => cambios.push('tamano'),
    alRestringir: () => {},
  });
  return { st, almacen, avisos, doc, cambios };
}

const primerBloque = doc => {
  const g = doc.capaActual();
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (g[y][x]) return { x, y };
  throw new Error('la capa no tiene bloques');
};

test('regenerar genera la forma y avisa del cambio de tamano', () => {
  const { doc, cambios } = montar();
  doc.regenerar();
  assert.equal(doc.capas().length, 1);
  assert.equal(doc.capaActual().length, 16);
  assert.equal(doc.totales()[0], 208);
  assert.deepEqual(cambios, ['vista', 'tamano']);
});

test('MAR-05: las marcas guardadas se recuperan al arrancar', () => {
  const primero = montar();
  primero.doc.regenerar();
  const c = primerBloque(primero.doc);
  primero.doc.antesDeMarcar();
  assert.equal(primero.doc.fijar(c.x, c.y, true), true);
  primero.doc.trasMarcar();

  const segundo = montar(primero.almacen);
  segundo.doc.regenerar();
  assert.equal(segundo.doc.hecho(c.x, c.y), true);
  assert.equal(segundo.doc.porCapa(1)[0], 1);
});

test('MAR-05: cambiar la geometria limpia las marcas y deshacer las devuelve', () => {
  const { st, doc, avisos } = montar();
  doc.regenerar();
  const c = primerBloque(doc);
  doc.antesDeMarcar();
  doc.fijar(c.x, c.y, true);
  doc.trasMarcar();

  st.w = 20; st.h = 20;
  doc.regenerar();
  assert.equal(doc.porCapa(1)[0], 0, 'la forma nueva empieza sin marcas');
  assert.ok(avisos.dichos.some(t => t.includes('se limpiaron las marcas')));

  doc.deshacer();
  assert.equal(st.w, 16);
  assert.equal(doc.hecho(c.x, c.y), true);
});

test('MAR-04: marcar capa se puede deshacer y rehacer', () => {
  const { doc } = montar();
  doc.regenerar();
  doc.marcarCapas(doc.todas(), true);
  assert.equal(doc.porCapa(1)[0], 208);
  assert.equal(doc.puedeDeshacer(), true);

  doc.deshacer();
  assert.equal(doc.porCapa(1)[0], 0);
  assert.equal(doc.puedeRehacer(), true);

  doc.rehacer();
  assert.equal(doc.porCapa(1)[0], 208);
});

test('MAR-04: una accion que no cambia nada no ocupa historial', () => {
  const { doc } = montar();
  doc.regenerar();
  const c = primerBloque(doc);
  doc.antesDeMarcar();
  doc.fijar(c.x, c.y, false);   // ya estaba vacio: no hay cambio
  doc.descartarPaso();
  assert.equal(doc.puedeDeshacer(), false);
});

test('MAR-16: marcar una fila es un solo paso de deshacer y el aviso ofrece Deshacer', () => {
  const { doc, avisos } = montar();
  doc.regenerar();
  const r = doc.marcarLinea('fila', 7);
  assert.deepEqual(r, { valor: true, n: 16, bloques: 16 });
  assert.equal(doc.porCapa(1)[0], 16);
  assert.ok(avisos.dichos.some(t => t.includes('16') && t.includes('fila 8')));
  assert.equal(typeof avisos.acciones.at(-1), 'function', 'el aviso ofrece una accion');

  avisos.acciones.at(-1)();
  assert.equal(doc.porCapa(1)[0], 0, 'un solo paso lo devuelve todo');
  doc.rehacer();
  assert.equal(doc.porCapa(1)[0], 16);
});

test('MAR-16: volver a alternar la misma fila la desmarca entera', () => {
  const { doc } = montar();
  doc.regenerar();
  doc.marcarLinea('fila', 7);
  const r = doc.marcarLinea('fila', 7);
  assert.deepEqual(r, { valor: false, n: 16, bloques: 16 });
  assert.equal(doc.porCapa(1)[0], 0);
});

test('MAR-16: marcar una columna tambien es un solo paso', () => {
  const { doc } = montar();
  doc.regenerar();
  const r = doc.marcarLinea('columna', 7);
  assert.deepEqual(r, { valor: true, n: 16, bloques: 16 });
  assert.equal(doc.porCapa(1)[0], 16);
  doc.deshacer();
  assert.equal(doc.porCapa(1)[0], 0);
});

test('MAR-18: una linea sin bloques no deja historial ni aviso', () => {
  const { doc, avisos } = montar();
  doc.regenerar();
  const antes = avisos.dichos.length;
  assert.deepEqual(doc.marcarLinea('fila', 999), { valor: true, n: 0, bloques: 0 });
  assert.deepEqual(doc.marcarLinea('columna', 999), { valor: true, n: 0, bloques: 0 });
  assert.equal(doc.puedeDeshacer(), false);
  assert.equal(avisos.dichos.length, antes);
});

test('FOR-04: el grosor se recorta y se avisa', () => {
  const { st, doc, avisos } = montar();
  st.w = 6; st.h = 6; st.modo = 'hueco'; st.grosor = 50;
  doc.regenerar();
  assert.ok(st.grosor < 50);
  assert.ok(avisos.dichos.some(t => t.includes('Grosor máximo')));
});

test('MAR-13: irCapa recorta al rango y guarda la capa', () => {
  const { st, doc, almacen } = montar();
  st.forma = 'esfera'; st.w = 8;
  doc.regenerar();
  assert.ok(doc.capas().length > 1);

  doc.irCapa(999);
  assert.equal(doc.capa(), doc.capas().length - 1);
  assert.equal(JSON.parse(almacen.leer('mc-formas-v1')).capa, doc.capa());

  doc.irCapa(-5);
  assert.equal(doc.capa(), 0);
});

test('MAR-09: sin almacenamiento persistente muestra una sola nota fija desde el arranque', () => {
  const almacen = { persistente: false, leer: () => null, escribir: () => false };
  const { doc, avisos } = montar(almacen);
  assert.equal(avisos.notas.length, 1, 'la nota sale al crear el documento');
  assert.match(avisos.notas[0], /bloquea el almacenamiento/);
  doc.regenerar();
  doc.marcarCapas(doc.todas(), true);
  assert.equal(avisos.notas.length, 1, 'no se repite');
  assert.ok(!avisos.dichos.some(t => /almacenamiento/.test(t)), 'no es un aviso temporal');
});

test('MAR-09: la nota de almacenamiento no la tapa el aviso de grosor recortado', () => {
  const almacen = { persistente: false, leer: () => null, escribir: () => false };
  const { st, doc, avisos } = montar(almacen);
  st.w = 6; st.h = 6; st.modo = 'hueco'; st.grosor = 50;
  doc.regenerar();
  assert.ok(avisos.dichos.some(t => t.includes('Grosor máximo')), 'el aviso de grosor sigue ahi');
  assert.match(avisos.notas[0], /bloquea el almacenamiento/, 'y la nota fija tambien');
});

test('MAR-09: almacenamiento lleno: la nota sale al primer fallo y se quita al volver a guardar', () => {
  let cabe = false;
  const datos = new Map();
  const almacen = {
    persistente: true,
    leer: k => (datos.has(k) ? datos.get(k) : null),
    escribir: (k, v) => { if (!cabe) return false; datos.set(k, v); return true; },
  };
  const { doc, avisos } = montar(almacen);
  assert.deepEqual(avisos.notas, [], 'un almacen lleno pero legible no avisa hasta que falla un guardado');
  doc.regenerar();
  assert.equal(avisos.notas.length, 1);
  assert.match(avisos.notas[0], /lleno/);
  doc.marcarCapas(doc.todas(), true);
  assert.equal(avisos.notas.length, 1, 'no se repite en cada guardado fallido');

  cabe = true;
  doc.marcarCapas(doc.todas(), false);
  assert.equal(avisos.notas[avisos.notas.length - 1], null, 'al volver a haber sitio la nota se oculta');
});

// --- proyecto: guardar y cargar un archivo (cambio 006) ---------------------------------------
// Un documento con una forma y unas marcas, listo para guardarse.
function conMarcas(forma = { forma: 'circulo', w: 16, h: 16 }) {
  const m = montar();
  Object.assign(m.st, forma);
  m.doc.regenerar();
  const g = m.doc.capaActual();
  let n = 0;
  for (let y = 0; y < g.length && n < 3; y++) for (let x = 0; x < g[0].length && n < 3; x++) {
    if (g[y][x]) { m.doc.antesDeMarcar(); m.doc.fijar(x, y, true); m.doc.trasMarcar(); n++; }
  }
  return m;
}
const clavesHechas = doc => [...doc.hechos()].sort();

test('MAR-20: cargar un proyecto aplica la forma y las marcas del archivo y las guarda en el navegador', () => {
  const origen = conMarcas({ forma: 'circulo', w: 16, h: 16 });
  const { texto } = origen.doc.proyecto();
  const destino = montar();
  Object.assign(destino.st, { forma: 'rectangulo', w: 6, h: 5, igualar: false });
  destino.doc.regenerar();

  const r = destino.doc.cargarProyecto(texto);
  assert.equal(r.ok, true);
  assert.equal(destino.st.forma, 'circulo');
  assert.equal(destino.st.w, 16);
  assert.deepEqual(clavesHechas(destino.doc), clavesHechas(origen.doc));
  assert.equal(JSON.parse(destino.almacen.leer('mc-formas-v1')).forma, 'circulo', 'se guarda en el navegador');
  const guardadas = JSON.parse(destino.almacen.leer('mc-formas-v1:marcas'));
  assert.equal(guardadas.firma, 'circulo|16|16|relleno|||');
});

test('MAR-20: tras cargar sale un aviso con el boton Deshacer', () => {
  const { texto } = conMarcas().doc.proyecto();
  const d = montar(); d.doc.regenerar();
  d.doc.cargarProyecto(texto);
  assert.match(d.avisos.dichos[d.avisos.dichos.length - 1], /^Proyecto cargado/);
  assert.equal(typeof d.avisos.acciones[d.avisos.acciones.length - 1], 'function', 'el aviso ofrece Deshacer');
});

test('MAR-20: un solo Deshacer devuelve de una vez la forma y las marcas anteriores, y Rehacer vuelve al proyecto', () => {
  const { texto } = conMarcas({ forma: 'circulo', w: 16, h: 16 }).doc.proyecto();
  const d = conMarcas({ forma: 'rectangulo', w: 6, h: 5, igualar: false });
  const antes = { forma: d.st.forma, w: d.st.w, h: d.st.h, hechos: clavesHechas(d.doc) };

  d.doc.cargarProyecto(texto);
  assert.equal(d.st.forma, 'circulo');
  d.doc.deshacer();
  assert.deepEqual({ forma: d.st.forma, w: d.st.w, h: d.st.h, hechos: clavesHechas(d.doc) }, antes);
  d.doc.rehacer();
  assert.equal(d.st.forma, 'circulo');
  assert.equal(d.doc.hechos().size, 3);
});

test('MAR-20: cargar apila un solo paso de historial (no uno por cada cosa que cambia)', () => {
  const { texto } = conMarcas().doc.proyecto();
  const d = montar(); d.doc.regenerar();
  d.doc.cargarProyecto(texto);
  d.doc.deshacer();
  assert.equal(d.doc.puedeDeshacer(), false, 'un Deshacer basta');
});

test('MAR-20: cargar no toca el zoom ni las opciones de vista del dispositivo', () => {
  const { texto } = conMarcas().doc.proyecto();
  const d = montar();
  Object.assign(d.st, { zoom: 40, rel: false, tramos: false, distEjes: false });
  d.doc.regenerar();
  d.doc.cargarProyecto(texto);
  assert.equal(d.st.zoom, 40);
  assert.deepEqual([d.st.rel, d.st.tramos, d.st.distEjes], [false, false, false]);
});

test('MAR-19, MAR-20: guardar y cargar es una ida y vuelta exacta, tambien en una esfera con capa', () => {
  const o = conMarcas({ forma: 'esfera', w: 8 });
  o.doc.irCapa(3);
  const { texto, nombre } = o.doc.proyecto();
  assert.equal(nombre, 'formas-mc-esfera-8.json');
  const d = montar(); d.doc.regenerar();
  d.doc.cargarProyecto(texto);
  assert.equal(d.st.forma, 'esfera');
  assert.equal(d.st.capa, 3, 'la capa actual viaja en el archivo');
  assert.deepEqual(clavesHechas(d.doc), clavesHechas(o.doc));
  assert.equal(d.doc.proyecto().texto, texto, 'volver a guardar da el mismo archivo');
});

test('MAR-21: un archivo que no es un proyecto no cambia nada, no apila historial y avisa', () => {
  const d = conMarcas();
  const antes = { forma: d.st.forma, hechos: clavesHechas(d.doc) };
  const pasos = d.doc.puedeDeshacer();
  const r = d.doc.cargarProyecto('{"esto":"no es un proyecto"}');
  assert.equal(r.ok, false);
  assert.deepEqual({ forma: d.st.forma, hechos: clavesHechas(d.doc) }, antes);
  assert.equal(d.doc.puedeDeshacer(), pasos, 'no ocupa un paso de historial');
  assert.match(d.avisos.dichos[d.avisos.dichos.length - 1], /^No es un proyecto de Formas MC/);
  assert.equal(d.avisos.acciones[d.avisos.acciones.length - 1], undefined, 'un error no ofrece Deshacer');
});

test('MAR-21: un archivo de una version mas nueva se rechaza sin cambiar nada', () => {
  const d = conMarcas();
  const antes = clavesHechas(d.doc);
  const r = d.doc.cargarProyecto(JSON.stringify({ app: 'formas-mc', version: 99, forma: { forma: 'rombo', w: 9, h: 9 } }));
  assert.equal(r.ok, false);
  assert.equal(d.st.forma, 'circulo');
  assert.deepEqual(clavesHechas(d.doc), antes);
  assert.match(d.avisos.dichos[d.avisos.dichos.length - 1], /versión más nueva/);
});

test('MAR-21: unas marcas que no corresponden a la forma del archivo se descartan y se avisa', () => {
  const marcas = { firma: 'rombo|9|9|relleno|||', porCapa: { 0: [4, 4] } };   // la firma no es la de la forma
  const texto = JSON.stringify({ app: 'formas-mc', version: 1, forma: { forma: 'circulo', w: 16, h: 16 }, marcas });
  const d = conMarcas();
  const r = d.doc.cargarProyecto(texto);
  assert.equal(r.ok, true);
  assert.equal(d.st.forma, 'circulo');
  assert.equal(d.doc.hechos().size, 0, 'las marcas ajenas no entran');
  assert.match(d.avisos.dichos[d.avisos.dichos.length - 1], /descartaron/);
  assert.equal(typeof d.avisos.acciones[d.avisos.acciones.length - 1], 'function', 'sigue pudiendo deshacerse');
});

test('MAR-21: las marcas del archivo se validan contra la forma generada (celdas inexistentes fuera)', () => {
  const firma = 'circulo|16|16|relleno|||';
  const marcas = { firma, porCapa: { 0: [8, 8, 0, 0, 99, 99], 5: [1, 1] } };   // (0,0) esta vacio en un circulo; las otras no existen
  const texto = JSON.stringify({ app: 'formas-mc', version: 1, forma: { forma: 'circulo', w: 16, h: 16 }, marcas });
  const d = montar(); d.doc.regenerar();
  d.doc.cargarProyecto(texto);
  assert.deepEqual(clavesHechas(d.doc), ['0,8,8']);
});

test('MAR-22: guardar y cargar un proyecto funciona aunque el navegador no deje guardar', () => {
  const sinGuardar = () => ({ persistente: false, leer: () => null, escribir: () => false });
  const o = montar(sinGuardar());
  o.doc.regenerar();
  const g = o.doc.capaActual(); const { x, y } = primerBloque(o.doc);
  o.doc.antesDeMarcar(); o.doc.fijar(x, y, true); o.doc.trasMarcar();
  const { texto } = o.doc.proyecto();

  const d = montar(sinGuardar()); d.st.forma = 'rombo'; d.st.w = 9; d.st.h = 9; d.doc.regenerar();
  const r = d.doc.cargarProyecto(texto);
  assert.equal(r.ok, true);
  assert.equal(d.st.forma, 'circulo');
  assert.equal(d.doc.hechos().size, 1);
  assert.equal(d.avisos.notas.length, 1, 'la nota fija de almacenamiento sigue ahi, una sola vez');
  assert.ok(g.length > 0);
});

// --- enlace para compartir: abrir la forma de un enlace (cambio 007) ----------------------------
const MSG_ENLACE = 'Se abrió la forma del enlace. Tu progreso anterior se borró.';
const ultimoAviso = d => d.avisos.dichos[d.avisos.dichos.length - 1];
const forma = d => ({ forma: d.st.forma, w: d.st.w, h: d.st.h, modo: d.st.modo, grosor: d.st.grosor, capa: d.st.capa });

test('FOR-16: el documento da el enlace de su forma actual', () => {
  const d = conMarcas({ forma: 'circulo', w: 30, h: 30, modo: 'hueco', grosor: 2 });
  assert.equal(d.doc.enlace(), 'forma=circulo&w=30&h=30&igualar=1&modo=hueco&grosor=2&esfera=esfera&orient=plano&capa=0');
});

test('FOR-17: abrir un enlace aplica la forma y la guarda en el navegador', () => {
  const d = montar(); d.doc.regenerar();
  assert.equal(d.doc.abrirEnlace('forma=rombo&w=20&modo=hueco&grosor=3'), true);
  assert.deepEqual(forma(d), { forma: 'rombo', w: 20, h: 20, modo: 'hueco', grosor: 3, capa: 0 });
  assert.equal(JSON.parse(d.almacen.leer('mc-formas-v1')).forma, 'rombo');
  assert.equal(d.doc.capaActual().length, 20);
});

test('FOR-17: los valores no validos del enlace se recortan y no fallan', () => {
  const d = montar(); d.doc.regenerar();
  assert.equal(d.doc.abrirEnlace('forma=nada&w=999&grosor=-3'), true);
  assert.deepEqual(forma(d), { forma: 'circulo', w: 200, h: 200, modo: 'relleno', grosor: 1, capa: 0 });
});

test('FOR-17: abrir un enlace no toca el zoom ni las opciones de vista', () => {
  const d = montar(); d.doc.regenerar();
  Object.assign(d.st, { zoom: 40, rel: false, tramos: false, distEjes: false });
  d.doc.abrirEnlace('forma=rombo&w=20&zoom=10&rel=1');
  assert.deepEqual([d.st.zoom, d.st.rel, d.st.tramos, d.st.distEjes], [40, false, false, false]);
});

test('FOR-17: un fragmento que no es de forma no cambia nada, ni historial ni aviso', () => {
  const d = conMarcas();
  const antes = { f: forma(d), hechos: clavesHechas(d.doc), avisos: d.avisos.dichos.length };
  const pasos = () => { let n = 0; while (d.doc.puedeDeshacer()) { d.doc.deshacer(); n++; } while (d.doc.puedeRehacer()) d.doc.rehacer(); return n; };
  const pasosAntes = pasos();
  for (const f of ['', 'hola', 'x=1']) assert.equal(d.doc.abrirEnlace(f), false, f);
  assert.deepEqual({ f: forma(d), hechos: clavesHechas(d.doc) }, { f: antes.f, hechos: antes.hechos });
  assert.equal(pasos(), pasosAntes, 'el historial queda igual');
});

test('FOR-18: con marcas y otra geometria, se borran y sale el aviso con Deshacer', () => {
  const d = conMarcas({ forma: 'circulo', w: 16, h: 16 });
  const total = d.doc.hechos().size;
  assert.ok(total > 0);
  d.doc.abrirEnlace('forma=rombo&w=20');
  assert.equal(d.doc.hechos().size, 0);
  assert.equal(ultimoAviso(d), MSG_ENLACE);
  assert.equal(typeof d.avisos.acciones[d.avisos.acciones.length - 1], 'function', 'el aviso ofrece Deshacer');
  assert.equal(JSON.parse(d.almacen.leer('mc-formas-v1:marcas')).firma, 'rombo|20|20|relleno|||');
});

test('FOR-18: un solo Deshacer devuelve la forma y las marcas anteriores', () => {
  const d = conMarcas({ forma: 'circulo', w: 16, h: 16 });
  const antes = { f: forma(d), hechos: clavesHechas(d.doc) };
  d.doc.abrirEnlace('forma=rombo&w=20');
  d.avisos.acciones[d.avisos.acciones.length - 1]();   // el boton «Deshacer» del aviso
  assert.deepEqual({ f: forma(d), hechos: clavesHechas(d.doc) }, antes);
  d.doc.rehacer();
  assert.equal(d.st.forma, 'rombo');
  assert.equal(d.doc.hechos().size, 0);
});

test('FOR-18: con la misma geometria las marcas se conservan y no hay aviso', () => {
  const d = conMarcas({ forma: 'circulo', w: 16, h: 16 });
  const hechos = clavesHechas(d.doc), avisos = d.avisos.dichos.length;
  d.doc.abrirEnlace('forma=circulo&w=16&h=16&igualar=1&modo=relleno&capa=0');
  assert.deepEqual(clavesHechas(d.doc), hechos);
  assert.equal(d.avisos.dichos.length, avisos, 'no sale ningun aviso');
});

test('FOR-18: sin marcas no hay aviso al cambiar de forma', () => {
  const d = montar(); d.doc.regenerar();
  const avisos = d.avisos.dichos.length;
  d.doc.abrirEnlace('forma=rombo&w=20');
  assert.equal(d.st.forma, 'rombo');
  assert.equal(d.avisos.dichos.length, avisos);
});

test('FOR-18: un enlace que deja todo igual no ocupa historial', () => {
  const d = montar(); d.doc.regenerar();
  assert.equal(d.doc.puedeDeshacer(), false);
  d.doc.abrirEnlace(d.doc.enlace());
  assert.equal(d.doc.puedeDeshacer(), false);
});

test('FOR-18: abrir el enlace ocupa un solo paso de historial', () => {
  const d = conMarcas({ forma: 'circulo', w: 16, h: 16 });
  const lleno = d.doc.hechos().size;
  d.doc.abrirEnlace('forma=rombo&w=20');
  d.doc.deshacer();
  assert.equal(d.st.forma, 'circulo');
  assert.equal(d.doc.hechos().size, lleno);
  d.doc.deshacer();   // el siguiente paso ya es de las marcas, no de abrir el enlace
  assert.equal(d.st.forma, 'circulo');
  assert.equal(d.doc.hechos().size, lleno - 1);
});

test('FOR-18: un enlace que acaba en la misma geometria tras normalizarla conserva las marcas (regresion)', () => {
  // Con «igualar» el alto vuelve al ancho; en hueco el grosor se recorta al maximo. Ninguno cambia la
  // forma final, asi que las marcas no se pueden perder (antes se borraban sin aviso ni Deshacer).
  const d = conMarcas({ forma: 'circulo', w: 16, h: 16 });
  const hechos = clavesHechas(d.doc), avisos = d.avisos.dichos.length;
  d.doc.abrirEnlace('forma=circulo&w=16&h=10&igualar=1');
  assert.deepEqual(clavesHechas(d.doc), hechos, 'alto distinto con igualar');
  assert.equal(d.avisos.dichos.length, avisos, 'sin aviso');

  const h = conMarcas({ forma: 'circulo', w: 16, h: 16, modo: 'hueco', grosor: 7 });   // 7 es el maximo
  const hechosHueco = clavesHechas(h.doc);
  assert.ok(hechosHueco.length > 0);
  h.doc.abrirEnlace('forma=circulo&w=16&h=16&igualar=1&modo=hueco&grosor=50');
  assert.equal(h.st.grosor, 7);
  assert.deepEqual(clavesHechas(h.doc), hechosHueco, 'grosor por encima del maximo');
});

// --- importar un esquema de Litematica (cambio 016) -----------------------------------------------
const MSG_ESQUEMA_PIERDE = 'Se importó la forma del esquema. Tu progreso anterior se borró.';
const esquema = (enlace, bloque = 'minecraft:stone') => ({ ok: true, forma: Estado.desdeEnlace(enlace), bloque });

test('FOR-19: importar un esquema aplica la forma y el bloque y los guarda en el navegador', () => {
  const d = montar(); d.doc.regenerar();
  assert.equal(d.doc.importarEsquema(esquema('forma=rombo&w=20&modo=hueco&grosor=3', 'minecraft:glass')), true);
  assert.deepEqual(forma(d), { forma: 'rombo', w: 20, h: 20, modo: 'hueco', grosor: 3, capa: 0 });
  assert.equal(d.st.bloque, 'minecraft:glass');
  const guardado = JSON.parse(d.almacen.leer('mc-formas-v1'));
  assert.equal(guardado.forma, 'rombo');
  assert.equal(guardado.bloque, 'minecraft:glass');
  assert.equal(d.doc.capaActual().length, 20);
});

test('FOR-19: con marcas y otra geometria se borran y sale el aviso con Deshacer', () => {
  const d = conMarcas({ forma: 'circulo', w: 16, h: 16 });
  assert.ok(d.doc.hechos().size > 0);
  d.doc.importarEsquema(esquema('forma=rombo&w=20'));
  assert.equal(d.doc.hechos().size, 0);
  assert.equal(ultimoAviso(d), MSG_ESQUEMA_PIERDE);
  assert.equal(typeof d.avisos.acciones[d.avisos.acciones.length - 1], 'function', 'el aviso ofrece Deshacer');
});

test('FOR-19: un solo Deshacer devuelve la forma y las marcas anteriores', () => {
  const d = conMarcas({ forma: 'circulo', w: 16, h: 16 });
  const antes = { f: forma(d), hechos: clavesHechas(d.doc) };
  d.doc.importarEsquema(esquema('forma=rombo&w=20'));
  d.avisos.acciones[d.avisos.acciones.length - 1]();
  assert.deepEqual({ f: forma(d), hechos: clavesHechas(d.doc) }, antes);
});

test('FOR-19: importar ocupa un solo paso de historial', () => {
  const d = conMarcas({ forma: 'circulo', w: 16, h: 16 });
  const lleno = d.doc.hechos().size;
  d.doc.importarEsquema(esquema('forma=rombo&w=20'));
  d.doc.deshacer();
  assert.equal(d.st.forma, 'circulo');
  assert.equal(d.doc.hechos().size, lleno);
  d.doc.deshacer();   // el siguiente paso ya es de las marcas
  assert.equal(d.doc.hechos().size, lleno - 1);
});

test('FOR-19: con la misma geometria las marcas se conservan y solo dice que se importo', () => {
  const d = conMarcas({ forma: 'circulo', w: 16, h: 16 });
  const hechos = clavesHechas(d.doc);
  d.doc.importarEsquema(esquema('forma=circulo&w=16&h=16&igualar=1&modo=relleno&capa=0', 'minecraft:bricks'));
  assert.deepEqual(clavesHechas(d.doc), hechos);
  assert.equal(ultimoAviso(d), 'Esquema importado.');
  assert.equal(d.st.bloque, 'minecraft:bricks');
});

test('FOR-19: sin marcas, cambiar de forma solo dice que se importo', () => {
  const d = montar(); d.doc.regenerar();
  d.doc.importarEsquema(esquema('forma=rombo&w=20'));
  assert.equal(d.st.forma, 'rombo');
  assert.equal(ultimoAviso(d), 'Esquema importado.');
});

test('FOR-19: importar no cambia el zoom ni las opciones de vista (salvo el bloque)', () => {
  const d = montar(); d.doc.regenerar();
  Object.assign(d.st, { zoom: 40, rel: false, tramos: false, distEjes: false });
  d.doc.importarEsquema(esquema('forma=rombo&w=20'));
  assert.deepEqual([d.st.zoom, d.st.rel, d.st.tramos, d.st.distEjes], [40, false, false, false]);
});

test('FOR-19: un esquema no valido avisa del motivo y no cambia nada', () => {
  const d = conMarcas({ forma: 'circulo', w: 16, h: 16 });
  const antes = { f: forma(d), hechos: clavesHechas(d.doc), bloque: d.st.bloque };
  const pasos = () => { let n = 0; while (d.doc.puedeDeshacer()) { d.doc.deshacer(); n++; } while (d.doc.puedeRehacer()) d.doc.rehacer(); return n; };
  const pasosAntes = pasos();
  const r = d.doc.importarEsquema({ ok: false, mensaje: 'Este esquema no lo hizo Formas MC: solo se pueden importar los descargados desde aquí.' });
  assert.equal(r, false);
  assert.equal(ultimoAviso(d), 'Este esquema no lo hizo Formas MC: solo se pueden importar los descargados desde aquí.');
  assert.deepEqual({ f: forma(d), hechos: clavesHechas(d.doc), bloque: d.st.bloque }, antes);
  assert.equal(pasos(), pasosAntes);
});

test('MAT-16: pedir el esquema no toca las marcas ni el historial (el documento solo da las capas)', () => {
  const d = conMarcas({ forma: 'circulo', w: 16, h: 16 });
  const antes = { hechos: clavesHechas(d.doc), pasos: d.doc.puedeDeshacer(), avisos: d.avisos.dichos.length };
  d.doc.capas(); d.doc.params();
  assert.deepEqual({ hechos: clavesHechas(d.doc), pasos: d.doc.puedeDeshacer(), avisos: d.avisos.dichos.length }, antes);
});

// --- MAT-21, MAR-19: el reparto de materiales viaja en el proyecto y no toca las marcas --------------------
test('MAR-19: guardar y cargar un proyecto con reparto devuelve el mismo reparto', () => {
  const origen = conMarcas({ forma: 'circulo', w: 16, h: 16, bloque: 'minecraft:bricks', relleno: 'minecraft:stone' });
  const { texto } = origen.doc.proyecto();
  assert.deepEqual(JSON.parse(texto).reparto, { borde: 'minecraft:bricks', relleno: 'minecraft:stone' });
  const d = montar(); d.doc.regenerar();
  d.doc.cargarProyecto(texto);
  assert.equal(d.st.bloque, 'minecraft:bricks');
  assert.equal(d.st.relleno, 'minecraft:stone');
  assert.deepEqual(clavesHechas(d.doc), clavesHechas(origen.doc));
  assert.equal(JSON.parse(d.almacen.leer('mc-formas-v1')).relleno, 'minecraft:stone', 'se guarda en el navegador');
});

test('MAR-19: un proyecto antiguo (sin reparto) carga con un solo material y no toca el bloque', () => {
  const { texto } = conMarcas({ forma: 'circulo', w: 16, h: 16 }).doc.proyecto();
  const d = montar(); d.doc.regenerar();
  Object.assign(d.st, { bloque: 'minecraft:glass', relleno: 'minecraft:stone' });
  d.doc.cargarProyecto(texto);
  assert.equal(d.st.relleno, '');
  assert.equal(d.st.bloque, 'minecraft:glass');
});

test('MAR-19: un Deshacer tras cargar no cambia el reparto (es una opción, no entra en el historial)', () => {
  const { texto } = conMarcas({ forma: 'circulo', w: 16, h: 16, bloque: 'minecraft:bricks', relleno: 'minecraft:stone' }).doc.proyecto();
  const d = montar(); d.doc.regenerar();
  d.doc.cargarProyecto(texto);
  d.doc.deshacer();
  assert.equal(d.st.relleno, 'minecraft:stone');
});

test('MAT-21: cambiar el reparto no borra marcas ni saca aviso', () => {
  const d = conMarcas({ forma: 'circulo', w: 16, h: 16 });
  const antes = { hechos: clavesHechas(d.doc), avisos: d.avisos.dichos.length, pasos: d.doc.puedeDeshacer() };
  Object.assign(d.st, { bloque: 'minecraft:bricks', relleno: 'minecraft:stone' });
  d.doc.regenerar();
  Object.assign(d.st, { relleno: 'minecraft:glass' });
  d.doc.regenerar();
  assert.deepEqual({ hechos: clavesHechas(d.doc), avisos: d.avisos.dichos.length, pasos: d.doc.puedeDeshacer() }, antes);
});

test('FOR-19: importar un esquema con dos materiales recupera el reparto; uno con un solo bloque lo quita', () => {
  const d = montar(); d.doc.regenerar();
  d.doc.importarEsquema({ ...esquema('forma=rombo&w=20', 'minecraft:bricks'), relleno: 'minecraft:stone' });
  assert.deepEqual([d.st.bloque, d.st.relleno], ['minecraft:bricks', 'minecraft:stone']);
  assert.equal(JSON.parse(d.almacen.leer('mc-formas-v1')).relleno, 'minecraft:stone', 'se guarda en el navegador');
  d.doc.importarEsquema({ ...esquema('forma=rombo&w=20', 'minecraft:glass'), relleno: '' });
  assert.deepEqual([d.st.bloque, d.st.relleno], ['minecraft:glass', '']);
  d.doc.importarEsquema(esquema('forma=rombo&w=20', 'minecraft:glass'));
  assert.equal(d.st.relleno, '', 'un resultado sin la clave tampoco deja reparto');
});

// --- MAT-18, MAT-19: el documento calcula el reparto una vez por regeneración -----------------------
test('MAT-18: sin reparto el documento no da zonas ni materiales', () => {
  const d = conMarcas({ forma: 'circulo', w: 16, h: 16 });
  assert.equal(d.doc.reparto(), null);
  assert.equal(d.doc.rellenoCapa(0), null);
});

test('MAT-18, MAT-19: círculo de 16 con ladrillos y piedra: dos materiales que suman los 208 bloques', () => {
  const d = conMarcas({ forma: 'circulo', w: 16, h: 16, bloque: 'minecraft:bricks', relleno: 'minecraft:stone' });
  const rep = d.doc.reparto();
  assert.deepEqual(rep.materiales.map(m => m.nombre), ['Ladrillos', 'Piedra']);
  assert.equal(rep.materiales[0].porCapa[0] + rep.materiales[1].porCapa[0], 208);
  const z = d.doc.rellenoCapa(0);
  assert.equal(z.reduce((a, b) => a + b, 0), rep.materiales[1].porCapa[0]);
});

test('MAT-18: en hueco no hay reparto aunque haya un relleno elegido; al volver a sólido, vuelve', () => {
  const d = conMarcas({ forma: 'circulo', w: 16, h: 16, bloque: 'minecraft:bricks', relleno: 'minecraft:stone' });
  Object.assign(d.st, { modo: 'hueco', grosor: 2 });
  d.doc.regenerar();
  assert.equal(d.doc.reparto(), null);
  assert.equal(d.doc.rellenoCapa(0), null);
  assert.equal(d.st.relleno, 'minecraft:stone', 'la elección se conserva');
  Object.assign(d.st, { modo: 'relleno' });
  d.doc.regenerar();
  assert.ok(d.doc.reparto());
});

test('MAT-18: las zonas se calculan una vez por regeneración y no en cada pintado', () => {
  const d = conMarcas({ forma: 'esfera', w: 11, esfera: 'esfera', bloque: 'minecraft:bricks', relleno: 'minecraft:stone' });
  assert.equal(d.doc.rellenoCapa(3), d.doc.rellenoCapa(3), 'misma instancia: sin recalcular');
  const antes = d.doc.rellenoCapa(3);
  Object.assign(d.st, { w: 13 });
  d.doc.regenerar();
  assert.notEqual(d.doc.rellenoCapa(3), antes, 'una forma nueva da zonas nuevas');
  assert.equal(d.doc.rellenoCapa(3).length, 13 * 13);
});
