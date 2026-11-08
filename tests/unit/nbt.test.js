// Lector y escritor de NBT (big-endian, raíz TAG_Compound sin nombre). Bytes de referencia escritos a mano.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { Nbt } from '../../src/herramientas/formas/nucleo/nbt.js';

const raiz = obj => Nbt.compound(obj);
const bytes = (...b) => Uint8Array.from(b);

test('MAT-15: un compuesto con un Int se escribe con los bytes de referencia', () => {
  assert.deepEqual(Nbt.escribir(raiz({ a: Nbt.int(1) })), bytes(10, 0, 0, 3, 0, 1, 97, 0, 0, 0, 1, 0));
});

test('MAT-15: un Int negativo se escribe en complemento a dos', () => {
  assert.deepEqual(Nbt.escribir(raiz({ a: Nbt.int(-2) })), bytes(10, 0, 0, 3, 0, 1, 97, 255, 255, 255, 254, 0));
});

test('MAT-15: una cadena con acentos va en UTF-8 con su longitud en bytes', () => {
  assert.deepEqual(Nbt.escribir(raiz({ n: Nbt.string('é') })), bytes(10, 0, 0, 8, 0, 1, 110, 0, 2, 0xc3, 0xa9, 0));
});

test('MAT-15: un LongArray escribe su longitud y cada long en 8 bytes', () => {
  const b = Nbt.escribir(raiz({ L: Nbt.longArray([1n, -1n]) }));
  assert.deepEqual(b, bytes(10, 0, 0, 12, 0, 1, 76, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1, 255, 255, 255, 255, 255, 255, 255, 255, 0));
});

test('MAT-15: un Long se escribe en 8 bytes', () => {
  assert.deepEqual(Nbt.escribir(raiz({ t: Nbt.long(258n) })), bytes(10, 0, 0, 4, 0, 1, 116, 0, 0, 0, 0, 0, 0, 1, 2, 0));
});

test('MAT-15: una lista vacía de compuestos lleva el tipo 10 y longitud 0', () => {
  assert.deepEqual(Nbt.escribir(raiz({ l: Nbt.list('compound', []) })), bytes(10, 0, 0, 9, 0, 1, 108, 10, 0, 0, 0, 0, 0));
});

test('MAT-15: una lista de compuestos escribe cada uno con su cierre', () => {
  const b = Nbt.escribir(raiz({ l: Nbt.list('compound', [{ a: Nbt.int(1) }]) }));
  assert.deepEqual(b, bytes(10, 0, 0, 9, 0, 1, 108, 10, 0, 0, 0, 1, 3, 0, 1, 97, 0, 0, 0, 1, 0, 0));
});

test('MAT-15: ida y vuelta de un árbol con todos los tipos que escribe la app', () => {
  const arbol = raiz({
    i: Nbt.int(-7), t: Nbt.long(1700000000000n), s: Nbt.string('Círculo Ø16×16'),
    c: Nbt.compound({ x: Nbt.int(1), y: Nbt.int(2) }),
    p: Nbt.list('compound', [{ Name: Nbt.string('minecraft:air') }, { Name: Nbt.string('minecraft:stone') }]),
    v: Nbt.list('compound', []),
    L: Nbt.longArray([0n, 5n, -9223372036854775808n, 9223372036854775807n]),
  });
  assert.deepEqual(Nbt.leer(Nbt.escribir(arbol)), arbol);
});

test('MAT-15: el lector entiende también Byte, Short, Float, Double, ByteArray e IntArray', () => {
  const b = bytes(
    10, 0, 0,
    1, 0, 1, 98, 5,                     // Byte b = 5
    2, 0, 1, 115, 1, 0,                 // Short s = 256
    5, 0, 1, 102, 0x3f, 0x80, 0, 0,     // Float f = 1
    6, 0, 1, 100, 0x3f, 0xf0, 0, 0, 0, 0, 0, 0,   // Double d = 1
    7, 0, 1, 66, 0, 0, 0, 2, 1, 255,    // ByteArray B = [1, -1]
    11, 0, 1, 73, 0, 0, 0, 1, 0, 0, 0, 9,   // IntArray I = [9]
    0,
  );
  const r = Nbt.leer(b);
  assert.equal(r.v.b.v, 5);
  assert.equal(r.v.s.v, 256);
  assert.equal(r.v.f.v, 1);
  assert.equal(r.v.d.v, 1);
  assert.deepEqual(r.v.B.v, [1, -1]);
  assert.deepEqual(r.v.I.v, [9]);
});

test('FOR-19: un NBT truncado o con una raíz que no es compuesto lanza un error', () => {
  assert.throws(() => Nbt.leer(bytes(10, 0, 0, 3, 0, 1, 97, 0, 0)));
  assert.throws(() => Nbt.leer(bytes(3, 0, 0, 0, 0, 0, 1)));
  assert.throws(() => Nbt.leer(bytes()));
});

test('FOR-19: un tipo de etiqueta desconocido lanza un error', () => {
  assert.throws(() => Nbt.leer(bytes(10, 0, 0, 99, 0, 1, 97, 0)));
});
