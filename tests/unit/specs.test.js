// Validador de las specs: el repositorio y los casos negativos en memoria.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Specs = require('../herramientas/specs-lib.js');

const raiz = path.join(__dirname, '..', '..');

// Los IDs de los casos negativos se construyen para que este archivo no los cite como
// si fueran requisitos reales.
const id = (codigo, numero) => `${codigo}-${numero}`;
const FOR1 = id('FOR', '01');
const FOR2 = id('FOR', '02');
const HUERFANO = id('NUM', '99');
const RETIRADO = id('FOR', '03');

const CONSTITUCION = `# Constitución

Versión: 1.0

1. **Sin instalación.** …
2. **Idioma.** …
3. **Módulos.** …
4. **Spec primero.** …
5. **Test primero.** …
6. **Compatibilidad de datos.** …
7. **Accesibilidad y móvil.** …
8. **Definición de hecho.** …
9. **Simplicidad.** …
10. **Enmiendas.** …
`;

const area = (codigo, requisitos) => `# Área · Prueba

Código: \`${codigo}\`

## Propósito

Prueba.

## Requisitos

${requisitos}

## Casos límite

- Ninguno.

## Fuera de alcance

- Nada.

## Decisiones

- 2026-10-29: decisión de prueba.
`;

const requisito = (identificador, texto = 'El sistema hace algo verificable.') =>
  `### ${identificador}\n\n${texto}\n`;

const AREA_BASE = area('FOR', requisito(FOR1));
const TEST_BASE = `test('${FOR1}: hace algo', () => {});\n`;

const propuesta = ({ estado = 'Borrador', preguntas = '', delta = '', areas = '`FOR`' } = {}) => `# 001 · Prueba

## Estado

${estado}

## Motivo

Prueba.

## Áreas afectadas

- ${areas}

## Delta

${delta}

## Criterios de aceptación

- **Dado** algo, **cuando** algo, **entonces** algo.

## Preguntas abiertas

${preguntas}
`;

function base(extra = {}) {
  return {
    'specs/constitucion.md': CONSTITUCION,
    'specs/areas/formas/spec.md': AREA_BASE,
    'tests/unit/formas.test.js': TEST_BASE,
    ...extra,
  };
}

function errores(fuentes) {
  return Specs.validarTodo(fuentes).errores;
}

function contiene(lista, fragmento) {
  return lista.some(e => e.includes(fragmento));
}

test('specs: el repositorio cumple el validador', () => {
  const fuentes = Specs.leerFuentes(raiz);
  const resultado = Specs.validarTodo(fuentes);
  console.log(Specs.formatearCobertura(resultado));
  assert.deepEqual(resultado.errores, [], resultado.errores.join('\n'));
});

test('specs: avisa si falta la constitución', () => {
  const fuentes = base();
  delete fuentes['specs/constitucion.md'];
  assert.ok(contiene(errores(fuentes), 'constitucion.md'));
});

test('specs: avisa si la constitución no tiene principios numerados', () => {
  assert.ok(contiene(errores(base({ 'specs/constitucion.md': '# Constitución\n\nSin principios.\n' })), 'principios'));
});

test('specs: avisa si un área no declara su código', () => {
  const texto = AREA_BASE.replace('Código: `FOR`\n', '');
  assert.ok(contiene(errores(base({ 'specs/areas/formas/spec.md': texto })), 'Código'));
});

test('specs: avisa si falta una sección del área', () => {
  const texto = AREA_BASE.replace('## Decisiones', '## Otra cosa');
  assert.ok(contiene(errores(base({ 'specs/areas/formas/spec.md': texto })), '## Decisiones'));
});

test('specs: avisa si un requisito no usa el prefijo del área', () => {
  const texto = area('FOR', requisito(id('NUM', '01')));
  assert.ok(contiene(errores(base({ 'specs/areas/formas/spec.md': texto })), 'prefijo'));
});

test('specs: avisa si un ID se repite', () => {
  const texto = area('FOR', requisito(FOR1) + requisito(FOR1));
  assert.ok(contiene(errores(base({ 'specs/areas/formas/spec.md': texto })), 'repetido'));
});

test('specs: avisa si un requisito vigente no tiene test', () => {
  const texto = area('FOR', requisito(FOR1) + requisito(FOR2));
  assert.ok(contiene(errores(base({ 'specs/areas/formas/spec.md': texto })), 'sin test'));
});

test('specs: acepta un requisito con verificación manual motivada', () => {
  const texto = area('FOR', requisito(FOR1) + requisito(FOR2, 'Se revisa a ojo. [verificación manual: solo se ve en pantalla]'));
  assert.deepEqual(errores(base({ 'specs/areas/formas/spec.md': texto })), []);
});

test('specs: avisa si la verificación manual no tiene motivo', () => {
  const texto = area('FOR', requisito(FOR1) + requisito(FOR2, 'Se revisa a ojo. [verificación manual: ]'));
  assert.ok(contiene(errores(base({ 'specs/areas/formas/spec.md': texto })), 'sin test'));
});

test('specs: avisa de un ID huérfano citado en un test', () => {
  const prueba = TEST_BASE + `test('${HUERFANO}: inventado', () => {});\n`;
  assert.ok(contiene(errores(base({ 'tests/unit/formas.test.js': prueba })), HUERFANO));
});

test('specs: avisa de un ID retirado citado en un test', () => {
  const texto = area('FOR', requisito(FOR1) + `${requisito(RETIRADO)} (retirado en cambio 001)\n`);
  const prueba = TEST_BASE + `test('${RETIRADO}: viejo', () => {});\n`;
  assert.ok(contiene(errores(base({ 'specs/areas/formas/spec.md': texto, 'tests/unit/formas.test.js': prueba })), 'retirado'));
});

test('specs: avisa si una propuesta tiene un estado inválido', () => {
  const fuentes = base({ 'specs/cambios/001-prueba/propuesta.md': propuesta({ estado: 'Pendiente' }) });
  assert.ok(contiene(errores(fuentes), 'estado'));
});

test('specs: avisa si una propuesta cita un área inexistente', () => {
  const fuentes = base({ 'specs/cambios/001-prueba/propuesta.md': propuesta({ delta: `- \`${id('ZZZ', '01')}\`: algo.` }) });
  assert.ok(contiene(errores(fuentes), 'ZZZ'));
});

test('specs: avisa si hay una pregunta abierta en una propuesta aprobada', () => {
  const fuentes = base({
    'specs/cambios/001-prueba/propuesta.md': propuesta({ estado: 'Aprobada', preguntas: `- [NECESITA ACLARACIÓN: ${id('FOR', '04')}?]` }),
  });
  assert.ok(contiene(errores(fuentes), 'NECESITA ACLARACIÓN'));
});

test('specs: avisa si las tareas del plan no usan casillas', () => {
  const fuentes = base({
    'specs/cambios/001-prueba/propuesta.md': propuesta({ estado: 'Aprobada' }),
    'specs/cambios/001-prueba/plan.md': '# Plan\n\n## Tareas\n\n- T01 hacer algo\n',
  });
  assert.ok(contiene(errores(fuentes), 'casilla'));
});

test('specs: avisa si una propuesta archivada no está hecha ni descartada', () => {
  const fuentes = base({ 'specs/cambios/archivo/001-prueba/propuesta.md': propuesta({ estado: 'En curso' }) });
  assert.ok(contiene(errores(fuentes), 'archivo'));
});

test('specs: avisa si una propuesta archivada añade un ID que no existe', () => {
  const fuentes = base({
    'specs/cambios/archivo/001-prueba/propuesta.md': propuesta({ estado: 'Hecha', delta: `### Añade\n\n- \`${FOR2}\`: algo.\n` }),
  });
  assert.ok(contiene(errores(fuentes), FOR2));
});

test('specs: la cobertura asocia cada ID con los tests que lo citan', () => {
  const resultado = Specs.validarTodo(base());
  const fila = resultado.cobertura.find(c => c.id === FOR1);
  assert.ok(fila);
  assert.deepEqual(fila.tests, ['tests/unit/formas.test.js']);
});
