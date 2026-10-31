# 008 · Guías de chunk cada 16 bloques

## Estado

Borrador

## Motivo

En Minecraft el mundo se divide en chunks de 16×16 bloques, y al construir cerca de una frontera de
chunk conviene saber dónde están (carga de zonas, redstone, granjas). El dibujo ya marca cada 5
bloques con una línea más clara, pero no hay ninguna guía de 16. Idea de la auditoría inicial.

## Áreas afectadas

- `NUM` (numeración)

## Delta

### Añade

- Una opción de vista que dibuja una guía más marcada cada 16 bloques sobre la rejilla. Los IDs de
  los requisitos se asignan al aclarar la propuesta.

### Modifica

Por decidir al aclarar: cómo conviven con las líneas cada 5 bloques.

### Retira

Nada.

## Criterios de aceptación

- **Dado** una forma de más de 16 bloques con la opción activada, **cuando** se mira el dibujo,
  **entonces** hay una guía visible cada 16 bloques, distinta de las líneas cada 5.
- **Dado** la opción desactivada, **cuando** se mira el dibujo, **entonces** es idéntico al de hoy.
- **Dado** una forma de 16 bloques o menos, **cuando** se activa la opción, **entonces** no hay
  guías ni errores.

## Preguntas abiertas

- `[NECESITA ACLARACIÓN: ¿las guías cuentan desde el borde del dibujo o desde una coordenada del mundo que indica el usuario? Un chunk real empieza en múltiplos de 16 del mundo, no del dibujo.]`
- `[NECESITA ACLARACIÓN: ¿es una opción de «Vista» que se activa aparte (como las demás) o va siempre visible?]`
- `[NECESITA ACLARACIÓN: ¿qué aspecto tienen: un color distinto, una línea más gruesa o ambas?]`
