# Plan · 016 · Exportar e importar archivos de Litematica

## Enfoque

Dos módulos puros nuevos en `src/herramientas/formas/nucleo/` y poca cosa más:

- **`nbt.js`**: escritor y lector de NBT (big-endian, raíz `TAG_Compound` sin nombre). Los valores llevan su
  tipo: `{ t, v }` (`int`, `long` como `BigInt`, `string`, `list` con `tipo`, `compound`, `longArray`, más los
  que solo se leen). Sin DOM ni gzip.
- **`litematica.js`**: empaquetado de `BlockStates`, construcción del esquema desde las capas, gzip con
  `CompressionStream`/`DecompressionStream` (globales del navegador y de Node 22: sin dependencias) y lectura
  con las comprobaciones de «lo hizo Formas MC».
- **Bloque (MAT-17)**: la lista corta vive en `materiales.js` (`BLOQUES`); `estado.js` guarda `bloque` junto
  a las opciones de vista (`mc-formas-v1`, valor por defecto si falta o es desconocido). No entra en `VISTA`
  (son casillas), ni en `CLAVES_GEO`, ni en el enlace, ni en la firma. `panel.js` lo lee y lo vuelca como un
  `<select>` más.
- **Importar (FOR-19)**: se extrae de `Documento.abrirEnlace` una función interna `aplicarForma(forma)` con
  la misma regla de marcas (aviso con «Deshacer»); `abrirEnlace` y la nueva `importarEsquema` la reutilizan.
- **Interfaz (INT-15)**: dos botones y un selector en «Proyecto»; `app.js` solo cablea.

### Formato `.litematic` elegido

Fuentes contrastadas: documentación de Litemapy («The Litematic file format», `litemapy.readthedocs.io`) y su
código (`schematic.py`, `storage.py`, `LitematicaBitArray`), que escribe archivos que Litematica carga. No se
pudo abrir el código del propio mod (la URL probada dio 404), así que la parte del mod se toma de Litemapy.

- Raíz (compuesto sin nombre): `MinecraftDataVersion` Int, `Version` Int, `SubVersion` Int, `Metadata`, `Regions`.
- **Versión 6, subversión 1** (la que usan Litematica y Litemapy). Se elige 6 y no 7 porque es la que está
  documentada y comprobada con Litemapy; el mod más nuevo lee las anteriores y las actualiza.
- **`MinecraftDataVersion` = 3955 (Minecraft 1.21.1)**: el mod migra datos de versiones anteriores a la del
  juego en curso, y 1.21.1 es anterior o igual a toda 1.21.x. Solo hay bloques sin propiedades, que no cambian.
- `Metadata`: `Name` String, `Author` String (`Formas MC`), `Description` String (el enlace de la forma,
  `Estado.aEnlace`), `RegionCount` Int, `TotalBlocks` Int, `TotalVolume` Int, `TimeCreated` y `TimeModified`
  Long (ms), `EnclosingSize` compuesto `x`,`y`,`z` Int.
- `Regions`: compuesto con una región (`Formas MC`): `Position` y `Size` (compuestos `x`,`y`,`z` Int; posición
  0), `BlockStatePalette` (lista de compuestos con `Name`; el 0 es `minecraft:air`), `BlockStates` (LongArray),
  `Entities`, `TileEntities`, `PendingBlockTicks`, `PendingFluidTicks` (listas de compuestos vacías).
- `BlockStates`: bits por entrada = `max(2, ceil(log2(paleta)))`; las entradas se empaquetan seguidas, de
  menos a más significativo, **cruzando** el límite de un long; `ceil(n * bits / 64)` longs; índice
  `(y * sizeZ + z) * sizeX + x`.
- **Ejes**: `y` = capa (la capa 1 de la app es `y 0`, abajo); `z` = fila de la rejilla (`g[fila][col]`) y
  `x` = columna. Es el dibujo visto desde arriba con el norte (z negativa) arriba: el esquema se ve como la app.
  `Size` = (ancho de la capa, nº de capas, alto de la capa).
- Sin propiedades en los bloques de la lista, así que la paleta son compuestos `{ Name }`.

### Importar

`Metadata.Author` debe ser `Formas MC`, `Description` debe ser un enlace válido (`Estado.desdeEnlace`) y la
paleta debe tener, tras el aire, un bloque de la lista corta. Si no, mensaje y nada cambia:

- no es gzip/NBT o falta la estructura: «Este archivo no es un esquema de Litematica o está dañado.»
- otro autor: «Este esquema no lo hizo Formas MC: solo se pueden importar los descargados desde aquí.»
- autor correcto pero sin forma o con bloque desconocido: «Este esquema de Formas MC no se puede leer: le faltan los datos de la forma o su bloque.»

## Archivos a tocar

- `src/herramientas/formas/nucleo/nbt.js` (nuevo), `litematica.js` (nuevo).
- `src/herramientas/formas/nucleo/materiales.js`: `BLOQUES`, `BLOQUE_DEFECTO`.
- `src/herramientas/formas/nucleo/estado.js`: `bloque` en `DEFAULTS` y `cargar`.
- `src/herramientas/formas/nucleo/documento.js`: `aplicarForma`, `importarEsquema`.
- `src/herramientas/formas/interfaz/panel.js`: el selector `bloque`.
- `src/herramientas/formas/app.js`: botones de Litematica.
- `src/pages/formas/index.astro`, `src/herramientas/formas/estilos.css`: controles de «Proyecto».
- `tests/unit/nbt.test.js`, `litematica.test.js` (nuevos), `estado.test.js`, `documento.test.js`.
- `tests/e2e/e2e.js`: bloque de escenarios de 016.
- `specs/areas/{materiales,formas,interfaz}/spec.md`, `README.md`, `CLAUDE.md`, `specs/pendientes.md`.

## Chequeo de la constitución

- [x] Sin instalación ni dependencias nuevas (gzip nativo del navegador y de Node).
- [x] Español en interfaz, specs y comentarios.
- [x] Lógica pura sin DOM (`nbt`, `litematica`); `app.js` solo compone.
- [x] Spec y test primero; IDs en los tests.
- [x] `mc-formas-v1*` y la firma de marcas: se añade una clave `bloque` compatible hacia atrás; la firma no cambia.
- [x] Accesibilidad y móvil: etiqueta visible, nombres accesibles, 44 px, 16 px en el selector.
- [x] `check`, `test`, `e2e` y `build` en verde; capturas revisadas.
- [x] Lo mínimo que cumple la spec: sin selector de versión, sin importar esquemas ajenos.

## Riesgos

- **Datos guardados**: `bloque` es una clave nueva; un guardado antiguo sin ella carga con piedra. Se prueba.
- **Firma de marcas**: no se toca; test de que cambiar el bloque no la altera ni borra marcas.
- **Dibujo**: el lienzo, el PNG y la ficha no cambian; comparación píxel a píxel contra `develop` previo.
- **Archivos que el mod rechace**: la prueba en el juego es manual. Mitigación: los nombres y tipos siguen a
  Litemapy y hay bytes de referencia escritos a mano para un NBT pequeño.
- **Tamaño**: esfera de 100 = 1 000 000 entradas a 2 bits: 31 250 longs; cabe y se empaqueta en ms con `BigInt`
  (se mide en un test).
- **Paleta** de un solo bloque: 2 bits mínimo (aire + bloque), como Litematica.

## Pruebas

**Unitarias** (con ID):
- `MAT-15`: NBT pequeño contra bytes escritos a mano; ida y vuelta; empaquetado de entradas que cruzan longs con
  paletas de 2, 3 y 5 entradas (2, 2 y 3 bits) y 64 bits no divisibles; el esquema de un círculo de 16
  (`Size` 16×1×16, 208 bloques) y de una esfera de 11 (11 capas; cada capa coincide con el dibujo); el
  archivo comprimido empieza por la firma gzip; nombre de archivo (`circulo-16x16.litematic`) y nombre del
  esquema.
- `MAT-16`: el esquema no depende de las marcas ni modifica los parámetros.
- `MAT-17`: lista de bloques y sus IDs; por defecto piedra; guardado y recarga; valor desconocido o ausente
  cae en piedra; no está en la firma, en el enlace ni en el proyecto.
- `FOR-19`: ida y vuelta de varias formas; archivo ajeno, no gzip, NBT truncado y esquema de otro autor ->
  error con su mensaje; importar con marcas y otra geometría -> aviso con «Deshacer»; misma geometría -> las
  marcas siguen.

**E2E**: descarga de un `.litematic` (se lee en Node con la misma `Litematica.leer`), reimportación a la misma
forma, archivo no válido con la forma intacta, selector recordado al recargar sin tocar las marcas, botones y
selector de 44 px a 390 px, controles con etiqueta y nombre accesible. `[verificación manual]`: la carga en el
juego con el mod (no hay Minecraft en las pruebas); se dejan `circulo-16.litematic` y `esfera-11.litematic`.

## Validación visual

Capturas en móvil 390×844 (toques reales) y escritorio 1280 en los dos temas, en `scratchpad\shots-016\`.
Píxel a píxel contra una copia de `develop` previo (`git worktree`): lienzo del círculo 16, esfera 11 con guías
y tramos, y PNG; debe haber 0 píxeles distintos.

## Tareas

- [x] T01 — `nbt.js`: test (MAT-15) en rojo con bytes de referencia a mano e ida y vuelta, luego el lector y el escritor. Archivos: `nucleo/nbt.js`, `tests/unit/nbt.test.js`. Hecho cuando: pasa y cubre listas vacías, LongArray y cadenas con acentos. Commit: «MAT-15: lector y escritor de NBT».
- [x] T02 — `litematica.js`: tests (MAT-15, MAT-16, FOR-19) en rojo del empaquetado, del esquema y de su lectura; luego la implementación (gzip incluido). Archivos: `nucleo/litematica.js`, `tests/unit/litematica.test.js`. Hecho cuando: ida y vuelta de círculo, esfera y cúpula, y los tres errores. Commit: «MAT-15, MAT-16, FOR-19: esquema de Litematica (empaquetado, escritura y lectura)».
- [x] T03 — Bloque (MAT-17): tests en rojo de `Estado` y `Materiales`; `BLOQUES`, `bloque` en `Estado`, selector en el panel y en «Proyecto» (con su E2E de recarga y marcas intactas). Archivos: `materiales.js`, `estado.js`, `panel.js`, `index.astro`, tests y E2E. Hecho cuando: el bloque se recuerda al recargar y las marcas no cambian. Commit: «MAT-17: bloque del esquema como opción de vista».
- [x] T04 — Importar en el documento (FOR-19): tests en rojo de `Documento.importarEsquema` (marcas, aviso, un paso de historial, bloque); `aplicarForma`. Archivos: `documento.js`, `documento.test.js`. Hecho cuando: pasan los tests de FOR-18 sin cambios y los nuevos. Commit: «FOR-19: importar un esquema como la forma (misma regla de marcas que el enlace)».
- [x] T05 — Botones y cableado (MAT-15, MAT-16, FOR-19, INT-15): E2E en rojo (descargar, importar, archivo no válido, 44 px a 390 px); botones, icono, `app.js`; capturas. Archivos: `index.astro`, `estilos.css`, `app.js`, `e2e.js`. Hecho cuando: el E2E completo está en verde y las capturas revisadas. Commit: «MAT-15, MAT-16, FOR-19, INT-15: descargar e importar para Litematica».
- [x] T06 — Comprobación píxel a píxel, archivos de ejemplo y archivado (delta a MAT, FOR e INT con Decisiones, `Hecha`, `archivo/`, README, CLAUDE.md, pendientes). Commit: «SDD: archiva la propuesta 016 (Litematica)».
