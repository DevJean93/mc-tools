# Plan · 018 · Tema claro y oscuro con selector

## Enfoque

El color ya vive en variables CSS de `:root` y el lienzo las lee con `paleta()` (`getComputedStyle`). El tema
es un atributo `data-tema="claro|oscuro"` en `<html>`: `:root` conserva los valores de hoy (tema oscuro, sin
cambiar ni un valor) y `:root[data-tema="claro"]` los redefine. Los pocos colores que hoy están fijos en el CSS
(hover y pulsado de botones, texto de error, fila seleccionada, sombra del aviso, borde de la leyenda) pasan a
variables con el mismo valor en oscuro.

- **Sin destello (INT-17)**: un script en línea en el `<head>` de `Base.astro` lee `mc-tema` (con `try/catch`),
  si no hay elección usa `prefers-color-scheme`, pone `data-tema` y ajusta `<meta name="theme-color">`
  (oscuro `#1B2336`, claro `#FFFFFF`, el fondo de la cabecera). Se ejecuta antes de que exista `<body>`.
- **Botón y seguimiento del sistema**: `src/compartido/tema.js` (sin DOM propio: recibe `raiz`, `boton`,
  `almacen`, `media`, `meta`, así se prueba en Node) con `resolver`, `otro`, `etiqueta` e `iniciar`. `iniciar`
  pone el nombre accesible y `aria-pressed`, alterna al tocar, guarda en `mc-tema` (si falla, sigue en la
  visita), escucha el cambio del sistema solo mientras no haya elección guardada y avisa con el evento
  `mc-tema` en `document`.
- **Botón en las dos cabeceras**: componente `src/compartido/BotonTema.astro` (dos iconos SVG de contorno, sol y
  luna, que el CSS alterna según `data-tema`) con su `<script>` que llama a `Tema.iniciar`. En la app va junto
  a «Ocultar menú» dentro de un contenedor `.cab-acciones`; en la portada, a la derecha de la cabecera.
- **Lienzo y PNG (MAT-07, INT-18)**: `paleta()` cachea en `PAL`; se guarda con el valor de `data-tema` con el
  que se leyó y se vuelve a leer si cambia, así lienzo y PNG siempre usan el tema activo. La ficha pasa
  `render.PAPEL` y no cambia (MAT-14). `app.js` escucha `mc-tema` y repinta (`dibujar()`), sin tocar forma,
  marcas ni historial.
- **Paleta clara** (skill `ui-ux-pro-max`: contraste ≥ 4,5:1, los estados no dependen solo del color, acento
  verde oscurecido para texto, amarillo del oro más oscuro para texto sobre claro):

| Variable | Oscuro (igual que hoy) | Claro |
|---|---|---|
| `--bg` / `--card` / `--muted` | `#0F172A` / `#1B2336` / `#272F42` | `#F1F5F9` / `#FFFFFF` / `#E2E8F0` |
| `--border` | `#475569` | `#7F8EA3` (3,0:1 sobre el fondo, 3,3:1 sobre tarjeta) |
| `--fg` / `--fg-mut` | `#F8FAFC` / `#94A3B8` | `#0F172A` / `#475569` |
| `--accent` / `--on-accent` | `#22C55E` / `#0F172A` | `#15803D` / `#FFFFFF` |
| `--oro` | `#FACC15` | `#854D0E` |
| `--lienzo` / `--vacia` | `#0B1222` / `#1B2336` | `#E2E8F0` / `#FFFFFF` |
| `--bloque` / `--hecho` | `#22C55E` / `#3B82F6` | `#4ADE80` / `#3B82F6` |
| `--sobre-bloque` | `#0F172A` | `#0F172A` (10,2:1 sobre bloque, 7,2:1 sobre bloque en eje) |
| `--centro-banda` | `rgba(250,204,21,.28)` | `rgba(120,53,15,.22)` |
| `--regla` / `--tramo` | `#CBD5E1` / `#7DD3FC` | `#334155` / `#0C4A6E` |
| `--rejilla` / `--rejilla-5` | `rgba(15,23,42,.55)` / `rgba(248,250,252,.35)` | `rgba(15,23,42,.18)` / `rgba(15,23,42,.45)` |
| `--guia-chunk` | `#E879F9` | `#7E22CE` |

  Escala de grises del claro: vacía 1,00 > bloque 0,55 > bloque en eje 0,37 > centro (borde de `--oro`) 0,10.

## Archivos a tocar

- `src/compartido/tema.js` (nuevo) y `src/compartido/BotonTema.astro` (nuevo).
- `src/layouts/Base.astro`: script en línea del tema y `theme-color`.
- `src/pages/formas/index.astro`, `src/pages/index.astro`: el botón en la cabecera.
- `src/herramientas/formas/estilos.css`: variables nuevas, bloque `:root[data-tema="claro"]`, `.cab-acciones`,
  botón de tema, iconos según tema.
- `src/herramientas/formas/dibujo/render.js`: la caché de `paleta()` depende del tema.
- `src/herramientas/formas/app.js`: repinta al evento `mc-tema`.
- `tests/unit/tema.test.js` (nuevo, `INT-16`, `INT-17`) y `tests/unit/render.test.js` (`INT-18`).
- `tests/e2e/e2e.js`: `INT-16`, `INT-17`, `INT-18`, `MAT-07`, `PUB-04`; el arnés emula tema oscuro por defecto
  para que el resto de escenarios sigan igual.
- `specs/areas/interfaz/spec.md` (INT-16..18 + Decisiones), `materiales/spec.md` (MAT-07),
  `publicacion/spec.md` (PUB-04), `README.md`, `CLAUDE.md` si procede, `specs/pendientes.md`.

## Chequeo de la constitución

- [x] Sin instalación ni dependencias nuevas.
- [x] Español en interfaz, specs y comentarios.
- [x] Lógica sin DOM propio (`tema.js` recibe los elementos); `app.js` solo escucha un evento y repinta.
- [x] Spec y test primero; IDs en los tests.
- [x] `mc-formas-v1*` y la firma de marcas sin cambios: clave propia `mc-tema`.
- [x] Accesibilidad: 44 px en móvil, nombre accesible, `aria-pressed`, icono además del color, `prefers-reduced-motion`.
- [x] `check`, `test`, `specs`, `build` y `e2e` en verde; capturas revisadas.
- [x] Lo mínimo que cumple la spec: dos posiciones, sin «Automático».

## Riesgos

- **Tema oscuro idéntico**: los valores oscuros no cambian; se comprueba píxel a píxel (lienzo y PNG, 4 formas
  y la ficha) contra una copia de `develop` previa.
- **Caché de `paleta()`**: sin invalidarla el lienzo seguiría con la paleta vieja; el E2E comprueba que el
  lienzo cambia al alternar y que el PNG sale con la paleta del tema.
- **Destello**: el script en línea va en el `<head>`; el E2E comprueba que el atributo ya está puesto cuando
  aún no existe `<body>`.
- **Almacenamiento bloqueado**: lectura y escritura con `try/catch`; el botón funciona igual.
- **Emulación del arnés E2E**: Edge headless sin preferencia puede seguir el tema claro del sistema; el arnés
  fija `prefers-color-scheme: dark` al arrancar para que los escenarios previos no cambien.
- **Cabecera en móvil (390 px)**: dos botones (44 px y «Ocultar menú») caben junto al título; se revisa en captura.

## Pruebas

**Unitarias:**
- `INT-17`: `resolver` (guardado manda, si no el sistema); `iniciar` sigue al sistema en vivo solo sin elección;
  al tocar guarda en `mc-tema`, alterna y manda desde entonces; con un almacén que lanza el botón funciona.
- `INT-16`: `etiqueta` dice a qué tema cambia; `aria-pressed` según el tema; el evento `mc-tema`.
- `INT-18`: variables del bloque claro de `estilos.css`: cifras sobre bloque, sobre bloque en eje y sobre hecho
  ≥ 4,5:1; regla, tramo, texto y oro sobre fondo y sobre eje vacío ≥ 4,5:1; `--fg-mut`, `--accent` y `--oro`
  sobre `--bg` y `--card` ≥ 4,5:1; escalón de luminancia ≥ 0,1 entre vacía, bloque, bloque en eje y centro;
  guía de chunk más oscura que la rejilla; el bloque oscuro conserva los valores de siempre.

**E2E:** sistema claro sin guardado → claro (`INT-17`); alternar sin recargar conserva forma y marcas (`INT-16`);
elegido oscuro con sistema claro, recarga sin destello (`INT-17`); la portada hereda el tema y tiene el botón
(`INT-17`, `PUB-04`); PNG claro (fondo claro) y oscuro (fondo oscuro) (`MAT-07`); `theme-color` sigue el tema;
botón de 44 px a 390 px (`INT-16`); el lienzo cambia de fondo (`INT-18`).

## Validación visual

- Capturas de app y portada en los dos temas, móvil 390×844 (toques reales) y escritorio 1280, y PNG en los dos.
- Comparación píxel a píxel del tema oscuro contra la copia anterior (lienzo y PNG de círculo 16, esfera 11,
  esfera 11 sin extras y cúpula 15; ficha).

## Tareas

- [ ] T01 — Tests en rojo de `INT-16`/`INT-17` (`tests/unit/tema.test.js`) y luego `src/compartido/tema.js`. Hecho cuando: pasan los tests nuevos. Commit: «INT-16, INT-17: lógica del tema (resolver, guardar, seguir al sistema)».
- [ ] T02 — Test en rojo de `INT-18` (contrastes y escala de grises del bloque claro, bloque oscuro intacto) y luego las variables y `:root[data-tema="claro"]` en `estilos.css`, `paleta()` por tema y repintado en `app.js`. Hecho cuando: pasan los tests y el tema oscuro es idéntico píxel a píxel. Commit: «INT-18, MAT-07: paleta clara y lienzo que sigue el tema».
- [ ] T03 — E2E en rojo (`INT-16`, `INT-17`, `PUB-04`, `MAT-07`, `INT-18`) y luego script del `<head>`, `BotonTema.astro` y su sitio en las dos cabeceras. Hecho cuando: E2E verde, capturas revisadas, sin errores de consola. Commit: «INT-16, INT-17, PUB-04: botón de tema en la app y en la portada».
- [ ] T04 — Archivar: INT-16..18 al área de interfaz, MAT-07 y PUB-04 modificados con sus Decisiones, `README.md`, `pendientes.md`, propuesta `Hecha` y a `archivo/`. Hecho cuando: `npm run specs` y `npm test` en verde. Commit: «SDD: archiva la propuesta 018 (tema claro y oscuro)».
