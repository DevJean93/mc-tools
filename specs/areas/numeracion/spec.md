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

## Casos límite

- Franja de 2 (tamaño par): centro 2×2 y la regla relativa muestra `1 | 1` en la franja.
- Franja de 1 (tamaño impar): el eje central y la regla relativa valen 1 en el bloque central.
- Círculo 30: 14 bloques por lado → el eje llega a 15, no a 14.
- Triángulo 21×15: las filas 1 a 3 no tienen sitio para cifras internas.

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
