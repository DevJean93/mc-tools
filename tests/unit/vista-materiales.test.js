// Vista del desglose de materiales: el HTML que pinta (con un elemento falso, sin navegador).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { VistaMateriales } from '../../src/herramientas/formas/interfaz/vista-materiales.js';
import { Materiales } from '../../src/herramientas/formas/nucleo/materiales.js';
import { Formas } from '../../src/herramientas/formas/nucleo/formas.js';

const el = () => ({ innerHTML: '', style: {}, textContent: '' });
function pintar(r, capa, textos) {
  const m = el(), t = el();
  VistaMateriales.crear({ materiales: m, tabla: t, barra: el(), progreso: el(), lienzo: null }).pintar(r, capa, textos);
  return { materiales: m.innerHTML, tabla: t.innerHTML };
}

test('MAT-19: sin reparto el desglose y la tabla por capas son exactamente los de siempre', () => {
  const h = pintar(Materiales.resumen([4, 40, 88], [1, 0, 0], 1), 1, { altura: i => 64 + i });
  assert.equal(h.materiales,
    '<div class="tot">132 <small>bloques</small></div><div class="mat"><span>Stacks</span><b>2 × 64 + 4</b><span>Shulker boxes</span><b>0.08 → 1</b><span>Cofres dobles</span><b>0.04 → 1</b><span>Construidos</span><b>1</b><span>Faltan</span><b>131</b></div><p class="formula">1 stack = 64 · 1 shulker = 27 stacks = 1728 · 1 cofre doble = 54 stacks = 3456</p>');
  assert.equal(h.tabla,
    '<table><thead><tr><th scope="col">Capa</th><th scope="col">Y</th><th scope="col">Bloques</th><th scope="col">Stacks</th><th scope="col">Hechos</th></tr></thead><tbody><tr data-i="0" class=" "><td>1</td><td>64</td><td>4</td><td>0 × 64 + 4</td><td>25 %</td></tr><tr data-i="1" class="sel " aria-current="true"><td>2</td><td>65</td><td>40</td><td>0 × 64 + 40</td><td>0 %</td></tr><tr data-i="2" class=" "><td>3</td><td>66</td><td>88</td><td>1 × 64 + 24</td><td>0 %</td></tr></tbody></table>');
});

const capasDe = p => Formas.generar({ modo: 'relleno', grosor: 1, ...p }).capas;
const repartoDe = (capas, a, b) => {
  const z = Materiales.rellenoDe(capas), tot = capas.map(g => g.flat().filter(Boolean).length);
  const nombre = id => Materiales.BLOQUES.find(x => x.id === id).nombre;
  return { materiales: [{ id: a, nombre: nombre(a), porCapa: tot.map((n, i) => n - z.cuenta[i]) }, { id: b, nombre: nombre(b), porCapa: z.cuenta }] };
};

test('MAT-19: con reparto el desglose da el total y, por material, bloques, stacks, shulker boxes y cofres dobles', () => {
  const capas = capasDe({ forma: 'circulo', w: 16, h: 16 });
  const rep = repartoDe(capas, 'minecraft:bricks', 'minecraft:stone');
  const r = Materiales.resumen([208], [0], 0, rep);
  const h = pintar(r, 0, {}).materiales;
  assert.match(h, /^<div class="tot">208 <small>bloques<\/small><\/div>/, 'el total de la forma va primero');
  assert.ok(h.includes('<b>3 × 64 + 16</b>'), 'los stacks del total siguen');
  for (const m of r.materiales) {
    assert.ok(h.includes(m.nombre), m.nombre);
    assert.ok(h.includes(`${m.total} <small>bloques</small>`) || h.includes(`${m.total} bloques`), `bloques de ${m.nombre}`);
    assert.ok(h.includes(`<b>${m.stacks}</b>`), `stacks de ${m.nombre}`);
    assert.ok(h.includes(`${m.shulkers.valor.toFixed(2)} → ${m.shulkers.cajas}`), `shulkers de ${m.nombre}`);
    assert.ok(h.includes(`${m.cofres.valor.toFixed(2)} → ${m.cofres.cajas}`), `cofres de ${m.nombre}`);
  }
  assert.ok(h.indexOf('Ladrillos') < h.indexOf('Piedra'), 'primero el borde y luego el relleno');
});

test('MAT-19: la tabla por capas gana una columna por material y cada fila suma su total', () => {
  const capas = capasDe({ forma: 'esfera', w: 11, esfera: 'esfera' });
  const tot = capas.map(g => g.flat().filter(Boolean).length);
  const r = Materiales.resumen(tot, tot.map(() => 0), 2, repartoDe(capas, 'minecraft:glass', 'minecraft:stone'));
  const t = pintar(r, 2, { altura: () => null }).tabla;
  assert.match(t, /<th scope="col">Capa<\/th><th scope="col">Bloques<\/th><th scope="col">Stacks<\/th><th scope="col">Cristal<\/th><th scope="col">Piedra<\/th><th scope="col">Hechos<\/th>/);
  const filas = [...t.matchAll(/<tr data-i="(\d+)"[^>]*>(.*?)<\/tr>/g)];
  assert.equal(filas.length, 11);
  for (const [, i, celdas] of filas) {
    const n = [...celdas.matchAll(/<td>([^<]*)<\/td>/g)].map(c => c[1]);
    assert.equal(+n[3] + +n[4], +n[1], `capa ${+i + 1}`);
  }
});

test('MAT-19: la ficha (sin marcas) con reparto lleva los dos materiales y no lo construido', () => {
  const capas = capasDe({ forma: 'esfera', w: 11, esfera: 'esfera' });
  const tot = capas.map(g => g.flat().filter(Boolean).length);
  const r = Materiales.resumen(tot, tot.map(() => 0), -1, repartoDe(capas, 'minecraft:glass', 'minecraft:stone'));
  const h = pintar(r, -1, { sinMarcas: true });
  assert.ok(h.materiales.includes('Cristal') && h.materiales.includes('Piedra'));
  assert.ok(!h.materiales.includes('Construidos') && !h.tabla.includes('Hechos'));
  assert.ok(h.tabla.includes('<th scope="col">Piedra</th>'));
});
