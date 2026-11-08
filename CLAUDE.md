# Formas MC

Planificador de formas en bloques para Minecraft. Sitio estático con Astro (sin framework de UI),
módulos ES, pruebas con Vitest. Se usa desde la web publicada o con `npm run dev`; ya no se abre
con doble clic. Todo en español.

## Comandos

```bash
npm run dev        # servidor local: http://localhost:4321/mc-tools/
npm run build      # construye dist/
npm run check      # astro check
npm test           # Vitest: unitarios y validador de specs
npm run e2e        # astro build + astro preview + Edge headless vía CDP
npm run specs      # valida las specs e imprime la cobertura ID -> tests
```

## Estructura

- `src/pages/` — `index.astro` (portada, con su dibujo en vivo, y redirección de enlaces antiguos) y `formas/index.astro`.
- `src/layouts/Base.astro` — head, aviso de Mojang y pie con la versión.
- `src/herramientas/formas/` — la app: `nucleo/` (lógica pura sin DOM: `formas`, `estado`, `documento`,
  `marcas`, `historial`, `materiales`, `almacen`), `dibujo/` (canvas), `interfaz/` (DOM del panel, avisos,
  menú, exportación), `entrada/` (ratón, táctil, teclado), `app.js` (raíz de composición, sin reglas de
  negocio) y `estilos.css`.
- `src/compartido/` — versión del pie, fuentes autoalojadas, tema claro/oscuro y el dibujo en vivo de la portada; lo que compartan las herramientas.
- `tests/unit/` (Vitest), `tests/e2e/`, `tests/herramientas/` (validador de specs).
- `specs/` — constitución, áreas vivas y propuestas de cambio.

## Metodología (SDD)

La spec es la fuente de verdad; el código y los tests la implementan.

1. Un cambio de comportamiento empieza con una propuesta en `specs/cambios/NNN-…/`.
2. La propuesta pasa por `Borrador` → `En revisión` → `Aprobada` (solo el usuario aprueba).
3. Con `Aprobada` se escribe `plan.md` y se implementa tarea a tarea: primero el test en
   rojo con el ID del requisito, después el código.
4. Al terminar, el delta se aplica al área (`specs/areas/<área>/spec.md`) y la propuesta se
   archiva en `specs/cambios/archivo/`.

Detalle y comandos: `specs/README.md`. Principios: `specs/constitucion.md`.

## Reglas

- Cada requisito vigente tiene al menos un test que cita su ID (`NUM-07: …`). Solo se
  admite `[verificación manual]`, con motivo, en lo puramente visual.
- Test primero: rojo y luego verde. Un bug se corrige con un test de regresión con ID.
- No hay paso de versión: el build pone la huella en cada archivo y el pie muestra el commit.
- No se tocan las claves `mc-formas-v1*` ni la firma de las marcas sin migración y test.
- En tareas de interfaz se usa la skill `ui-ux-pro-max` y se valida con capturas reales
  (móvil 390×844 con toques reales y escritorio).
- Lo mínimo que cumple la spec. Una dependencia nueva exige enmendar la constitución (vigentes: `astro`,
  `vitest`, `typescript`, `@astrojs/check`, `@fontsource-variable/*`; versiones exactas, sin `^`).
- Commits en español y **sin push** salvo que el usuario lo pida.

## Trampas conocidas

- **E2E:** el arnés ejecuta `astro build`, arranca `astro preview` (puerto 4321) y navega a
  `http://localhost:4321/mc-tools/formas/`; lo cierra al terminar. Ya no hay `file://`: el origen es
  `localhost:4321` y se limpia `localStorage` entre escenarios.
- **E2E con Edge headless:** `edge.kill()` no cierra el navegador en Windows. Si hay
  `msedge.exe --headless` huérfanos en el puerto 9333, la siguiente ejecución se conecta al
  navegador viejo (con su emulación móvil) y falla en masa. El arnés cierra por carpeta de
  perfil; si hace falta, matar los procesos a mano.
- **Módulos:** conservan el objeto de espacio de nombres (`export const Formas = (() => {…})()`). `Formas` y
  `Render` también se exponen en `globalThis` desde `app.js` solo para el E2E.
- **Fuentes:** `src/compartido/fuentes.css` usa las variables de `@fontsource-variable` (las estáticas daban
  píxeles distintos a los de Google).
- **Firma de marcas:** un cambio real de geometría borra las marcas. No ampliar la firma
  con zoom ni opciones de vista.
- **Dibujo:** si un cambio no debe alterarlo, comprobar píxel a píxel contra la versión
  anterior antes de dar por hecho el trabajo.
- **Toques simulados con CDP:** en `Input.dispatchTouchEvent`, los puntos de `touchEnd` son los
  dedos que **se levantan**, no los que quedan. Pasar los que siguen apoyados levanta esos.
- **Cifras del lienzo:** solo se pintan con celdas de 16 px o más; en una captura con poco zoom
  no aparecen y no es un fallo.

## Publicación

GitHub Pages desde **GitHub Actions** (`.github/workflows/deploy.yml`, solo en push a `main`): corre
`npm run check`, `npm test` y el build, y si fallan no se publica nada. URL:
`https://devjean93.github.io/mc-tools/` (portada) y `…/formas/`. En Ajustes > Pages el origen debe ser
«GitHub Actions». No se hace push sin que lo pida el usuario. Las páginas HTML pueden tardar hasta unos 10
minutos en llegar (caché de Pages); el resto de archivos llevan huella en el nombre (área PUB).

## Dónde está cada cosa

- Qué hace la app y por qué: `specs/areas/<área>/spec.md` (con sus `## Decisiones`).
- Cambios en marcha: `specs/cambios/NNN-…/` (`propuesta.md` y `plan.md`, versionados).
- Ideas sin propuesta: `specs/pendientes.md`.
- Historia: `git log` (un commit por tarea).
