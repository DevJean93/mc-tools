# 005 · Reglas fijas al desplazar el dibujo

## Estado

Aprobada

## Motivo

Con mucho zoom el dibujo es más grande que el espacio visible y se desplaza dentro de su
contenedor. Las reglas (los números 1..N de los márgenes izquierdo y superior) forman parte del
dibujo, así que salen de la vista al desplazarlo: en una fila o columna lejana no se ve qué
número es y la posición solo se averigua pasando el ratón o tocando un bloque. Tampoco se puede
marcar una fila o columna entera (MAR-14, MAR-15) sin volver al borde. El usuario lo aprobó el
29/10/2026.

## Áreas afectadas

- `NUM` (numeración)
- `MAR` (marcas)

## Delta

### Añade

- `NUM-15`: al desplazar el dibujo, las reglas izquierda y superior se quedan fijas en el borde
  visible del contenedor y muestran los números de las filas y columnas que se ven: la regla
  superior mientras se haya desplazado hacia abajo, y la izquierda mientras se haya desplazado
  hacia la derecha. Incluyen la regla relativa si está activa. Sin desplazamiento el dibujo se ve
  exactamente igual que siempre y no hay reglas añadidas.

### Modifica

- `MAR-14`:
  - antes: tocar o hacer clic en la banda de una fila de la regla izquierda alterna la fila
    entera de la capa actual.
  - después: lo mismo con la regla izquierda **fija**: la banda es la que se ve, y la fila es la
    que corresponde a ese punto del dibujo. Un toque en la regla fija nunca marca el bloque que
    queda debajo.
- `MAR-15`:
  - antes: tocar o hacer clic en la banda de una columna de la regla superior alterna la columna
    entera.
  - después: lo mismo con la regla superior **fija**, con la misma garantía.

### Retira

Nada.

## Criterios de aceptación

- **Dado** una forma grande con zoom, **cuando** se desplaza el dibujo hacia abajo, **entonces**
  la regla superior queda fija arriba y sus números corresponden a las columnas visibles
  (`NUM-15`).
- **Dado** una forma grande con zoom, **cuando** se desplaza el dibujo hacia la derecha,
  **entonces** la regla izquierda queda fija a la izquierda y sus números corresponden a las
  filas visibles (`NUM-15`).
- **Dado** el dibujo sin desplazar, **cuando** se mira el lienzo, **entonces** no hay reglas fijas
  y es idéntico al de siempre (`NUM-15`).
- **Dado** el dibujo desplazado, **cuando** se hace clic o se toca el número de la regla fija,
  **entonces** se alterna la fila o columna correcta y ningún bloque suelto cambia (`MAR-14`,
  `MAR-15`).
- **Dado** el dibujo desplazado en horizontal y en vertical, **cuando** se toca la esquina entre
  las dos reglas fijas, **entonces** no pasa nada (`MAR-14`, `MAR-15`).

## Preguntas abiertas

Ninguna.
