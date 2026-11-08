# 010 · Ficha imprimible de la forma

## Estado

Hecha

## Motivo

Mucha gente construye con el plano en papel o en otra pantalla, no con la app abierta. Hoy se puede
exportar una imagen por capa, pero no hay una ficha lista para imprimir que reúna la forma
numerada y la lista de materiales. Idea de la auditoría inicial.

## Áreas afectadas

- `MAT` (materiales y exportación)
- `INT` (interfaz): el botón «Imprimir ficha»

## Delta

### Añade

- `MAT-11`: el botón «Imprimir ficha» abre el diálogo de impresión del navegador con una ficha
  preparada solo para papel: en pantalla la app no cambia y en el papel no salen los controles.
  - La primera página lleva el nombre, las dimensiones y el modo de la forma y sus materiales
    (bloques, stacks, shulker boxes y cofres dobles). En 3D lleva además la tabla por capas, con la
    columna Y si hay Y de la base (NUM-18).
  - Después hay una página por capa con su dibujo numerado y su cabecera, la misma que el PNG: capa,
    Y si la hay y bloques.
  - En 2D todo cabe en una página.
  - El dibujo usa las opciones de vista actuales (reglas, tramos, guías de chunk…), igual que el PNG.
  - Desde el diálogo se puede imprimir o elegir «Guardar como PDF».
- `MAT-12`: la ficha es la forma limpia: no lleva las marcas de lo construido, y los materiales son
  el total necesario, no lo que falta. Cada dibujo ocupa lo máximo que cabe en la página que se
  elija en el diálogo (tamaño y orientación), sin deformarse ni cortarse.
- `MAT-13`: si alguna capa mide más de 60 bloques de ancho o de alto, antes de abrir el diálogo sale
  un aviso: la ficha se imprime igual, pero en un A4 sus cifras no se leerán (quedarían menos de 3 mm
  por bloque); para imprimir legible, mejor el PNG por capa.
- `INT-14`: el botón «Imprimir ficha» va en «Vista», junto a los de exportar: ocupa todo el ancho
  bajo «PNG de la capa» y «Todas las capas». Lleva un icono de impresora de contorno, texto visible y
  nombre accesible, y mide 44 px en móvil.

### Modifica

Nada. La exportación PNG sigue igual y su dibujo (`Render.dibujar` con cabecera) se reutiliza para
la ficha.

### Retira

Nada.

## Criterios de aceptación

- **Dado** un círculo (2D), **cuando** se pide la ficha, **entonces** sale una sola página con el
  dibujo numerado y los materiales (`MAT-11`).
- **Dado** una esfera de 11, **cuando** se pide la ficha, **entonces** salen 12 páginas: la primera
  con la forma, los materiales y la tabla por capas, y una por cada capa (`MAT-11`).
- **Dado** una forma con marcas hechas, **cuando** se pide la ficha, **entonces** el dibujo sale sin
  marcas y los materiales son el total (`MAT-12`).
- **Dado** una esfera de 11 con la base en Y = 64, **cuando** se pide la ficha, **entonces** la tabla
  lleva la columna Y y la cabecera de la capa 3 dice «Y 66» (`MAT-11`).
- **Dado** un papel cualquiera elegido en el diálogo (A4 vertical, Carta horizontal…), **cuando** se
  imprime, **entonces** cada dibujo cabe en su página sin cortarse ni deformarse (`MAT-12`).
- **Dado** un círculo de 120, **cuando** se pide la ficha, **entonces** sale el aviso antes del
  diálogo y la ficha se genera igual (`MAT-13`).
- **Dado** la app en pantalla, **cuando** se ha pedido la ficha, **entonces** en pantalla no cambia
  nada (`MAT-11`).
- **Dado** el móvil (390 px), **cuando** se abre «Vista», **entonces** el botón cabe y mide al menos
  44 px (`INT-14`).

## Decisiones tomadas al aclarar

- 2026-11-08: la ficha se hace con el diálogo de impresión del navegador, que también permite
  guardarla como PDF. Funciona con doble clic y en móvil sin dependencias. Se descartó generar un PDF
  propio (exigiría una dependencia y enmendar la constitución) y una sola imagen PNG grande (al
  imprimirla, el tamaño y los márgenes los decidiría el visor).
- 2026-11-08: en 3D va una capa por página, para que cada dibujo salga lo más grande posible. Se
  descartó poner varias capas por página porque las capas grandes quedarían pequeñas, y solo la capa
  actual porque obligaría a imprimir varias veces.
- 2026-11-08: la ficha es la forma limpia, sin lo construido: el papel sirve para ir tachando a mano.
- 2026-11-08: el tamaño de papel no se elige en la app; la ficha se adapta al que se elija en el
  diálogo. Un selector propio tendría que coincidir con el del diálogo.
- 2026-11-08: las capas muy grandes se encogen igualmente y se avisa antes de imprimir. Se descartó
  partirlas en varias hojas, que es mucho más complejo de hacer y de probar; si hiciera falta, sería
  otra propuesta.

## Detalles propuestos al redactar (revisar antes de aprobar)

- El umbral es de 60 bloques: un A4 vertical deja unos 180 mm útiles, y a menos de 3 mm por bloque
  las cifras no se leen.
- El botón va en «Vista», con los de exportar, porque imprimir es otra forma de exportar.
- El dibujo de la ficha usa las opciones de vista actuales, igual que el PNG.
- En el E2E la impresión se prueba con la emulación de medios de impresión (sin papel).
- Una esfera de 100 da 100 páginas de imagen: en el plan se vigilará la memoria y el tiempo.

## Preguntas abiertas

Ninguna.
