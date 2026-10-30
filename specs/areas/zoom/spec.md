# Área · Zoom

Código: `ZOO`

## Propósito

Controla el tamaño con el que se ve el dibujo: niveles de acercamiento, ajuste a la ventana,
alejado automático cuando la forma crece y anclaje del zoom al puntero. No genera geometría
ni cambia el progreso.

## Requisitos

### ZOO-01

El zoom se mueve por niveles predefinidos de 2 a 48. Los botones y las teclas `+` y `-`
pasan al nivel inmediatamente superior o inferior; en los extremos no se sale del rango.

### ZOO-02

La tecla `0` (y el ajuste a la ventana) elige el mayor nivel con el que la capa visible cabe
entera en el espacio del contenedor y deja el desplazamiento en el origen.

### ZOO-03

Cuando la forma crece y deja de caber, el zoom se aleja solo hasta que vuelve a caber. Nunca
se acerca solo.

Ejemplo: círculo de 200 al abrirlo se aleja hasta el nivel 2 y cabe.

### ZOO-04

El zoom anclado al puntero mantiene quieta la celda que hay bajo el puntero. Sin punto, se
ancla al centro visible.

### ZOO-05

Cambiar el zoom no borra las marcas, no regenera la forma y no altera el progreso.

## Casos límite

- En el nivel 2 (mínimo) seguir alejando no hace nada.
- En el nivel 48 (máximo) seguir acercando no hace nada.
- Una forma que ya cabe no se aleja al cambiar de capa.

## Fuera de alcance

- El gesto de pellizcar y el arrastre táctil (área TAC).
- El dibujo de la cuadrícula y las cifras (áreas NUM y FOR).

## Decisiones

- 2026-10-29: el zoom va por niveles discretos (2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24,
  28, 32, 40, 48) en vez de continuo, para que las celdas queden en píxeles enteros y el
  dibujo se vea nítido.
- 2026-10-29: al crecer la forma solo se aleja, nunca se acerca; acercar sin pedirlo
  desorienta.
