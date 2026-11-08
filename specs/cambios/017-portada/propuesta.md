# 017 · Portada más completa

## Estado

En curso

## Motivo

La portada (`PUB-04`, propuesta 015) es solo un título, una tarjeta con texto y el pie. Cumple, pero
es la primera impresión del sitio: no enseña cómo es la herramienta, no explica para qué sirve ni da
una razón para entrar, y en escritorio deja casi toda la pantalla vacía. Con más funciones y
herramientas en camino, la portada debe presentar el sitio y llevar a cada herramienta de un vistazo.

## Áreas afectadas

- `SIT` (sitio): área nueva para la portada y lo común a las herramientas.
- `PUB` (publicación): `PUB-04` se queda solo con el build y las rutas; la portada pasa a `SIT`.

Formas MC y su interfaz no cambian.

## Delta

### Añade

- `SIT-01`: la portada, en la raíz del sitio, lista las herramientas que existen (hoy solo Formas MC),
  cada una con su enlace (objetivo táctil de 44 px como mínimo), lleva el botón de tema (`INT-16`), el
  aviso de que el proyecto no es oficial de Mojang y el pie con la versión (`PUB-06`). No anuncia
  herramientas futuras ni enlaza a sitios externos.
- `SIT-02`: la portada abre con una presentación: el nombre del sitio, una frase que dice qué es y
  para quién, y un botón principal que lleva a Formas MC. En móvil (390 × 844) y escritorio se ve sin
  desplazarse.
- `SIT-03`: la portada enseña Formas MC con un dibujo en vivo, hecho con el mismo código de dibujo de
  la app y con los colores del tema activo: una esfera que recorre sus capas sola, de la base a la
  cima, en bucle. Con `prefers-reduced-motion` se muestra una capa fija, sin animación. El dibujo no es
  interactivo y tiene un texto alternativo que dice qué muestra. La animación se detiene cuando no
  está a la vista o la pestaña está oculta.
- `SIT-04`: la portada resume en pocas líneas lo que se puede hacer con Formas MC (formas 2D y 3D,
  numeración, marcar lo construido, materiales, exportar e imprimir), cada punto con un icono de
  contorno del mismo estilo que la app; la información no depende solo del color.
- `SIT-05`: el estilo es el de la app (mismos colores, tipografía y tokens, en los dos temas) con un
  guiño a Minecraft: una rejilla de bloques sutil de fondo, que no compite con el texto (contraste de
  al menos 4,5:1). Sin fuentes nuevas. En móvil no hay desplazamiento horizontal y en escritorio el
  contenido ocupa la pantalla de forma equilibrada.

### Modifica

- `PUB-04`:
  - antes: el sitio se construye con Astro, con una portada en la raíz y cada herramienta en su ruta;
    la portada lista las herramientas, el aviso de Mojang y el pie con la versión.
  - después: el sitio se construye con Astro, con una portada en la raíz y cada herramienta en su ruta
    (Formas MC en `/formas/`). Qué lleva la portada lo dice el área `SIT`.

### Retira

Nada.

## Criterios de aceptación

- **Dado** la portada en un móvil de 390 × 844, **cuando** se abre, **entonces** se ven el nombre, la
  frase y el botón a Formas MC sin desplazarse, y no hay desplazamiento horizontal (`SIT-02`,
  `SIT-05`).
- **Dado** la portada, **cuando** se toca el botón principal, **entonces** se abre `/formas/`
  (`SIT-02`).
- **Dado** la portada, **cuando** pasan unos segundos, **entonces** el dibujo de la esfera cambia de
  capa solo; con `prefers-reduced-motion` no cambia (`SIT-03`).
- **Dado** el tema claro, **cuando** se abre la portada, **entonces** el dibujo y el fondo usan los
  colores claros (`SIT-03`, `SIT-05`).
- **Dado** la portada, **cuando** se lee, **entonces** aparecen las funciones principales de Formas MC,
  cada una con su icono (`SIT-04`).
- **Dado** la portada en escritorio (1280 px), **cuando** se abre, **entonces** el contenido ocupa la
  pantalla de forma equilibrada, sin una columna estrecha en medio de un fondo vacío (`SIT-05`).
- **Dado** la portada, **cuando** se revisan sus enlaces, **entonces** ninguno sale del sitio
  (`SIT-01`).
- **Dado** un enlace antiguo con `#forma=…`, **cuando** se abre la portada, **entonces** sigue
  redirigiendo a `/formas/` (`PUB-08`, sin cambios).

## Decisiones tomadas al aclarar

- 2026-11-08: el dibujo de la portada es en vivo y animado, con el código de la app: siempre al día y
  con el tema activo. Se descartaron una captura fija (habría que regenerarla) y un dibujo quieto.
- 2026-11-08: solo se muestran las herramientas que existen. Se descartaron tarjetas
  «Próximamente»: no se promete lo que no hay.
- 2026-11-08: ningún enlace externo, coherente con «todos los derechos reservados».
- 2026-11-08: estilo sobrio de la app con un guiño a Minecraft (rejilla de bloques de fondo). Se
  descartaron texturas y títulos pixelados, que desentonan con la app y añadirían fuentes.
- 2026-11-08: la portada pasa a un área nueva, `SIT`, y `PUB` se queda con el build y el despliegue.

## Detalles propuestos al redactar (revisar al implementar)

- El diseño se decide en el plan con la skill `ui-ux-pro-max`.
- La esfera de la animación es de 11 o 13 bloques, con un cambio de capa cada 0,6–1 s.
- Esta propuesta se implementa después de la 018 (tema claro y oscuro).

## Preguntas abiertas

Ninguna.
