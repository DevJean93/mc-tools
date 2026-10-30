# Área · Táctil

Código: `TAC`

## Propósito

Resuelve los gestos de dedo sobre el lienzo, que el navegador no gestiona porque el lienzo
usa `touch-action: none`: un dedo desplaza o marca, dos dedos pellizcan y desplazan. No
conoce el estado: recibe las acciones de dibujo, marcas y zoom.

## Requisitos

### TAC-01

Un dedo desplaza el dibujo y, cuando el contenedor ya no puede moverse, desplaza la página.
Si el dedo se movió menos de 10 px, cuenta como un toque corto y marca la celda.

### TAC-02

El arrastre acumula la fracción de píxel: un dedo muy lento (menos de 1 px por evento)
también mueve el dibujo, y la página solo se desplaza cuando el contenedor llegó a su borde.

Ejemplo: a 1×, un arrastre de 0,4 px por evento mueve el dibujo sin mover la página.

### TAC-03

Dos dedos hacen pellizco con zoom anclado al punto medio. Si la distancia entre dedos no
cambia, los dedos desplazan el dibujo. Los dedos pueden llegar en momentos distintos: el
pellizco empieza al llegar el segundo.

### TAC-04

El zoom del pellizco se recorta en los límites: al llegar al máximo o al mínimo, los dedos
siguen desplazando el dibujo sin perder el movimiento.

### TAC-05

En un pellizco que además se desplaza, manda el punto medio: la celda que estaba bajo el
punto medio inicial sigue bajo el punto medio final.

### TAC-06

Si se pierde la captura del puntero, el dedo se suelta como una cancelación y el siguiente
toque vuelve a marcar con normalidad.

### TAC-07

Con tres o más dedos el gesto se ignora; al levantar el dedo sobrante, el pellizco continúa
con los dos que quedan.

### TAC-08

El pellizco no marca bloques ni cambia el progreso.

### TAC-09

Con un dibujo que no cabe, el arrastre mueve el dibujo y no la página, también a 3× y en
pantallas móviles.

## Casos límite

- Un toque corto seguido de otro marca dos celdas.
- El pellizco en el zoom máximo sigue desplazando en las dos direcciones.
- Tres dedos no dejan el gesto bloqueado para el siguiente toque.

## Fuera de alcance

- Los botones, las teclas y el zoom de escritorio (áreas ZOO y FOR).
- La lógica de marcas, que solo recibe la celda tocada (área MAR).

## Decisiones

- 2026-10-29: el umbral de toque es de 10 px; por debajo se marca la celda bajo el dedo.
- 2026-10-29: la fracción de píxel se acumula porque el navegador redondea el scroll a
  píxeles enteros y un arrastre lento no movía nada.
- 2026-10-29: primero se desplaza y luego se aplica el zoom ya recortado; así en los límites
  no se pierden movimientos del pellizco.
- 2026-10-29: se descartó dejar el gesto al navegador (`touch-action: pan-y`) porque impedía
  pellizcar y marcar sobre el lienzo.
