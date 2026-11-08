# 014 · Ficha imprimible con los dibujos en fondo claro

## Estado

Borrador

## Motivo

Los dibujos de la ficha imprimible (MAT-11) usan la paleta oscura de la app, igual que el PNG: fondo
casi negro (`#0F172A`) y celdas vacías oscuras. En papel eso gasta mucha tinta, tarda en imprimirse,
y en una impresora en blanco y negro las cifras sobre los bloques se distinguen peor. La ficha es solo
para papel, así que debería dibujarse para papel. Lo detectó la revisión de la propuesta 010.

## Áreas afectadas

- `MAT` (materiales y exportación): solo la ficha imprimible.

La pantalla y la imagen exportada no cambian (`MAT-07`..`MAT-09` quedan igual).

## Delta

### Añade

- `MAT-14`: los dibujos de la ficha imprimible usan una paleta para papel:
  - fondo blanco, celdas vacías sin relleno con una rejilla fina gris y bloques de la forma en un tono
    claro;
  - cifras, reglas y cabecera en tinta oscura, legibles también en una impresora en blanco y negro;
  - el bloque central, los ejes resaltados, los tramos y las guías de chunk se distinguen entre sí y de
    los bloques normales sin depender solo del color.

  En pantalla y en el PNG se sigue dibujando con la paleta oscura de siempre.

### Modifica

- `MAT-11`:
  - antes: «el dibujo usa las opciones de vista actuales (reglas, tramos, guías de chunk…), igual que
    el PNG».
  - después: el dibujo usa las mismas opciones de vista actuales que el PNG, pero con la paleta para
    papel de `MAT-14`.

### Retira

Nada.

## Criterios de aceptación

- **Dado** una esfera de 11, **cuando** se pide la ficha, **entonces** el fondo de cada dibujo es
  blanco y no hay zonas grandes de color oscuro (`MAT-14`).
- **Dado** la ficha impresa en escala de grises, **cuando** se mira una capa, **entonces** se leen las
  cifras, y el centro y los ejes se distinguen de los demás bloques (`MAT-14`).
- **Dado** las guías de chunk y los tramos activados, **cuando** se pide la ficha, **entonces**
  aparecen en el dibujo y se distinguen de la rejilla (`MAT-11`, `MAT-14`).
- **Dado** cualquier forma, **cuando** se exporta el PNG o se mira el lienzo, **entonces** el dibujo es
  idéntico píxel a píxel al de antes del cambio (`MAT-14`).

## Preguntas abiertas

- `[NECESITA ACLARACIÓN: ¿siempre en fondo claro, o un interruptor junto al botón para elegir entre la paleta para papel y la de la pantalla (por ejemplo, para guardar un PDF que se vea igual que la app)?]`
- `[NECESITA ACLARACIÓN: ¿los bloques de la forma van con un relleno claro de color (verde muy suave) o en gris o solo con borde, pensando en impresoras en blanco y negro?]`
- `[NECESITA ACLARACIÓN: ¿el centro y los ejes resaltados se distinguen con un gris más oscuro, con un borde más grueso o con una trama (rayado)? Hoy se distinguen solo por el color (amarillo y ocre).]`
