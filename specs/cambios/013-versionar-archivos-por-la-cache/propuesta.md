# 013 · Versionar los archivos para que el navegador reciba lo nuevo

## Estado

En curso

## Motivo

Al desplegar un cambio en GitHub Pages, un navegador que ya tenía la app puede seguir mostrando la
versión anterior. Pasó en una tablet: la versión nueva solo se veía abriendo la web en incógnito.

La causa es que `index.html` carga siempre las mismas direcciones (`src/app.js`, `src/estilos.css`…).
GitHub Pages las sirve para guardarlas unos 10 minutos y no se puede configurar, y los navegadores
móviles pueden retener la copia más tiempo, sobre todo al reabrir una pestaña en vez de recargarla.
Si la dirección de cada archivo lleva una versión (`src/app.js?v=…`), cuando la versión cambia el
navegador lo trata como un archivo nuevo y lo descarga.

La app debe seguir abriéndose con doble clic y sin dependencias (constitución, principio 1): la
herramienta que actualiza las versiones es de desarrollo, como `tests/herramientas/check.js`, y no un
paso de compilación; la app funciona sin ejecutarla.

## Áreas afectadas

- `PUB` (publicación, área nueva, solo con su esqueleto hasta archivar)
- `INT` (interfaz): la versión se muestra en el pie

## Delta

### Añade

- `PUB-01`: cada hoja de estilos y cada script **locales** que carga `index.html` lleva en su
  dirección una versión (`?v=…`), la misma en todos. Los archivos externos (las fuentes de Google) no.
- `PUB-02`: la versión es una huella del contenido de `index.html` y de esos archivos locales (en
  el orden en que `index.html` los carga): cambia sola si cambia alguno y no cambia si no cambia
  ninguno. En `index.html` se ignoran las propias marcas de versión, para que la huella no dependa
  de sí misma. Los saltos de línea se normalizan antes de calcularla, así que da lo mismo en
  Windows (CRLF) que en Linux o en GitHub (LF). Un comando
  de npm la calcula y la escribe de una vez en todas las direcciones y en el pie (`INT-11`). Es
  idempotente: ejecutarlo dos veces seguidas no cambia nada más.
  Ejemplo: `src/app.js?v=7f3a9c1e` en todos los archivos; si no se toca nada, el comando deja
  `index.html` igual.
- `PUB-03`: `npm test` falla si alguna dirección local de `index.html` no lleva versión, si las
  versiones no coinciden entre sí o si no coinciden con la huella de los archivos actuales (es decir,
  si se cambió algo y no se ejecutó el comando), e indica qué falla.
- `INT-11`: el pie de la app muestra la versión («Versión 7f3a9c1e»), la misma que llevan las
  direcciones, con texto discreto pero legible, para poder comprobar en cualquier dispositivo qué
  versión se está ejecutando.

### Modifica

Nada: las claves `mc-formas-v1*` y la firma de las marcas no cambian.

### Retira

Nada.

## Criterios de aceptación

- **Dado** cambios en algún archivo de `src/`, **cuando** se ejecuta el comando de versión,
  **entonces** todas las direcciones locales y el pie llevan la huella nueva y `npm test` pasa
  (`PUB-01`, `PUB-02`, `INT-11`).
- **Dado** el comando ya ejecutado, **cuando** se ejecuta otra vez sin cambios, **entonces**
  `index.html` queda idéntico (`PUB-02`).
- **Dado** un cambio solo en el HTML de `index.html` (sin tocar `src/`), **cuando** se ejecuta el
  comando, **entonces** la versión cambia (`PUB-02`).
- **Dado** los mismos archivos con saltos de línea CRLF o LF, **cuando** se calcula la huella,
  **entonces** es la misma (`PUB-02`).
- **Dado** un archivo de `src/` cambiado sin ejecutar el comando, **cuando** se ejecuta `npm test`,
  **entonces** falla y dice que la versión no está al día (`PUB-03`).
- **Dado** un script local de `index.html` sin `?v=` o con otra versión, **cuando** se ejecuta
  `npm test`, **entonces** falla y nombra ese archivo (`PUB-03`).
- **Dado** una dirección externa (las fuentes), **cuando** se actualiza la versión, **entonces** no
  se toca (`PUB-01`).
- **Dado** la app abierta con doble clic (`file://`), **cuando** carga, **entonces** se cargan todos
  sus scripts y funciona igual que antes, y el pie muestra la versión (`PUB-01`, `INT-11`).

## Decisiones tomadas al aclarar

- 2026-11-08: la versión es una huella del contenido y no la de `package.json` ni una fecha: cambia
  sola y solo si cambia algo, así que no hay que acordarse de subirla (olvidarlo es justo el problema
  que se quiere resolver) y no se invalida la caché sin motivo.
- 2026-11-08: la prueba exige que la versión esté al día. Es más estricta, pero imposibilita
  desplegar por descuido con la versión vieja; el coste es ejecutar el comando tras editar.
- 2026-11-08: la versión se muestra en el pie (`INT-11`): es la forma de comprobar en la tablet si
  tiene lo nuevo sin abrir herramientas de desarrollo. Esto amplía el alcance a `INT`.
- 2026-11-08: se acepta que `index.html` tarde hasta unos 10 minutos en actualizarse (límite de
  GitHub Pages) y se anota como límite conocido; en cuanto el navegador ve el `index.html` nuevo,
  el resto llega al instante. Se descartó el service worker (exige HTTPS, no funciona con
  `file://` y añade mucha complejidad); podría ser otra propuesta.
- 2026-11-08: es un comando suelto que se ejecuta a mano antes de desplegar, sin comando «publicar»
  que lo encadene: lo mínimo que cumple la spec. Como la prueba exige que esté al día, olvidarlo
  se detecta. Al planificar se fijará el nombre del comando; ojo, `version` es un gancho
  propio de `npm version` y conviene evitarlo.

- 2026-11-08 (revisión antes de aprobar): la huella incluye `index.html` sin sus marcas de versión,
  porque un cambio solo en el HTML también debe verse en el pie; y normaliza los saltos de línea,
  porque git guarda LF y en Windows la copia de trabajo tiene CRLF: sin normalizar, la prueba «al
  día» fallaría según el equipo.
- 2026-11-08: aprobada por el usuario.

## Preguntas abiertas

Ninguna.
