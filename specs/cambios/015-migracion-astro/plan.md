# Plan · 015 · Migración a Astro

## Enfoque

El comportamiento de Formas MC no cambia: se cambia el empaquetado. El código actual entra en Astro tal
cual (sin framework de interfaz) y lo único nuevo es la portada, el pie con versión, las fuentes
autoalojadas y el despliegue.

- **Estructura** (con `git mv`, para conservar el historial):
  - `src/nucleo|dibujo|interfaz|entrada`, `src/app.js` y `src/estilos.css` pasan a
    `src/herramientas/formas/…`.
  - `index.html` se divide: el `<head>` y el pie van a `src/layouts/Base.astro`; el `<body>` a
    `src/pages/formas/index.astro`.
  - `src/pages/index.astro` es la portada. `src/compartido/` queda con un `.gitkeep`.
- **Módulos ES.** Cada archivo pasa de `const X = (() => {…})(); if (typeof module…) … else globalThis.X = X`
  a `export const X = (() => {…})();` más `import { Y } from './y.js'` donde antes leía el global
  (`typeof module !== 'undefined' ? require(…) : globalThis.Y` desaparece). **Decisión del plan:** se
  conserva el objeto-espacio de nombres (`Formas.registrar`, `Render.registrar`, `Estado.cargar`…) y su
  envoltorio de función. Quitarlo obligaría a reescribir cada `return {…}` en exportaciones con nombre y
  a tocar todos los usos y tests (diff grande, riesgo de cambiar el dibujo sin ganar nada hoy). Lo que
  la constitución pide (módulos ES, sin globales ni orden de carga) se cumple igual; desenvolverlos va
  con la migración a TypeScript, módulo a módulo (anotada en `pendientes.md`). Los dos únicos globales
  que necesita la app en el navegador son `Formas` y `Render`, que el E2E sustituye/llama
  (`Render.dibujar`, `Formas.generar`): `app.js` los expone en `globalThis` con un comentario.
- **Orden de carga** actual de `index.html` → dependencias implícitas hechas imports:
  `estado→formas`, `panel→estado,formas`, `documento→estado,formas,marcas,historial`, `zoom→estado`;
  `app.js` importa todo lo que compone. El script de la página es `<script>` de Astro (módulo, empaquetado
  y con huella de Vite).
- **Pruebas.** `node --test` → Vitest (`vitest.config.js`, solo `tests/unit/**`): cambia `node:test` por
  `vitest` y `require` por `import`; nombres e IDs intactos (234 tests + `specs.test.js`). Primero se
  cambia solo el ejecutor (T01, con CommonJS aún) y después los imports (T02), así cada paso es
  pequeño y verificable.
- **`npm run check` = `astro check`** (con `typescript` y `@astrojs/check`, que son lo que dice la
  enmienda). Revisa los `.astro` y la configuración, y los `.js` no se comprueban de tipos hasta que
  se migren a TS (sin `checkJs`): no da fricción y deja el comando ya listo para esa migración. Para la
  sintaxis de `.js`/tests, Vitest y `astro build` fallan si hay un error. Se retira
  `tests/herramientas/check.js` (no entiende `import`).
- **E2E.** El arnés CDP se conserva. `npm run e2e` pasa a ser `astro build` + `astro preview`
  (puerto 4321, lo arranca el propio arnés y lo cierra al final) y navega a
  `http://localhost:4321/mc-tools/formas/`. Se matan antes los `msedge.exe --headless` huérfanos. El
  origen deja de ser `file://` (comparte `localStorage` solo con `localhost:4321`) y el E2E lo sigue
  limpiando entre escenarios. Los E2E que dependían de `file://` o de `index.html` se revisan: el de
  `PUB-01` (`?v=`) se retira; el de `INT-11` (pie) pasa a `PUB-06`; el del enlace con `location.hash`
  y el del archivo de proyecto se mantienen (la app ya usa `location.pathname`, vale con la ruta
  nueva).
- **Versión (PUB-05, PUB-06).** La huella de los archivos la da Vite (`_astro/<nombre>.<hash>.js|css`).
  El pie muestra `versionDe(env)`: pura, en `src/compartido/version.js`
  (`GITHUB_SHA` → 7 primeros caracteres; si no hay, `git rev-parse --short HEAD` solo en `build`; en
  `dev`, `dev`). `astro.config.mjs` la inyecta con `vite.define` (`__VERSION__`).
- **Fuentes (PUB-10).** `@fontsource-variable/ibm-plex-sans` (400, 500, 600) y `@fontsource-variable/jetbrains-mono`
  (400, 600), solo los subconjuntos `latin` y `latin-ext` (acentos y ñ). **Corrección hecha al
  implementar:** las estáticas (`@fontsource/*`) daban 6 a 73 píxeles distintos por imagen respecto a
  Google, que sirve fuentes variables; con las variables la diferencia es 0. Como el CSS de fontsource
  por subconjunto no trae `unicode-range` y las variables se llaman «… Variable», se escribe
  `src/compartido/fuentes.css` con un `@font-face` por peso y subconjunto, con el nombre de familia de la
  app y los `unicode-range` de fontsource. Se importa en `Base.astro`; Vite copia los `.woff2` a
  `_astro/` con huella. Los `<link>` a Google y los `preconnect` se quitan. Si la forma de letra
  difiere de la de Google, se corrige (no se acepta).
- **Enlaces antiguos (PUB-08).** La portada lleva un script en línea que, si `location.hash` no está
  vacío, hace `location.replace(base + 'formas/' + location.hash)`. La portada no tiene otro uso de
  `#`. Los fragmentos de enlace de `Estado.aEnlace` empiezan por `forma=…`; se redirige cualquier
  fragmento no vacío (el comportamiento de ajeno `#hola` lo trata ya la app: lo deja en su sitio).
- **Despliegue (PUB-07).** `.github/workflows/deploy.yml`: en `push` a `main` (y `workflow_dispatch`),
  un trabajo `construir` hace `npm ci`, `npm run check`, `npm test`, y `withastro/action` construye y
  sube el artefacto; el trabajo `desplegar` (`needs: construir`, `actions/deploy-pages`) solo corre si
  el anterior fue bien. Versiones de las acciones fijadas a una versión exacta. No se puede probar en
  GitHub desde aquí: se valida el YAML y el build en local. Se borra `_config.yml` (Jekyll ya no
  aplica). Antes de fusionar a `main` hay que cambiar Pages a «GitHub Actions» en Ajustes.
- **Portada (PUB-04, interfaz).** Mínima y con el estilo de la app: título, una tarjeta de Formas MC
  (enlace de 44 px o más), aviso Mojang y pie con versión. Se diseña con la skill `ui-ux-pro-max`.
- **Datos (PUB-09).** No se toca nada de `Estado`, `Almacen` ni `Marcas`: solo un test con cadenas de
  referencia (estado guardado en el formato viejo y un archivo de proyecto de la 006) que carga igual.

## Archivos a tocar

- `package.json`, `package-lock.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.js`,
  `.gitignore`: dependencias fijadas (sin `^`), scripts `dev`, `build`, `preview`, `check`, `test`,
  `e2e`, `specs`; se elimina `versionar`.
- `src/herramientas/formas/**`: los 18 scripts y `estilos.css` movidos y convertidos a módulos ES.
- `src/layouts/Base.astro`, `src/pages/index.astro`, `src/pages/formas/index.astro`,
  `src/compartido/version.js`.
- `tests/unit/*.test.js`: `vitest` e imports; `tests/unit/pub.test.js` (nuevo: `PUB-06`, `PUB-09`);
  se eliminan `tests/unit/version.test.js`, `tests/herramientas/version.js`, `tests/herramientas/check.js`.
- `tests/herramientas/specs-lib.js` y `tests/unit/specs.test.js`: que también escaneen los tests
  nuevos (ya recorren `tests/` entera; se comprueba).
- `tests/e2e/e2e.js`: servidor de preview, URL nueva, bloques `PUB-04`, `PUB-05`, `PUB-06`, `PUB-08`,
  `PUB-10`.
- `.github/workflows/deploy.yml`; se borra `_config.yml`.
- `specs/areas/publicacion/spec.md`, `specs/pendientes.md`, `README.md`, `CLAUDE.md`,
  `specs/README.md` y las skills `sdd-*` si citan comandos o rutas: al archivar.

## Chequeo de la constitución

- [x] Sitio estático (principio 1, v2.0): Astro sin servidor; sin peticiones a otros dominios.
- [x] Español en interfaz, specs y comentarios.
- [x] Módulos ES; lógica pura sin DOM; `app.js` solo compone (con los dos globales para el E2E).
- [x] Spec y test primero; IDs `PUB-04`..`PUB-10` en los tests.
- [x] `mc-formas-v1*` y la firma de marcas sin cambios, con test de cadenas de referencia (`PUB-09`).
- [x] Accesibilidad y móvil en la portada (44 px, contraste, 390 px, `prefers-reduced-motion`).
- [ ] `check`, `test`, `e2e` en verde; capturas y comparación píxel a píxel revisadas (al terminar).
- [x] Dependencias nuevas solo las de la enmienda: `astro`, `vitest`, `typescript`, `@astrojs/check`,
      `@fontsource/*`; versiones exactas.

## Riesgos

- **Dibujo distinto** por las fuentes o por un cambio de orden de carga. Se compara píxel a píxel
  (lienzo, PNG exportado y ficha) contra una copia de `develop` antes de empezar y tras T02 y T06.
- **Datos guardados**: no se toca ninguna clave ni la firma; origen `devjean93.github.io` igual (la
  ruta cambia a `/mc-tools/formas/`, el `localStorage` es por origen).
- **Pesos y subconjuntos de fuentes**: si un glifo cae fuera de `latin`/`latin-ext` se vería con la
  fuente de respaldo; se revisa con las cifras, la `ñ`, `×`, `·` y `−` de la interfaz.
- **Rendimiento / tamaño**: `dist/` se mide al final; Vite empaqueta un solo script de la app.
- **Estado intermedio**: el comando `check` cambia de herramienta a mitad (T02); el E2E no se puede
  ejecutar contra `file://` desde T02. Cada commit deja los tres en verde.
- **No verificable desde aquí**: el despliegue por Actions y Pages.

## Pruebas

- Unitarios (Vitest): los 234 existentes con los mismos nombres; `PUB-06` (`versionDe`: commit corto,
  `dev`, variables de entorno), `PUB-09` (estado y proyecto de referencia), `PUB-05` y `PUB-07` se
  comprueban sobre `dist/` y el YAML.
- E2E: `PUB-04` (portada lista Formas MC y enlaza a `/formas/`), `PUB-05` (nombres con huella en
  `_astro/`, y la app carga), `PUB-06` (pie), `PUB-08` (redirección con fragmento), `PUB-10` (ninguna
  petición externa; `document.fonts` con IBM Plex Sans y JetBrains Mono).
- `PUB-07`: test unitario que lee `deploy.yml` (solo `main`, `needs`, `check`, `test`, versiones
  exactas) y la prueba real queda para el primer push a `main` (verificación manual, con motivo:
  depende de GitHub).
- Cadenas de referencia: la de estado viejo y la del proyecto 006 ya existen en `tests/`.

## Validación visual

- Comparación píxel a píxel contra `develop` (Edge headless, puerto 9455): círculo 16, esfera 11 con
  todas las opciones de vista, cúpula hueca 15 grosor 2 (lienzo y PNG exportado), y ficha impresa
  de la esfera 11 (media print). Se repite tras T02 y tras T06.
- Capturas reales de portada y `/formas/` en móvil 390×844 (toques reales) y escritorio, sin
  errores de consola.

## Tareas

- [x] T01 — Vitest como ejecutor. Test primero: `npm test` debe ejecutar los tests con `vitest run`
  (en rojo: aún no existe). Cambio: `vitest` fijado, `vitest.config.js`, los tests importan `test` de
  `vitest` en vez de `node:test` (CommonJS aún). Archivos: `package.json`, lockfile, `.gitignore`,
  `vitest.config.js`, `tests/unit/*.test.js`. Hecho cuando: 234 tests con los mismos nombres y
  `npm run specs` en verde, `check` y `e2e` sin cambios en verde. Commit: «Pruebas: pasan a Vitest sin
  cambiar nombres ni IDs (015 T01)».
- [x] T02 — Astro y módulos ES: `/formas/` idéntica. Test primero (rojo): el E2E apuntado a
  `http://localhost:4321/mc-tools/formas/` con el arnés que arranca `astro preview`; y los tests
  unitarios con `import`. Cambio: `astro`, `typescript`, `@astrojs/check`, `astro.config.mjs`
  (`site`, `base`), `tsconfig.json`, `git mv` del código, módulos ES, `Base.astro` y
  `formas/index.astro` con el cuerpo de `index.html` (sin los `<link>` de fuentes de Google aún, que
  siguen: PUB-10 va en T06), `check` = `astro check`, se retiran `PUB-01..03` (`version.test.js`,
  `tests/herramientas/version.js`, `versionar`, `check.js`, `index.html`) y el E2E de `?v=`. Un solo
  commit porque no hay forma de que la app arranque, y por tanto de que el E2E esté en verde, con la
  mitad de los archivos en cada formato. Hecho cuando: `check`, `test` (234), `e2e` (~197, sin el
  `PUB-01`) y `specs` en verde; comparación píxel a píxel = 0. Commit: «Astro: Formas MC pasa a
  módulos ES en /formas/ (015 T02)».
- [x] T03 — Portada (`PUB-04`). Test primero: E2E que abre `/mc-tools/` y comprueba una tarjeta
  «Formas MC» que enlaza a `/formas/`, aviso Mojang y pie (rojo: 404). Cambio: `index.astro` con la
  skill `ui-ux-pro-max`, estilos compartidos mínimos. Hecho cuando: E2E verde y capturas en móvil y
  escritorio. Commit: «Portada con la lista de herramientas (015 T03, PUB-04)».
- [x] T04 — Enlaces antiguos (`PUB-08`). Test primero: E2E que abre `/mc-tools/#forma=…` (cadena de
  `aEnlace`) y espera estar en `/formas/` con la misma forma y el fragmento limpio (rojo: se queda en la
  portada). Cambio: script de redirección de la portada. Commit: «Los enlaces antiguos redirigen a
  /formas/ (015 T04, PUB-08)».
- [x] T05 — Versión y huella (`PUB-05`, `PUB-06`). Test primero: unitario de `versionDe` (rojo: no
  existe) y E2E del pie y de los nombres con huella. Cambio: `src/compartido/version.js`,
  `vite.define` en `astro.config.mjs`, pie en `Base.astro`. Commit: «Pie con el commit corto y archivos
  con huella (015 T05, PUB-05, PUB-06)».
- [x] T06 — Fuentes autoalojadas (`PUB-10`). Test primero: E2E sin peticiones a otros dominios y con
  `document.fonts` de las dos familias (rojo: hoy pide a Google). Cambio: `@fontsource-variable/ibm-plex-sans`
  y `@fontsource-variable/jetbrains-mono` (versiones exactas), importes en `Base.astro`, se quitan los `<link>`
  de Google. Hecho cuando: E2E verde y comparación píxel a píxel = 0 (o diferencia explicada y
  corregida). Commit: «Fuentes autoalojadas con fontsource (015 T06, PUB-10)».
- [x] T07 — Datos antiguos (`PUB-09`). Test primero: cargar un estado guardado y un archivo de proyecto
  de la 006 de referencia (unitario y E2E con `localStorage`); es de regresión: debería pasar ya
  (se comprueba rompiendo la clave a propósito para ver el rojo y se revierte). Commit: «Pruebas de datos
  antiguos tras la migración (015 T07, PUB-09)».
- [ ] T08 — Despliegue (`PUB-07`). Test primero: test unitario del YAML (rojo: no existe). Cambio:
  `.github/workflows/deploy.yml`, se borra `_config.yml`. Commit: «Despliegue por GitHub Actions
  (015 T08, PUB-07)».
- [ ] T09 — Comparación final y capturas. Sin commit de código: píxel a píxel final, capturas en
  `scratchpad/shots-015`, tamaño de `dist/`.
- [ ] T10 — Archivar (`/sdd-archivar 015`): delta a `specs/areas/publicacion/spec.md` (PUB-04..10,
  PUB-01..03 retirados, propósito, casos límite, fuera de alcance, decisiones), estado `Hecha`,
  archivo, `pendientes.md`. Commit: «SDD: archiva la propuesta 015 (migración a Astro)».
- [ ] T11 — Documentación: `README.md`, `CLAUDE.md`, `specs/README.md` y skills `sdd-*`. Commit:
  «Docs: comandos y estructura tras la migración a Astro (015)».
