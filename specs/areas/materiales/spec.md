# Área · Materiales

Código: `MAT`

## Propósito

Traduce los bloques de la forma a materiales de Minecraft (stacks, shulkers y cofres dobles)
y calcula el progreso por capa y total, exporta el dibujo de cada capa como imagen y prepara una ficha para imprimir. El
cálculo es puro; la tabla y la barra solo pintan su resultado.

## Requisitos

### MAT-01

Los bloques se agrupan en stacks de 64. El texto muestra los stacks completos y, si sobran
bloques, el resto como `+ N`; cero bloques son `0 × 64`.

Ejemplo: 208 bloques → `3 × 64 + 16`; 128 → `2 × 64`.

### MAT-02

Un shulker son 27 stacks (1728 bloques) y un cofre doble 54 stacks (3456 bloques). Las cajas
necesarias se redondean hacia arriba y sin bloques no hace falta ninguna.

Ejemplo: 1728 bloques → 1 shulker y 1 cofre; 1729 → 2 shulkers y 1 cofre.

### MAT-03

En una forma de una sola capa, el progreso dice cuántos bloques se construyeron del total y
su porcentaje redondeado.

Ejemplo: 16 de 208 → `Construidos: 16/208 (8 %)`.

### MAT-04

En 3D el progreso incluye la capa visible y el total de la forma.

Ejemplo: capa 2 con 0 de 26, total 54 de 80 → `Capa: 0/26 (0 %) · Total: 54/80 (68 %)`.

### MAT-05

Cada capa conoce su total, lo construido, su porcentaje y si está completa. Una capa vacía
nunca se marca como completa.

### MAT-06

Las constantes de stack, shulker y cofre viven solo en el cálculo de materiales; el resto de
la app las lee de ahí en vez de repetir los números.

### MAT-07

«PNG de la capa» descarga la capa visible como imagen PNG con un nombre que dice la forma,
el tamaño, el modo y la capa: `<variante>-<tamaño>[-hueco-g<grosor>][-capas<n>-capa<k>].png`.

Ejemplo: capa 1 de una esfera de 11 hueca con grosor 5 → `esfera-11-hueco-g5-capas11-capa1.png`.

### MAT-08

«Todas las capas» descarga una imagen por capa, en orden, y avisa al terminar. Con más de 10
capas pide confirmación antes de empezar.

### MAT-09

Cada imagen exportada lleva una cabecera con la forma, sus dimensiones y el modo; la capa,
sus bloques en stacks y los construidos; y el nombre de la app con la fecha.

[verificación manual: la cabecera se dibuja dentro de la imagen; se revisa abriendo el PNG.]

### MAT-10

Los números del desglose de materiales (stacks, shulker boxes, cofres dobles, construidos y
faltan) se muestran en negrita, como el total y las cifras del lienzo. Las etiquetas y la
fórmula de equivalencias siguen en peso normal.

### MAT-11

«Imprimir ficha» abre el diálogo de impresión del navegador con una ficha preparada solo para
papel: en pantalla la app no cambia y en el papel no salen los controles. La primera página lleva el
nombre, las dimensiones y el modo de la forma y sus materiales (bloques, stacks, shulker boxes y
cofres dobles); en 3D, además, la tabla por capas, con la columna Y si hay Y de la base (NUM-18).
Después hay una página por capa con su dibujo numerado y su cabecera, la misma que el PNG (capa, Y si
la hay y bloques). En 2D todo cabe en una página. El dibujo usa las mismas opciones de vista
actuales (reglas, tramos, guías de chunk…) que el PNG, pero con la paleta para papel de MAT-14. Desde el diálogo se puede imprimir o elegir
«Guardar como PDF».

Ejemplo: círculo → 1 página; esfera de 11 → 12 páginas (la forma y 11 capas); con la base en Y = 64,
la cabecera de la capa 3 dice «Y 66».

### MAT-12

La ficha es la forma limpia: no lleva las marcas de lo construido ni «Construidos», «Faltan» o
«Hechos», y los materiales son el total necesario, no lo que falta. Cada dibujo ocupa lo máximo que
cabe en la página que se elija en el diálogo (tamaño y orientación), sin deformarse ni cortarse.

### MAT-13

Si alguna capa mide más de 60 bloques de ancho o de alto, antes de abrir el diálogo sale un aviso: la
ficha se imprime igual, pero en un A4 sus cifras no se leerán (quedarían menos de 3 mm por bloque);
para imprimir legible, mejor el PNG por capa.

Ejemplo: círculo de 120 → aviso; círculo de 60 → sin aviso.

### MAT-14

Los dibujos de la ficha imprimible usan siempre una paleta para papel, sin opción para elegir otra:

- fondo blanco y celdas vacías sin relleno, con una rejilla fina gris;
- bloques de la forma en verde muy suave, con la rejilla como borde fino;
- cifras, reglas y cabecera en tinta oscura (contraste de al menos 4,5:1 sobre su fondo, también sobre
  un bloque en un eje), legibles en una impresora en blanco y negro;
- ejes resaltados con un velo oscuro, en un tono más oscuro que los bloques normales;
- bloque central con un borde grueso oscuro;
- el centro, los ejes, los bloques normales y las celdas vacías se distinguen también en escala de
  grises (luminancias separadas), sin tapar las cifras;
- tramos y guías de chunk siguen apareciendo si están activados; las guías son líneas de 2 px más
  oscuras que la rejilla.

En pantalla y en el PNG se sigue dibujando con la paleta oscura de siempre (MAT-07 a MAT-09).

## Casos límite

- 0 bloques: `0 × 64`, sin shulkers ni cofres.
- 3457 bloques: 2 cofres dobles (el segundo por el resto).
- Porcentaje 67,5 % se muestra como 68 %.
- Una capa de total 0 no está completa aunque no le falte nada.
- Una imagen demasiado grande para el navegador no se descarga: se avisa de reducir el zoom.
- Una esfera de 100 genera 100 imágenes para la ficha; se hacen una a una y se liberan tras imprimir.
- Imprimir sin pedir la ficha (Ctrl+P o el menú del navegador) saca la app como siempre, no una página en blanco.

## Fuera de alcance

- Marcar los bloques (área MAR).
- El resumen del centro y la numeración (área NUM).
- Generar la geometría y contar sus bloques (área FOR).

## Decisiones

- 2026-10-29: los porcentajes se redondean al entero más cercano para que el texto sea corto;
  el progreso nunca supera el 100 % porque las marcas se limitan a bloques reales.
- 2026-10-29: las cajas se redondean hacia arriba: media caja no existe y hay que llevarla
  entera.
- 2026-10-25: la imagen se exporta con el zoom de pantalla y densidad 1; si el lienzo supera
  16 Mpx, la densidad de píxeles se reduce (también en pantalla) para que el navegador pueda
  crearlo. La descarga entra por una función inyectada, para poder probarla sin navegador.
- 2026-10-29: los números del desglose van en negrita (peso 600) para que las cantidades,
  que es lo que se consulta, destaquen sobre las etiquetas. La tabla por capas de las formas
  3D se queda en peso normal: con todo en negrita se pierde la jerarquía, y la capa activa ya
  se distingue por su fondo (cambio 004).
- 2026-11-08 (cambio 010): la ficha se hace con el diálogo de impresión del navegador, que también permite
  guardarla como PDF: funciona con doble clic y en móvil sin dependencias. Se descartó generar un PDF
  propio (exigiría una dependencia y enmendar la constitución) y una sola imagen PNG grande (al
  imprimirla, el tamaño y los márgenes los decidiría el visor).
- 2026-11-08 (cambio 010): en 3D va una capa por página, para que cada dibujo salga lo más grande
  posible. Se descartó poner varias capas por página (las grandes quedarían pequeñas) y solo la capa
  actual (obligaría a imprimir varias veces).
- 2026-11-08 (cambio 010): la ficha es la forma limpia, sin lo construido: el papel sirve para ir
  tachando a mano. El tamaño de papel no se elige en la app, sino en el diálogo; un selector propio
  tendría que coincidir con él.
- 2026-11-08 (cambio 010): las capas de más de 60 bloques se encogen igualmente y se avisa antes de
  imprimir (un A4 deja unos 180 mm útiles: a menos de 3 mm por bloque las cifras no se leen). Se
  descartó partirlas en varias hojas, mucho más complejo de hacer y de probar.
- 2026-11-08 (cambio 010): implementación: `#ficha` está oculto en pantalla y `@media print` oculta todo
  lo demás; cada capa es una imagen (blob URL, no `toDataURL`) dibujada con celdas de 20 px,
  independiente del zoom de pantalla, para que las cifras salgan nítidas al encogerse. Los blobs se
  revocan al regenerar y tras `afterprint`. `VistaMateriales` pinta la página de resumen con una
  opción `sinMarcas`. (La paleta del dibujo cambió en el cambio 014: ver abajo.)
- 2026-11-08 (cambio 014): modifica MAT-11. Antes: «el dibujo usa las opciones de vista actuales, igual
  que el PNG»; ahora: las mismas opciones, pero con la paleta para papel de MAT-14. La ficha es solo
  para papel: con la paleta oscura gastaba mucha tinta, tardaba en imprimirse y en una impresora en
  blanco y negro las cifras sobre los bloques se leían peor. Sin interruptor: quien quiera la imagen
  como en pantalla ya tiene el PNG (se descartó una casilla «Fondo oscuro», que tocaría la interfaz
  y añadiría otra opción guardada para un caso raro).
- 2026-11-08 (cambio 014): bloques en verde muy suave (`#BBF7D0`) con la rejilla como borde fino:
  recuerda a la app, gasta poca tinta y en blanco y negro sale un gris claro bajo las cifras. Se
  descartaron el gris claro (pierde el parecido con la app) y el solo borde (cuesta ver la forma).
- 2026-11-08 (cambio 014): ejes con un velo oscuro translúcido y centro con borde grueso (4 px) para
  distinguirlos en gris sin depender del color. Se descartaron los grises solos (centro y ejes se
  confundirían) y el rayado (estorba a las cifras). Implementación: `Render.PAPEL` y una opción
  `paleta` de `Render.dibujar` que se mezcla sobre la de la app; `centroAncho` vale 2 en pantalla.
  Pantalla y PNG quedan idénticos byte a byte a los de antes.
