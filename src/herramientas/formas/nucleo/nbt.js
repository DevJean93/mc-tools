// NBT (el formato de datos de Minecraft): big-endian, con una raiz TAG_Compound sin nombre. Puro: sin DOM
// ni compresion (el gzip lo pone quien lo usa). Cada valor lleva su tipo: { t, v }.
//   int -> numero, long -> BigInt, string -> texto, compound -> { clave: valor },
//   list -> { t: 'list', tipo, v: [elementos sin etiquetar] }, longArray -> [BigInt].
// Se escriben los tipos que usa la app; se leen todos para dar un error claro y no uno mudo.
export const Nbt = (() => {
  const ID = { end: 0, byte: 1, short: 2, int: 3, long: 4, float: 5, double: 6, byteArray: 7, string: 8, list: 9, compound: 10, intArray: 11, longArray: 12 };
  const NOMBRE = Object.fromEntries(Object.entries(ID).map(([k, v]) => [v, k]));

  const int = v => ({ t: 'int', v });
  const long = v => ({ t: 'long', v: BigInt(v) });
  const string = v => ({ t: 'string', v });
  const compound = v => ({ t: 'compound', v });
  const list = (tipo, v) => ({ t: 'list', tipo, v });
  const longArray = v => ({ t: 'longArray', v });

  // --- escritura ---------------------------------------------------------------------
  function escribir(raiz) {
    const trozos = [];
    const buf = n => { const b = new DataView(new ArrayBuffer(n)); trozos.push(b); return b; };
    const u8 = n => buf(1).setUint8(0, n);
    const u16 = n => buf(2).setUint16(0, n);
    const i32 = n => buf(4).setInt32(0, n);
    const i64 = n => buf(8).setBigInt64(0, BigInt.asIntN(64, n));
    const crudo = b => trozos.push(new DataView(b.buffer, b.byteOffset, b.byteLength));
    const texto = s => { const b = new TextEncoder().encode(s); u16(b.length); crudo(b); };

    function carga(tipo, v) {
      switch (tipo) {
        case 'int': return i32(v);
        case 'long': return i64(v);
        case 'string': return texto(v);
        case 'longArray': i32(v.length); for (const n of v) i64(n); return;
        case 'compound':
          for (const [clave, valor] of Object.entries(v)) { u8(ID[valor.t]); texto(clave); carga(valor.t, valor.t === 'list' ? valor : valor.v); }
          return u8(0);
        case 'list': return lista(v);
        default: throw new Error(`NBT: no se puede escribir el tipo ${tipo}`);
      }
    }
    function lista(l) {
      u8(ID[l.tipo]); i32(l.v.length);
      for (const e of l.v) carga(l.tipo, e);
    }
    // `carga('list', valor)` recibe el valor entero de la lista (lleva su tipo); el resto recibe `.v`.
    u8(ID.compound); u16(0); carga('compound', raiz.v);

    const total = trozos.reduce((a, d) => a + d.byteLength, 0), salida = new Uint8Array(total);
    let o = 0;
    for (const d of trozos) { salida.set(new Uint8Array(d.buffer, d.byteOffset, d.byteLength), o); o += d.byteLength; }
    return salida;
  }

  // --- lectura -----------------------------------------------------------------------
  function leer(bytes) {
    const d = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let o = 0;
    const tomar = n => { if (o + n > d.byteLength) throw new Error('NBT truncado'); const p = o; o += n; return p; };
    const u8 = () => d.getUint8(tomar(1));
    const u16 = () => d.getUint16(tomar(2));
    const i32 = () => d.getInt32(tomar(4));
    const texto = () => { const n = u16(), p = tomar(n); return new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(p, p + n)); };
    const matriz = (n, leerUno) => { const a = []; for (let i = 0; i < n; i++) a.push(leerUno()); return a; };
    const longitud = () => { const n = i32(); if (n < 0) throw new Error('NBT: longitud negativa'); return n; };

    function carga(id) {
      switch (id) {
        case 1: return d.getInt8(tomar(1));
        case 2: return d.getInt16(tomar(2));
        case 3: return i32();
        case 4: return d.getBigInt64(tomar(8));
        case 5: return d.getFloat32(tomar(4));
        case 6: return d.getFloat64(tomar(8));
        case 7: { const n = longitud(); return matriz(n, () => d.getInt8(tomar(1))); }
        case 8: return texto();
        case 9: {
          const e = u8(), n = longitud();
          if (!(e in NOMBRE) || (e === 0 && n > 0)) throw new Error(`NBT: tipo de lista desconocido (${e})`);
          return { t: 'list', tipo: NOMBRE[e], v: matriz(n, () => carga(e)) };
        }
        case 10: {
          const obj = {};
          for (let t = u8(); t !== 0; t = u8()) {
            if (!(t in NOMBRE)) throw new Error(`NBT: tipo de etiqueta desconocido (${t})`);
            const clave = texto();
            const v = carga(t);
            obj[clave] = t === 9 ? v : { t: NOMBRE[t], v };
          }
          return obj;
        }
        case 11: { const n = longitud(); return matriz(n, i32); }
        case 12: { const n = longitud(); return matriz(n, () => d.getBigInt64(tomar(8))); }
        default: throw new Error(`NBT: tipo de etiqueta desconocido (${id})`);
      }
    }

    if (u8() !== ID.compound) throw new Error('NBT: la raiz no es un compuesto');
    texto();   // el nombre de la raiz se ignora
    return { t: 'compound', v: carga(ID.compound) };
  }

  return { int, long, string, compound, list, longArray, escribir, leer };
})();
