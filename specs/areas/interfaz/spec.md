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
fila y `C` la columna. La ayuda táctil sugiere además acercar el zoom si la fila es fina
(«si la fila es fina, acércate antes de tocarla»).

### INT-08

Los avisos temporales aparecen centrados abajo y usan el ancho disponible: en móvil, todo el
ancho de la pantalla menos 16 px a cada lado; en escritorio, como mucho unos 60 caracteres por
línea.

Ejemplo: en un móvil de 375 px, «Marcados 16 bloques de la fila 8.» con su botón «Deshacer»
ocupa como mucho dos líneas.

### INT-09

El menú tiene una sección «Proyecto» con los botones «Guardar proyecto» y «Cargar proyecto», con
texto visible, nombre accesible y objetivo táctil de al menos 44 px en móvil. «Cargar proyecto» abre
el selector de archivos del dispositivo; el selector en sí queda oculto.

### INT-10

La sección «Proyecto» tiene además un botón «Copiar enlace», de ancho completo debajo de los otros
dos, con texto visible, nombre accesible y objetivo táctil de al menos 44 px en móvil. Copia el
enlace de FOR-16 al portapapeles y avisa «Enlace copiado.». Si el navegador no deja usar el
portapapeles, el aviso muestra el enlace entero, seleccionado y partido en líneas para que quepa en
la pantalla, y dura 15 s para dar tiempo a copiarlo a mano.

### INT-11

El pie de la app muestra la versión («Versión 8b03d4e», o «Versión dev» en local), el commit desde el que
se construyó el sitio (PUB-06), en la fuente monoespaciada de las cifras y sin partirse en dos líneas, con el color
atenuado del pie, que tiene contraste suficiente sobre el fondo. Sirve para comprobar en cualquier
dispositivo qué versión se está ejecutando.

### INT-12

En «Vista» hay una casilla «Guías de chunk». Al activarla aparecen dos campos numéricos, «X del centro»
y «Z del centro», con etiqueta visible, texto de 16 px y objetivo táctil de 44 px en móvil, que admiten
enteros negativos; junto a ellos una ayuda que, sin coordenadas, pide la X y la Z del bloque central y,
con ellas, recuerda la convención del centro 2×2 y el sentido de los ejes. La leyenda del dibujo
muestra la guía solo cuando hay guías dibujadas. Al desactivar la casilla los campos se ocultan pero
conservan su valor. La casilla y las coordenadas se recuerdan al recargar.

### INT-13

En «Forma», solo con esfera o cúpula, hay un campo numérico opcional «Y de la base», con etiqueta
visible, texto de 16 px y objetivo táctil de 44 px en móvil, que admite enteros negativos. Una ayuda,
enlazada al campo con `aria-describedby`, dice que es la altura de la capa 1 (la que se apoya en el
suelo, la que se ve con F3) y que vacío solo se ve el número de capa. Al cambiarlo se actualizan el
texto de la capa y la tabla sin repintar el dibujo. Se recuerda al recargar.

### INT-14

El botón «Imprimir ficha» va en «Vista», a todo el ancho, bajo «PNG de la capa» y «Todas las capas».
Lleva un icono de impresora de contorno, texto visible y nombre accesible, y mide 44 px en móvil.

### INT-16

Un botón de tema en la cabecera de la app (junto a «Ocultar menú») y en la de la portada alterna entre
tema claro y oscuro al instante, sin recargar y sin perder la forma, las marcas ni el historial. Tiene
nombre accesible que dice a qué tema cambia («Cambiar a tema claro» / «Cambiar a tema oscuro»), indica
el tema actual con `aria-pressed` (`true` con el tema oscuro), lleva un icono de contorno (sol en el
tema oscuro, luna en el claro) y mide 44 px en móvil.

### INT-17

Sin elección guardada, el tema sigue el del sistema (`prefers-color-scheme`), también si el sistema
cambia mientras la página está abierta. Al tocar el botón, la elección se guarda en el navegador y manda
desde entonces, en la app y en la portada, y se aplica antes de pintar la página (sin destello del otro
tema; `theme-color` sigue el tema). Se guarda en la clave `mc-tema` (`claro` / `oscuro`), sin tocar las
claves `mc-formas-v1*`; si el navegador no deja guardar, el botón funciona igual durante la visita.

### INT-18

El tema claro tiene su propia paleta para la interfaz y para el lienzo (fondo claro, bloques verdes,
cifras oscuras), distinta de la de papel (MAT-14). El texto y las cifras sobre los bloques tienen un
contraste de al menos 4,5:1, y el centro, los ejes, los construidos y las guías de chunk se distinguen
sin depender solo del color, igual que en el tema oscuro. El tema oscuro queda idéntico al de antes.

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
- 2026-10-29: el aviso temporal se ancla a los dos lados con margen automático en vez de
  `left: 50%` + `translateX(-50%)`: así el navegador solo le dejaba la mitad derecha de la
  pantalla y en móvil el aviso de una fila salía en 5 líneas (cambio 003).
- 2026-10-29: con el zoom inicial del móvil una fila de la regla mide 15 px, menos que los
  24 px que pide WCAG 2.2 para un objetivo. Marcar bloque a bloque es el control equivalente y
  la ayuda táctil sugiere acercarse; no se agranda la banda porque pisaría la fila de al lado.
- 2026-10-31: «Proyecto» es una sección propia al final del menú y no se mezcla con «Vista» ni con
  «Materiales»: guardar y cargar no son una opción de vista ni un cálculo. Reutiliza la rejilla de
  dos botones de los de exportar y los iconos de descarga y de subir, con una frase de ayuda que
  explica para qué sirve. La barra inferior del móvil no cambia: se llega desplazando el menú.
- 2026-11-08: «Copiar enlace» ocupa las dos columnas de la rejilla porque es una acción distinta (no
  descarga ni sube un archivo) y así los otros dos botones siguen siendo un par. La barra de
  direcciones no se actualiza sola mientras se cambia la forma: en móvil está oculta y no sería
  evidente cómo compartir. Se descartó el menú nativo de compartir para no tener dos caminos que
  probar; puede ser otra propuesta.
- 2026-11-08: el aviso de respaldo usa `overflow-wrap: anywhere` (en todos los avisos): una
  dirección larga sin espacios no se partía y se salía de la pantalla, como mostró la captura en
  móvil.
- 2026-11-08: la versión va en el pie y no en el menú ni en un aviso: es información de consulta,
  no una acción, y el pie ya es el sitio de lo secundario. Se muestra siempre, para comprobar en la
  tablet si llegó lo nuevo sin herramientas de desarrollo.
- 2026-11-08: los campos de coordenadas aparecen solo al activar la casilla (divulgación progresiva) y
  usan `type="number"` sin `inputmode`: en iOS el teclado numérico no tiene el signo menos y las
  coordenadas pueden ser negativas. No se pisa el campo que se está tecleando al repintar el panel.
- 2026-11-08: la entrada de la leyenda aparece solo con guías visibles, para que la leyenda no hable de
  algo que no se ve.
- 2026-11-08: el campo va en «Forma», tras la variante, y solo con esfera o cúpula: con una sola capa
  la altura no significa nada. Con una forma 2D se oculta pero la Y guardada se conserva.
- 2026-11-08: `type="number"` sin `inputmode`, como las coordenadas de las guías: en iOS el teclado
  numérico no tiene el signo menos y la Y llega a −64 en el juego. La etiqueta es visible (no solo un
  marcador) y la ayuda va enlazada con `aria-describedby`.
- 2026-11-08: `Panel` avisa con un callback propio, `alCambiarAltura`, y la app llama a `refrescar()`: a
  diferencia de las demás opciones de vista, esta no cambia el lienzo sino el texto y la tabla.
- 2026-11-08 (cambio 010): el botón va en «Vista», con los de exportar, porque imprimir es otra forma de
  exportar; usa la clase `.ancho` como «Copiar enlace» y el icono `i-imprimir` del sprite, del mismo
  trazo que los demás.
- 2026-11-08 (cambio 018): tema claro y oscuro con un botón de dos posiciones. Sin elección guardada se
  sigue el tema del sistema (también en vivo) y tocar el botón guarda la elección en `mc-tema`. Se
  descartaron tres posiciones con «Automático» (ocupa más en la cabecera del móvil) y abrir siempre en
  oscuro. El botón va en la cabecera, en la app y en la portada, siempre en el mismo sitio; se descartó
  ponerlo en «Vista», que la portada no tiene. Es solo icono (sol en oscuro, luna en claro) con nombre
  accesible que dice a qué tema cambia; `aria-pressed` es `true` con el tema oscuro.
- 2026-11-08 (cambio 018): el tema es el atributo `data-tema` de `<html>`. `:root` conserva los valores de
  siempre (tema oscuro, comprobado píxel a píxel) y `:root[data-tema="claro"]` los redefine. Un script en
  línea en el `<head>` lo pone antes de pintar (sin destello) y `src/compartido/tema.js` añade el botón y el
  seguimiento del sistema. Los colores que estaban fijos en el CSS (hover y pulsado de botones, error, fila
  seleccionada, sombra, borde de la leyenda) pasaron a variables con el mismo valor en oscuro.
- 2026-11-08 (cambio 018): paleta clara con la skill `ui-ux-pro-max`: fondo `#F1F5F9`, tarjetas blancas,
  acento verde `#15803D` y oro `#854D0E` (los de oscuro no llegan a 4,5:1 como texto sobre claro), lienzo
  `#E2E8F0` con celdas vacías blancas, bloques `#4ADE80` y cifras `#0F172A` (10,2:1). En escala de grises:
  vacía 1,00 > bloque 0,55 > bloque en eje 0,37 > centro 0,10. Se descartó dejar el lienzo oscuro dentro de
  una interfaz clara. La entrada de la leyenda «Construido» pasó de «esquina blanca» a «esquina marcada»
  porque en el tema claro la esquina es oscura.
