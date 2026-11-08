# Área · Numeración

Código: `NUM`

## Propósito

Numera el dibujo para poder construirlo: reglas en los bordes, cifras de los tramos dentro
de la forma, información del centro y resumen de distancias. Todo el cálculo es puro y se
prueba sin canvas.

## Requisitos

### NUM-01

La cuenta de los ejes empieza en 1 en la franja central y llega hasta el bloque del borde.
El máximo es el número de bloques por lado más 1, también cuando la franja es de un solo
bloque.

Ejemplo: círculo de 30 (franja de 2, 14 bloques por lado) → `15 14 … 2 1 | 1 2 … 14 15`.

### NUM-02

Cada celda se numera una sola vez: los dos ejes no se pisan en la franja central.

### NUM-03

En modo hueco los ejes numeran también el interior vacío hasta el borde, y distinguen un
bloque lleno de uno vacío.

Ejemplo: círculo 20 hueco con grosor 1 → el borde es el 10 y el interior va marcado como
vacío.

### NUM-04

Una forma sin bloques en la franja central no numera ningún eje.

### NUM-05

Sin números de eje, cada tramo dentro del dibujo lleva su total centrado en el tramo.

### NUM-06

Con números de eje, un tramo que cruza la franja se muestra partido: cada lado lleva lo que
hay a su lado, sin contar los bloques de la franja.

Ejemplo: círculo de 30, fila con 14 bloques y franja de 2 → `6 | 6`; 6 + 6 + 2 = 14.

### NUM-07

Las cifras de los lados van en dos columnas fijas y simétricas respecto a la franja. En las
filas de los extremos, sin número de eje, cada cifra se centra en su parte.

Ejemplo: círculo 30, primera fila con 8 bloques → `3 | 3`, centradas y simétricas.

### NUM-08

Ningún número de tramo cae sobre la franja central ni sobre las filas centrales, que son del
eje.

### NUM-09

Un tramo estrecho que no deja sitio entre el eje y el borde no se numera dentro. Nunca se
escriben ceros.

Ejemplo: triángulo 21×15 → las tres primeras filas no llevan cifras.

### NUM-10

La regla relativa al centro cuenta como los ejes: la franja central vale 1 y se llega al
bloque del borde, sin signo ni `C`. Cada margen lleva la misma cuenta que la fila y la columna
centrales.

Ejemplos: círculo de 30 → `15 … 2 1 | 1 2 … 15`; círculo de 15 (franja de 1) → `8 … 2 1 2 … 8`.

### NUM-11

Los tramos por fila (a la derecha) y por columna (abajo) muestran el total de cada fila y
columna, y se adaptan al zoom.

[verificación manual: son cifras fuera del lienzo; se revisan en las capturas de escritorio y móvil.]

### NUM-12

El resumen del centro indica el tamaño del centro (1×1 o 2×2) y la distancia a cada borde
sin contar el centro. Una capa vacía solo indica el tamaño.

Ejemplo: centro 1×1 en una fila de 3 → `← 1 · → 1 · ↑ 0 · ↓ 0`.

### NUM-13

Con poco zoom, la regla relativa muestra solo las cifras que caben: el 1 de la franja (una
sola vez, en su último bloque, aunque la franja sea de 2) y los múltiplos del paso de la
regla; con todo el zoom muestra todas.

Ejemplo: círculo de 16 con paso 2 → `8 6 4 2 1 2 4 6 8`.

### NUM-14

La línea de información de un bloque dice su posición respecto al centro con la misma cuenta
que la regla y una flecha en lugar de signo. En la franja central dice solo `1`.

Ejemplo: círculo de 30, columna 3, fila 5 → `relativo al centro (← 13, ↑ 11)`.

### NUM-15

Al desplazar el dibujo, las reglas izquierda y superior se quedan fijas en el borde visible del
contenedor y muestran los números de las filas y columnas que se ven: la superior mientras se
haya desplazado hacia abajo y la izquierda mientras se haya desplazado hacia la derecha. Incluyen
la regla relativa si está activa. Sin desplazamiento no hay reglas añadidas y el dibujo es
exactamente igual que siempre.

### NUM-16

Con «Guías de chunk» activada y las coordenadas del centro escritas, el dibujo traza una guía en cada
frontera de chunk que cae dentro de él: entre dos columnas cuya X del mundo pasa de un múltiplo de 16
menos 1 a un múltiplo de 16, y lo mismo entre filas con la Z. La X del mundo crece hacia la derecha
(este) y la Z hacia abajo (sur), como en el mapa del juego, y las coordenadas son las del bloque
central (con centro 2×2, las del bloque de arriba a la izquierda). La guía es una línea de 2 px en un
color propio (`--guia-chunk`) que no usa el resto del dibujo, por encima de la rejilla; se distingue de
las líneas cada 5 por el color y por el grosor, y la leyenda la explica. No hay guías en los bordes del
dibujo, solo entre dos celdas. Son las mismas en todas las capas de una forma 3D y salen también en el
PNG exportado.

Ejemplo: círculo de 16 con el centro en X = 100, Z = −40: la columna 0 está en X = 93, así que hay una
guía vertical entre las columnas 2 y 3 (X 95 y 96); la fila 0 está en Z = −47, y hay una guía
horizontal entre las filas 14 y 15 (Z −33 y −32). Con tamaño impar (15) y X = 0, la guía cae justo a la
izquierda del bloque central.

### NUM-17

Con la opción activada pero sin la X o la Z (o con alguna vacía) no se dibuja ninguna guía y el panel
pide escribir la X y la Z del bloque central. Con la opción desactivada el dibujo es idéntico, píxel a
píxel, al de antes de que existieran las guías. Las guías son una opción de vista: no cambian la
forma, la firma de las marcas ni las marcas, y cambiarlas no saca avisos; tampoco viajan en el enlace
(FOR-16) ni en el archivo de proyecto (MAR-19). La casilla y las coordenadas se guardan con las demás
opciones de vista; un estado guardado antes de existir las guías carga igual, con la opción apagada y
sin coordenadas. Las coordenadas son enteros de −30 000 000 a 30 000 000: se redondean, se recortan, y
un texto o un campo vacío es «sin coordenada».

### NUM-18

En las formas 3D (esfera y cúpula), con la Y de la base escrita, cada capa muestra su altura: la Y de la
base más el número de capa menos uno. La capa 1 es siempre la base, también en la cúpula (su capa 1 es
la que se apoya en el suelo). La altura se ve en los tres sitios donde ya aparece el número de capa:
el texto de la capa sobre el dibujo («Capa 3 de 11 · Y 66», «Capa 1 de 11 (base) · Y 64»), la tabla por
capas, con una columna «Y» tras «Capa», y la cabecera del PNG exportado («Capa 3 de 11 · Y 66 · …»). La
etiqueta accesible del dibujo la anuncia («Capa 3 de 11, altura Y 66: …»).

Ejemplo: esfera de 11 con la base en Y = 64 → la capa 3 está en Y = 66 y la 11 en Y = 74; con la base en
Y = −60, la capa 1 está en −60 y la 11 en −50.

### NUM-19

Con la Y de la base vacía todo se ve como antes: solo el número de capa, sin columna Y en la tabla y con
la cabecera del PNG y la etiqueta accesible de siempre. En las formas 2D (una sola capa) no se muestra
ninguna altura aunque haya una guardada. La Y de la base es una opción de vista: no cambia la forma, la
firma de las marcas ni las marcas, cambiarla no saca avisos, y no viaja en el enlace (FOR-16) ni en el
archivo de proyecto (MAR-19). Se guarda en el navegador con las demás opciones de vista; un estado
guardado antes de existir la altura carga igual, sin ella. Es un entero de −30 000 000 a 30 000 000
(mismas reglas que las coordenadas de las guías de chunk): se redondea, se recorta, y un texto o un
campo vacío es «sin altura».

## Casos límite

- Franja de 2 (tamaño par): centro 2×2 y la regla relativa muestra `1 | 1` en la franja.
- Franja de 1 (tamaño impar): el eje central y la regla relativa valen 1 en el bloque central.
- Círculo 30: 14 bloques por lado → el eje llega a 15, no a 14.
- Triángulo 21×15: las filas 1 a 3 no tienen sitio para cifras internas.
- Guías de chunk en un dibujo de 200: 13 guías por eje, de 16 en 16, ninguna en los bordes.
- Una forma sin ninguna frontera de chunk dentro (p. ej. 10×10 con el centro en X = 5) o de un solo bloque no tiene guías ni falla.
- Con coordenadas negativas las guías caen donde toca (X = −1 con centro 1×1: a la derecha del centro).
- Una base negativa (Y = −60) sigue contando hacia arriba: la capa 5 está en −56.
- Una forma 2D con una Y de la base guardada no muestra ni campo ni altura (la Y se conserva por si se vuelve a una forma 3D).

## Fuera de alcance

- Generar la geometría (área FOR).
- El zoom y el desplazamiento del lienzo (área ZOO).
- La cuenta de materiales y el progreso (área MAT).

## Decisiones

- 2026-10-29: el conteo de los ejes llega hasta el bloque del borde (15 en un círculo de
  30). Antes se numeraba hasta el último bloque interior; se cambió porque el borde también
  se cuenta al construir.
- 2026-10-29: los tramos se probaron en escalera y en columna única; se quedó la cifra por
  lado, sin contar la franja, por ser la más legible.
- 2026-10-29: las cifras de los lados van en dos columnas fijas simétricas respecto a la
  franja; en los extremos se centran en su parte porque no hay eje en esa fila.
- 2026-10-29: las filas centrales no llevan tramos: pertenecen al eje.
- 2026-10-29: la regla relativa al centro cuenta igual que los ejes (franja = 1, hasta el
  borde, sin signo ni `C`): tener dos cuentas parecidas que dijeran cosas distintas confundía.
  Se mantiene la opción «Regla relativa al centro» en lugar de retirarla porque está en el
  margen y sirve cuando los números de los ejes están ocultos o hay poco zoom (cambio 001).
- 2026-10-29: la línea de información usa flechas (`← 13`, `↑ 11`) y no signos para decir de
  qué lado del centro está el bloque; el `1` de la franja no lleva flecha.
- 2026-10-29: con paso > 1 la franja de 2 muestra su `1` una sola vez (en el último bloque) para
  que dos cifras no queden pegadas. El `1` y el `2` siguientes sí pueden ir contiguos, como en
  la regla absoluta, porque son cifras sueltas que caben.
- 2026-10-25: todas las cifras del lienzo van en negrita (peso 600) para que destaquen sobre
  los bloques; el margen del dibujo se mide ya con la negrita para que nada se corte.
- 2026-10-25: las cifras dentro del dibujo solo se pintan con celdas de 16 px o más; con
  menos zoom no caben y el texto del zoom avisa «acércate para ver todos los números».
- 2026-10-29: las reglas fijas son dos lienzos superpuestos dentro de un ancla `position: sticky`
  de tamaño cero, no un repintado del dibujo entero. Chromium pega el ancla al borde del
  *contenido* y no al del contenedor, así que el origen visible es exactamente lo desplazado
  (`scrollLeft`, `scrollTop`) y los lienzos se extienden sobre el relleno (8 px) para que no
  asomen bloques por encima o a la izquierda. Se descubrió al medir en el navegador: la primera
  versión restaba el relleno y quedaba desalineada 8 px (cambio 005).
- 2026-10-29: las reglas fijas no reciben eventos y son `aria-hidden`; el puntero llega al lienzo
  principal y la geometría (`zonaRegla`, `zonaCelda`) ya sabe qué parte tapan. Solo aparecen con
  desplazamiento, para que sin él el dibujo sea idéntico píxel a píxel.
- 2026-11-08: las guías se alinean a las coordenadas del mundo a partir de la X y la Z del bloque
  central, que el jugador lee con F3. Se descartó contarlas desde el borde del dibujo: no coincide con
  los chunks reales, que es lo que pide el motivo (granjas, redstone).
- 2026-11-08: se activan con una casilla en «Vista», como las demás opciones, y al activarla aparecen
  los campos de coordenadas, así se pueden ocultar sin borrar los números.
- 2026-11-08: la guía tiene color propio (fucsia `#E879F9`) y 2 px de grosor: se distingue de la línea
  cada 5 por las dos cosas, no solo por el color (constitución, principio 7).
- 2026-11-08: con tamaño par se pide la coordenada del bloque de arriba a la izquierda del centro 2×2:
  es la convención que ya fija `Render.centro` y la ayuda del campo lo dice.
- 2026-11-08: las guías son una opción de vista y no viajan en el enlace ni en el archivo de proyecto;
  si se quisieran compartir, sería otra propuesta.
- 2026-11-08: `% 16 === 0` ya vale para múltiplos negativos (`-16 % 16` es `-0`), así que `fronterasChunk`
  no necesita un módulo positivo. Se descubrió al intentar una mutación que no se detectaba.
- 2026-11-08: `fronterasChunk` es una función pura de `Render` y la capa se registra tras la rejilla;
  sin la opción o sin las dos coordenadas no pinta nada, así que el dibujo no cambia.
- 2026-11-08: la Y de la base es un campo opcional; vacío, todo queda como antes. Se descartó que siempre
  tuviera un valor: quien no la necesita vería una altura que no ha pedido y que puede estar mal.
- 2026-11-08: la altura se ve en los tres sitios donde ya está el número de capa (texto, tabla y PNG),
  sin sitios nuevos; el PNG es lo que se lleva al juego.
- 2026-11-08: en la cúpula la base es su propia capa 1 (la que se apoya en el suelo), igual que en la
  esfera. Se descartó pedir la base de la esfera completa: solo sirve para cúpulas sobre una esfera ya
  hecha y confunde en el caso normal.
- 2026-11-08: se guarda en el navegador como las coordenadas de las guías de chunk y no viaja en el
  enlace ni en el archivo de proyecto: llevarla obligaría a una versión 2 del archivo con migración, y
  entonces lo lógico sería llevar también la X y la Z de las guías. Podría ser otra propuesta.
- 2026-11-08: `Estado.alturaCapa(st, i)` es la única fuente de la altura y devuelve `null` sin Y o en
  2D; el texto de la capa, la tabla, la cabecera del PNG y la etiqueta accesible la reciben como una
  función y no calculan nada.
