# 008 · Guías de chunk cada 16 bloques

## Estado

En curso

## Motivo

En Minecraft el mundo se divide en chunks de 16×16 bloques, y al construir cerca de una frontera de
chunk conviene saber dónde están (carga de zonas, redstone, granjas). El dibujo ya marca cada 5
bloques con una línea más clara, pero no hay ninguna guía de 16. Idea de la auditoría inicial.

Las fronteras de chunk reales están en los múltiplos de 16 de las coordenadas del mundo, no del
dibujo: para que las guías sirvan, el dibujo tiene que saber dónde va en el mundo. Basta con la X y
la Z del bloque central, que se leen en el juego con F3.

## Áreas afectadas

- `NUM` (numeración)
- `INT` (interfaz): la casilla y los campos de coordenadas

## Delta

### Añade

- `NUM-16`: con «Guías de chunk» activada y las coordenadas del centro escritas, el dibujo traza una
  guía en cada frontera de chunk que cae dentro de él: entre dos columnas cuya X del mundo pasa de
  un múltiplo de 16 menos 1 a un múltiplo de 16, y lo mismo entre filas con la Z. La X del mundo crece
  hacia la derecha (este) y la Z hacia abajo (sur), como en el mapa del juego. La guía es una línea de
  2 px en un color propio que no usa el resto del dibujo, por encima de la rejilla y de los bloques;
  se distingue de las líneas cada 5 por el color y por el grosor. La leyenda la explica.
  Ejemplo: círculo de 16 con el centro en X = 100, Z = −40. El bloque central es la columna 7 (con
  tamaño par, el bloque central de referencia es el de arriba a la izquierda del 2×2); la columna 0
  está en X = 93 y la 15 en X = 108, así que hay una guía vertical entre las columnas 2 y 3 (X 95 y
  96). En Z, la fila 0 está en −47 y la 15 en −32: hay una guía horizontal entre las filas 14 y 15
  (Z −33 y −32).
- `NUM-17`: con la opción activada pero sin coordenadas (o con alguna vacía) no se dibuja ninguna
  guía y el panel explica que hay que escribir la X y la Z del bloque central. Con la opción
  desactivada el dibujo es idéntico al de hoy, píxel a píxel. Las guías no cambian la forma, la firma
  ni las marcas; tampoco viajan en el enlace (FOR-16) ni en el archivo de proyecto (MAR-19), porque
  son una opción de vista.
- `INT-12`: en «Vista» hay una casilla «Guías de chunk». Al activarla aparecen dos campos
  numéricos, «X del centro» y «Z del centro», con etiqueta visible, texto de 16 px y objetivo táctil
  de 44 px en móvil, que admiten números enteros negativos dentro del mundo (de −30 000 000 a
  30 000 000). La casilla y las coordenadas se recuerdan al recargar, como las demás opciones de
  vista. Se pueden ocultar las guías sin perder las coordenadas.

### Modifica

Nada. Las opciones nuevas se guardan dentro de `mc-formas-v1` como campos nuevos con su valor por
defecto (desactivada, sin coordenadas) cuando faltan, así que lo ya guardado sigue cargando igual; un
test con una cadena de referencia lo comprueba. La firma de las marcas no cambia.

### Retira

Nada.

## Criterios de aceptación

- **Dado** un círculo de 16 con el centro en X = 100 y Z = −40 y la opción activada, **cuando** se
  mira el dibujo, **entonces** hay una guía vertical entre las columnas 2 y 3 y una horizontal entre
  las filas 14 y 15, y ninguna más (`NUM-16`).
- **Dado** un círculo de 15 (centro 1×1) con el centro en X = 0, **cuando** se activa la opción,
  **entonces** la guía vertical cae justo a la izquierda del bloque central (X 0) (`NUM-16`).
- **Dado** una forma de 3D, **cuando** se cambia de capa, **entonces** las guías siguen en el mismo
  sitio (los chunks son columnas verticales) (`NUM-16`).
- **Dado** la opción activada sin coordenadas, **cuando** se mira el dibujo, **entonces** no hay
  guías y el panel pide la X y la Z del centro (`NUM-17`).
- **Dado** la opción desactivada, **cuando** se mira el dibujo, **entonces** es idéntico al de antes
  de este cambio, píxel a píxel (`NUM-17`).
- **Dado** guías visibles con marcas hechas, **cuando** se cambian las coordenadas o se desactiva la
  opción, **entonces** las marcas siguen intactas y no sale ningún aviso (`NUM-17`).
- **Dado** un `mc-formas-v1` guardado antes de este cambio, **cuando** se carga, **entonces** todo
  se recupera igual y la opción empieza desactivada (`NUM-17`).
- **Dado** el móvil (390 px), **cuando** se activa la casilla, **entonces** los dos campos caben,
  tienen etiqueta y miden al menos 44 px (`INT-12`).
- **Dado** guías visibles, **cuando** se exporta el PNG de una capa, **entonces** la imagen las
  lleva, como lleva las demás opciones de vista (`NUM-16`).

## Decisiones tomadas al aclarar

- 2026-11-08: las guías se alinean a las coordenadas del mundo a partir de la X y la Z del bloque
  central, que el jugador lee con F3. Se descartó contarlas desde el borde del dibujo: no coincide
  con los chunks reales, que es lo que pide el motivo (granjas, redstone).
- 2026-11-08: se activan con una casilla en «Vista», como las demás opciones, y al activarla
  aparecen los campos de coordenadas. Así se pueden ocultar sin borrar los números.
- 2026-11-08: la guía tiene color propio y 2 px de grosor: se distingue de la línea cada 5 por las dos
  cosas, no solo por el color (constitución, principio 7).

## Detalles propuestos al redactar (revisar antes de aprobar)

- Con tamaño par el centro es un 2×2 (FOR-06): la coordenada que se pide es la del bloque de arriba
  a la izquierda de ese 2×2. Es una convención; la ayuda del campo lo dirá.
- La X crece hacia la derecha y la Z hacia abajo del dibujo (norte arriba, como el mapa del juego).
- Las guías salen también en el PNG exportado cuando están activas.
- Las coordenadas son una opción de vista: no viajan en el enlace ni en el archivo de proyecto. Si
  se quisieran compartir, sería otra propuesta.

## Preguntas abiertas

Ninguna.
