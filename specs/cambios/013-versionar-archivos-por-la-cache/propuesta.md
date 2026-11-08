# 013 · Versionar los archivos para que el navegador reciba lo nuevo

## Estado

Borrador

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

## Delta

### Añade

- `PUB-01`: cada hoja de estilos y cada script **locales** que carga `index.html` lleva en su
  dirección una versión (`?v=…`), la misma en todos. Los archivos externos (las fuentes de Google) no.
- `PUB-02`: un comando de npm actualiza la versión en todas esas direcciones de una vez y es
  idempotente: ejecutarlo dos veces seguidas no cambia nada más.
- `PUB-03`: `npm test` falla si alguna dirección local de `index.html` no lleva versión o si las
  versiones no coinciden, e indica cuál es.

Los IDs son provisionales y se confirman al aclarar la propuesta.

### Modifica

Nada: las claves `mc-formas-v1*` y la firma de las marcas no cambian.

### Retira

Nada.

## Criterios de aceptación

- **Dado** un `index.html` con versión, **cuando** se ejecuta el comando de versión, **entonces**
  todas las direcciones locales comparten la versión nueva y `npm test` pasa (`PUB-01`, `PUB-02`).
- **Dado** el comando ya ejecutado, **cuando** se ejecuta otra vez sin cambios, **entonces** los
  archivos quedan igual (`PUB-02`).
- **Dado** un script local de `index.html` sin `?v=` o con otra versión, **cuando** se ejecuta
  `npm test`, **entonces** falla y nombra ese archivo (`PUB-03`).
- **Dado** una dirección externa (las fuentes), **cuando** se actualiza la versión, **entonces** no
  se toca (`PUB-01`).
- **Dado** la app abierta con doble clic (`file://`), **cuando** carga, **entonces** se cargan todos
  sus scripts y funciona igual que antes (`PUB-01`).

## Preguntas abiertas

- `[NECESITA ACLARACIÓN: ¿qué formato tiene la versión? La de package.json (0.2.0, se sube a mano), una fecha con contador (20261108-1) o una huella del contenido de los archivos (cambia sola, y solo si cambian).]`
- `[NECESITA ACLARACIÓN: ¿la prueba debe exigir que la versión esté al día (falla si cambió algo de src/ y no se ejecutó el comando) o basta con que sea coherente entre todas las direcciones?]`
- `[NECESITA ACLARACIÓN: ¿se muestra la versión en el pie de la app para comprobar en la tablet cuál se está ejecutando? Tocaría también el área de interfaz.]`
- `[NECESITA ACLARACIÓN: el propio index.html puede tardar hasta unos 10 minutos en actualizarse (límite de GitHub Pages, no configurable). ¿Se acepta, o se quiere evitar con un service worker? Este exige HTTPS, no funciona con file:// y añade bastante complejidad.]`
- `[NECESITA ACLARACIÓN: ¿el comando de versión se ejecuta a mano antes de desplegar, o dentro de un comando «publicar» que encadene check, test y versión?]`
