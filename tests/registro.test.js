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

test('una forma nueva con variantes propias se valida y se carga sin tocar estado.js', () => {
  const antes = [...Estado.ENUMS.esfera];
  Formas.registrar('torre', {
    nombre: 'Torre de prueba',
    es3D: true,
    opciones: ['esfera'],
    variantes: [
      { valor: 'torre', nombre: 'Torre', etiqueta: 'Torre completa' },
      { valor: 'almena', nombre: 'Almena', etiqueta: 'Almena' },
    ],
    dimensiones: () => ({ w: 3, h: 3, d: 3 }),
    llenar: () => true,
  });

  assert.ok(Estado.ENUMS.esfera.includes('torre'), 'la variante entra en la validacion');
  assert.deepEqual(Estado.ENUMS.esfera.slice(0, antes.length), antes, 'no altera las anteriores');

  const st = Estado.cargar(Almacen.memoria({ 'mc-formas-v1': JSON.stringify({ forma: 'torre', esfera: 'almena' }) }));
  assert.equal(st.forma, 'torre');
  assert.equal(st.esfera, 'almena');
  assert.equal(Estado.cargar(Almacen.memoria({ 'mc-formas-v1': JSON.stringify({ esfera: 'no-existe' }) })).esfera, 'esfera');
});

test('una forma desconocida sigue dando un error claro', () => {
  assert.throws(() => Formas.generar({ forma: 'no-existe', w: 4, h: 4 }), /Forma desconocida/);
  const almacen = Almacen.memoria({ 'mc-formas-v1': JSON.stringify({ forma: 'no-existe' }) });
  assert.equal(Estado.cargar(almacen).forma, 'circulo', 'al cargar cae en el valor por defecto');
});

test('una forma 3D nueva usa el maximo 3D y genera una capa por nivel', () => {
  Formas.registrar('cubo', {
    nombre: 'Cubo de prueba',
    es3D: true,
    dimensiones: p => {
      const n = Math.max(1, Math.min(Formas.MAX_3D, Math.round(+p.w || 1)));
      return { w: n, h: n, d: n };
    },
    llenar: () => true,
  });

  // Estado la acepta y usa el limite 3D sin tocar estado.js.
  const almacen = Almacen.memoria({ 'mc-formas-v1': JSON.stringify({ forma: 'cubo', w: 300 }) });
  const st = Estado.cargar(almacen);
  assert.equal(st.forma, 'cubo');
  assert.equal(st.w, Estado.LIMITES.w3d, 'el ancho se limita al maximo 3D');

  // La firma usa w como alto (es 3D) y solo cambia con la geometria.
  assert.equal(Estado.firma({ ...st, zoom: 40 }), Estado.firma(st));
  assert.notEqual(Estado.firma({ ...st, w: 5 }), Estado.firma(st));

  // Generar devuelve w capas de w x w.
  const r = Formas.generar({ forma: 'cubo', w: 4, h: 4, modo: 'relleno' });
  assert.equal(r.capas.length, 4, 'una capa por nivel');
  assert.equal(Formas.contar(r.capas[0]), 16);
});
