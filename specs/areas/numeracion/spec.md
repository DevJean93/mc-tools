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

La regla relativa al centro marca `C` en el bloque central cuando el tamaño es impar; con
tamaño par el centro es de 2×2 y no hay 0 (`-1 | 1`).

[verificación manual: la regla se dibuja en el lienzo y no tiene una aserción automática; se revisa en las capturas.]

### NUM-11

Los tramos por fila (a la derecha) y por columna (abajo) muestran el total de cada fila y
columna, y se adaptan al zoom.

[verificación manual: son cifras fuera del lienzo; se revisan en las capturas de escritorio y móvil.]

### NUM-12

El resumen del centro indica el tamaño del centro (1×1 o 2×2) y la distancia a cada borde
sin contar el centro. Una capa vacía solo indica el tamaño.

Ejemplo: centro 1×1 en una fila de 3 → `← 1 · → 1 · ↑ 0 · ↓ 0`.

## Casos límite

- Franja de 2 (tamaño par): centro 2×2, no hay 0 en la regla relativa.
- Franja de 1 (tamaño impar): el eje central vale 1 y el centro es `C`.
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
- 2026-10-29: la regla relativa al centro sigue mostrando negativos (`-8 … 8`), aunque no
  coincide con el conteo de los ejes. Hay una propuesta abierta para cambiarla
  (`specs/cambios/001-regla-relativa-sin-negativos/`).
