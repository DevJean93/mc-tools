# Área · Formas

Código: `FOR`

## Propósito

Genera la geometría de la forma elegida, en 2D o en 3D, sólida o hueca, y ofrece un
registro abierto para añadir formas sin tocar el resto de la app. Es la base de la cuenta
de materiales y del dibujo.

## Requisitos

### FOR-01

La app genera formas 2D —círculo/óvalo, cuadrado/rectángulo, triángulo, rombo y hexágono—
con ancho y alto de 1 a 200 bloques.

Ejemplo: círculo de 16×16 → 208 bloques, simétrico en ambos ejes.

### FOR-02

La app genera formas 3D —esfera y cúpula— con diámetro de 1 a 100, una capa por nivel
vertical; la capa 1 es la base. El total de cada capa coincide con sus bloques.

Ejemplo: esfera de 16 → 2176 bloques en 16 capas; una esfera nueva de 3D genera una capa
por nivel y usa el máximo 3D.

### FOR-03

El modo sólido llena la forma y el modo hueco deja solo el borde. El hueco siempre es un
subconjunto del sólido: ninguna celda hueca cae fuera de la forma llena.

Ejemplo: círculo 16 hueco con grosor 2 → 84 bloques.

### FOR-04

En modo hueco, el grosor del borde se limita al máximo que aún deja interior. Si se pide
más, se recorta al máximo y se avisa.

Ejemplo: círculo 16 con grosor 50 → se recorta a 7 y no devuelve el sólido.

### FOR-05

La cúpula es exactamente la mitad superior de la esfera del mismo diámetro.

Ejemplo: esfera 16 → 16 capas; cúpula 16 → las 8 capas de arriba.

### FOR-06

El centro de la forma es de 2×2 bloques cuando el tamaño es par y de 1×1 cuando es impar.

Ejemplo: círculo 16 → centro en (7,7), (7,8), (8,7) y (8,8); círculo 15 → centro en (7,7).

### FOR-07

Los tamaños degenerados (1×1, 2×2, 3×3, esfera de 1) no fallan y respetan el marco pedido.

### FOR-08

Los parámetros inválidos se recortan al límite o fallan con un mensaje claro; una forma
desconocida da «Forma desconocida» y un ancho no numérico da un error de ancho.

### FOR-09

El registro de formas es abierto: registrar una forma nueva la hace disponible en toda la
app (selector, validación, geometría y firma) sin tocar `estado.js` ni `app.js`.

### FOR-10

Cada forma declara sus propias variantes y orientaciones. Una variante u orientación solo
vale para la forma que la declara; en las demás se descarta y se cae en la primera.

### FOR-11

Toda forma registrada cumple el contrato común: genera al menos un bloque, respeta sus
dimensiones, es simétrica en horizontal y sus totales coinciden con las capas. Una
definición mal formada, vacía o duplicada no se registra.

### FOR-12

El selector de formas sale del registro y conserva su orden. Se construye una vez: escribir
un tamaño no lo reconstruye.

### FOR-13

El hexágono ofrece orientación de lado plano o punta arriba. La elección se recuerda al
volver a la forma y se restaura al recargar; la fila solo aparece en las formas que la
ofrecen.

### FOR-14

La variante 3D (esfera o cúpula) se recuerda y se restaura al recargar. Una variante
guardada que no pertenece a la forma activa cae en la primera de esa forma.

### FOR-15

Los campos numéricos se pueden vaciar para teclear otro número: mientras están vacíos no se
aplica el mínimo ni cambia la forma; al teclear se aplica el valor escrito.

Ejemplo: borrar el ancho y teclear «20» da 20, no 1 ni 2.

## Casos límite

- 2D en el máximo: círculo 200 → 31 428 bloques; hexágono 200 plano → 30 000.
- 3D en el máximo: esfera Ø100 hueca con grosor 50 se genera en menos de 300 ms.
- Rectángulo 10×10 hueco con grosor 1 → 36 bloques.
- Grosor 50 en una forma pequeña se recorta al máximo real (7 en el círculo 16).

## Fuera de alcance

- La numeración de ejes y tramos (área NUM).
- El dibujo en canvas y el zoom (áreas ZOO y NUM).
- La cuenta de materiales (área MAT).

## Decisiones

- 2026-10-29: el registro es abierto (`Formas.registrar`) y valida un contrato mínimo al
  registrar; así una forma nueva aparece sola en selectores, validación y firma.
- 2026-10-29: las variantes y orientaciones las declara cada forma, no una lista central.
  Se descartó mantener listas por id en `estado.js` porque obligaba a tocar dos archivos por
  cada forma nueva.
- 2026-10-29: el hueco se calcula por distancia BFS en una pasada (4-vecinos en 2D,
  6 en 3D) en lugar de erosiones repetidas: mismo resultado y mucho más rápido (esfera Ø100
  hueca de 625 ms a unos 24 ms).
- 2026-10-29: el grosor máximo es la distancia máxima menos 1; si se pide más se recorta y
  se avisa, para que «hueco» nunca sea igual al sólido.
- 2026-10-29: la cúpula se obtiene cortando las capas superiores de la esfera ya generada,
  no con una fórmula aparte.
