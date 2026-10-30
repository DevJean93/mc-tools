# 001 · Regla relativa al centro sin números negativos

## Estado

Borrador

## Motivo

La regla relativa al centro numera hoy hacia la izquierda y hacia arriba con números
negativos (`-8 … -1 | 1 … 8`). Al construir, esos negativos no aportan nada: el bloque que
está a 3 del centro se cuenta igual a un lado que al otro, y el signo obliga a pensar en
coordenadas en vez de en distancia. La regla absoluta de los bordes ya cuenta 1..N; la
relativa debería dar la distancia al centro sin signo.

## Áreas afectadas

- `NUM` (numeración)

## Delta

### Añade

- `NUM-13`: la regla relativa al centro muestra la distancia en bloques desde el centro,
  sin signo, y es simétrica (`8 … 2 1 | 1 2 … 8` en un lado de 8 bloques).

### Modifica

- `NUM-10`:
  - antes: el centro es `C` con tamaño impar y, con tamaño par, la regla va de `-n/2` a
    `n/2` sin 0 (`-1 | 1` en el centro).
  - después: no hay números negativos; cada lado cuenta desde 1 junto al centro hasta el
    borde. El tamaño impar conserva `C` en el bloque central.

### Retira

- Ninguno.

## Criterios de aceptación

- **Dado** un círculo de 16 (centro de 2×2), **cuando** se activa la regla relativa,
  **entonces** la fila central muestra `8 … 1 | 1 … 8` y ningún número negativo (`NUM-10`,
  `NUM-13`).
- **Dado** un círculo de 15 (centro de 1×1), **cuando** se activa la regla relativa,
  **entonces** el bloque central muestra `C` y a cada lado se cuenta `1 … 7` (`NUM-10`).
- **Dado** cualquier tamaño y zoom, **cuando** la regla oculta números que no caben,
  **entonces** sigue mostrando el 1 junto al centro, el borde y los múltiplos del paso
  (`NUM-13`).

## Preguntas abiertas

- `[NECESITA ACLARACIÓN: con tamaño impar, ¿el bloque central debe mostrar solo «C» o «C» y además contar como 1 en ambos lados?]`
- `[NECESITA ACLARACIÓN: ¿la cuenta debe llegar hasta el borde (8 en un lado de 8) o quedarse en el último bloque interior, como hacía antes la regla absoluta?]`
- `[NECESITA ACLARACIÓN: ¿la distancia al centro que se escribe sobre los ejes centrales debe usar el mismo criterio sin signo?]`
- `[NECESITA ACLARACIÓN: ¿los tramos por fila y columna («3 · 8 · 3») cambian de algún modo o siguen igual?]`
- `[NECESITA ACLARACIÓN: ¿basta con la regla relativa, o conviene retirarla y dejar solo la absoluta para no duplicar dos cuentas parecidas?]`
