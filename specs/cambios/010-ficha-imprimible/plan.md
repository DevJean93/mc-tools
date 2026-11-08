# Plan · 010 · Ficha imprimible de la forma

## Enfoque

La ficha se arma con lo que ya existe y se imprime con el diálogo del navegador:

- **`Exportar`** (ya dibuja cada capa con cabecera para el PNG) gana `ficha()`: dibuja cada capa con
  `Render.dibujar` **sin marcas** (`hechos` vacío), la convierte en un blob URL (`canvas.toBlob`, como
  el PNG, sin `toDataURL` para no guardar cadenas enormes) y arma el contenido de un contenedor
  `#ficha` hijo directo de `body`. Después espera a que las imágenes estén decodificadas y llama a
  `imprimir()` (inyectado; en la app, `window.print`). La cabecera de la capa sale de una función
  `cabecera(d, c, { construidos })` compartida con el PNG, que sigue idéntico; la ficha la usa sin la
  parte de «construidos». Funciones puras exportadas para los tests: `cabecera` y
  `capaMasAnchaQue(capas, límite)` (MAT-13).
- **`VistaMateriales`** pinta la página 1 reutilizando el desglose y la tabla por capas (con la
  columna Y por `altura`). Una opción nueva `textos.sinMarcas` oculta lo que habla de lo construido
  («Construidos», «Faltan» y la columna «Hechos»): la ficha es la forma limpia y los materiales son
  el total (MAT-12). Los elementos de la barra de progreso se pasan sueltos (sin DOM visible).
- **`app.js`** solo cablea: `Exportar.crear` recibe `ficha: $('ficha')`, `imprimir` y `VistaMateriales`;
  el botón `#imprimirFicha` llama a `exportador.ficha()`. El contexto de exportación existente se
  reutiliza tal cual; la ficha ignora `hechos` y `porCapa`.
- **Aviso (MAT-13)**: si alguna capa mide más de 60 de ancho o de alto, `avisos.avisar(...)` antes de
  imprimir; la ficha se genera igual.
- **CSS**: `#ficha` está `display:none` en pantalla; en `@media print` todo lo que cuelga de `body`
  salvo `#ficha` se oculta y la ficha se muestra en fondo blanco. Cada `.ficha-pag` lleva
  `break-after: page` (la última no) y las imágenes `max-width:100%; max-height:<alto útil>;
  object-fit:contain`, con `@page { margin: 10mm }`, para adaptarse a cualquier papel y orientación
  del diálogo. En 2D, una sola página con dibujo y materiales.
- **Tamaño del dibujo de la ficha**: celda fija de 20 px (independiente del zoom de pantalla) para
  que las cifras salgan nítidas al encogerse a la página; la capa grande se rebaja sola por el límite
  de 16 Mpx de `Render.dibujar`. Es una decisión del plan, no de la spec: el zoom de pantalla puede
  ser 2 y no dejaría cifras.

**Memoria y tiempo**: una esfera de 100 son 100 imágenes y 100 blobs PNG. Se generan una a una (sin
tenerlas todas como canvas a la vez; se reutiliza un solo canvas auxiliar) y la ficha anterior se
limpia (se revocan sus blob URLs y se vacía `#ficha`) al regenerar y tras `afterprint`.

**Interfaz** (skill `ui-ux-pro-max`): botón de texto visible con icono de impresora de contorno (`i-imprimir`,
mismo trazo que los demás símbolos del sprite: 24×24, `stroke` heredado, 2 px, extremos redondos), clase
`.ancho` como «Copiar enlace», bajo «PNG de la capa» y «Todas las capas». Alto de 44 px en móvil lo da
la regla `pointer: coarse` / `max-width: 800px` que ya tienen los botones. Ficha impresa: tipografía
del sistema en negro sobre blanco, título y datos de la forma arriba, desglose en dos columnas
etiqueta/valor y tabla con líneas finas; sin color como único portador de información.

## Archivos a tocar

- `src/interfaz/exportar.js`: `cabecera`, `capaMasAnchaQue`, `ficha()`, limpieza de blobs.
- `src/interfaz/vista-materiales.js`: opción `sinMarcas`.
- `src/app.js`: cableado del botón y de `ficha`/`imprimir`.
- `index.html`: botón `#imprimirFicha`, símbolo `i-imprimir`, contenedor `#ficha`. Tras tocar `src/` o
  `index.html`, `npm run versionar` en el mismo commit.
- `src/estilos.css`: botón (nada si basta con lo existente) y `@media print` de la ficha.
- `tests/unit/exportar.test.js` (nuevo): `MAT-11`, `MAT-12`, `MAT-13` (partes puras).
- `tests/e2e/e2e.js`: bloque «ficha».
- `specs/areas/materiales/spec.md`, `specs/areas/interfaz/spec.md`: el delta al archivar.
- `README.md` («Funciones»), `specs/pendientes.md`.

## Chequeo de la constitución

- [x] Sin instalación ni dependencias nuevas (`window.print` y CSS).
- [x] Español en interfaz, specs y comentarios.
- [x] Lógica pura sin DOM (`cabecera`, `capaMasAnchaQue`); `app.js` solo compone.
- [x] Spec y test primero; IDs `MAT-11`, `MAT-12`, `MAT-13` e `INT-14` en los tests.
- [x] `mc-formas-v1*` y la firma de marcas sin cambios: la ficha no escribe estado.
- [x] Accesibilidad y móvil: texto visible, `aria-hidden` en el icono, 44 px; `#ficha` con
      `aria-hidden="true"` en pantalla para que no lo lea el lector.
- [x] `check`, `test`, `specs` y `e2e` en verde; capturas reales revisadas.
- [x] Lo mínimo que cumple la spec: sin selector de papel, sin partir capas grandes en hojas.

## Riesgos

- **Cada commit debe dejar la app arrancando**: el botón, `Panel`/`app.js` y el HTML van juntos; el
  E2E completo se pasa en cada tarea.
- **PNG sin cambios**: la cabecera pasa a una función compartida; se comprueba con un test de que sin
  `construidos: false` produce exactamente las tres líneas de hoy.
- **Dibujo en pantalla**: no se toca `render.js`; la ficha no cambia el DOM visible (E2E: `#ficha`
  con `display:none` y el resto de la app igual).
- **Memoria/tiempo**: esfera de 100 (100 PNG de ~2000 px). Una a una, blobs revocados al regenerar y
  tras `afterprint`. Se mide el tiempo de una esfera de 100 en el E2E o la validación.
- **Imágenes sin cargar al abrir el diálogo**: se espera a `img.decode()` de todas antes de imprimir.
- **Tema oscuro**: el dibujo usa la paleta de la app (fondo oscuro), igual que el PNG; en papel
  consume tinta. Cambiarlo exigiría tocar `render.js`; queda anotado como posible propuesta.
- **Aviso y diálogo**: `window.print()` bloquea; el aviso se pinta antes (se cede un fotograma).
- **E2E**: la impresión se prueba con `Emulation.setEmulatedMedia({media:'print'})` y un stub de
  `window.print`, nunca con el diálogo real.

## Pruebas

**Unitarios (`exportar.test.js`):**
- `MAT-11`: `cabecera` con y sin Y de la capa («Capa 3 de 11 · Y 66 · N bloques (…)»); sin
  `construidos` la línea 2 no los menciona; con ellos es la del PNG de hoy.
- `MAT-13`: `capaMasAnchaQue` — círculo de 60 no, 61 sí, 120 sí; ancho o alto; 3D con capas distintas.

**E2E (`e2e.js`, bloque «ficha»):**
- `MAT-11`: círculo → una página (`.ficha-pag` = 1, 1 imagen) con materiales; esfera de 11 → 1 + 11;
  con base 64 la tabla tiene columna Y y la cabecera de la capa 3 dice «Y 66» (se lee de la
  cabecera dibujada vía el contexto/`data-` de la imagen, `alt`); el stub de `print` se llama una vez;
  en pantalla `#ficha` no se ve y la app no cambia; en medios de impresión los controles quedan
  ocultos y la ficha visible; un `Page.printToPDF` real con `preferCSSPageSize` da 12 páginas para la
  esfera de 11.
- `MAT-12`: con marcas hechas la ficha no muestra «Construidos»/«Faltan»/«Hechos» y el total es el
  total; imágenes con `object-fit: contain` y caben en la página (alto ≤ alto útil).
- `MAT-13`: círculo de 120 → aviso y `print` llamado igualmente; círculo de 30 → sin aviso.
- `INT-14`: botón en «Vista», último, `.ancho`, con texto e icono; a 390 px cabe y mide ≥ 44 px.

## Validación visual

- Capturas reales (Edge headless por CDP) en móvil 390×844 y escritorio: «Vista» con el botón.
- Capturas con medios de impresión emulados: página 1 (esfera de 11 con base 64) y una capa;
  `printToPDF` para confirmar el nº de páginas.
- Sin errores de consola.
- El lienzo en pantalla no cambia (`render.js` no se toca; se comprueba que `#ficha` no ocupa sitio).

## Tareas

- [x] T01 — Test en rojo de `MAT-11`/`MAT-13` (`cabecera` y `capaMasAnchaQue`) y después esas dos funciones puras en `Exportar`, usando `cabecera` en el PNG sin cambiar su resultado. Archivos: `src/interfaz/exportar.js`, `tests/unit/exportar.test.js`. Hecho cuando: pasan los tests nuevos y el E2E sigue en verde. Commit: «MAT-11, MAT-13: cabecera compartida y detección de capas muy anchas en Exportar» (con `npm run versionar`).
- [ ] T02 — Test E2E en rojo de `INT-14` y de `MAT-11`/`MAT-12`/`MAT-13` (páginas, Y, sin marcas, aviso, `print`, pantalla vs. impresión) y después el botón, el icono y `#ficha` en `index.html`, `sinMarcas` en `VistaMateriales`, `ficha()` en `Exportar`, el cableado en `app.js` y el CSS de impresión. Con la skill `ui-ux-pro-max`. Archivos: `index.html`, `src/estilos.css`, `src/interfaz/exportar.js`, `src/interfaz/vista-materiales.js`, `src/app.js`, `tests/e2e/e2e.js`. Hecho cuando: pasa el E2E completo, el botón mide 44 px en móvil y `printToPDF` da el nº de páginas esperado. Commit: «MAT-11, MAT-12, MAT-13, INT-14: botón Imprimir ficha con la ficha para papel» (con `npm run versionar`).
- [ ] T03 — Validación visual: capturas en escritorio, móvil y con medios de impresión, consola sin errores, esfera de 100 en tiempo razonable. Hecho cuando: se ve bien; si hay retoques, se hacen aquí y se vuelve a versionar. Commit: solo si hay cambios.
- [ ] T04 — Archivar: `MAT-11…13` al área de materiales e `INT-14` al de interfaz con sus decisiones, `README.md`, `pendientes.md`, propuesta a `Hecha` y moverla al archivo. Hecho cuando: el validador está en verde con todos los IDs cubiertos. Commit: «SDD: archiva la propuesta 010 (ficha imprimible)».
