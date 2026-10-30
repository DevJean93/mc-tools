# Plan · 002 · Marcar una fila o columna entera tocando su número

## Enfoque

Se reutiliza lo que ya existe: `Marcas.marcarCapas` para recorrer una línea, el historial de
`Documento` y la geometría que devuelve `Render.dibujar` para saber si el puntero cayó en la
regla. La lógica de qué bloques forman la línea vive en `marcas.js` (pura); la de qué banda
de la regla se tocó, en `render.js` (pura); las entradas solo conectan el gesto con la acción.
El dibujo no cambia: solo se añade una zona sensible en los márgenes.

## Archivos a tocar

- `src/nucleo/marcas.js`: `alternarLinea(capas, c, eje, i)`.
- `src/nucleo/documento.js`: `marcarLinea(eje, i)` con historial, aviso y resultado.
- `src/dibujo/render.js`: `zonaRegla(geo, px, py)` y su exportación.
- `src/entrada/raton.js`: clic en la regla y cursor de mano.
- `src/entrada/tactil.js`: toque corto en la regla.
- `src/entrada/teclado.js`: `F` y `C`.
- `src/app.js`: cableado de `regla`, `marcarLinea` y `anunciarLinea`.
- `index.html`: frases de ayuda táctil, de ratón y de teclado.
- `tests/unit/marcas.test.js`, `tests/unit/documento.test.js`, `tests/unit/render.test.js`.
- `tests/e2e/e2e.js`: escritorio y móvil.
- `specs/areas/marcas/spec.md`, `specs/areas/interfaz/spec.md`: delta al archivar.
- `README.md`: una línea en Funciones.

## Chequeo de la constitución

- [x] Sin instalación ni dependencias nuevas.
- [x] Español en interfaz, specs y comentarios.
- [x] Lógica pura sin DOM; `app.js` solo compone.
- [x] Spec y test primero; IDs en los tests.
- [x] `mc-formas-v1*` y la firma de marcas sin cambios.
- [x] Accesibilidad y móvil: alternativa de teclado, anuncios y ayuda.
- [x] `check`, `test`, `specs` y `e2e` en verde; capturas revisadas.
- [x] Lo mínimo que cumple la spec.

## Riesgos

- El toque en el margen podría confundirse con el inicio de un arrastre: solo cuenta si el
  dedo se movió 10 px o menos.
- Con poco zoom la banda de una fila mide menos de 24 px: la ayuda lo dice y `F`/`C` cubren
  la accesibilidad.
- Los márgenes derecho e inferior pertenecen a los tramos; `zonaRegla` debe devolver `null`.
- La firma y las claves guardadas no cambian: una fila marcada se recupera al recargar.

## Pruebas

- Unitarios: `MAR-14/15/18` en `marcas.test.js`; `MAR-16/18` en `documento.test.js`;
  `MAR-14/15/18` en `render.test.js`.
- E2E: clic en fila y columna, deshacer, `F` y `C`, toque real en móvil 390×844, arrastre
  desde el margen y `INT-07` en las dos ayudas.

## Validación visual

- Capturas de escritorio y móvil: fila marcada, aviso con «Deshacer» y cursor de mano sobre
  la regla.
- Comparación píxel a píxel con la versión actual en los casos de referencia, sin marcas:
  debe salir idéntica (el render no cambia).

## Tareas

- [x] T01 — Propuesta 002 y este plan; validador en verde. Archivos: `specs/cambios/002-…/`.
  Hecho cuando: `npm run specs` pasa. Commit: `SDD: propuesta 002 para marcar filas y columnas`.
- [x] T02 — `MAR-14/15/18`: tests de `alternarLinea` (fila, columna, desmarcar, hueco, otras
  capas, línea vacía) y la implementación. Archivos: `tests/unit/marcas.test.js`,
  `src/nucleo/marcas.js`. Hecho cuando: `npm test` en verde. Commit: `MAR-14/15: alternar una
  fila o columna entera`.
- [x] T03 — `MAR-16/18`: tests de `marcarLinea` (un paso de deshacer, aviso con Deshacer,
  línea vacía sin historial) y la implementación. Archivos: `tests/unit/documento.test.js`,
  `src/nucleo/documento.js`. Hecho cuando: `npm test` en verde. Commit: `MAR-16: marcar una
  línea es un solo paso de deshacer`.
- [x] T04 — `MAR-14/15/18`: tests de `zonaRegla` (bandas, bordes, esquina, márgenes derecho e
  inferior, regla relativa) y la implementación. Archivos: `tests/unit/render.test.js`,
  `src/dibujo/render.js`. Hecho cuando: `npm test` en verde. Commit: `MAR-14/15: zona
  sensible de las reglas`.
- [x] T05 — Entradas y cableado (ratón, táctil, teclado y `app.js`) con E2E de escritorio,
  móvil y teclado. Archivos: `src/entrada/*.js`, `src/app.js`, `tests/e2e/e2e.js`. Hecho
  cuando: `npm run e2e` en verde. Commit: `MAR-14/15/17: marcar filas y columnas con ratón,
  toque y teclado`.
- [x] T06 — `INT-07`: frases de ayuda y E2E que las comprueba. Archivos: `index.html`,
  `tests/e2e/e2e.js`. Hecho cuando: `npm run e2e` en verde. Commit: `INT-07: ayuda del gesto
  de marcar filas y columnas`.
- [x] T07 — `/sdd-archivar 002`: delta a las áreas MAR e INT, propuesta en `archivo/`, línea
  en `README.md`. Hecho cuando: `npm run specs` y `npm test` en verde. Commit: `SDD: archiva
  la propuesta 002`.
