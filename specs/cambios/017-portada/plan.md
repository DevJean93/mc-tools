# Plan · 017 · Portada más completa

## Enfoque

La portada sigue siendo `src/pages/index.astro` (con la redirección de enlaces antiguos, `PUB-08`, intacta).
Sigue importando `herramientas/formas/estilos.css`, que ya trae los tokens de los dos temas y `.ico`, `.cab`,
`.pie`; no se mueven tokens a `compartido/` porque no hace falta y así `/formas/` no puede cambiar (el CSS y
el JS de la app no se tocan). Lo nuevo:

- **Diseño** (skill `ui-ux-pro-max`, sistema ya fijado por la app: sobrio, oscuro OLED / claro, verde de
  acento, JetBrains Mono para títulos y IBM Plex Sans para texto; sin fuentes nuevas):
  - Cabecera de siempre (`h1` «Herramientas MC», frase corta, botón de tema).
  - **Presentación** (`SIT-02`): `h2` con la propuesta de valor («Planifica formas en bloques, capa a
    capa»), una frase de qué es y para quién, y botón principal «Abrir Formas MC» (verde de acento, 48 px
    de alto) hacia `/formas/`. En escritorio, dos columnas (texto | dibujo); en móvil, texto y botón
    primero y el dibujo debajo, de modo que nombre, frase y botón se ven en 390 × 844 sin desplazarse.
  - **Dibujo en vivo** (`SIT-03`) en una tarjeta con borde (como las de la app): `<canvas role="img"
    aria-label>` con pie «Capa N de 11» en un `aria-hidden` (el texto de la capa no se anuncia).
  - **Funciones** (`SIT-04`): rejilla de 6 tarjetas pequeñas (1 columna en móvil, 2 en tablet, 3 en
    escritorio) con icono de contorno (los de la app: forma, rejilla, check, cajas, imprimir, descargar) +
    título + línea de texto: Formas 2D y 3D, Numeración, Marcar lo construido, Lista de materiales,
    Exportar PNG, Imprimir ficha.
  - **Herramientas** (`SIT-01`): la lista con la tarjeta de Formas MC (la actual).
  - **Fondo** (`SIT-05`): rejilla de bloques con dos `linear-gradient` de 1 px en un token nuevo
    `--grilla` por tema (`rgba(248,250,252,.05)` oscuro, `rgba(15,23,42,.06)` claro), celda de 32 px,
    con un degradado a transparente hacia abajo (máscara) para que no compita con el texto. Sin imágenes.
    El texto va siempre sobre el fondo con un contraste de al menos 4,5:1 (la rejilla es ≤ 6 % de opacidad;
    se comprueba midiendo el píxel más claro/oscuro de la rejilla).
- **Dibujo en vivo**: módulo `src/compartido/dibujoVivo.js` (sin reglas de negocio, solo una función pura
  para la capa siguiente y otra para el tamaño de celda, más `iniciar` con el DOM). Reutiliza
  `Formas.generar({ forma: 'esfera', w: 11, h: 11, modo: 'hueco', grosor: 1, esfera: 'esfera', orient: 'plano' })`
  y `Render.dibujar` con las opciones de reglas apagadas. Cada 800 ms pasa a la capa siguiente (0 → 10 y
  vuelta a 0). `prefers-reduced-motion: reduce`: capa fija (la central, 5), sin temporizador, y reacciona si
  la preferencia cambia. Se detiene con `IntersectionObserver` (fuera de pantalla) y `visibilitychange`.
  Se repinta con el evento `mc-tema` y con `ResizeObserver` (celda = ancho disponible / 13, entre 16 y 26
  px). Sin `hechos` marcados.
- **Pie y aviso de Mojang**: los pone `Base.astro` (sin cambios).

## Archivos a tocar

- `src/compartido/dibujoVivo.js` (nuevo): `siguienteCapa`, `celdaPara`, `PARAMS`, `iniciar`.
- `src/pages/index.astro`: estructura y estilos de la portada; script que llama a `iniciar`.
- `src/herramientas/formas/estilos.css`: solo añade el token `--grilla` a los dos temas (no cambia nada
  visible en `/formas/`; se comprueba píxel a píxel).
- `tests/unit/portada.test.js` (nuevo): `SIT-03` (puras), `SIT-01` (sin enlaces externos en la fuente de la
  portada).
- `tests/e2e/e2e.js`: `SIT-01..05` y re-etiquetado a `SIT-01` de las comprobaciones de portada que hoy citan
  `PUB-04` (misma lógica).
- `specs/areas/sitio/spec.md`, `specs/areas/publicacion/spec.md`: delta al archivar.
- `README.md`, `CLAUDE.md` (si describen la portada), `specs/pendientes.md`.

## Chequeo de la constitución

- [x] Sin dependencias nuevas.
- [x] Español en interfaz, specs y comentarios.
- [x] Lógica pura sin DOM (`siguienteCapa`, `celdaPara`); `iniciar` es solo composición del DOM.
- [x] Spec y test primero; IDs `SIT-01..05` en los tests.
- [x] `mc-formas-v1*` y la firma de marcas sin cambios: la portada no lee ni escribe estado de la app.
- [x] Accesibilidad: 44 px, `role="img"` + `aria-label`, no solo color (cada función lleva icono y texto),
  `prefers-reduced-motion`, contraste ≥ 4,5:1.
- [x] `check`, `test`, `specs`, `build` y `e2e` en verde; capturas revisadas.
- [x] Lo mínimo que cumple la spec: sin fuentes ni imágenes nuevas, sin enlaces externos.

## Riesgos

- **`/formas/` no debe cambiar**: solo se añade una variable CSS que la app no usa. Píxel a píxel del lienzo
  en los dos temas contra la base.
- **Redirección `PUB-08`**: el script en línea de `index.astro` no se toca; hay E2E.
- **Rendimiento y tamaño**: el JS de la portada incluye `formas.js` y `render.js` (unos pocos KB, ya en
  la app); se mide el tamaño de `dist/` antes y después. Un canvas de unos 330 × 330 px redibujado cada
  800 ms es barato, y se detiene fuera de pantalla.
- **Móvil**: sin desplazamiento horizontal (`min-width: 0`, canvas con ancho calculado y `max-width: 100%`).
- **Render lee los colores de las variables CSS** y cachea por `data-tema`: al cambiar de tema se repinta
  con el evento `mc-tema`.

## Pruebas

**Unitarias** (`tests/unit/portada.test.js`):
- `SIT-03`: `siguienteCapa` recorre de la base a la cima y vuelve a empezar; `celdaPara` acota entre 16 y
  26; los `PARAMS` generan una esfera de 11 con 11 capas.
- `SIT-01`: la fuente de la portada no contiene ningún `href` que empiece por `http`.

**E2E** (`tests/e2e/e2e.js`):
- `SIT-02`: a 390 × 844 y 1280 × 800 el nombre, la frase y el botón están dentro de la ventana sin
  desplazarse; el botón lleva a `/formas/`; sin desplazamiento horizontal.
- `SIT-03`: la capa del dibujo cambia sola; con `prefers-reduced-motion: reduce` no cambia; los colores del
  lienzo son los del tema (oscuro y claro) y se repintan al cambiar de tema; `role="img"` con `aria-label`.
- `SIT-04`: aparecen las seis funciones, cada una con icono (`svg`) y texto.
- `SIT-05`: el fondo lleva la rejilla (`background-image`), contraste del texto ≥ 4,5:1, sin desplazamiento
  horizontal a 390 px, el contenido ocupa el ancho en 1280.
- `SIT-01`: ningún `<a href>` externo; enlaces de 44 px; botón de tema, aviso de Mojang y pie.
- `PUB-08`: sin cambios.

## Validación visual

- Capturas a 390 × 844 y 1280 × 800, en tema oscuro y claro, en `scratchpad\shots-017\`; consola sin
  errores. Comparación píxel a píxel del lienzo de `/formas/` en ambos temas contra el árbol anterior
  (`git worktree`).

## Tareas

- [x] T01 — Tests en rojo de `SIT-03` (funciones puras) y `SIT-01` (sin enlaces externos), luego
  `src/compartido/dibujoVivo.js`. Archivos: `src/compartido/dibujoVivo.js`, `tests/unit/portada.test.js`.
  Hecho cuando: pasan los tests nuevos. Commit: «SIT-03: dibujo en vivo de la portada (lógica y módulo)».
- [x] T02 — Tests E2E en rojo de `SIT-01..05` (y re-etiquetado de `PUB-04` a `SIT-01`), luego la portada
  nueva (`index.astro`, token `--grilla`). Hecho cuando: `npm run e2e`, `check`, `test` y `build` en verde.
  Commit: «SIT-01, SIT-02, SIT-03, SIT-04, SIT-05: portada con presentación, dibujo en vivo y funciones».
- [ ] T03 — Validación visual: capturas, retoques, píxel a píxel de `/formas/`, tamaño de `dist/`. Commit:
  solo si hay retoques.
- [ ] T04 — Archivar: `SIT-01..05` al área `sitio`, `PUB-04` modificado, README/CLAUDE.md,
  `pendientes.md`, propuesta a `Hecha` y al archivo. Commit: «SDD: archiva la propuesta 017 (portada)».
