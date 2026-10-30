// Flujo del documento: generar, marcas, historial, capas y guardado.
const test = require('node:test');
const assert = require('node:assert');
const Documento = require('../../src/nucleo/documento.js');
const Estado = require('../../src/nucleo/estado.js');
const Almacen = require('../../src/nucleo/almacen.js');

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
