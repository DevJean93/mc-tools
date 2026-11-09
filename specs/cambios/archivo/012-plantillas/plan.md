# Plan · 012 · Formas guardadas como plantillas

## Enfoque

- **Núcleo** (`nucleo/plantillas.js`, sin DOM): `Plantillas.crear({ almacen })` mantiene la lista en memoria,
  la lee una vez de la clave propia `mc-plantillas-v1` y la escribe tras cada cambio. Cada plantilla es
  `{ nombre, forma, reparto? }`. Al leer se valida cada entrada con las mismas funciones que el archivo de
  proyecto y el enlace (`Estado.formaValidada`, `Estado.repartoValido`, que pasan a exportarse): las inválidas
  se ignoran, un JSON corrupto da lista vacía. Los nombres duplicados al leer se quedan con el primero y la
  lista se corta en 20.
- **Qué guarda** (`FOR-20`): las claves de `CLAVES_GEO` y, **solo si hay reparto** (`relleno` distinto de
  `bloque`, igual que el archivo de proyecto, MAR-19), `reparto: { borde, relleno }`. Sin reparto no guarda el
  bloque: el bloque es una opción de vista y una plantilla de «solo forma» no debe cambiarlo. Nada de capa,
  marcas, zoom ni vista. Al aplicar una plantilla sin reparto se quita el que hubiera (un solo material, el
  bloque se conserva); con reparto se ponen borde y relleno. Mismo criterio que importar un esquema.
- **Reglas de la lista**: nombre recortado, 1 a 40 caracteres; mismo nombre (exacto, tras recortar) sustituye
  en su sitio y se ofrece «Deshacer» (aviso «Plantilla sustituida»); 20 como máximo (con 20, un nombre nuevo se
  rechaza con motivo; sustituir sí); borrar devuelve la plantilla y su posición para que «Deshacer» la reponga.
  Sin renombrar.
- **Aplicar** (`FOR-21`): `Documento.aplicarPlantilla(p)` usa `aplicarForma` (la misma vía que el enlace y el
  esquema), sin `capa` (la plantilla no la guarda: se conserva la actual). Aviso con «Deshacer» cuando cambia
  algo; «Se aplicó la plantilla «X». Tu progreso anterior se borró.» si se perdieron marcas.
- **Interfaz**: módulo `interfaz/plantillas.js` (DOM por inyección) y un bloque al principio de «Forma»:
  desplegable «Plantillas» con opción inicial «Elige una plantilla…», botones «Aplicar» y «Borrar» (deshabilitados
  sin elegir), botón «Guardar como plantilla» que abre un campo «Nombre de la plantilla» en línea (`Enter`
  guarda, `Escape` cancela, error junto al campo). Sin plantillas se oculta el desplegable y una ayuda lo
  explica. Los nombres entran con `textContent`. `teclado.js`: Ctrl+Z dentro de un campo de texto no deshace la
  forma (hoy solo lo respeta en `number` y `select`).
- `app.js` solo conecta (instancia el núcleo y el módulo de interfaz, pasa `doc.aplicarPlantilla` y `avisos`).

## Archivos a tocar

- `src/herramientas/formas/nucleo/plantillas.js` (nuevo), `nucleo/estado.js` (exporta `formaValidada`,
  `repartoValido`), `nucleo/documento.js` (`aplicarPlantilla`).
- `src/herramientas/formas/interfaz/plantillas.js` (nuevo), `app.js`, `entrada/teclado.js`, `estilos.css`,
  `src/pages/formas/index.astro`.
- `tests/unit/plantillas.test.js` (nuevo), `tests/unit/documento.test.js`, `tests/e2e/e2e.js`.
- `specs/areas/formas/spec.md`: FOR-20 a FOR-23 y Decisiones al archivar; `specs/pendientes.md`, `README.md`/`CLAUDE.md`.

## Chequeo de la constitución

- [x] Sin instalación ni dependencias nuevas.
- [x] Español en interfaz, specs y comentarios.
- [x] Lógica pura sin DOM; `app.js` solo compone.
- [x] Spec y test primero; IDs `FOR-20` a `FOR-23` en los tests.
- [x] `mc-formas-v1*` y la firma de marcas sin cambios (clave nueva `mc-plantillas-v1`).
- [x] Accesibilidad y móvil (etiquetas visibles, 44 px, 16 px, nombres accesibles, `Enter`/`Escape`).
- [x] `check`, `test`, `specs`, `build` y `e2e` en verde; capturas revisadas.
- [x] Lo mínimo que cumple la spec: sin renombrar, sin exportar la lista.

## Riesgos

- **Datos guardados corruptos o ajenos**: se valida entrada a entrada; nunca lanza.
- **Inyección de HTML** por el nombre: solo `textContent`; prueba E2E con `<b>`, comillas y acentos.
- **Dibujo**: no se toca el render; se comprueba píxel a píxel (lienzo, PNG, ficha) contra `develop` previo.
- **Firma de marcas**: no cambia; aplicar usa la regla existente.
- **Almacenamiento bloqueado**: `escribir` devuelve false → aviso al guardar; la lista sigue en memoria esa sesión.

## Pruebas

- Unitarias: `FOR-20` (qué guarda, límites de nombre, sustitución, reparto), `FOR-21` (`aplicarPlantilla`:
  marcas, Deshacer, misma geometría, reparto), `FOR-22` (borrar y reponer, tope de 20), `FOR-23` (clave
  propia, persistencia, corrupto, inválidas, aviso sin almacenamiento).
- E2E: guardar y ver en la lista, recargar y sigue; aplicar con marcas + Deshacer; borrar + Deshacer; tope de
  20; nombres con caracteres especiales; botones de 44 px a 390 px; Enter y Escape.

## Validación visual

- Capturas móvil 390×844 (toques reales) y escritorio 1280, tema oscuro y claro, en `shots-012\`.
- Comparación píxel a píxel de lienzo, PNG y ficha contra el árbol anterior, en los dos temas.

## Tareas

- [x] T01 — Tests en rojo del núcleo y luego `plantillas.js` (+ exportar `formaValidada` y `repartoValido`). Hecho cuando: pasan `FOR-20`, `FOR-22`, `FOR-23`. Commit: «FOR-20, FOR-22, FOR-23: núcleo de las plantillas».
- [x] T02 — Test en rojo y `Documento.aplicarPlantilla`. Hecho cuando: pasa `FOR-21` unitario. Commit: «FOR-21: aplicar una plantilla por la vía de los enlaces».
- [x] T03 — Interfaz y E2E (en rojo primero), `teclado.js`. Hecho cuando: pasa el E2E completo. Commit: «FOR-20, FOR-21, FOR-22, FOR-23: plantillas en la interfaz».
- [x] T04 — Validación visual y píxel a píxel; retoques si hacen falta. Commit: «FOR-20: la etiqueta del nombre de la plantilla en una sola línea» (único retoque).
- [x] T05 — Archivar: FOR-20 a FOR-23 al área, `pendientes.md`, README/CLAUDE.md, propuesta a `Hecha` y al archivo. Commit: «SDD: archiva la propuesta 012 (plantillas)».
