# 015 · Migración a Astro (y TypeScript poco a poco)

## Estado

En curso

## Motivo

Formas MC es hoy una sola página con 18 scripts clásicos (IIFE y espacio de nombres global, unas 2.900
líneas) que se abre con doble clic. Funciona, pero frena lo que viene:

- **Varias herramientas MC** en un mismo sitio, con portada, menú y estilos compartidos. Hoy habría que
  copiar `index.html` y los scripts.
- **Que cada herramienta crezca** (011 varios materiales, 012 plantillas…): sin módulos reales ni
  tipos, cada función nueva depende de un orden de carga de scripts y de globales.
- **Versionar contra la caché** (013) se hace a mano con un script propio (`npm run versionar`) y exige
  recordar ejecutarlo en cada commit.

Un build con módulos ES, archivos con huella automática y páginas por herramienta resuelve las tres. Se
usa Astro estático, sin framework de interfaz: la app es lienzo y DOM imperativo, y reescribirla en
componentes no aporta nada.

## Áreas afectadas

- `PUB` (publicación): cambia cómo se construye, versiona y despliega.

El comportamiento de Formas MC no cambia: las demás áreas (`FOR`, `NUM`, `MAR`, `ZOO`, `TAC`, `MAT`,
`INT`) siguen igual y sus tests se mantienen con los mismos IDs.

## Enmienda propuesta a la constitución (versión 2.0)

Se aplica a `specs/constitucion.md` solo cuando esta propuesta esté aprobada y antes de implementar:

- **Principio 1** (antes «Sin instalación»): pasa a «Sitio estático». La app se construye con Astro y se
  publica como archivos estáticos (sin servidor ni servicios propios). Ya no se abre con doble clic:
  se usa la web publicada o `npm run dev` en local. Sigue sin necesitar red para funcionar una vez
  cargada.
- **Principio 3** (módulos): los scripts pasan de IIFE y globales a módulos ES con `import/export`. «Se
  extiende por registro» y «la lógica pura no toca el DOM» se mantienen.
- **Principio 9** (simplicidad): una dependencia nueva exige una propuesta y se anota en esta
  constitución. Las de esta migración son `astro`, `vitest`, `typescript` (con `@astrojs/check`) y
  `@fontsource` para las fuentes (todas de desarrollo o de build: al navegador solo llegan archivos
  estáticos).
- Se añade al principio 6 que la migración conserva las claves `mc-formas-v1*` y la firma de las marcas.

## Delta

### Añade

- `PUB-04`: el sitio se construye con Astro y publica una portada en la raíz y cada herramienta en su
  propia ruta; Formas MC queda en `/formas/`. La portada lista las herramientas disponibles.
- `PUB-05`: cada archivo generado (script, hoja de estilos) lleva en su nombre una huella de su
  contenido, calculada por el build, así que un navegador que tenía la app guardada descarga lo nuevo
  sin pasos manuales. Las páginas HTML pueden tardar hasta unos 10 minutos en actualizarse (límite de
  GitHub Pages).
- `PUB-10`: las fuentes de la app se sirven desde el propio sitio, no desde Google: con o sin conexión
  el texto y las cifras se ven con la misma tipografía. La app no hace ninguna petición a otros
  dominios.
- `PUB-06`: el pie de cada página muestra la versión: el commit corto desde el que se construyó, o
  `dev` en local.
- `PUB-07`: al subir a `main`, GitHub Actions construye y despliega el sitio; si falla la comprobación
  de tipos, las pruebas o el build, no se publica nada.
- `PUB-08`: los enlaces para compartir creados antes de la migración (la raíz de la web con
  `#forma=…`) siguen abriendo la forma: la portada redirige a `/formas/` conservando el fragmento.
- `PUB-09`: los datos guardados en el navegador (`mc-formas-v1*`) y los archivos de proyecto de
  versiones anteriores se cargan igual tras la migración.

### Modifica

- Propósito del área `PUB`:
  - antes: «sigue abriéndose con doble clic, sin instalación».
  - después: el sitio se construye y se despliega solo; se abre desde la web o con `npm run dev`.

### Retira

- `PUB-01`: las direcciones `?v=` escritas a mano. Las sustituye `PUB-05`.
- `PUB-02`: la huella de `index.html` y `npm run versionar`. Las sustituye `PUB-05`.
- `PUB-03`: la prueba de «index.html al día». Deja de tener sentido sin ese paso manual.
- A partir de esta propuesta la app deja de abrirse con doble clic (`file://`).

## Criterios de aceptación

- **Dado** una forma guardada por la versión anterior, **cuando** se abre la web nueva en el mismo
  navegador, **entonces** aparece la misma forma con sus marcas (`PUB-09`).
- **Dado** un enlace antiguo `…/mc-tools/#forma=…`, **cuando** se abre, **entonces** se ve la misma
  forma que antes, ahora en `/formas/` (`PUB-08`).
- **Dado** una forma cualquiera, **cuando** se compara el lienzo y el PNG exportado con los de la
  versión anterior, **entonces** son idénticos píxel a píxel (todos los requisitos de dibujo vigentes).
- **Dado** un cambio en un script, **cuando** se vuelve a construir, **entonces** el nombre del archivo
  cambia y no hace falta ejecutar ningún comando de versión (`PUB-05`).
- **Dado** un push a `main` con una prueba rota, **cuando** corre el despliegue, **entonces** no se
  publica nada (`PUB-07`).
- **Dado** el pie de la página publicada, **cuando** se lee, **entonces** muestra el commit corto
  construido, y en local muestra `dev` (`PUB-06`).
- **Dado** la portada, **cuando** se abre, **entonces** lista Formas MC y enlaza a `/formas/`
  (`PUB-04`).
- **Dado** la app abierta sin conexión, **cuando** carga, **entonces** el texto usa las mismas fuentes
  que con conexión y no se pide nada a otros dominios (`PUB-10`).

## Decisiones tomadas al aclarar

- 2026-11-08: se usa Astro estático sin framework de interfaz. Se descartaron Vite a secas (menos
  estructura para un sitio con varias herramientas) y SvelteKit, Next o React (obligan a reescribir el
  lienzo y el DOM imperativo en componentes, sin beneficio).
- 2026-11-08: se acepta dejar de abrir la app con doble clic. Basta la web publicada y
  `npm run dev`.
- 2026-11-08: el código pasa primero a módulos ES, sin cambiar lógica; después a TypeScript poco a
  poco, módulo a módulo (propuestas siguientes, no esta).
- 2026-11-08: el objetivo es varias herramientas, y que cada una crezca.

- 2026-11-08: Formas MC pasa a `/formas/` y la raíz es una portada. Los enlaces antiguos redirigen
  conservando la forma (`PUB-08`). Se descartó dejarla en la raíz hasta tener una segunda herramienta:
  habría que mover los enlaces después, con más gente ya usándolos.
- 2026-11-08: las pruebas pasan a Vitest, con los mismos nombres e IDs. Se descartó conservar
  `node --test` porque no entiende los alias ni las utilidades de Vite y hay que escribir las
  extensiones en los imports al pasar a TypeScript.
- 2026-11-08: las fuentes se autoalojan en esta misma migración (`PUB-10`), con `@fontsource`. Amplía
  el alcance: ya no es solo un cambio de empaquetado. La comparación píxel a píxel se hace con las
  mismas fuentes cargadas antes y después; si una fuente autoalojada diera otra forma de letra, se
  corrige en el plan y no se acepta la diferencia.
- 2026-11-08: el trabajo va en una rama aparte (`migracion-astro`) y solo se fusiona a `main` con el
  build, las pruebas y el despliegue por Actions probados. Antes de la fusión, el usuario cambia
  Pages a «GitHub Actions» en Ajustes. Se descartó trabajar directo en `develop` porque lo dejaría sin
  poder fusionarse a `main` mientras dure la migración.

## Preguntas abiertas

Ninguna.
