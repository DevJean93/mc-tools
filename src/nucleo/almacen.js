// Almacenamiento clave/valor tras un adaptador: localStorage del navegador o memoria (tests).
// Nunca lanza: si el navegador bloquea el almacenamiento, leer devuelve null y escribir false.
const Almacen = (() => {
  const PRUEBA = '__mc-formas-prueba';

  // Envuelve cualquier Storage (localStorage, sessionStorage...). `persistente: false` marca un
  // almacen que se puede leer pero en el que no se puede guardar (el progreso no sobrevive).
  function desde(storage, { persistente = true } = {}) {
    const sirve = !!storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function';
    return {
      persistente: sirve && persistente,
      leer(clave) {
        try { return sirve ? storage.getItem(clave) : null; } catch (e) { return null; }
      },
      escribir(clave, valor) {
        try {
          if (!sirve) return false;
          storage.setItem(clave, String(valor));
          return true;
        } catch (e) { return false; }
      },
    };
  }

  // Almacen en memoria: para los tests.
  function memoria(inicial = {}) {
    const datos = new Map(Object.entries(inicial));
    return {
      persistente: false,
      leer: clave => (datos.has(clave) ? datos.get(clave) : null),
      escribir: (clave, valor) => { datos.set(clave, String(valor)); return true; },
    };
  }

  // Almacen que no guarda nada: el navegador no deja usar localStorage (modo privado,
  // file:// restringido...). No se usa memoria a proposito: guardar en silencio haria
  // perder el progreso al recargar sin avisar.
  function sinPersistencia() {
    return { persistente: false, leer: () => null, escribir: () => false };
  }

  // El error de cuota: el navegador no deja escribir porque no queda espacio.
  const esCuota = e => !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    e.code === 22 || e.code === 1014);
  const hayDatos = storage => { try { return storage.length > 0; } catch (e) { return false; } };

  // El del navegador. Se prueba una lectura y una escritura:
  //  - leer lanza o no hay localStorage: no hay nada que recuperar -> no guarda y lo declara.
  //  - leer funciona pero escribir falla: el progreso ya guardado sigue disponible, asi que se
  //    sigue leyendo. Si falla por cuota y hay datos dentro, esta lleno: es persistente y el
  //    primer guardado fallido avisara de que esta lleno. Cualquier otro caso (cuota 0 en un
  //    almacen vacio, Safari privado antiguo, sin permiso) no es persistente.
  function local() {
    let storage;
    try {
      storage = globalThis.localStorage;
      if (!storage) return sinPersistencia();
      storage.getItem(PRUEBA);
    } catch (e) { return sinPersistencia(); }
    try {
      storage.setItem(PRUEBA, '1');
      if (typeof storage.removeItem === 'function') storage.removeItem(PRUEBA);
      return desde(storage);
    } catch (e) {
      return desde(storage, { persistente: esCuota(e) && hayDatos(storage) });
    }
  }

  return { desde, memoria, local };
})();
if (typeof module !== 'undefined') module.exports = Almacen; else globalThis.Almacen = Almacen;
