# 011 · Varios materiales por forma

## Estado

Borrador

## Motivo

La app calcula los materiales como si toda la forma fuera de un solo bloque. En una construcción
real suele haber varios: un borde de un material y un relleno de otro, o capas distintas.
Poder repartir los bloques entre materiales daría un desglose útil de verdad (cuántos stacks de
cada uno). Hoy está entre los límites conocidos: «un solo material por forma». Idea de la
auditoría inicial.

## Áreas afectadas

- `MAT` (materiales y exportación)

## Delta

### Añade

- La posibilidad de asignar materiales distintos a partes de la forma y ver el desglose de cada
  uno. Los IDs de los requisitos se asignan al aclarar la propuesta.

### Modifica

Por decidir al aclarar: el desglose actual (total, stacks, shulkers, cofres) pasa a ser uno por
material o se mantiene el total además de ellos.

### Retira

Nada.

## Criterios de aceptación

- **Dado** una forma hueca con borde de un material y relleno de otro, **cuando** se asignan,
  **entonces** el desglose muestra los bloques y stacks de cada material y su suma coincide con el
  total de la forma.
- **Dado** una forma sin materiales asignados, **cuando** se mira el desglose, **entonces** es
  idéntico al de hoy.
- **Dado** una forma con varios materiales, **cuando** se recarga la página, **entonces** se
  conserva el reparto.

## Preguntas abiertas

- `[NECESITA ACLARACIÓN: ¿el reparto es por zonas automáticas (borde e interior, por capas) o el usuario elige bloque a bloque como al marcar?]`
- `[NECESITA ACLARACIÓN: ¿cuántos materiales como máximo y con qué nombre: texto libre o una lista de bloques del juego?]`
- `[NECESITA ACLARACIÓN: ¿cómo se distinguen en el lienzo (colores, patrones) sin perder la numeración ni el estado de construido?]`
- `[NECESITA ACLARACIÓN: ¿el reparto entra en la firma de la forma? Cambiarla borraría las marcas guardadas.]`
