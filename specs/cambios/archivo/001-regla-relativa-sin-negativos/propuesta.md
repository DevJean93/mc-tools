# 001 · Regla relativa al centro sin números negativos

## Estado

Hecha

## Motivo

La regla relativa al centro numera hoy hacia la izquierda y hacia arriba con números
negativos (`-8 … -1 | 1 … 8`) y marca `C` en el centro de las formas impares. Al construir,
esos signos no aportan nada: el bloque que está a 3 del centro se cuenta igual a un lado que al
otro, y el signo obliga a pensar en coordenadas en vez de en distancia. Además no coincide con
los números de los ejes (NUM-01), que ya cuentan sin signo desde la franja central hasta el
borde. Dos cuentas parecidas que dicen cosas distintas confunden.

## Decisiones del usuario (29/10/2026)

- La regla relativa **cuenta igual que los ejes**: la franja central vale 1 y se llega hasta el
  bloque del borde. Desaparecen los signos y la `C`.
- La opción «Regla relativa al centro» **se mantiene** en «Vista».
- Los tramos por fila y columna y los números de los ejes **no cambian**.

## Áreas afectadas

- `NUM` (numeración)

## Delta

### Añade

- `NUM-13`: con poco zoom, la regla relativa muestra solo las cifras que caben: el 1 de la
  franja (una sola vez, aunque la franja sea de 2 bloques) y los múltiplos del paso de la
  regla; con todo el zoom muestra todas.
- `NUM-14`: la línea de información de un bloque dice su posición respecto al centro con la
  misma cuenta que la regla y una flecha en lugar de signo. Ejemplo: círculo de 30, columna 3,
  fila 5 → `relativo al centro (← 13, ↑ 11)`. En la franja central dice solo `1`, sin flecha.

### Modifica

- `NUM-10`:
  - antes: la regla relativa marca `C` en el bloque central cuando el tamaño es impar; con
    tamaño par el centro es de 2×2 y no hay 0 (`-1 | 1`).
  - después: la regla relativa cuenta como los ejes: la franja central vale 1 y se llega al
    bloque del borde, sin signo ni `C`. Ejemplos: círculo de 30 → `15 … 2 1 | 1 2 … 15`;
    círculo de 15 → `8 … 2 1 2 … 8`.

### Retira

Nada.

## Criterios de aceptación

- **Dado** un círculo de 16 (franja de 2×2), **cuando** se activa la regla relativa, **entonces**
  cada margen muestra `8 … 2 1 | 1 2 … 8` y ningún número negativo (`NUM-10`).
- **Dado** un círculo de 15 (franja de 1×1), **cuando** se activa la regla relativa,
  **entonces** el bloque central muestra `1` (no `C`) y a cada lado se cuenta `2 … 8`
  (`NUM-10`).
- **Dado** un tamaño y un zoom que ocultan cifras, **cuando** se mira la regla relativa,
  **entonces** siguen el 1 de la franja y los múltiplos del paso, sin dos cifras pegadas
  (`NUM-13`).
- **Dado** un círculo de 30, **cuando** el puntero pasa por la columna 3, fila 5, **entonces** la
  línea de información dice `relativo al centro (← 13, ↑ 11)` y no contiene ningún `-`
  (`NUM-14`).

## Preguntas abiertas

Ninguna.
