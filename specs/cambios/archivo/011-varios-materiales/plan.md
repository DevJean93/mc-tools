# Plan · 011 · Varios materiales por forma

## Enfoque

El reparto es una opción guardada más, como el bloque de la 016: `st.relleno` (`''` = «Igual que el
borde» = un solo material, o un ID de `Materiales.BLOQUES`). Va al final de lo guardado en `mc-formas-v1`,
fuera de la firma, de `CLAVES_GEO`, de `VISTA` y del enlace. El borde usa `st.bloque`.

- **Zonas (lógica pura, `nucleo/materiales.js`)**: `Materiales.rellenoDe(capas)` devuelve, por capa, un
  `Uint8Array` (índice `y * w + x`, 1 = bloque de relleno) y el recuento por capa. Un bloque es borde si
  alguno de sus 4 vecinos de la capa está vacío o fuera de la rejilla y, con varias capas (3D), también si
  la capa de arriba o la de abajo no existe o no tiene bloque en esa celda (en una cúpula la capa 1 es toda
  borde: no hay nada debajo). Un bucle de un solo paso sobre las celdas; una esfera de 100 son 10⁶ celdas.
  Se calcula **una vez por regeneración** y se guarda en el documento (se invalida al cambiar `capas`); el
  pintado solo lee el `Uint8Array`.
- **`Materiales.repartoActivo({ modo, bloque, relleno })`**: `{ borde, relleno }` (IDs) o `null`. Solo hay
  reparto en formas sólidas y con un relleno distinto del borde. En hueco todo es borde (MAT-18): el
  selector de relleno queda **deshabilitado** (no oculto) con una línea de ayuda que lo explica; el valor
  elegido se conserva para cuando se vuelva a sólido. Ocultarlo haría desaparecer una opción sin explicación.
- **Desglose**: `Materiales.resumen(totales, porCapa, capa, reparto)` con un cuarto parámetro opcional
  `{ materiales: [{ id, nombre, porCapa }, …] }` (borde, relleno). Sin él devuelve lo mismo de siempre. Con él
  añade `r.materiales` (total, stacks, shulkers, cofres de cada uno) y `porMaterial` en cada capa.
  `VistaMateriales` pinta el total como hoy y, debajo, un bloque por material; la tabla por capas gana una
  columna por material entre «Stacks» y «Hechos». Sin reparto el HTML es el de hoy, carácter a carácter.
- **Dibujo**: `Render.dibujar` acepta `relleno` (el `Uint8Array` de la capa o nada). `capaCeldas` elige
  `P.relleno` para esas celdas; lo construido sigue en `P.hecho`. Sin la opción, el mismo código de antes.
  Nuevo color `--relleno` en los dos temas (`estilos.css`) y `relleno` en `Render.PAPEL`:

  | Tema | Bloque | Relleno | Contraste de la cifra `#0F172A` sobre el relleno (sobre el relleno en eje) |
  |---|---|---|---|
  | oscuro | `#22C55E` (L 0,41) | `#6E9C80` (L 0,29) | 5,7:1 (6,9:1) |
  | claro | `#4ADE80` (L 0,55) | `#86B096` (L 0,38) | 7,4:1 (5,6:1) |
  | papel | `#BBF7D0` (L 0,82) | `#CBD5D0` (L 0,65) | 11,9:1 (8,7:1) |

  Es un verde grisáceo (menos saturado y menos luminoso), siempre distinguible por luminancia del bloque
  (diferencia ≥ 0,1), no solo por tono; la leyenda lo nombra.
- **Leyenda**: `<li id="leyendaRelleno">Relleno</li>`, oculto salvo con reparto. Con reparto la primera entrada
  pasa de «Bloque» a «Borde».
- **Interfaz**: el control va en «Proyecto», justo bajo el selector de bloque de la 016 (que pasa a decir
  «… (borde)»): los dos materiales juntos y junto a «Descargar para Litematica», donde ya se piensa en
  materiales; no se mueve nada de sitio ni se rompe lo de la 016. Etiqueta visible «Material del relleno»,
  primera opción «Igual que el borde», misma lista `BLOQUES`, 44 px y 16 px en móvil por el CSS existente de
  `select`. Se descartó ponerlo en «Materiales»: obligaría a mover el selector de bloque.
- **Proyecto (MAR-19)**: campo opcional `reparto: { borde, relleno }` al final del archivo, solo si hay
  reparto; sin reparto el archivo es byte a byte el de antes (PUB-09). `desdeArchivo` lo valida (IDs de la
  lista y distintos) y lo devuelve; un archivo sin él (o con uno no válido) carga con un solo material. La
  versión del formato sigue en 1. Cargar un proyecto cambia `bloque` y `relleno` (no entran en el historial,
  como al importar un esquema).
- **Litematica (MAT-21)**: con reparto la paleta es aire, borde, relleno y cada celda lleva su índice
  (1 = borde, 2 = relleno). `leer` devuelve también `relleno` (de `paleta[2]`, o `''`); `importarEsquema`
  lo pone. Sin reparto el esquema es el de antes (misma paleta de 2).
- **Ficha**: `paginaResumen` pasa el reparto a `VistaMateriales` y `imagenCapa` el relleno de la capa con la
  paleta de papel; el PNG de la capa también.

## Archivos a tocar

- `src/herramientas/formas/nucleo/materiales.js`: `rellenoDe`, `repartoActivo`, `resumen` con reparto.
- `src/herramientas/formas/nucleo/estado.js`: `relleno` (DEFAULTS al final, `cargar`), `aArchivo` y `desdeArchivo`.
- `src/herramientas/formas/nucleo/litematica.js`: paleta de 3 y lectura del relleno.
- `src/herramientas/formas/nucleo/documento.js`: caché de zonas, `reparto()`, `rellenoCapa(c)`,
  `cargarProyecto` e `importarEsquema` con el reparto.
- `src/herramientas/formas/dibujo/render.js` y `estilos.css`: color y celdas del relleno.
- `src/herramientas/formas/interfaz/panel.js`, `vista-materiales.js`, `exportar.js`, `app.js`,
  `src/pages/formas/index.astro` (selector, ayuda, leyenda) y `estilos.css`.
- `tests/unit/`: `materiales`, `estado`, `litematica`, `documento`, `render`, `exportar`, `pub`;
  `tests/e2e/e2e.js`.
- `specs/areas/materiales/spec.md` y `specs/areas/marcas/spec.md` (delta al archivar), `README.md`, `CLAUDE.md`
  (lista de módulos si cambia), `specs/pendientes.md`.

## Chequeo de la constitución

- [x] Sin instalación ni dependencias nuevas.
- [x] Español en interfaz, specs y comentarios.
- [x] Lógica pura sin DOM; `app.js` solo compone.
- [x] Spec y test primero; IDs en los tests.
- [x] `mc-formas-v1*` (solo una clave nueva al final, test PUB-09) y la firma de marcas sin cambios.
- [x] Accesibilidad y móvil (44 px, etiqueta visible, no solo color, 16 px).
- [x] `check`, `test` y `e2e` en verde; capturas revisadas.
- [x] Lo mínimo que cumple la spec: dos materiales, sin rangos de capas.

## Riesgos

- **Datos guardados**: una clave nueva al final; lo anterior queda byte a byte. Un guardado antiguo carga con
  `relleno: ''`.
- **Firma**: `relleno` no entra; cambiarlo no borra marcas ni saca aviso (test).
- **Rendimiento**: esfera de 100 = 10⁶ celdas; una pasada por regeneración, solo con reparto activo. Test con
  límite de tiempo.
- **Dibujo sin reparto**: debe ser idéntico píxel a píxel (lienzo, PNG y ficha, dos temas): se compara contra
  un worktree de `develop` previo.
- **Hueco con relleno elegido**: el reparto no está activo; el archivo de proyecto y el esquema lo tratan
  igual (el esquema de una forma hueca lleva solo el borde y al importarlo el relleno vuelve a «Igual que el
  borde»).
- **Cúpula**: su capa 1 es toda borde (no hay capa debajo); es la regla de la propuesta.

## Pruebas

- `MAT-18`: borde/relleno del círculo de 16 (cuenta contra un cálculo independiente), esfera de 11 capa 1 toda
  borde, 3D por arriba y abajo, hueco sin reparto, esfera de 100 en < 1 s; opciones guardadas y fuera de la
  firma, del enlace y de `CLAVES_GEO`.
- `MAT-19`: círculo de 16 con dos materiales suma 208; las cajas de cada material; la tabla por capas y la
  ficha; sin reparto el HTML y el resumen no cambian.
- `MAT-20`: paletas con contraste y luminancia en los tres temas; celdas de relleno y su ausencia sin reparto.
- `MAT-21`: paleta de 3, índices por zona, ida y vuelta del esquema con dos bloques (FOR-19), una celda de
  borde y una de relleno; PUB-09 con el sufijo nuevo; cambiar el reparto no borra marcas.
- `MAR-19`: archivo con reparto (ida y vuelta) y archivo antiguo (cadena de referencia) que carga con un solo
  material.
- E2E: elegir relleno en el navegador (desglose, leyenda, píxeles del lienzo, recarga), descargar el esquema,
  hueco deshabilita el control, la ficha lleva el desglose.

## Validación visual

- Capturas móvil 390×844 (con toques reales) y escritorio 1280, en tema oscuro y claro, en
  `scratchpad\shots-011\`.
- Comparación píxel a píxel contra un worktree de `develop` (lienzo, PNG y ficha sin reparto, dos temas).

## Tareas

- [x] T01 — `rellenoDe`, `repartoActivo` y `resumen` con reparto (MAT-18, MAT-19). Archivos: `materiales.js`,
  `materiales.test.js`. Hecho cuando: los tests de zonas y de suma pasan y sin reparto el resumen no cambia.
  Commit: «MAT-18, MAT-19: zonas de borde y relleno y desglose por material».
- [x] T02 — `relleno` guardado y en el archivo de proyecto (MAT-21, MAR-19, PUB-09). Archivos: `estado.js`,
  `estado.test.js`, `pub.test.js`. Hecho cuando: cargar, guardar y la cadena de PUB-09 pasan.
  Commit: «MAT-21, MAR-19: el reparto se guarda y viaja en el proyecto».
- [x] T03 — esquema de Litematica con dos bloques y su lectura (MAT-21, FOR-19). Archivos: `litematica.js`,
  `litematica.test.js`. Hecho cuando: paleta de 3, índices por zona e ida y vuelta pasan.
  Commit: «MAT-21, FOR-19: esquema con borde y relleno y su lectura».
- [x] T04 — colores del relleno y celdas (MAT-20). Archivos: `render.js`, `estilos.css`, `render.test.js`.
  Hecho cuando: contraste y luminancia en los tres temas y `capaCeldas` pintan; sin relleno nada cambia.
  Commit: «MAT-20: color del relleno en los dos temas y en papel».
- [x] T05 — documento, interfaz, leyenda, ficha y E2E (MAT-18..21, MAR-19). Archivos: `documento.js`,
  `panel.js`, `vista-materiales.js`, `exportar.js`, `app.js`, `index.astro`, `estilos.css`, tests y E2E.
  Hecho cuando: el flujo completo funciona en el navegador y los píxeles sin reparto no cambian.
  Commit: «MAT-18, MAT-19, MAT-20, MAT-21, MAR-19: reparto de materiales en la interfaz».
- [x] T06 — capturas, archivado (delta en MAT y MAR, Decisiones, README, pendientes). Commit: «SDD: archiva
  la propuesta 011 (varios materiales)».
