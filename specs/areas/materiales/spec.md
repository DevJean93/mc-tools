# Área · Materiales

Código: `MAT`

## Propósito

Traduce los bloques de la forma a materiales de Minecraft (stacks, shulkers y cofres dobles)
y calcula el progreso por capa y total. El cálculo es puro; la tabla y la barra solo pintan
su resultado.

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

## Casos límite

- 0 bloques: `0 × 64`, sin shulkers ni cofres.
- 3457 bloques: 2 cofres dobles (el segundo por el resto).
- Porcentaje 67,5 % se muestra como 68 %.
- Una capa de total 0 no está completa aunque no le falte nada.

## Fuera de alcance

- Marcar los bloques (área MAR).
- El resumen del centro y la numeración (área NUM).
- Generar la geometría y contar sus bloques (área FOR).

## Decisiones

- 2026-10-29: los porcentajes se redondean al entero más cercano para que el texto sea corto;
  el progreso nunca supera el 100 % porque las marcas se limitan a bloques reales.
- 2026-10-29: las cajas se redondean hacia arriba: media caja no existe y hay que llevarla
  entera.
