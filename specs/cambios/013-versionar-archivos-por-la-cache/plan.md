# Plan · 013 · Versionar los archivos para que el navegador reciba lo nuevo

## Enfoque

Una herramienta de desarrollo nueva, `tests/herramientas/version.js`, junto a `check.js`. Es un
módulo con funciones puras (texto de entrada, texto de salida) que también se ejecuta desde la línea
de órdenes con `npm run versionar`. No se usa la palabra `version` como nombre del comando porque
es un gancho propio de `npm version`.

- **`marcasFuera(html)`**: quita de `index.html` las marcas de versión (`?v=…` de las direcciones
  locales y el texto «Versión …» del pie), para que la huella no dependa de sí misma.
- **`locales(html)`**: las direcciones locales de `<link rel="stylesheet" href>` y
  `<script src>` en orden (las que no empiezan por `http`, `https` ni `//`).
- **`huella(html, leer)`**: SHA-256 (módulo `crypto` de Node, sin dependencias) de `index.html` sin
  marcas y de cada archivo local en orden, cada uno con su ruta delante, con los saltos de línea
  normalizados a LF. Devuelve los 8 primeros caracteres hexadecimales.
- **`sellar(html, v)`**: pone `?v=<v>` en cada dirección local (sustituye la que hubiera) y
  «Versión <v>» en el pie. Las externas no se tocan. Es idempotente.
- **`revisar(html, leer)`**: lista de problemas. Dirección local sin versión, versiones distintas,
  versión del pie distinta o versión que no es la huella actual («no está al día: ejecuta npm run
  versionar»).
- Desde la línea de órdenes: lee `index.html`, calcula la huella, sella y escribe solo si cambió.
  Respeta los saltos de línea que tenga el archivo (CRLF en Windows), para no ensuciar `git diff`.

**Pie (`INT-11`)**, con la skill `ui-ux-pro-max`: dentro de `<footer class="pie">` se añade
`<span id="version">Versión 7f3a9c1e</span>` tras el texto actual y un separador « · », con el mismo
estilo discreto del pie. El número va en la fuente monoespaciada que ya usa la app para cifras.

## Archivos a tocar

- `tests/herramientas/version.js` (nuevo): las funciones y la línea de órdenes.
- `package.json`: `"versionar": "node tests/herramientas/version.js"`.
- `tests/unit/version.test.js` (nuevo): `PUB-01` a `PUB-03` con cadenas pequeñas y, además, la
  comprobación real del repositorio (`revisar` sobre `index.html` y `src/` debe dar cero problemas).
- `index.html`: el `<span id="version">` del pie y las direcciones ya selladas.
- `src/estilos.css`: si hace falta, el estilo del número de versión.
- `tests/e2e/e2e.js`: `INT-11` (el pie muestra la misma versión que llevan los scripts) y `PUB-01`
  (con `file://` todos los scripts locales cargan con `?v=`).
- `specs/areas/publicacion/spec.md`, `specs/areas/interfaz/spec.md`: el delta al archivar.
- `CLAUDE.md` y `README.md`: el comando, la regla de ejecutarlo antes de desplegar y el límite de
  unos 10 minutos de `index.html`.

## Chequeo de la constitución

- [x] Sin instalación ni dependencias nuevas: `crypto` y `fs` son de Node; la app sigue
      abriéndose con doble clic, y una dirección con `?v=` funciona igual con `file://`.
- [x] Español en interfaz, specs, comentarios y mensajes de la herramienta.
- [x] Lógica pura separada de la escritura del archivo: se prueba en Node sin tocar disco.
- [x] Spec y test primero; IDs `PUB-01` a `PUB-03` e `INT-11` en los tests.
- [x] `mc-formas-v1*` y la firma de marcas sin cambios: no se tocan.
- [x] Accesibilidad: el pie es texto normal, no transmite nada solo por color y su contraste es el
      del pie actual.
- [x] `check`, `test` y `e2e` en verde; capturas del pie en móvil y escritorio.
- [x] Lo mínimo: sin service worker, sin comando «publicar», sin ganchos de git.

## Riesgos

- **Flujo de trabajo:** desde ahora, cualquier cambio en `src/` o `index.html` pone `npm test` en
  rojo hasta ejecutar `npm run versionar`. Es lo pedido; el mensaje de la prueba dice exactamente
  qué ejecutar. Se anota en `CLAUDE.md`.
- **Saltos de línea:** se normalizan para la huella; al escribir se conserva el estilo del archivo.
  Se prueba que CRLF y LF dan la misma huella.
- **`file://` con `?v=`:** Edge y Chrome ignoran la consulta al abrir un archivo local; lo
  comprueba el E2E completo (si un script no cargase, fallaría todo).
- **Cadena de referencia:** se fija la huella de un caso pequeño en un test para que un cambio de
  algoritmo sea visible.

## Pruebas

**Unitarios (`tests/unit/version.test.js`):**
- `PUB-01`: `locales` encuentra el CSS y los scripts locales en orden y no las fuentes externas;
  `sellar` añade `?v=` solo a los locales.
- `PUB-02`:
  - huella de referencia de un caso pequeño;
  - cambia si cambia un script o solo el HTML;
  - no cambia al cambiar solo las marcas de versión;
  - CRLF y LF dan la misma huella;
  - `sellar` dos veces da el mismo texto;
  - `sellar` sustituye una versión vieja y pone el pie.
- `PUB-03`:
  - `revisar` informa una dirección sin versión (con su nombre), versiones distintas, un pie
    distinto y una versión que no es la huella actual;
  - un `index.html` bien sellado da cero problemas;
  - **el repositorio real** está al día.

**E2E (`e2e.js`):**
- `INT-11`: el pie muestra «Versión xxxxxxxx», igual al `?v=` de `src/app.js`.
- `PUB-01`: todos los `<script>` locales llevan `?v=` y la app funciona (lo prueba el resto del E2E).

## Validación visual

- Capturas del pie en escritorio y en móvil 390×844; consola sin errores.
- Comparación píxel a píxel del lienzo contra la versión anterior: no debe cambiar.

## Tareas

- [x] T01 — Test en rojo de `PUB-01` a `PUB-03` con cadenas pequeñas y después `tests/herramientas/version.js` con `marcasFuera`, `locales`, `huella`, `sellar`, `revisar` y la línea de órdenes, más el script `versionar` en `package.json`. Archivos: `tests/herramientas/version.js`, `tests/unit/version.test.js`, `package.json`. Hecho cuando: pasan los tests de funciones (el del repositorio real aún no existe). Commit: «PUB-01 a PUB-03: herramienta npm run versionar».
- [ ] T02 — Test en rojo del repositorio real (`PUB-03`) y del pie en el E2E (`INT-11`, `PUB-01`), y después el `<span id="version">` en el pie y `npm run versionar` sobre `index.html`. Archivos: `index.html`, `src/estilos.css`, `tests/unit/version.test.js`, `tests/e2e/e2e.js`. Hecho cuando: `npm test` y el E2E pasan con `index.html` sellado. Commit: «INT-11, PUB-01: index.html sellado y versión en el pie».
- [ ] T03 — Validación visual del pie con la skill `ui-ux-pro-max`: capturas en escritorio y móvil, comparación píxel a píxel del lienzo y consola sin errores. Hecho cuando: las capturas se ven bien; si hay retoques, se vuelve a sellar. Commit: solo si hay cambios.
- [ ] T04 — Archivar: `PUB-01` a `PUB-03` al área de publicación e `INT-11` a la de interfaz con sus decisiones; `CLAUDE.md` (comando, regla y publicación) y `README.md` (límite de unos 10 minutos); propuesta a `Hecha` y moverla al archivo. Hecho cuando: el validador está en verde con todos los IDs cubiertos. Commit: «SDD: archiva la propuesta 013 (versionar los archivos por la caché)».
