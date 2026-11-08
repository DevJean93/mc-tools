# Plan · 014 · Ficha imprimible con los dibujos en fondo claro

## Enfoque

El dibujo ya sale de `Render.dibujar`, que lee sus colores de la paleta de la app (`paleta()`, variables
CSS). Lo más pequeño es una opción nueva, `paleta`, en `dibujar`: un objeto parcial que se mezcla sobre la
paleta de la app (`{ ...paleta(), ...o.paleta }`). Sin la opción el código recorre el mismo camino que
hoy, así que pantalla y PNG no cambian.

- **`Render.PAPEL`** (constante exportada, sin DOM, testeable en Node): la paleta para papel.
  La ficha (`imagenCapa` en `exportar.js`) la pasa siempre; no hay interruptor.
- **Centro con borde grueso**: `capaCentro` pasa a leer `P.centroAncho` (la paleta de la app lo fija en
  2, como hoy; el papel en 4) y deja el borde dentro de la franja con `ancho / 2` de margen. Con 2 las
  coordenadas son las mismas que antes.
- **Ejes más oscuros**: ya los pinta `capaBandas` con `P.banda` (translúcido). En papel es un velo de
  tinta (`rgba(15,23,42,.16)`) que oscurece bloques y celdas vacías de los ejes sin tapar las cifras.
- **Bloques con borde fino**: la línea de la rejilla (1 px, gris) ya rodea cada celda; en papel sobre el
  verde suave hace de borde fino. No se añade capa nueva.
- **Guías de chunk**: ya son de 2 px; en papel un púrpura oscuro (luminancia menor que la rejilla).
- **Cabecera**: usa `P.texto` y `P.regla`, que en papel son tinta oscura sobre blanco.

Colores (skill `ui-ux-pro-max`: contraste mínimo 4,5:1, el color no es el único portador de la
información). Contrastes calculados con la fórmula WCAG:

| Elemento | Color | Nota |
|---|---|---|
| `lienzo` y `vacia` (sin relleno) | `#FFFFFF` | fondo blanco |
| `bloque` | `#BBF7D0` | verde muy suave, L = 0,82 |
| `banda` (ejes) | `rgba(15,23,42,.16)` | sobre bloque L = 0,57; sobre blanco L = 0,70 |
| `sobreBloque` (cifras sobre bloque) | `#0F172A` | 14,7:1 sobre el bloque; 10,6:1 sobre bloque con eje |
| `regla`, `tramo` | `#334155` | 10,4:1 sobre blanco; 7,4:1 sobre eje vacío |
| `texto` y `oro` (cabecera, centro, regla relativa) | `#0F172A` | 17,9:1 sobre blanco |
| `rejilla` / `rejilla5` | `#CBD5E1` / `#94A3B8` | rejilla fina gris |
| `guiaChunk` | `#6B21A8` | L = 0,07, más oscura que la rejilla (L = 0,36) |

En escala de grises: vacía 1,00 > bloque 0,82 > bloque en eje 0,57 > centro (borde 4 px) 0,01.

## Archivos a tocar

- `src/dibujo/render.js`: `PAPEL`, opción `paleta` en `dibujar`, `centroAncho` en `capaCentro`.
- `src/interfaz/exportar.js`: `imagenCapa` pasa `paleta: render.PAPEL`.
- `tests/unit/render.test.js`: `MAT-14` (contrastes, escala de grises, `centroAncho` por defecto).
- `tests/e2e/e2e.js`: `MAT-14` en el bloque de la ficha (píxeles de la ficha; lienzo oscuro).
- `specs/areas/materiales/spec.md`: delta al archivar (MAT-14 nuevo, MAT-11 modificado, Decisiones; se
  corrige la decisión que dice que el dibujo conserva la paleta oscura).
- `README.md`, `specs/pendientes.md`.

## Chequeo de la constitución

- [x] Sin instalación ni dependencias nuevas.
- [x] Español en interfaz, specs y comentarios.
- [x] Lógica pura sin DOM (`PAPEL` es un dato; `app.js` no se toca).
- [x] Spec y test primero; ID `MAT-14` (y `MAT-11`) en los tests.
- [x] `mc-formas-v1*` y la firma de marcas sin cambios: no se escribe estado.
- [x] Accesibilidad: contraste de cifras ≥ 4,5:1; centro, ejes y bloques se distinguen sin color.
- [x] `check`, `test`, `specs` y `e2e` en verde; capturas revisadas.
- [x] Lo mínimo que cumple la spec: sin interruptor, sin capa de dibujo nueva.

## Riesgos

- **Pantalla y PNG deben quedar idénticos**: la opción `paleta` es opcional y `centroAncho` vale 2 por
  defecto. Se comprueba píxel a píxel contra una copia del árbol anterior (`git worktree`) en el lienzo
  y en el PNG de varias formas (círculo 16, esfera 11 con guías de chunk y tramos, cúpula hueca).
- **Caché de `paleta()`**: `PAL` se calcula una vez; la mezcla crea un objeto nuevo y no lo toca.
- **Cifras sobre el eje**: el velo del eje es translúcido y se pinta antes de las cifras; se comprueba el
  contraste sobre el peor caso (bloque con eje).
- **Borde del centro de 4 px** sobre celdas de 20 px: deja la cifra libre (se revisa en captura).
- **Firma de marcas**: no cambia (la ficha no usa marcas).
- **Rendimiento**: igual que hoy.

## Pruebas

**Unitarias:**
- `MAT-14`: `Render.PAPEL` tiene fondo y celdas vacías blancos; cifras sobre bloque y sobre bloque con
  eje ≥ 4,5:1; regla ≥ 4,5:1 sobre blanco; luminancias vacía > bloque > bloque con eje > borde del
  centro (separadas ≥ 0,1); guías de chunk más oscuras que la rejilla; `centroAncho` mayor que el de
  pantalla.
- `MAT-14`/`MAT-11`: la ficha llama a `dibujar` con `paleta: PAPEL`; el PNG (`capa`) no pasa `paleta`.

**E2E:**
- `MAT-14`: la imagen de la ficha de una esfera de 11, dibujada en un canvas, tiene fondo blanco (esquina
  y celda vacía), píxeles verdes claros en bloques y ningún bloque oscuro grande; el lienzo de pantalla
  sigue con el fondo oscuro de siempre.

**Comparación píxel a píxel** (herramienta puntual, no se versiona): Edge headless por CDP sobre la copia
anterior y la nueva; `canvas.toDataURL` del lienzo y del PNG exportado de cada forma.

## Validación visual

- Capturas con medios de impresión de la ficha: esfera de 11 (resumen y una capa) y círculo 16, en color
  y en escala de grises; escritorio y móvil 390×844 de la app para confirmar que no cambió; consola sin
  errores.

## Tareas

- [x] T01 — Tests en rojo de `MAT-14`: unitarios (paleta de papel: contrastes, escala de grises, `centroAncho`; la ficha pasando la paleta se comprueba por píxeles en el E2E, y el PNG sin cambios por la comparación píxel a píxel) y E2E (ficha en fondo blanco, bloques verdes claros, lienzo de pantalla oscuro). Después `Render.PAPEL`, la opción `paleta` en `dibujar`, `centroAncho` en `capaCentro` y `imagenCapa` pasando `PAPEL`. Archivos: `src/dibujo/render.js`, `src/interfaz/exportar.js`, `tests/unit/render.test.js`, `tests/unit/exportar.test.js`, `tests/e2e/e2e.js`. Hecho cuando: pasan los tests nuevos, `npm test` en verde salvo el huérfano esperado, `npm run e2e` en verde y la comparación píxel a píxel de pantalla y PNG da 0 píxeles distintos. Commit: «MAT-14, MAT-11: la ficha dibuja con la paleta para papel» (con `npm run versionar`).
- [x] T02 — Validación visual: capturas en color y en grises, escritorio y móvil, consola limpia; retoques de color si hacen falta (con `npm run versionar`). Commit: solo si hay cambios (no hubo retoques: sin commit).
- [x] T03 — Archivar: `MAT-14` y `MAT-11` al área de materiales con sus decisiones, `README.md`, `pendientes.md`, propuesta a `Hecha` y moverla al archivo. Hecho cuando: el validador está en verde con todos los IDs cubiertos. Commit: «SDD: archiva la propuesta 014 (ficha en fondo claro)».
