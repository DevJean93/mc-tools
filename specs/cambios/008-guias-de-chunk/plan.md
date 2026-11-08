# Plan · 008 · Guías de chunk cada 16 bloques

## Enfoque

Casi todo existe ya. `op: st` pasa el estado entero al dibujo (también al PNG exportado), así que las
opciones nuevas viajan por el camino de las demás opciones de vista, sin cableado nuevo. El dibujo
ya se compone por capas registradas (`Render.registrar`): una capa nueva «guiasChunk» se añade después
de «rejilla» y, si la opción está apagada, sale sin pintar nada (el dibujo es idéntico al de hoy).

- **`Estado`**: `guiasChunk` entra en `VISTA` (casilla, por defecto apagada) y dos campos nuevos,
  `centroX` y `centroZ`, enteros de −30 000 000 a 30 000 000 o `null` (sin valor). Se validan al
  cargar con la misma función que las demás (`cargar`); un valor no numérico o vacío es `null`, uno
  fuera de rango se recorta. Como `guardar` escribe todo `st`, se guardan solos. `CLAVES_GEO` no
  cambia, así que ni la firma de marcas, ni el enlace (FOR-16), ni el archivo de proyecto (MAR-19)
  los llevan, y `mc-formas-v1` sigue cargando igual: los campos que faltan toman el valor por defecto.
- **`Render`**: función pura `fronterasChunk(m, cx, cz)` que devuelve los índices de línea de las
  guías: la línea `i` (entre las columnas `i−1` e `i`, con `0 < i < w`) es frontera si la X del mundo
  de la columna `i` es múltiplo de 16. La X de la columna `i` es `cx − c0 + i`, donde `c0` es la
  primera columna del centro (`Render.centro(w)[0]`, ya existente: la de arriba a la izquierda si el
  centro es 2×2). Lo mismo con las filas y `cz`. Módulo siempre positivo (`((n % 16) + 16) % 16`) para
  coordenadas negativas. La capa pinta cada guía como una línea de 2 px del color `--guia-chunk` de
  borde a borde.
- **`Panel`**: lee y escribe los dos campos (vacío ⇒ `null`; no pisa un campo mientras se teclea) y
  muestra u oculta su fila según la casilla. Una frase de ayuda cambia: sin coordenadas pide la X y
  la Z del bloque central (F3); con ellas recuerda la convención del centro 2×2.
- **`index.html` / `src/estilos.css`**: la casilla «Guías de chunk» al final de «Vista» (antes de
  los botones de PNG), la fila con «X del centro» y «Z del centro», la variable `--guia-chunk` y un
  elemento de la leyenda que solo se ve con guías visibles.

**Interfaz** (con la skill `ui-ux-pro-max`): los campos usan el mismo estilo que los numéricos del
panel (16 px, 44 px en móvil), en una fila de dos columnas como ancho/alto. `type="number"` sin
`inputmode` para que el teclado móvil ofrezca el signo menos.

**Color de la guía:** `#E879F9` (fucsia), que no usa ningún otro elemento del dibujo (verde,
dorado, azul y blanco). Se distingue también por el grosor (2 px frente a 1 px de la rejilla).

## Archivos a tocar

- `src/nucleo/estado.js`: `guiasChunk` en `VISTA`, `centroX`/`centroZ` en `DEFAULTS` y en `cargar`.
- `src/dibujo/render.js`: `fronterasChunk`, la capa, el color en la paleta y la exportación.
- `src/interfaz/panel.js`: campos, fila visible, ayuda y leyenda.
- `index.html`, `src/estilos.css`: casilla, campos, ayuda, leyenda y color. Tras cambiarlos,
  `npm run versionar` (regla de la 013); va en el mismo commit.
- `tests/unit/estado.test.js` (y el test `MAR-07` de `VISTA`, que ahora tiene una opción más),
  `tests/unit/render.test.js`, `tests/e2e/e2e.js`.
- `specs/areas/numeracion/spec.md`, `specs/areas/interfaz/spec.md`: el delta al archivar.
- `README.md`: en «Funciones».

## Chequeo de la constitución

- [x] Sin instalación ni dependencias nuevas.
- [x] Español en interfaz, specs y comentarios.
- [x] Lógica pura sin DOM: `fronterasChunk` y la validación van en `Render` y `Estado`; `Panel` solo
      toca el formulario; `app.js` no cambia.
- [x] Spec y test primero; IDs `NUM-16`, `NUM-17` e `INT-12` en los tests.
- [x] `mc-formas-v1*` y la firma de marcas **sin cambios de formato**: solo campos nuevos con valor
      por defecto, con una cadena de referencia del formato antiguo como prueba.
- [x] Accesibilidad y móvil: casilla y campos con etiqueta visible, 44 px, 16 px; la guía no
      depende solo del color (2 px frente a 1 px) y la leyenda la nombra.
- [x] UI con la skill `ui-ux-pro-max`; `check`, `test`, `specs` y `e2e` en verde; capturas reales en
      móvil y escritorio; comparación píxel a píxel con la opción apagada.
- [x] Lo mínimo que cumple la spec: una sola casilla y dos campos; sin guías de otros tamaños.

## Riesgos

- **Dibujo:** una capa nueva no puede alterar el dibujo con la opción apagada. Se comprueba píxel
  a píxel contra la versión anterior y, en el E2E, encendiendo y apagando en la misma sesión.
- **Datos guardados:** `cargar` debe seguir aceptando el `mc-formas-v1` de antes: test con la cadena
  literal del formato anterior. Un `null` guardado vuelve como `null`.
- **Coordenadas enormes o raras:** 30 000 000 cabe en un entero seguro; el módulo se hace sobre
  enteros ya recortados. Un campo con texto, `1e3` o decimales se redondea o queda en `null`.
- **Matemática del centro 2×2:** la convención (arriba a la izquierda) es la que fija
  `Render.centro`; el test del ejemplo de la propuesta (X 100, Z −40) la protege.
- **Móvil:** dos campos más en «Vista»; se comprueba que caben en 390 px y que no tapan los botones.
- **Rendimiento:** a lo sumo `w/16 + h/16` líneas extra por dibujo; despreciable.

## Pruebas

**Unitarios (`estado.test.js`):**
- `NUM-17`: valores por defecto (`guiasChunk` apagada, coordenadas `null`); un `mc-formas-v1`
  escrito antes de este cambio carga igual y con la opción apagada; las coordenadas se recortan a
  ±30 000 000, se redondean y un texto o vacío es `null`; `guiasChunk` está en `VISTA` y no en
  `CLAVES_GEO`; ni la firma, ni `aEnlace` ni `aArchivo` cambian al activarla.

**Unitarios (`render.test.js`, `fronterasChunk`):**
- `NUM-16`:
  - círculo de 16 con X = 100 y Z = −40 → una guía vertical en la línea 3 (entre las columnas 2 y 3)
    y una horizontal en la 15 (entre las filas 14 y 15), y ninguna más;
  - círculo de 15 con X = 0 → línea 7 (justo a la izquierda del bloque central);
  - coordenadas negativas (X = −1 con centro 1×1 → la guía cae a la derecha del centro);
  - una forma de 16 o menos sin frontera dentro → sin guías y sin error;
  - un dibujo grande (200) con guías cada 16 bloques → 12 o 13 líneas por eje, ninguna en los bordes;
  - esfera 3D: las mismas guías en cualquier capa (la función no depende de la capa).

**E2E (`e2e.js`):**
- `INT-12`: la casilla «Guías de chunk» existe en «Vista»; al activarla aparecen los campos con su
  etiqueta; al desactivar se ocultan pero conservan el valor; se recuerda al recargar.
- `NUM-16`: con el círculo de 16 en X = 100 y Z = −40, el píxel de la línea 3 y el de la 15 tienen el
  color de la guía y el de la línea 4 no.
- `NUM-17`: sin coordenadas el dibujo no cambia y el panel pide X y Z; encender y apagar deja el
  lienzo idéntico (`toDataURL`); las marcas siguen intactas y no sale ningún aviso; con un
  `mc-formas-v1` antiguo en `localStorage` arranca bien.
- `NUM-16`: con guías visibles, el PNG de la capa se descarga con normalidad (mismo nombre).
- `INT-12` en móvil: los dos campos caben en 390 px y miden al menos 44 px.

## Validación visual

- Capturas reales en escritorio y en móvil 390×844: guías visibles sobre un círculo de 40 en X =
  100, la casilla con sus campos y el mensaje sin coordenadas.
- Comparación píxel a píxel del lienzo contra la versión anterior con la opción apagada: idéntico.
- Sin errores de consola.

## Tareas

- [x] T01 — Test en rojo de `NUM-17` (valores por defecto, formato antiguo, recorte de coordenadas, no entra en geometría ni en enlace ni en proyecto) y después `guiasChunk` en `VISTA`, `centroX` y `centroZ` en `Estado`; actualizar el test `MAR-07` de `VISTA`. Archivos: `src/nucleo/estado.js`, `tests/unit/estado.test.js`. Hecho cuando: pasan los tests nuevos y los antiguos de `Estado`. Commit: «NUM-17: Estado guarda guiasChunk y las coordenadas del centro».
- [ ] T02 — Test en rojo de `NUM-16` con `fronterasChunk` y después la función, la capa «guiasChunk» después de «rejilla», el color en la paleta y la variable `--guia-chunk`. Archivos: `src/dibujo/render.js`, `src/estilos.css`, `tests/unit/render.test.js`, `index.html` (solo versión). Hecho cuando: pasan los tests de `fronterasChunk`. Commit: «NUM-16: fronterasChunk y capa de guías de chunk» (con `npm run versionar`).
- [ ] T03 — Test E2E en rojo de `NUM-16`, `NUM-17` e `INT-12`, y después la casilla, la fila de coordenadas, la ayuda y la leyenda, con el cableado en `Panel`. Con la skill `ui-ux-pro-max`. Archivos: `index.html`, `src/estilos.css`, `src/interfaz/panel.js`, `tests/e2e/e2e.js`. Hecho cuando: pasa el E2E completo y los campos miden 44 px o más en móvil. Commit: «INT-12, NUM-16, NUM-17: casilla Guías de chunk y coordenadas del centro» (con `npm run versionar`).
- [ ] T04 — Validación visual: capturas en escritorio y móvil, comparación píxel a píxel con la opción apagada y consola sin errores. Hecho cuando: las capturas se ven bien; si hay retoques, se hacen aquí y se vuelve a versionar. Commit: solo si hay cambios.
- [ ] T05 — Archivar: `NUM-16` y `NUM-17` al área de numeración e `INT-12` al de interfaz con sus decisiones, `README.md`, propuesta a `Hecha` y moverla al archivo. Hecho cuando: el validador está en verde con todos los IDs cubiertos. Commit: «SDD: archiva la propuesta 008 (guías de chunk)».
