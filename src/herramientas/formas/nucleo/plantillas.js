// Plantillas: formas guardadas con nombre, solo en el navegador y en una clave propia (FOR-20 a FOR-23).
// Una plantilla es { nombre, forma, reparto? }: los parametros de geometria y, solo si hay reparto de
// materiales, { borde, relleno }. No lleva marcas, capa, zoom ni vista. Sin DOM; el almacen se inyecta.
import { Estado } from './estado.js';
export const Plantillas = (() => {

  const KEY = 'mc-plantillas-v1';
  const MAX = 20;
  const MAX_NOMBRE = 40;
  const VERSION = 1;
  const MSG_NOMBRE = `Escribe un nombre de 1 a ${MAX_NOMBRE} caracteres.`;
  const MSG_LLENO = `Ya hay ${MAX} plantillas: borra alguna para guardar otra con un nombre nuevo, o usa el nombre de una existente para sustituirla.`;

  const nombreValido = n => typeof n === 'string' && n.trim().length >= 1 && n.trim().length <= MAX_NOMBRE;

  // Una plantilla valida a partir de lo leido (que puede ser cualquier cosa), o null. La forma se valida con la
  // misma funcion que el enlace y el archivo de proyecto; la capa no es de la plantilla.
  function validar(crudo) {
    if (!crudo || typeof crudo !== 'object' || Array.isArray(crudo) || !nombreValido(crudo.nombre)) return null;
    if (!crudo.forma || typeof crudo.forma !== 'object' || Array.isArray(crudo.forma)) return null;
    const forma = Estado.formaValidada(crudo.forma);
    delete forma.capa;
    const reparto = Estado.repartoValido(crudo.reparto);
    return reparto ? { nombre: crudo.nombre.trim(), forma, reparto } : { nombre: crudo.nombre.trim(), forma };
  }

  // La plantilla de la forma actual: sus parametros y, con reparto (relleno distinto del borde, como en el
  // archivo de proyecto), el reparto. Sin reparto no se guarda el bloque: es una opcion de vista.
  function desde(nombre, st) {
    const forma = {};
    for (const k of Estado.CLAVES_GEO) forma[k] = st[k];
    const p = { nombre: nombre.trim(), forma };
    if (st.relleno && st.relleno !== st.bloque) p.reparto = { borde: st.bloque, relleno: st.relleno };
    return p;
  }

  // Lee y valida lo guardado: lo invalido se ignora, los nombres repetidos se quedan con el primero y no pasa de MAX.
  function leer(almacen) {
    let lista = [];
    try {
      const raw = JSON.parse(almacen.leer(KEY) || 'null');
      const items = raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray(raw.plantillas) ? raw.plantillas : [];
      for (const it of items) {
        const p = validar(it);
        if (p && !lista.some(q => q.nombre === p.nombre)) lista.push(p);
        if (lista.length === MAX) break;
      }
    } catch (e) { lista = []; }
    return lista;
  }

  function crear({ almacen }) {
    if (!almacen || typeof almacen.leer !== 'function' || typeof almacen.escribir !== 'function') {
      throw new Error('Plantillas necesita un almacen con leer() y escribir()');
    }
    let lista = leer(almacen);
    const copia = p => JSON.parse(JSON.stringify(p));
    const guardarLista = () => almacen.escribir(KEY, JSON.stringify({ version: VERSION, plantillas: lista }));

    return {
      lista: () => lista.map(copia),

      // { ok: true, sustituida, anterior, guardado } o { ok: false, motivo: 'nombre' | 'lleno', mensaje }.
      // `guardado` es false si el navegador no dejo escribir (la lista sigue en memoria esta sesion).
      guardar(nombre, st) {
        if (!nombreValido(nombre)) return { ok: false, motivo: 'nombre', mensaje: MSG_NOMBRE };
        const p = desde(nombre, st), i = lista.findIndex(q => q.nombre === p.nombre);
        if (i < 0 && lista.length >= MAX) return { ok: false, motivo: 'lleno', mensaje: MSG_LLENO };
        const anterior = i >= 0 ? lista[i] : null;
        if (i >= 0) lista[i] = p; else lista.push(p);
        return { ok: true, sustituida: !!anterior, anterior: anterior && copia(anterior), guardado: guardarLista() };
      },

      // { ok: true, plantilla, indice, guardado } para poder reponerla, o { ok: false }.
      borrar(nombre) {
        const i = lista.findIndex(q => q.nombre === nombre);
        if (i < 0) return { ok: false };
        const [plantilla] = lista.splice(i, 1);
        return { ok: true, plantilla: copia(plantilla), indice: i, guardado: guardarLista() };
      },

      // Deshacer de borrar o sustituir: pone la plantilla (en su sitio si ya existe una con su nombre; si no, en
      // `indice`). No pasa del maximo.
      reponer(plantilla, indice = lista.length) {
        const i = lista.findIndex(q => q.nombre === plantilla.nombre);
        if (i >= 0) lista[i] = copia(plantilla);
        else if (lista.length >= MAX) return { ok: false, motivo: 'lleno', mensaje: MSG_LLENO };
        else lista.splice(Math.max(0, Math.min(indice, lista.length)), 0, copia(plantilla));
        return { ok: true, guardado: guardarLista() };
      },
    };
  }

  return { KEY, MAX, MAX_NOMBRE, crear };
})();
