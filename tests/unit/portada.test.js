// Portada del sitio: dibujo en vivo (SIT-03) y enlaces (SIT-01).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DibujoVivo } from '../../src/compartido/dibujoVivo.js';
import { Formas } from '../../src/herramientas/formas/nucleo/formas.js';

test('SIT-03: siguienteCapa recorre de la base a la cima y vuelve a empezar', () => {
  const vistas = [];
  let c = 0;
  for (let i = 0; i < 12; i++) { vistas.push(c); c = DibujoVivo.siguienteCapa(c, 11); }
  assert.deepEqual(vistas, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0]);
});

test('SIT-03: celdaPara ajusta la celda al ancho y la acota entre 16 y 26 px', () => {
  assert.equal(DibujoVivo.celdaPara(100), 16);
  assert.equal(DibujoVivo.celdaPara(2000), 26);
  const s = DibujoVivo.celdaPara(340);
  assert.ok(s >= 16 && s <= 26);
  assert.ok(DibujoVivo.anchoDe(s) <= 340 || s === 16);
});

test('SIT-03: los parámetros del dibujo generan una esfera de 11 con 11 capas', () => {
  const r = Formas.generar(DibujoVivo.PARAMS);
  assert.equal(DibujoVivo.PARAMS.w, 11);
  assert.equal(r.capas.length, 11);
  assert.ok(r.totales.every(t => t > 0));
  assert.ok(DibujoVivo.CAPA_FIJA >= 0 && DibujoVivo.CAPA_FIJA < 11);
});

test('SIT-03: el texto alternativo dice qué muestra', () => {
  const t = DibujoVivo.TEXTO_ALTERNO;
  assert.match(t, /esfera de 11/i);
  assert.match(t, /capa a capa/i);
});

test('SIT-01: la portada no enlaza fuera del sitio', () => {
  const fuente = fs.readFileSync(new URL('../../src/pages/index.astro', import.meta.url), 'utf8');
  assert.ok(!/href\s*=\s*["']?(https?:)?\/\//i.test(fuente), 'hay un href externo');
  assert.ok(!/https?:\/\//i.test(fuente), 'la portada no menciona ninguna URL externa');
});
