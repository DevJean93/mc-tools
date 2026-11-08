# Área · Publicación

Código: `PUB`

## Propósito

Cubre cómo llega a las personas lo que se despliega: que un navegador que ya tenía la app guardada
reciba la versión nueva en cuanto se publica, y que las herramientas de desarrollo que lo garantizan
no cambien cómo se usa la app (sigue abriéndose con doble clic, sin instalación).

## Requisitos

### PUB-01

Cada hoja de estilos y cada script **locales** que carga `index.html` lleva en su dirección una
versión (`?v=…`), la misma en todos. Las direcciones externas (las fuentes de Google) no la llevan. La
app sigue abriéndose con doble clic (`file://`) y carga todos sus archivos igual que sin versión.

Ejemplo: `<script src="src/app.js?v=8edada70">`.

### PUB-02

La versión es una huella del contenido: SHA-256 de `index.html` sin sus marcas de versión (sin los
`?v=` y con el `<span id="version">` del pie vacío) y de cada archivo local en el orden en que se
carga, cada uno con su ruta delante, con los saltos de línea normalizados a LF; se usan los 8 primeros
caracteres hexadecimales. Cambia si cambia cualquiera de esos archivos, también solo el HTML, y no
cambia si no cambia ninguno. `npm run versionar` la calcula y la escribe en todas las direcciones y en
el pie; ejecutarlo dos veces seguidas no cambia nada más, y conserva los saltos de línea del archivo.

### PUB-03

`npm test` falla si `index.html` no está al día y dice qué falla: una dirección local sin versión (con
su nombre), versiones distintas entre direcciones, un pie sin versión o con otra, o una versión que no
es la huella de los archivos actuales («no está al día: ejecuta npm run versionar»).

## Casos límite

- Mismos archivos con saltos de línea CRLF (Windows) o LF (git, GitHub): misma huella.
- Cambiar solo el texto del pie o un `?v=` a mano no cambia la huella, pero sí hace fallar la prueba
  por versión distinta.
- `index.html` en sí no lleva versión: tras desplegar, un navegador con la página guardada puede
  tardar hasta unos 10 minutos en verlo (límite de GitHub Pages, no configurable). En cuanto lo ve,
  el resto llega al instante.

## Fuera de alcance

- Qué hace la app una vez cargada (áreas de formas, marcas, interfaz…).
- El alojamiento en sí (GitHub Pages) y su configuración de caché, que no se puede cambiar desde el
  repositorio.

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
