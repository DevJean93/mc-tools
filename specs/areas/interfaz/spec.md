# Área · Interfaz

Código: `INT`

## Propósito

Cubre el marco de la app alrededor del dibujo: el formulario, el menú (columna lateral en
escritorio, hoja a pantalla completa en móvil), la barra inferior de secciones en móvil y la
accesibilidad básica de los controles. No genera geometría ni cambia el progreso.

## Requisitos

### INT-01

Al teclear el ancho, el alto o el grosor, la forma no se regenera en cada pulsación: se
regenera cuando se deja de escribir durante 150 ms (o al confirmar el campo).

Ejemplo: escribir «20» en el ancho del círculo da 316 bloques tras la pausa, sin pasar por
la forma de ancho 2.

### INT-02

Todos los botones tienen un nombre accesible (texto visible o `aria-label`) y el lienzo es
enfocable con una descripción que dice la forma, sus dimensiones, el modo, la capa, los
bloques de la capa y los construidos.

### INT-03

En pantallas de hasta 800 px de ancho el dibujo va primero y la página no tiene
desplazamiento horizontal (comprobado a 375 px).

### INT-04

En móvil el menú es una hoja a pantalla completa sobre el dibujo y arranca siempre cerrada.
El botón de la cabecera la abre con el foco en «Cerrar»; «Cerrar» o `Esc` la cierran y
devuelven el foco al botón de la cabecera.

### INT-05

En móvil, la barra inferior tiene tres secciones: «Dibujo», «Forma» y «Materiales».
«Dibujo» cierra el menú; «Forma» y «Materiales» lo abren desplazado hasta su sección. La
sección activa queda marcada (`aria-current`).

### INT-06

En escritorio, el botón de la cabecera oculta y muestra la columna del menú (el dibujo pasa
a ocupar todo el ancho), indica su estado con `aria-expanded` y la preferencia se recuerda al
recargar.

### INT-07

La ayuda táctil y la de ratón explican el gesto de marcar una fila o columna entera («toca el
número de una fila o columna para marcarla entera»), y la de teclado dice que `F` alterna la
fila y `C` la columna.

## Casos límite

- Al pasar de escritorio a móvil (o al revés) el menú adopta el comportamiento del nuevo
  tamaño: en móvil vuelve a arrancar cerrado; en escritorio recupera la preferencia guardada.
- Con el almacenamiento bloqueado la preferencia del menú de escritorio no se recuerda, pero
  el botón sigue funcionando.
- Un campo numérico vacío no dispara la regeneración (ver FOR-15).

## Fuera de alcance

- Los gestos sobre el lienzo (área TAC) y el zoom (área ZOO).
- La nota fija y los avisos de almacenamiento (área MAR).
- Las cifras del dibujo (área NUM).

## Decisiones

- 2026-10-25: la interfaz se diseñó con la skill `ui-ux-pro-max`: estilo «Dark Mode (OLED)»
  con paleta slate (fondo `#0F172A`, bloques `#22C55E`, centro y foco `#FACC15`, construidos
  `#3B82F6`), JetBrains Mono para cifras e IBM Plex Sans para texto, iconos SVG de Lucide,
  foco visible y `prefers-reduced-motion`. Los colores son tokens de `src/estilos.css` y el
  lienzo lee los mismos. Se descartó el patrón «FAQ landing» que devolvió la skill porque no
  encaja en una herramienta.
- 2026-10-25: adaptación a móvil (≤ 800 px): campos a 16 px para que iOS no haga zoom al
  enfocarlos, objetivos táctiles de 44 px, `viewport-fit=cover` con márgenes
  `env(safe-area-inset-*)`, ayuda táctil distinta de la de ratón según `pointer: coarse`,
  acciones de marcas en rejilla de 2 columnas y el texto de la capa en su propia línea. Por
  debajo de 360 px los pares de campos pasan a una columna.
- 2026-10-25: en móvil el menú es una hoja sobre el dibujo y no solo un panel que se oculta:
  la primera versión ocultaba el panel, pero en móvil estaba debajo del dibujo y el botón
  parecía no hacer nada.
- 2026-10-25: el grosor del borde va en su propia fila bajo «Modo»; al lado no cabía.
- 2026-10-25: la preferencia del menú de escritorio se guarda en `mc-formas-v1:menu`
  (`'0'` = oculto); en móvil no se guarda porque la hoja siempre arranca cerrada.
- 2026-10-29: el estado del almacenamiento es una nota fija y no un aviso temporal: la guía
  de la skill de UI dice que los avisos tipo toast deben desaparecer solos, y ese estado sigue
  siendo cierto mientras dure (ver MAR).
- 2026-10-29: la ayuda del lienzo explica el gesto de marcar filas y columnas en las dos
  variantes (táctil y ratón) y añade `F`/`C` a la línea de teclado; va en el mismo párrafo de
  ayuda para no añadir otro bloque de texto sobre el dibujo.