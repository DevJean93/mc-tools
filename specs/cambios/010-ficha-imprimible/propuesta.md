# 010 · Ficha imprimible de la forma

## Estado

Borrador

## Motivo

Mucha gente construye con el plano en papel o en otra pantalla, no con la app abierta. Hoy se puede
exportar una imagen por capa, pero no hay una ficha lista para imprimir que reúna la forma
numerada y la lista de materiales. Idea de la auditoría inicial.

## Áreas afectadas

- `MAT` (materiales y exportación)

## Delta

### Añade

- Un botón para imprimir (o guardar como documento) una ficha con el dibujo numerado de la forma y
  los materiales necesarios. Los IDs de los requisitos se asignan al aclarar la propuesta.

### Modifica

Por decidir al aclarar: cómo se relaciona con la exportación de imágenes que ya existe.

### Retira

Nada.

## Criterios de aceptación

- **Dado** una forma de una capa, **cuando** se pide la ficha, **entonces** sale una página con el
  dibujo numerado y los materiales.
- **Dado** una forma 3D, **cuando** se pide la ficha, **entonces** sale la información de todas las
  capas de forma legible.
- **Dado** una forma muy grande, **cuando** se pide la ficha, **entonces** el dibujo se ajusta a la
  página sin que las cifras queden ilegibles, o se avisa.

## Preguntas abiertas

- `[NECESITA ACLARACIÓN: en formas 3D, ¿una página por capa o varias capas por página?]`
- `[NECESITA ACLARACIÓN: ¿la ficha lleva las marcas de lo ya construido o solo la forma limpia?]`
- `[NECESITA ACLARACIÓN: ¿hay que elegir el tamaño de papel o basta con el que ofrezca el navegador al imprimir?]`
- `[NECESITA ACLARACIÓN: ¿se usa el diálogo de impresión del navegador (que también permite guardar como documento) o se genera un archivo propio?]`
