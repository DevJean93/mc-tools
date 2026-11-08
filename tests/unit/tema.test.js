// Tema claro y oscuro: elección, persistencia y seguimiento del sistema (INT-16, INT-17).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { Tema } from '../../src/compartido/tema.js';
import { Almacen } from '../../src/herramientas/formas/nucleo/almacen.js';

// Elementos de mentira: lo justo para que `iniciar` los use sin DOM.
function entorno({ guardado = null, sistemaClaro = false, almacen } = {}) {
  const raiz = { dataset: {} };
  const atributos = {};
  const clics = [];
  const boton = {
    setAttribute: (k, v) => { atributos[k] = String(v); },
    addEventListener: (t, f) => { if (t === 'click') clics.push(f); },
  };
  const meta = { content: '' };
  const oyentes = [];
  const media = { matches: sistemaClaro, addEventListener: (t, f) => { if (t === 'change') oyentes.push(f); } };
  const avisos = [];
  const doc = { dispatchEvent: e => { avisos.push(e.detail); return true; } };
  const alm = almacen || Almacen.memoria(guardado ? { 'mc-tema': guardado } : {});
  const t = Tema.iniciar({ raiz, boton, almacen: alm, media, meta, documento: doc });
  return {
    raiz, atributos, meta, avisos, alm, t,
    tocar: () => clics.forEach(f => f()),
    sistema: claro => { media.matches = claro; oyentes.forEach(f => f({ matches: claro })); },
  };
}

test('INT-17: resolver usa la elección guardada y, sin ella, el tema del sistema', () => {
  assert.equal(Tema.resolver('oscuro', true), 'oscuro');
  assert.equal(Tema.resolver('claro', false), 'claro');
  assert.equal(Tema.resolver(null, true), 'claro');
  assert.equal(Tema.resolver(null, false), 'oscuro');
  assert.equal(Tema.resolver('rosa', true), 'claro', 'un valor que no es un tema se ignora');
});

test('INT-17: sin elección guardada se aplica el tema del sistema', () => {
  assert.equal(entorno({ sistemaClaro: true }).raiz.dataset.tema, 'claro');
  assert.equal(entorno({ sistemaClaro: false }).raiz.dataset.tema, 'oscuro');
});

test('INT-17: con elección guardada manda sobre el sistema', () => {
  assert.equal(entorno({ guardado: 'oscuro', sistemaClaro: true }).raiz.dataset.tema, 'oscuro');
  assert.equal(entorno({ guardado: 'claro', sistemaClaro: false }).raiz.dataset.tema, 'claro');
});

test('INT-17: sin elección, si el sistema cambia con la página abierta el tema lo sigue', () => {
  const e = entorno({ sistemaClaro: false });
  e.sistema(true);
  assert.equal(e.raiz.dataset.tema, 'claro');
  e.sistema(false);
  assert.equal(e.raiz.dataset.tema, 'oscuro');
});

test('INT-17: tras tocar el botón la elección se guarda en mc-tema y el sistema ya no manda', () => {
  const e = entorno({ sistemaClaro: false });
  e.tocar();
  assert.equal(e.raiz.dataset.tema, 'claro');
  assert.equal(e.alm.leer('mc-tema'), 'claro');
  e.sistema(false);
  assert.equal(e.raiz.dataset.tema, 'claro', 'el sistema no pisa la elección');
  e.tocar();
  assert.equal(e.alm.leer('mc-tema'), 'oscuro');
});

test('INT-17: solo se escribe la clave mc-tema (no se tocan las claves mc-formas-v1*)', () => {
  const escrito = [];
  const almacen = { persistente: true, leer: () => null, escribir: k => { escrito.push(k); return true; } };
  entorno({ almacen }).tocar();
  assert.deepEqual(escrito, ['mc-tema']);
});

test('INT-17: si el navegador no deja guardar, el botón funciona igual durante la visita', () => {
  const almacen = Almacen.desde(null);
  const e = entorno({ almacen, sistemaClaro: false });
  e.tocar();
  assert.equal(e.raiz.dataset.tema, 'claro');
  e.tocar();
  assert.equal(e.raiz.dataset.tema, 'oscuro');
});

test('INT-16: el nombre accesible dice a qué tema cambia y aria-pressed indica el tema actual', () => {
  assert.equal(Tema.etiqueta('oscuro'), 'Cambiar a tema claro');
  assert.equal(Tema.etiqueta('claro'), 'Cambiar a tema oscuro');
  const e = entorno({ sistemaClaro: false });
  assert.equal(e.atributos['aria-label'], 'Cambiar a tema claro');
  assert.equal(e.atributos['aria-pressed'], 'true', 'tema oscuro activo');
  e.tocar();
  assert.equal(e.atributos['aria-label'], 'Cambiar a tema oscuro');
  assert.equal(e.atributos['aria-pressed'], 'false');
});

test('INT-16: al cambiar de tema se avisa con un evento y se ajusta theme-color', () => {
  const e = entorno({ sistemaClaro: false });
  assert.equal(e.meta.content, Tema.COLOR.oscuro);
  e.tocar();
  assert.deepEqual(e.avisos.at(-1), { tema: 'claro' });
  assert.equal(e.meta.content, Tema.COLOR.claro);
});
