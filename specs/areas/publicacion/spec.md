# Área · Publicación

Código: `PUB`

## Propósito

Cubre cómo se construye, se versiona y se despliega el sitio, y cómo llega a las personas: que un
navegador que ya tenía la app guardada reciba la versión nueva en cuanto se publica, que lo publicado
no dependa de otros dominios y que lo guardado por versiones anteriores siga abriéndose. El sitio se
construye y se despliega solo; se abre desde la web o con `npm run dev` (ya no con doble clic).

## Requisitos

### PUB-01

(retirado en cambio 015) Las direcciones `?v=` escritas a mano: el build de Astro pone la huella en el
nombre de cada archivo. El ID no se reutiliza.

### PUB-02

(retirado en cambio 015) La huella de `index.html` y `npm run versionar`: ya no hay ese paso manual. El ID
no se reutiliza.

### PUB-03

(retirado en cambio 015) La prueba de «index.html al día»: sin el paso manual no tiene sentido. El ID no se
reutiliza.

### PUB-04

El sitio se construye con Astro y publica una portada en la raíz y cada herramienta en su propia ruta:
Formas MC queda en `/formas/`. Qué lleva la portada lo dice el área `SIT`.

Ejemplo: `https://devjean93.github.io/mc-tools/` (portada) y `…/mc-tools/formas/` (Formas MC).

### PUB-05

Cada archivo generado (script, hoja de estilos, fuente) lleva en su nombre una huella de su contenido,
calculada por el build, así que un navegador que tenía la app guardada descarga lo nuevo sin pasos
manuales. Las páginas HTML pueden tardar hasta unos 10 minutos en actualizarse (límite de GitHub Pages).

Ejemplo: `/mc-tools/_astro/estilos.CZ-QhePy.css`.

### PUB-06

El pie de cada página muestra la versión: el commit corto (7 caracteres) desde el que se construyó el
sitio en GitHub Actions, o `dev` en local.

Ejemplo: «Versión 8b03d4e» en la web publicada, «Versión dev» con `npm run dev`.

### PUB-07

Al subir a `main`, GitHub Actions construye y despliega el sitio. Antes de publicar se ejecutan la
comprobación de tipos (`npm run check`), las pruebas (`npm test`) y el build; si cualquiera falla, no se
publica nada. Las acciones del flujo llevan una versión exacta. [verificación manual: el flujo solo se
puede ejecutar en GitHub; los tests comprueban su forma (disparador, orden, dependencia y versiones) y la
prueba real es el primer push a `main`.]

### PUB-08

Los enlaces para compartir creados antes de la migración (la raíz de la web con `#forma=…`) siguen
abriendo la forma: la portada redirige a `/formas/` conservando el fragmento. La portada sin fragmento
no redirige.

### PUB-09

Los datos guardados en el navegador (`mc-formas-v1*`, con la forma, las marcas y su firma) y los archivos de
proyecto de versiones anteriores se cargan igual tras la migración. Las claves y el formato no cambian.

### PUB-10

Las fuentes de la app (IBM Plex Sans en 400, 500 y 600; JetBrains Mono en 400 y 600, subconjuntos latin y
latin-ext) se sirven desde el propio sitio, no desde Google: con o sin conexión el texto y las cifras se ven
con la misma tipografía, y la app no hace ninguna petición a otros dominios.


## Casos límite

- La portada con un fragmento cualquiera (también uno que no es de forma, como `#hola`) redirige a
  `/formas/` con ese fragmento; la app ignora el que no reconoce, igual que antes.
- Una web construida en local (sin `GITHUB_SHA`) muestra `dev`; un valor que no parece un commit tampoco
  se muestra.
- Las páginas HTML no llevan huella en su nombre: tras desplegar, un navegador con la página guardada puede
  tardar hasta unos 10 minutos en verla (límite de GitHub Pages, no configurable). En cuanto la ve, el
  resto llega al instante.
- Abrir `index.html` con doble clic (`file://`) ya no funciona: los scripts son módulos y el sitio vive
  bajo `/mc-tools/`.
- El origen no cambia (`devjean93.github.io`), así que el `localStorage` de antes sigue siendo el mismo
  aunque la ruta pase a `/formas/`. En local, `localhost:4321` es otro origen y no ve lo guardado en la web.

## Fuera de alcance

- Qué hace la app una vez cargada (áreas de formas, marcas, interfaz…).
- El alojamiento en sí (GitHub Pages) y su configuración de caché, que no se puede cambiar desde el
  repositorio. Cambiar Pages a «GitHub Actions» en Ajustes es un paso manual del propietario.
- La migración a TypeScript (propuestas posteriores, módulo a módulo).

## Decisiones

- 2026-11-08: la publicación es un área propia y no parte de `INT`: trata del despliegue y de los
  archivos, no de la interfaz. Se descartó meterla en `INT` porque mezclaría una herramienta de
  desarrollo con lo que ve la persona que usa la app.
- 2026-11-08: la versión es una huella del contenido y no la de `package.json` ni una fecha: cambia
  sola y solo si cambia algo, así que no hay que acordarse de subirla (olvidarlo era justo el
  problema) y no se invalida la caché sin motivo.
- 2026-11-08: la prueba exige que la versión esté al día, no solo que sea coherente. Es más
  estricta, pero impide desplegar por descuido con la versión vieja; el coste es ejecutar
  `npm run versionar` tras cambiar `index.html` o `src/`.
- 2026-11-08: la huella incluye `index.html` sin sus marcas, porque un cambio solo en el HTML
  también debe verse en el pie, y normaliza los saltos de línea, porque git guarda LF y en Windows
  la copia de trabajo tiene CRLF: sin normalizar, la prueba fallaría según el equipo.
- 2026-11-08: el comando se llama `versionar` y no `version`, que es un gancho propio de
  `npm version`. Es una herramienta de desarrollo en `tests/herramientas/` (excluida de la web) y no
  un paso de compilación: la app funciona sin ejecutarla.
- 2026-11-08: se descartó un service worker para que `index.html` tampoco tarde en llegar: exige
  HTTPS, no funciona con `file://` y añade mucha complejidad. Tampoco hay comando «publicar» ni
  ganchos de git: lo mínimo que cumple la spec.
- 2026-11-08: la huella se fijó con una cadena de referencia calculada aparte, a mano, para que un
  cambio de algoritmo sea visible en los tests.
- 2026-11-08 (cambio 015): se migra a Astro estático, sin framework de interfaz. Se retiran PUB-01, PUB-02
  y PUB-03 (las direcciones `?v=`, la huella de `index.html`, `npm run versionar` y su prueba): el build
  pone la huella en cada archivo (PUB-05) y ya no hay paso manual. Sus IDs no se reutilizan. Se descartaron
  Vite a secas (menos estructura para varias herramientas) y SvelteKit, Next o React (obligan a reescribir
  el lienzo y el DOM imperativo sin beneficio).
- 2026-11-08 (cambio 015): Formas MC pasa a `/formas/` y la raíz es una portada; los enlaces antiguos
  redirigen conservando la forma (PUB-08). Se descartó dejarla en la raíz hasta tener otra herramienta:
  habría que mover los enlaces después, con más gente usándolos.
- 2026-11-08 (cambio 015): la versión del pie (PUB-06) es el commit corto de `GITHUB_SHA`, sin llamar a git
  en el build: en local siempre es `dev`, que basta para distinguirlo de lo publicado.
- 2026-11-08 (cambio 015): las fuentes se autoalojan (PUB-10) con `@fontsource-variable`: las estáticas
  (`@fontsource`) daban de 6 a 73 píxeles distintos por imagen frente a Google, que sirve fuentes
  variables; con las variables la comparación da 0. Se declaran por peso y subconjunto en
  `src/compartido/fuentes.css` porque el CSS por subconjunto de fontsource no trae `unicode-range`.
- 2026-11-08 (cambio 015): las pruebas pasan a Vitest, con los mismos nombres e IDs. Se descartó conservar
  `node --test` porque no entiende los alias ni las utilidades de Vite. Los módulos conservan el objeto
  de espacio de nombres (`Formas.registrar`…) con su envoltorio de función, ahora como `export const`;
  desenvolverlos va con la migración a TypeScript.
- 2026-11-08 (cambio 015): el despliegue (PUB-07) usa `withastro/action` y `actions/deploy-pages` con
  versiones exactas, y `npm run check` (`astro check`) y `npm test` antes del build. Se borra
  `_config.yml` (Jekyll ya no aplica).
- 2026-11-08 (cambio 018): modifica PUB-04. Antes: «la portada lista las herramientas, el aviso de Mojang y el
  pie con la versión»; ahora: además lleva el botón de tema y respeta el tema elegido, que comparte con la app
  por la clave `mc-tema` (mismo origen). El script que aplica el tema va en `Base.astro`, así que lo heredan
  todas las páginas del sitio.
- 2026-11-08 (cambio 017): modifica PUB-04. Antes: «la portada lista las herramientas, el aviso de Mojang, el
  pie con la versión, el botón de tema y respeta el tema elegido»; ahora: se queda con el build y las rutas, y
  lo de la portada pasa al área `SIT` (SIT-01 a SIT-05).
