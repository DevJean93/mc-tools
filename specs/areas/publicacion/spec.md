# Área · Publicación

Código: `PUB`

## Propósito

Cubre cómo llega a las personas lo que se despliega: que un navegador que ya tenía la app guardada
reciba la versión nueva en cuanto se publica, y que las herramientas de desarrollo que lo garantizan
no cambien cómo se usa la app (sigue abriéndose con doble clic, sin instalación).

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
