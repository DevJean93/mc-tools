# 004 · Números del desglose de materiales en negrita

## Estado

Hecha

## Motivo

Las cifras del lienzo van en negrita para que destaquen, pero el desglose de materiales (stacks,
shulker boxes, cofres dobles, construidos y faltan) usa peso normal: las cantidades, que es lo
que se consulta, se confunden con las etiquetas. El usuario lo propuso y lo aprobó el
29/10/2026.

## Áreas afectadas

- `MAT` (Materiales)

## Delta

### Añade

- `MAT-10`: los números del desglose de materiales (stacks, shulker boxes, cofres dobles,
  construidos y faltan) se muestran en negrita, como el total y las cifras del lienzo. Las
  etiquetas y la fórmula de equivalencias siguen en peso normal.

### Modifica

Nada.

### Retira

Nada.

## Criterios de aceptación

- **Dado** una forma cualquiera, **cuando** se mira el desglose, **entonces** sus cinco números
  están en negrita y sus etiquetas no (`MAT-10`).
- **Dado** una forma 3D con tabla por capas, **cuando** se mira la tabla, **entonces** sus
  celdas siguen en peso normal: la jerarquía se mantiene (`MAT-10`).

## Preguntas abiertas

Ninguna.
