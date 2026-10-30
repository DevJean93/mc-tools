// Almacen: el localStorage del navegador con un Storage falso (sin DOM).
const test = require('node:test');
const assert = require('node:assert/strict');
const Almacen = require('../../src/nucleo/almacen.js');
const Estado = require('../../src/nucleo/estado.js');

const cuota = () => Object.assign(new Error('sin espacio'), { name: 'QuotaExceededError', code: 22 });

// Storage falso: `alEscribir` / `alLeer` devuelven el error que se lanza.
function falso({ datos = {}, alEscribir, alLeer } = {}) {
  const m = new Map(Object.entries(datos));
  return {
    getItem: k => { if (alLeer) throw alLeer(); return m.has(k) ? m.get(k) : null; },
    setItem: (k, v) => { if (alEscribir) throw alEscribir(); m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    get length() { return m.size; },
    _m: m,
  };
}

// Instala `storage` como localStorage mientras dura `fn`.
function con(storage, fn) {
  const antes = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { if (storage instanceof Error) throw storage; return storage; } });
  try { return fn(); } finally {
    if (antes) Object.defineProperty(globalThis, 'localStorage', antes); else delete globalThis.localStorage;
  }
}

test('MAR-08: con escritura posible es persistente y no deja la clave de prueba', () => {
  const s = falso({ datos: { a: '1' } });
  const almacen = con(s, () => Almacen.local());
  assert.equal(almacen.persistente, true);
  assert.equal(almacen.escribir('b', '2'), true);
  assert.equal(almacen.leer('b'), '2');
  assert.deepEqual([...s._m.keys()].sort(), ['a', 'b'], 'la prueba de escritura se limpia');
});

test('MAR-08: almacenamiento lleno: se sigue leyendo el progreso y se declara persistente', () => {
  const guardado = JSON.stringify({ forma: 'triangulo', w: 21, h: 15, igualar: false });
  const s = falso({ datos: { 'mc-formas-v1': guardado, relleno: 'x'.repeat(100) }, alEscribir: cuota });
  const almacen = con(s, () => Almacen.local());
  assert.equal(almacen.persistente, true, 'lleno no es lo mismo que bloqueado');
  assert.equal(almacen.leer('mc-formas-v1'), guardado);
  assert.equal(almacen.escribir('x', '1'), false, 'guardar falla y el llamador avisa de que esta lleno');

  const st = Estado.cargar(almacen);
  assert.equal(st.forma, 'triangulo');
  assert.equal(st.w, 21);
});

test('MAR-08: cuota en un almacen vacio (cuota 0) no es persistente pero lee', () => {
  const almacen = con(falso({ alEscribir: cuota }), () => Almacen.local());
  assert.equal(almacen.persistente, false);
  assert.equal(almacen.leer('nada'), null);
  assert.equal(almacen.escribir('x', '1'), false);
});

test('MAR-08: un error de escritura que no es de cuota no es persistente, y sigue leyendo', () => {
  const s = falso({ datos: { a: '1' }, alEscribir: () => new DOMException('sin permiso', 'SecurityError') });
  const almacen = con(s, () => Almacen.local());
  assert.equal(almacen.persistente, false);
  assert.equal(almacen.leer('a'), '1');
});

test('MAR-08: si leer lanza, no hay nada que recuperar: no guarda y lo declara', () => {
  const almacen = con(falso({ alLeer: () => new DOMException('bloqueado', 'SecurityError') }), () => Almacen.local());
  assert.equal(almacen.persistente, false);
  assert.equal(almacen.leer('a'), null);
  assert.equal(almacen.escribir('a', '1'), false);
});

test('MAR-08: si acceder a localStorage lanza o no existe, tampoco guarda', () => {
  const bloqueado = con(new DOMException('bloqueado', 'SecurityError'), () => Almacen.local());
  assert.equal(bloqueado.persistente, false);
  assert.equal(bloqueado.leer('a'), null);

  const sin = con(undefined, () => Almacen.local());
  assert.equal(sin.persistente, false);
  assert.equal(sin.escribir('a', '1'), false);
});

test('MAR-08: desde() sin opciones es persistente; con persistente:false no', () => {
  assert.equal(Almacen.desde(falso()).persistente, true);
  assert.equal(Almacen.desde(falso(), { persistente: false }).persistente, false);
  assert.equal(Almacen.desde(null).persistente, false);
});
