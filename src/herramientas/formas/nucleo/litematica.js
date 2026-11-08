// Esquema de Litematica (.litematic): la forma como NBT con gzip, y su lectura. Puro: sin DOM; el gzip usa
// CompressionStream/DecompressionStream (navegador y Node 22), asi que no hay dependencias.
//
// Formato (version 6, subversion 1; contrastado con la documentacion y el codigo de Litemapy):
//   raiz: MinecraftDataVersion, Version, SubVersion (Int), Metadata, Regions
//   Metadata: Name, Author, Description (String), RegionCount, TotalBlocks, TotalVolume (Int),
//             TimeCreated, TimeModified (Long), EnclosingSize {x, y, z}
//   Regions.<nombre>: Position, Size {x, y, z}, BlockStatePalette [{ Name }], BlockStates (LongArray),
//             Entities, TileEntities, PendingBlockTicks, PendingFluidTicks (listas vacias)
// Ejes: y = capa (la capa 1 de la app, abajo), z = fila de la rejilla y x = columna: es el dibujo visto desde
// arriba. Indice de bloque = (y * sizeZ + z) * sizeX + x.
import { Nbt } from './nbt.js';
import { Estado } from './estado.js';
import { Formas } from './formas.js';
import { Materiales } from './materiales.js';
export const Litematica = (() => {
  const VERSION = 6, SUBVERSION = 1;
  const DATA_VERSION = 3955;       // Minecraft 1.21.1: el mod migra a la del juego en curso, y es la mas antigua de la 1.21.x
  const AUTOR = 'Formas MC';
  const REGION = 'Formas MC';
  const AIRE = 'minecraft:air';

  const MSG_NO_ESQUEMA = 'Este archivo no es un esquema de Litematica o está dañado.';
  const MSG_AJENO = 'Este esquema no lo hizo Formas MC: solo se pueden importar los descargados desde aquí.';
  const MSG_ILEGIBLE = 'Este esquema de Formas MC no se puede leer: le faltan los datos de la forma o su bloque.';

  // --- BlockStates -------------------------------------------------------------------
  const bitsPaleta = n => Math.max(2, Math.ceil(Math.log2(n)));

  // Entradas de `bits` bits, seguidas y sin huecos (cruzan el limite de un long), de la menos a la mas
  // significativa. Se arma con palabras de 32 bits y cada long se une al final: BigInt por entrada seria lento.
  function empaquetar(indices, bits) {
    const longs = Math.ceil(indices.length * bits / 64);
    const w = new Uint32Array(longs * 2);
    for (let i = 0; i < indices.length; i++) {
      const v = indices[i], inicio = i * bits, p = inicio >>> 5, off = inicio & 31;
      w[p] |= v << off;
      if (off + bits > 32) w[p + 1] |= v >>> (32 - off);
    }
    const salida = new Array(longs);
    for (let k = 0; k < longs; k++) salida[k] = BigInt.asIntN(64, (BigInt(w[2 * k + 1]) << 32n) | BigInt(w[2 * k]));
    return salida;
  }

  function desempaquetar(longs, bits, n) {
    const w = new Uint32Array(longs.length * 2);
    longs.forEach((l, k) => { const u = BigInt.asUintN(64, l); w[2 * k] = Number(u & 0xffffffffn); w[2 * k + 1] = Number(u >> 32n); });
    const mascara = 2 ** bits - 1, salida = new Array(n);
    for (let i = 0; i < n; i++) {
      const inicio = i * bits, p = inicio >>> 5, off = inicio & 31;
      let v = w[p] >>> off;
      if (off + bits > 32) v |= w[p + 1] << (32 - off);
      salida[i] = (v >>> 0) & mascara;
    }
    return salida;
  }

  // --- nombres -----------------------------------------------------------------------
  const nombreForma = st => {
    const def = Formas.obtener(st.forma) || {};
    const variante = (def.variantes || []).find(v => v.valor === st.esfera);
    return (variante && variante.nombre) || def.nombre || st.forma;
  };
  const dimensiones = st => ((Formas.obtener(st.forma) || {}).es3D ? `Ø${st.w}` : `${st.w}×${st.h}`);
  const nombreEsquema = st => `${nombreForma(st)} ${dimensiones(st)}`;

  // La regla del PNG (MAT-07) sin la parte de la capa: circulo-16x16.litematic, esfera-11-hueco-g5.litematic
  function nombreArchivo(st) {
    const def = Formas.obtener(st.forma) || {};
    const que = def.variantes ? st.esfera : st.forma;
    const hueco = st.modo === 'hueco' ? `-hueco-g${st.grosor}` : '';
    return `${que}-${def.es3D ? st.w : st.w + 'x' + st.h}${hueco}.litematic`;
  }

  // --- escritura ---------------------------------------------------------------------
  const xyz = (x, y, z) => Nbt.compound({ x: Nbt.int(x), y: Nbt.int(y), z: Nbt.int(z) });

  // El esquema de la forma entera (las marcas no entran): NBT sin comprimir.
  function aNbt({ st, capas, bloque, ahora }) {
    const X = capas[0][0].length, Z = capas[0].length, Y = capas.length;
    const indices = new Array(X * Y * Z);
    let bloques = 0;
    for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
      const v = capas[y][z][x] ? 1 : 0;
      indices[(y * Z + z) * X + x] = v; bloques += v;
    }
    const paleta = [AIRE, bloque].map(Name => ({ Name: Nbt.string(Name) }));
    const hora = Nbt.long(ahora);
    return Nbt.escribir(Nbt.compound({
      MinecraftDataVersion: Nbt.int(DATA_VERSION),
      Version: Nbt.int(VERSION),
      SubVersion: Nbt.int(SUBVERSION),
      Metadata: Nbt.compound({
        Name: Nbt.string(nombreEsquema(st)),
        Author: Nbt.string(AUTOR),
        Description: Nbt.string(Estado.aEnlace(st)),   // los parametros de la forma: asi se reconoce al importar
        RegionCount: Nbt.int(1),
        TotalBlocks: Nbt.int(bloques),
        TotalVolume: Nbt.int(X * Y * Z),
        TimeCreated: hora, TimeModified: hora,
        EnclosingSize: xyz(X, Y, Z),
      }),
      Regions: Nbt.compound({
        [REGION]: Nbt.compound({
          Position: xyz(0, 0, 0),
          Size: xyz(X, Y, Z),
          BlockStatePalette: Nbt.list('compound', paleta),
          BlockStates: Nbt.longArray(empaquetar(indices, bitsPaleta(paleta.length))),
          Entities: Nbt.list('compound', []),
          TileEntities: Nbt.list('compound', []),
          PendingBlockTicks: Nbt.list('compound', []),
          PendingFluidTicks: Nbt.list('compound', []),
        }),
      }),
    }));
  }

  const aBytes = async flujo => new Uint8Array(await new Response(flujo).arrayBuffer());
  const comprimir = datos => aBytes(new Blob([datos]).stream().pipeThrough(new CompressionStream('gzip')));
  const descomprimir = datos => aBytes(new Blob([datos]).stream().pipeThrough(new DecompressionStream('gzip')));

  // El archivo .litematic: NBT con gzip.
  const exportar = async args => comprimir(aNbt(args));

  // --- lectura -----------------------------------------------------------------------
  const texto = n => (n && n.t === 'string' ? n.v : null);

  // Lee un .litematic. Devuelve { ok: true, forma, bloque } o { ok: false, mensaje } sin tocar nada. Solo
  // vale un esquema de Formas MC: autor, forma (enlace en la descripcion) y bloque de la lista corta.
  async function leer(bytes) {
    let raiz;
    try {
      if (!(bytes[0] === 0x1f && bytes[1] === 0x8b)) throw new Error('no es gzip');
      raiz = Nbt.leer(await descomprimir(bytes)).v;
    } catch (e) { return { ok: false, mensaje: MSG_NO_ESQUEMA }; }
    const meta = raiz.Metadata && raiz.Metadata.t === 'compound' ? raiz.Metadata.v : null;
    const regiones = raiz.Regions && raiz.Regions.t === 'compound' ? Object.values(raiz.Regions.v) : null;
    if (!meta || !regiones) return { ok: false, mensaje: MSG_NO_ESQUEMA };
    if (texto(meta.Author) !== AUTOR) return { ok: false, mensaje: MSG_AJENO };
    const forma = Estado.desdeEnlace(texto(meta.Description) || '');
    const reg = regiones[0] && regiones[0].v;
    const paleta = reg && reg.BlockStatePalette && reg.BlockStatePalette.t === 'list' ? reg.BlockStatePalette.v : [];
    const bloque = paleta[1] && paleta[1].Name ? texto(paleta[1].Name) : null;
    if (!forma || !Materiales.BLOQUES.some(b => b.id === bloque)) return { ok: false, mensaje: MSG_ILEGIBLE };
    return { ok: true, forma, bloque };
  }

  return {
    VERSION, SUBVERSION, DATA_VERSION, bitsPaleta, empaquetar, desempaquetar,
    nombreEsquema, nombreArchivo, aNbt, exportar, leer,
  };
})();
