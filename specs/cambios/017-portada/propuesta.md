# 017 · Portada más completa

## Estado

Borrador

## Motivo

La portada (`PUB-04`, propuesta 015) es solo un título, una tarjeta con texto y el pie. Cumple, pero
es la primera impresión del sitio: no enseña cómo es la herramienta, no explica para qué sirve ni da
una razón para entrar, y en escritorio deja casi toda la pantalla vacía. Con más herramientas en
camino (y Litematica, 016), la portada debe presentar el sitio y llevar a cada herramienta de un
vistazo.

## Áreas afectadas

- `PUB` (publicación): la portada vive aquí desde la 015.

Formas MC y su interfaz no cambian.

## Delta

### Añade

- `PUB-11`: la portada abre con una presentación: el nombre del sitio, una frase que dice qué es y
  para quién, y un botón principal que lleva a Formas MC (44 px, visible sin desplazarse en móvil y
  escritorio).
- `PUB-12`: la portada enseña cómo se ve Formas MC: una imagen de una forma numerada, con el mismo
  dibujo de la app, con texto alternativo que la describe.
- `PUB-13`: la portada resume en pocas líneas lo que se puede hacer con Formas MC (formas 2D y 3D,
  numeración, marcar lo construido, materiales, exportar e imprimir), cada punto con un icono de
  contorno del mismo estilo que la app y sin depender solo del color.
- `PUB-14`: la portada se ve bien en móvil (390 px, sin desplazamiento horizontal) y en escritorio
  (sin grandes huecos vacíos), con el estilo oscuro y la tipografía de la app, y respeta
  `prefers-reduced-motion` si lleva animación.

### Modifica

- `PUB-04`:
  - antes: la portada lista las herramientas disponibles con un enlace a cada una, el aviso de Mojang
    y el pie con la versión.
  - después: igual, más la presentación, la imagen y el resumen de `PUB-11` a `PUB-14`. La lista de
    herramientas sigue siendo la forma de llegar a cada una.

### Retira

Nada.

## Criterios de aceptación

- **Dado** la portada en un móvil de 390 × 844, **cuando** se abre, **entonces** se ven el nombre, la
  frase y el botón a Formas MC sin desplazarse, y no hay desplazamiento horizontal (`PUB-11`,
  `PUB-14`).
- **Dado** la portada, **cuando** se toca el botón principal, **entonces** se abre `/formas/`
  (`PUB-11`).
- **Dado** la portada, **cuando** se mira, **entonces** hay una imagen de una forma numerada con texto
  alternativo (`PUB-12`).
- **Dado** la portada, **cuando** se lee, **entonces** aparecen las funciones principales de Formas MC,
  cada una con su icono (`PUB-13`).
- **Dado** la portada en escritorio (1280 px), **cuando** se abre, **entonces** el contenido ocupa la
  pantalla de forma equilibrada, sin una columna estrecha en medio de un fondo vacío (`PUB-14`).
- **Dado** un enlace antiguo con `#forma=…`, **cuando** se abre la portada, **entonces** sigue
  redirigiendo a `/formas/` (`PUB-08`, sin cambios).

## Preguntas abiertas

- `[NECESITA ACLARACIÓN: ¿La imagen de la forma es fija (una captura incluida en el sitio) o se dibuja en vivo con el código de la app (p. ej. una esfera que cambia de capa sola o una forma distinta cada vez)?]`
- `[NECESITA ACLARACIÓN: ¿La portada anuncia herramientas futuras como «Próximamente» (p. ej. Litematica u otras) o solo muestra las que ya existen?]`
- `[NECESITA ACLARACIÓN: ¿Se añaden enlaces externos en la portada o el pie (repositorio de GitHub, contacto, cómo usarla), o nada fuera del sitio?]`
- `[NECESITA ACLARACIÓN: ¿Un estilo más llamativo con guiño a Minecraft (texturas de bloques, rejilla de fondo, tipografía pixelada en el título) o el mismo estilo sobrio y técnico de la app?]`
- `[NECESITA ACLARACIÓN: ¿La portada sigue siendo una página propia del área de publicación o se crea un área nueva para el sitio (portada y lo que compartan las herramientas), dejando la publicación solo para el build y el despliegue?]`
