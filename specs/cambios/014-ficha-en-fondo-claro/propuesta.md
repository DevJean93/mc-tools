# 014 · Ficha imprimible con los dibujos en fondo claro

## Estado

En curso

## Motivo

Los dibujos de la ficha imprimible (MAT-11) usan la paleta oscura de la app, igual que el PNG: fondo
casi negro (`#0F172A`) y celdas vacías oscuras. En papel eso gasta mucha tinta y tarda en imprimirse.
Además, en una impresora en blanco y negro las cifras sobre los bloques se distinguen peor. La ficha es
solo para papel, así que debería dibujarse para papel. Lo detectó la revisión de la propuesta 010.

## Áreas afectadas

- `MAT` (materiales y exportación): solo la ficha imprimible.

La pantalla y la imagen exportada no cambian (`MAT-07`..`MAT-09` quedan igual).

## Delta

### Añade

- `MAT-14`: los dibujos de la ficha imprimible usan siempre una paleta para papel, sin opción para
  elegir otra:
  - fondo blanco y celdas vacías sin relleno, con una rejilla fina gris;
  - bloques de la forma en verde muy suave con un borde fino;
  - cifras, reglas y cabecera en tinta oscura, legibles también en una impresora en blanco y negro;
  - ejes resaltados en un tono algo más oscuro que los bloques normales;
  - bloque central con un borde grueso oscuro;
  - el centro, los ejes y los bloques normales se distinguen también en escala de grises, no solo por
    el color, y sin tapar las cifras;
  - tramos y guías de chunk siguen apareciendo si están activados y se distinguen de la rejilla.

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
- **Dado** una capa de la ficha, **cuando** se mira, **entonces** los bloques de la forma tienen un
  relleno verde claro y las celdas vacías son blancas con rejilla gris (`MAT-14`).
- **Dado** la ficha en escala de grises, **cuando** se mira una capa, **entonces** se leen las cifras,
  los ejes son más oscuros que los bloques normales y el centro tiene un borde grueso oscuro
  (`MAT-14`).
- **Dado** las guías de chunk y los tramos activados, **cuando** se pide la ficha, **entonces**
  aparecen en el dibujo y se distinguen de la rejilla (`MAT-11`, `MAT-14`).
- **Dado** cualquier forma, **cuando** se exporta el PNG o se mira el lienzo, **entonces** el dibujo es
  idéntico píxel a píxel al de antes del cambio (`MAT-14`).

## Decisiones tomadas al aclarar

- 2026-11-08: la ficha usa siempre la paleta para papel, sin interruptor. La ficha solo sirve para
  imprimir; quien quiera la imagen como en pantalla ya tiene el PNG. Se descartó una casilla «Fondo
  oscuro» junto al botón: tocaría la interfaz y añadiría otra opción guardada para un caso raro.
- 2026-11-08: los bloques de la forma van en verde muy suave con borde fino. Recuerda a la app, gasta
  poca tinta y en blanco y negro sale como un gris claro sobre el que se leen las cifras. Se
  descartaron el gris claro, que pierde el parecido con la app, y el solo borde, que hace difícil ver
  la forma de un vistazo.
- 2026-11-08: los ejes van en un tono algo más oscuro y el centro con un borde grueso oscuro. Así se
  distinguen en gris sin depender del color (constitución, principio 7) y sin tapar las cifras. Se
  descartaron los grises solos, porque el centro y los ejes se confundirían, y el rayado, que
  dificulta leer las cifras.

## Detalles propuestos al redactar (revisar antes de aprobar)

- Los colores exactos se eligen en el plan con la skill `ui-ux-pro-max`. Se comprueban con capturas
  de la ficha en color y en escala de grises: las cifras deben tener un contraste de al menos 4,5:1
  sobre su relleno.
- Las guías de chunk (magenta en pantalla) se mantienen en papel como líneas de 2 px más oscuras que
  la rejilla, para que se vean también en blanco y negro.
- La cabecera del dibujo (forma, capa, Y, bloques) pasa a texto oscuro sobre fondo blanco, igual que
  el resto de la ficha.
- Los E2E de la 010 se mantienen; se añaden la comprobación de los colores de la ficha y la
  comparación píxel a píxel del lienzo y del PNG contra la versión anterior.

## Preguntas abiertas

Ninguna.
