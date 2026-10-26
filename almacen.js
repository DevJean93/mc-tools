// Almacenamiento clave/valor tras un adaptador: localStorage del navegador o memoria (tests).
// Nunca lanza: si el navegador bloquea el almacenamiento, leer devuelve null y escribir false.
const Almacen = (() => {
  // Envuelve cualquier Storage (localStorage, sessionStorage...).
  function desde(storage) {
    const sirve = !!storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function';
    return {
      persistente: sirve,
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

  // El del navegador; si acceder a localStorage lanza, uno que no guarda y lo declara.
  // Se prueba tambien una escritura: un almacen que lee pero no escribe (Safari privado
  // antiguo, cuota 0) no es persistente y la app debe decir "no disponible", no "lleno".
  function local() {
    try {
      const storage = globalThis.localStorage;
      if (!storage) return sinPersistencia();
      storage.getItem('__mc-formas-prueba');
      storage.setItem('__mc-formas-prueba', '1');
      if (typeof storage.removeItem === 'function') storage.removeItem('__mc-formas-prueba');
      return desde(storage);
    } catch (e) { /* bloqueado o sin escritura */ }
    return sinPersistencia();
  }

  return { desde, memoria, local };
})();
if (typeof module !== 'undefined') module.exports = Almacen; else globalThis.Almacen = Almacen;
