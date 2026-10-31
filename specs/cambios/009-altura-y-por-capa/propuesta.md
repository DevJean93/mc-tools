# 009 · Altura Y de cada capa en las formas 3D

## Estado

Borrador

## Motivo

En una esfera o cúpula cada capa es un nivel de altura, y al construir se trabaja con la
coordenada Y del juego (la que se ve con F3). Hoy las capas se numeran 1..N desde la base, y
quien construye tiene que sumar a mano la altura de su suelo en cada capa. Idea de la auditoría
inicial.

## Áreas afectadas

- `NUM` (numeración)

## Delta

### Añade

- Un campo para indicar la altura Y de la capa base y que cada capa muestre su altura (la de la
  base más su número de capa menos uno). Los IDs de los requisitos se asignan al aclarar la
  propuesta.

### Modifica

Por decidir al aclarar: dónde se muestra la altura y si cambia el texto «Capa 3 de 11».

### Retira

Nada.

## Criterios de aceptación

- **Dado** una esfera con la base en Y = 64, **cuando** se mira la capa 3, **entonces** indica
  que está a Y = 66.
- **Dado** una forma de una sola capa, **cuando** se mira, **entonces** no cambia nada.
- **Dado** la altura sin rellenar, **cuando** se mira una capa, **entonces** solo se ve su número,
  como hoy.

## Preguntas abiertas

- `[NECESITA ACLARACIÓN: ¿la altura de la base la escribe el usuario o puede dejarse vacía y se muestra solo el número de capa?]`
- `[NECESITA ACLARACIÓN: ¿dónde se ve la altura: en el texto de la capa, en la tabla por capas, en la imagen exportada o en los tres sitios?]`
- `[NECESITA ACLARACIÓN: en una cúpula, que empieza a mitad de la esfera, ¿la capa base es la primera capa de la cúpula?]`
- `[NECESITA ACLARACIÓN: ¿se guarda la altura con el progreso del navegador?]`
