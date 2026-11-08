# 011 · Varios materiales por forma

## Estado

Aprobada

## Motivo

La app calcula los materiales como si toda la forma fuera de un solo bloque. En una construcción
real suele haber varios: un borde de un material y un relleno de otro. Poder repartir los bloques
entre materiales daría un desglose útil de verdad (cuántos stacks de cada uno). Hoy está entre los
límites conocidos: «un solo material por forma». Idea de la auditoría inicial.

## Áreas afectadas

- `MAT` (materiales y exportación): el reparto, el desglose y el esquema de Litematica.
- `MAR` (marcas): el archivo de proyecto lleva el reparto.

## Delta

### Añade

- `MAT-18`: en las formas sólidas se puede dar un material al borde y otro al relleno, elegidos de la
  misma lista de bloques que Litematica (`MAT-17`). El borde son los bloques de la forma que tocan el
  exterior por alguna cara (en 3D también por arriba y por abajo); el relleno, el resto. Por defecto
  hay un solo material para toda la forma y todo queda como hoy. En formas huecas solo hay borde.
- `MAT-19`: con dos materiales, el desglose muestra para cada uno sus bloques, stacks, shulker boxes y
  cofres dobles, además del total de la forma; la suma de los dos coincide con el total. También en la
  tabla por capas y en la ficha imprimible.
- `MAT-20`: con dos materiales, el lienzo pinta el relleno en un tono más apagado que el borde, en los
  dos temas, en el PNG y en la ficha, con su entrada en la leyenda. La numeración y las marcas de
  construido se ven igual. Con un solo material el dibujo es idéntico al de antes.
- `MAT-21`: el reparto no entra en la firma de las marcas: cambiarlo no borra nada ni saca avisos. Se
  guarda en el navegador, viaja en el archivo de proyecto (`MAR-19`) y en el esquema de Litematica
  (un bloque por zona, `MAT-15`), y no viaja en el enlace.

### Modifica

- `MAR-19`:
  - antes: el archivo de proyecto lleva los parámetros de la forma y las marcas.
  - después: además lleva el reparto de materiales; un archivo sin reparto (de versiones anteriores)
    carga igual, con un solo material.

### Retira

Nada.

## Criterios de aceptación

- **Dado** un círculo sólido de 16 con borde de ladrillos y relleno de piedra, **cuando** se mira el
  desglose, **entonces** muestra los bloques y stacks de cada material y su suma es 208 (`MAT-18`,
  `MAT-19`).
- **Dado** una forma sin reparto, **cuando** se mira el desglose y el lienzo, **entonces** son
  idénticos a los de hoy, píxel a píxel (`MAT-19`, `MAT-20`).
- **Dado** una esfera de 11 sólida con dos materiales, **cuando** se mira la capa 1, **entonces** todos
  sus bloques son borde (tocan el exterior por abajo) (`MAT-18`).
- **Dado** marcas hechas, **cuando** se cambia el reparto, **entonces** las marcas siguen y no sale
  aviso (`MAT-21`).
- **Dado** un reparto, **cuando** se guarda y se carga el proyecto, **entonces** vuelve el mismo
  reparto; un proyecto antiguo carga con un solo material (`MAR-19`, `MAT-21`).
- **Dado** dos materiales, **cuando** se descarga para Litematica, **entonces** el esquema lleva cada
  bloque en su zona (`MAT-21`).

## Decisiones tomadas al aclarar

- 2026-11-08: el reparto es por zonas automáticas (borde y relleno). Se descartó elegir bloque a
  bloque: sería una segunda capa de marcas con su guardado, deshacer y táctil.
- 2026-11-08: como mucho dos materiales, de la lista de bloques de Litematica, para que el reparto
  viaje tal cual al esquema. Se descartó el texto libre.
- 2026-11-08: en el lienzo, el relleno va en un tono distinto, sin tocar números ni marcas. Se
  descartó mostrar el reparto solo en la lista.
- 2026-11-08: el reparto no entra en la firma: es como una opción de los materiales y no borra marcas.

## Detalles propuestos al redactar (revisar al implementar)

- La opción de dar otro material a un rango de capas en 3D, mencionada al aclarar como opcional, se
  deja fuera: añade una interfaz de rangos que no hace falta para borde y relleno. Podría ser otra
  propuesta.
- El reparto va en el archivo de proyecto como un campo opcional, sin cambiar la versión del formato,
  porque un archivo sin él sigue siendo válido.
- Se implementa después de la 016, que crea la lista de bloques y el esquema.

## Preguntas abiertas

Ninguna.
