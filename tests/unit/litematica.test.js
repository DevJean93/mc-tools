// Esquema de Litematica: empaquetado de BlockStates, construcción, gzip y lectura.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { Litematica } from '../../src/herramientas/formas/nucleo/litematica.js';
import { Nbt } from '../../src/herramientas/formas/nucleo/nbt.js';
import { Estado } from '../../src/herramientas/formas/nucleo/estado.js';
import { Formas } from '../../src/herramientas/formas/nucleo/formas.js';

const AHORA = 1700000000000;
const stDe = p => ({ ...Estado.DEFAULTS, ...p });
const hacer = (p, bloque = 'minecraft:stone') => {
  const st = stDe(p);
  return { st, capas: Formas.generar(st).capas, bloque };
};
const nbtDe = (p, bloque) => {
  const { st, capas } = hacer(p, bloque);
  return Nbt.leer(Litematica.aNbt({ st, capas, bloque: bloque || 'minecraft:stone', ahora: AHORA }));
};
const region = r => r.v.Regions.v['Formas MC'];
const tam = c => [c.v.x.v, c.v.y.v, c.v.z.v];
// Las celdas del esquema, de nuevo como capas[y][z][x] de 0 y 1.
const celdas = r => {
  const [X, Y, Z] = tam(region(r).v.Size);
  const reg = region(r).v, bits = Litematica.bitsPaleta(reg.BlockStatePalette.v.length);
  const idx = Litematica.desempaquetar(reg.BlockStates.v, bits, X * Y * Z);
  return Array.from({ length: Y }, (_, y) => Array.from({ length: Z }, (_, z) => Array.from({ length: X }, (_, x) => idx[(y * Z + z) * X + x])));
};

// --- empaquetado ----------------------------------------------------------------------
test('MAT-15: bits por entrada = max(2, ceil(log2(paleta)))', () => {
  const esperado = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 3, 8: 3, 9: 4, 16: 4, 17: 5 };
  for (const [n, b] of Object.entries(esperado)) assert.equal(Litematica.bitsPaleta(+n), b, `paleta de ${n}`);
});

test('MAT-15: con 2 bits las entradas se empaquetan de la menos a la más significativa', () => {
  assert.deepEqual(Litematica.empaquetar([0, 1, 1, 0], 2), [20n]);
  assert.deepEqual(Litematica.empaquetar([3, 0, 0, 0, 2], 2), [3n + (2n << 8n)]);
});

test('MAT-15: con paleta de 3 entradas (2 bits) 32 entradas llenan exactamente un long', () => {
  const r = Litematica.empaquetar(new Array(32).fill(2), 2);
  assert.equal(r.length, 1);
  assert.equal(r[0], BigInt.asIntN(64, 0xaaaaaaaaaaaaaaaan));
  assert.equal(Litematica.empaquetar(new Array(33).fill(2), 2).length, 2);
});

test('MAT-15: con paleta de 5 entradas (3 bits) una entrada cruza el límite entre dos longs', () => {
  // 22 entradas de 3 bits son 66 bits: la 22.ª ocupa los bits 63, 64 y 65.
  const r = Litematica.empaquetar(new Array(22).fill(7), 3);
  assert.deepEqual(r, [-1n, 3n]);
  const sola = Litematica.empaquetar([...new Array(21).fill(0), 5], 3);   // 101: el bit 63 va al primer long, el resto al segundo
  assert.deepEqual(sola, [BigInt.asIntN(64, 1n << 63n), 2n]);
});

test('MAT-15: sin huecos entre longs, el número de longs es ceil(n * bits / 64)', () => {
  for (const [n, bits] of [[1, 2], [31, 2], [33, 2], [21, 3], [22, 3], [100, 4], [1331, 2], [37, 5]]) {
    assert.equal(Litematica.empaquetar(new Array(n).fill(1), bits).length, Math.ceil(n * bits / 64), `${n} entradas de ${bits} bits`);
  }
});

test('MAT-15: empaquetar y desempaquetar son inversas con 2, 3, 4, 5 y 7 bits', () => {
  let semilla = 12345;
  const azar = max => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla % max; };
  for (const bits of [2, 3, 4, 5, 7]) {
    const valores = Array.from({ length: 1000 }, () => azar(1 << bits));
    assert.deepEqual(Litematica.desempaquetar(Litematica.empaquetar(valores, bits), bits, valores.length), valores, `${bits} bits`);
  }
});

test('MAT-15: una esfera de 100 (un millón de entradas) se empaqueta en menos de 500 ms', () => {
  const valores = new Array(1000000).fill(1);
  const t = performance.now();
  const r = Litematica.empaquetar(valores, 2);
  assert.equal(r.length, 31250);
  assert.ok(performance.now() - t < 500, 'tarda demasiado');
});

// --- el esquema -------------------------------------------------------------------------
test('MAT-15: la raíz lleva las versiones y los metadatos que lee Litematica', () => {
  const r = nbtDe({ forma: 'circulo', w: 16, h: 16 });
  assert.equal(r.v.Version.v, 6);
  assert.equal(r.v.SubVersion.v, 1);
  assert.equal(r.v.MinecraftDataVersion.v, 3955);
  const m = r.v.Metadata.v;
  assert.equal(m.Author.v, 'Formas MC');
  assert.equal(m.Name.v, 'Círculo / Óvalo 16×16');
  assert.equal(m.RegionCount.v, 1);
  assert.equal(m.TotalBlocks.v, 208);
  assert.equal(m.TotalVolume.v, 256);
  assert.equal(m.TimeCreated.t, 'long');
  assert.equal(m.TimeCreated.v, BigInt(AHORA));
  assert.equal(m.TimeModified.v, BigInt(AHORA));
  assert.deepEqual(tam(m.EnclosingSize), [16, 1, 16]);
});

test('MAT-15: un círculo de 16 mide 16 × 1 × 16, lleva 208 bloques y la posición es cero', () => {
  const r = nbtDe({ forma: 'circulo', w: 16, h: 16 });
  const reg = region(r).v;
  assert.deepEqual(tam(reg.Size), [16, 1, 16]);
  assert.deepEqual(tam(reg.Position), [0, 0, 0]);
  assert.deepEqual(reg.BlockStatePalette.v.map(b => b.Name.v), ['minecraft:air', 'minecraft:stone']);
  assert.equal(celdas(r).flat(2).filter(Boolean).length, 208);
  for (const k of ['Entities', 'TileEntities', 'PendingBlockTicks', 'PendingFluidTicks']) {
    assert.equal(reg[k].t, 'list');
    assert.deepEqual(reg[k].v, []);
  }
  assert.equal(reg.BlockStates.t, 'longArray');
  assert.equal(reg.BlockStates.v.length, Math.ceil(256 * 2 / 64));
});

test('MAT-15: una esfera de 11 tiene 11 capas y cada una coincide con la rejilla de la app', () => {
  const { st, capas } = hacer({ forma: 'esfera', w: 11, esfera: 'esfera' });
  const r = Nbt.leer(Litematica.aNbt({ st, capas, bloque: 'minecraft:stone', ahora: AHORA }));
  assert.deepEqual(tam(region(r).v.Size), [11, 11, 11]);
  const c = celdas(r);
  assert.equal(c.length, 11);
  capas.forEach((g, y) => g.forEach((fila, z) => fila.forEach((hay, x) => assert.equal(c[y][z][x], hay ? 1 : 0, `capa ${y + 1}, fila ${z + 1}, columna ${x + 1}`))));
});

test('MAT-15: el esquema pone la fila de la rejilla en z, la columna en x y la capa 1 abajo (y = 0)', () => {
  const g0 = [[true, false, false], [false, false, false]];
  const g1 = [[false, false, false], [false, false, true]];
  const st = stDe({ forma: 'rectangulo', w: 3, h: 2 });
  const r = Nbt.leer(Litematica.aNbt({ st, capas: [g0, g1], bloque: 'minecraft:stone', ahora: AHORA }));
  assert.deepEqual(tam(region(r).v.Size), [3, 2, 2]);
  const c = celdas(r);
  assert.equal(c[0][0][0], 1);
  assert.equal(c[1][1][2], 1);
  assert.equal(c.flat(2).filter(Boolean).length, 2);
});

test('MAT-15: una cúpula lleva solo sus capas', () => {
  const r = nbtDe({ forma: 'esfera', w: 11, esfera: 'cupula' });
  assert.deepEqual(tam(region(r).v.Size), [11, 6, 11]);
});

test('MAT-17: el bloque elegido va en la paleta, después del aire', () => {
  const r = nbtDe({ forma: 'circulo', w: 8, h: 8 }, 'minecraft:stone_bricks');
  assert.deepEqual(region(r).v.BlockStatePalette.v.map(b => b.Name.v), ['minecraft:air', 'minecraft:stone_bricks']);
});

test('MAT-15: la descripción lleva los parámetros de la forma como un enlace', () => {
  const { st, capas } = hacer({ forma: 'hexagono', w: 20, h: 10, igualar: false, modo: 'hueco', grosor: 2, orient: 'punta' });
  const r = Nbt.leer(Litematica.aNbt({ st, capas, bloque: 'minecraft:stone', ahora: AHORA }));
  assert.equal(r.v.Metadata.v.Description.v, Estado.aEnlace(st));
});

test('MAT-15: el nombre del esquema es el de la forma con sus dimensiones', () => {
  assert.equal(Litematica.nombreEsquema(stDe({ forma: 'esfera', w: 11, esfera: 'esfera' })), 'Esfera Ø11');
  assert.equal(Litematica.nombreEsquema(stDe({ forma: 'esfera', w: 16, esfera: 'cupula' })), 'Cúpula Ø16');
  assert.equal(Litematica.nombreEsquema(stDe({ forma: 'rectangulo', w: 30, h: 12 })), 'Cuadrado / Rectángulo 30×12');
});

test('MAT-15: el nombre del archivo sigue el del PNG sin la capa y acaba en .litematic', () => {
  assert.equal(Litematica.nombreArchivo(stDe({ forma: 'circulo', w: 16, h: 16 })), 'circulo-16x16.litematic');
  assert.equal(Litematica.nombreArchivo(stDe({ forma: 'esfera', w: 11, esfera: 'esfera', modo: 'hueco', grosor: 5 })), 'esfera-11-hueco-g5.litematic');
  assert.equal(Litematica.nombreArchivo(stDe({ forma: 'esfera', w: 16, esfera: 'cupula' })), 'cupula-16.litematic');
  assert.equal(Litematica.nombreArchivo(stDe({ forma: 'rectangulo', w: 30, h: 12 })), 'rectangulo-30x12.litematic');
});

test('MAT-16: construir el esquema no cambia los parámetros ni depende de las marcas', () => {
  const { st, capas } = hacer({ forma: 'circulo', w: 16, h: 16 });
  const copia = JSON.stringify(st), capasCopia = JSON.stringify(capas);
  const a = Litematica.aNbt({ st, capas, bloque: 'minecraft:stone', ahora: AHORA });
  assert.equal(JSON.stringify(st), copia);
  assert.equal(JSON.stringify(capas), capasCopia);
  // Las marcas ni siquiera entran: mismas entradas, mismos bytes.
  assert.deepEqual(Litematica.aNbt({ st, capas, bloque: 'minecraft:stone', ahora: AHORA }), a);
});

// --- gzip y lectura ----------------------------------------------------------------------
const exportar = (p, bloque = 'minecraft:stone') => {
  const { st, capas } = hacer(p);
  return Litematica.exportar({ st, capas, bloque, ahora: AHORA });
};
const gzip = async datos => new Uint8Array(await new Response(new Blob([datos]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());

test('MAT-15: el archivo es NBT comprimido con gzip', async () => {
  const b = await exportar({ forma: 'circulo', w: 16, h: 16 });
  assert.equal(b[0], 0x1f);
  assert.equal(b[1], 0x8b);
  const plano = new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  assert.equal(plano[0], 10);   // TAG_Compound
});

test('FOR-19: un esquema descargado vuelve a ser la misma forma y el mismo bloque', async () => {
  const casos = [
    [{ forma: 'circulo', w: 16, h: 16 }, 'minecraft:stone'],
    [{ forma: 'esfera', w: 11, esfera: 'cupula', modo: 'hueco', grosor: 2, capa: 3 }, 'minecraft:white_wool'],
    [{ forma: 'hexagono', w: 20, h: 10, igualar: false, orient: 'punta' }, 'minecraft:smooth_stone'],
    [{ forma: 'rombo', w: 9, h: 15, igualar: false, modo: 'hueco', grosor: 2 }, 'minecraft:glass'],
  ];
  for (const [p, bloque] of casos) {
    const { st, capas } = hacer(p);
    const r = await Litematica.leer(await Litematica.exportar({ st, capas, bloque, ahora: AHORA }));
    assert.equal(r.ok, true, JSON.stringify(p));
    assert.deepEqual(r.forma, Estado.desdeEnlace(Estado.aEnlace(st)), JSON.stringify(p));
    assert.equal(r.bloque, bloque);
  }
});

test('FOR-19: un archivo que no es gzip dice que no es de Litematica y no cambia nada', async () => {
  const r = await Litematica.leer(new TextEncoder().encode('{"app":"formas-mc"}'));
  assert.equal(r.ok, false);
  assert.equal(r.mensaje, 'Este archivo no es un esquema de Litematica o está dañado.');
});

test('FOR-19: un gzip que no contiene NBT o un archivo vacío dicen lo mismo', async () => {
  for (const datos of [await gzip(new TextEncoder().encode('hola')), new Uint8Array(0), Uint8Array.from([0x1f, 0x8b, 8, 0, 0])]) {
    const r = await Litematica.leer(datos);
    assert.equal(r.ok, false);
    assert.equal(r.mensaje, 'Este archivo no es un esquema de Litematica o está dañado.');
  }
});

test('FOR-19: un NBT truncado está dañado', async () => {
  const entero = Litematica.aNbt({ ...hacer({ forma: 'circulo', w: 8, h: 8 }), ahora: AHORA, bloque: 'minecraft:stone' });
  const r = await Litematica.leer(await gzip(entero.subarray(0, entero.length - 40)));
  assert.equal(r.ok, false);
  assert.match(r.mensaje, /no es un esquema de Litematica o está dañado/);
});

test('FOR-19: un NBT sin la estructura de un esquema se rechaza', async () => {
  const r = await Litematica.leer(await gzip(Nbt.escribir(Nbt.compound({ otra: Nbt.int(1) }))));
  assert.equal(r.ok, false);
  assert.match(r.mensaje, /no es un esquema de Litematica o está dañado/);
});

test('FOR-19: un esquema de otro programa no se importa y dice que solo valen los de Formas MC', async () => {
  const ajeno = Nbt.compound({
    Version: Nbt.int(6), Regions: Nbt.compound({}),
    Metadata: Nbt.compound({ Author: Nbt.string('Alex'), Name: Nbt.string('Casa') }),
  });
  const r = await Litematica.leer(await gzip(Nbt.escribir(ajeno)));
  assert.equal(r.ok, false);
  assert.equal(r.mensaje, 'Este esquema no lo hizo Formas MC: solo se pueden importar los descargados desde aquí.');
});

test('FOR-19: un esquema con el autor de Formas MC pero sin forma o con un bloque que no es de la lista se rechaza', async () => {
  const { st, capas } = hacer({ forma: 'circulo', w: 8, h: 8 });
  const nbt = Nbt.leer(Litematica.aNbt({ st, capas, bloque: 'minecraft:stone', ahora: AHORA }));
  const sinForma = structuredClone(nbt);
  sinForma.v.Metadata.v.Description.v = 'hola';
  const bloqueRaro = structuredClone(nbt);
  region(bloqueRaro).v.BlockStatePalette.v[1].Name.v = 'minecraft:bedrock';
  for (const r of [sinForma, bloqueRaro]) {
    const res = await Litematica.leer(await gzip(Nbt.escribir(r)));
    assert.equal(res.ok, false);
    assert.match(res.mensaje, /^Este esquema de Formas MC no se puede leer/);
  }
});
