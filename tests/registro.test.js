// Registro de formas: una forma nueva entra sin tocar shapes.js ni estado.js.
const test = require('node:test');
const assert = require('node:assert/strict');
const Formas = require('../shapes.js');
const Estado = require('../estado.js');
const Almacen = require('../almacen.js');

test('registrar una forma nueva la hace disponible en toda la app', () => {
  const antes = [...Formas.FORMAS];

  // Marco cuadrado: solo el borde de una rejilla fija de 5x5.
  Formas.registrar('marco', {
    dimensiones: () => ({ w: 5, h: 5, d: 1 }),
    llenar: (x, y) => x < 1 || y < 1 || x > 4 || y > 4,
  });

  assert.equal(Formas.FORMAS.length, antes.length + 1);
  assert.deepEqual(Formas.FORMAS.slice(0, antes.length), antes, 'no altera las anteriores');
  assert.ok(Formas.existe('marco'));
  assert.ok(Estado.ENUMS.forma.includes('marco'), 'el selector y la validacion lo ven');

  const r = Formas.generar({ forma: 'marco', w: 9, h: 9, modo: 'relleno' });
  assert.equal(r.capas.length, 1);
  assert.equal(Formas.contar(r.capas[0]), 16, 'borde de 5x5');

  // Y un estado guardado con la forma nueva se acepta al cargar.
  const almacen = Almacen.memoria({ 'mc-formas-v1': JSON.stringify({ forma: 'marco', w: 9, h: 9 }) });
  assert.equal(Estado.cargar(almacen).forma, 'marco');
});

test('una forma desconocida sigue dando un error claro', () => {
  assert.throws(() => Formas.generar({ forma: 'no-existe', w: 4, h: 4 }), /Forma desconocida/);
  const almacen = Almacen.memoria({ 'mc-formas-v1': JSON.stringify({ forma: 'no-existe' }) });
  assert.equal(Estado.cargar(almacen).forma, 'circulo', 'al cargar cae en el valor por defecto');
});
