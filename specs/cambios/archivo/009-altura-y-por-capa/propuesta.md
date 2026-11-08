# 009 · Altura Y de cada capa en las formas 3D

## Estado

Hecha

## Motivo

En una esfera o cúpula cada capa es un nivel de altura, y al construir se trabaja con la
coordenada Y del juego (la que se ve con F3). Hoy las capas se numeran 1..N desde la base, y
quien construye tiene que sumar a mano la altura de su suelo en cada capa. Idea de la auditoría
inicial.

## Áreas afectadas

- `NUM` (numeración)
- `INT` (interfaz): el campo «Y de la base»

## Delta

### Añade

- `NUM-18`: en las formas 3D (esfera y cúpula), con la Y de la base escrita, cada capa muestra su
  altura: la Y de la base más el número de capa menos uno. La capa 1 es siempre la base, también en
  la cúpula (su capa 1 es la que se apoya en el suelo). La altura se ve en los tres sitios donde ya
  aparece el número de capa:
  - el texto de la capa sobre el dibujo: «Capa 3 de 11 · Y 66» («Capa 1 de 11 (base) · Y 64»);
  - la tabla por capas, con una columna «Y»;
  - la cabecera del PNG exportado: «Capa 3 de 11 · Y 66 · …».
  Ejemplo: esfera de 11 con la base en Y = 64 → la capa 3 está en Y = 66 y la 11 en Y = 74; con la
  base en Y = −60, la capa 1 está en −60 y la 11 en −50.
- `NUM-19`: con la Y de la base vacía todo se ve como hoy (solo el número de capa, sin columna Y). En
  las formas 2D (una sola capa) no se muestra ninguna altura aunque haya una guardada. La Y de la base
  es una opción de vista: no cambia la forma, la firma de las marcas ni las marcas, cambiarla no saca
  avisos, y no viaja en el enlace (FOR-16) ni en el archivo de proyecto (MAR-19). Se guarda en el
  navegador con las demás opciones de vista; un estado guardado antes de este cambio carga igual, sin
  altura. Es un entero de −30 000 000 a 30 000 000 (mismas reglas que las coordenadas de las guías de
  chunk): se redondea, se recorta, y un texto o un campo vacío es «sin altura».
- `INT-13`: en «Forma», solo con esfera o cúpula, hay un campo numérico opcional «Y de la base», con
  etiqueta visible, texto de 16 px y objetivo táctil de 44 px en móvil, que admite negativos (en el
  juego la Y llega a −64). Una ayuda corta dice que es la altura de la capa 1 (la que se apoya en el
  suelo). Se recuerda al recargar.

### Modifica

Nada. La Y de la base se guarda dentro de `mc-formas-v1` como un campo nuevo con valor por defecto
(sin altura) cuando falta, así que lo ya guardado sigue cargando igual; un test con una cadena de
referencia lo comprueba. La firma de las marcas no cambia.

### Retira

Nada.

## Criterios de aceptación

- **Dado** una esfera de 11 con la base en Y = 64, **cuando** se mira la capa 3, **entonces** el texto
  dice «Capa 3 de 11 · Y 66», la tabla tiene la columna Y con 64 … 74 y el PNG de esa capa lleva
  «Y 66» en la cabecera (`NUM-18`).
- **Dado** una cúpula de 16 con la base en Y = 70, **cuando** se mira su capa 1, **entonces** está en
  Y = 70 (`NUM-18`).
- **Dado** una base negativa (Y = −60), **cuando** se mira la capa 5, **entonces** está en Y = −56
  (`NUM-18`).
- **Dado** la Y de la base vacía, **cuando** se mira una capa, **entonces** el texto, la tabla y el PNG
  son exactamente como hoy (`NUM-19`).
- **Dado** un círculo (2D) con una Y guardada, **cuando** se mira, **entonces** no hay campo ni altura
  (`NUM-19`, `INT-13`).
- **Dado** marcas hechas, **cuando** se cambia la Y de la base, **entonces** las marcas siguen y no sale
  ningún aviso (`NUM-19`).
- **Dado** un `mc-formas-v1` guardado antes de este cambio, **cuando** se carga, **entonces** todo se
  recupera igual y sin altura (`NUM-19`).
- **Dado** el móvil (390 px) con una esfera, **cuando** se abre «Forma», **entonces** el campo «Y de la
  base» cabe, tiene etiqueta y mide al menos 44 px (`INT-13`).

## Decisiones tomadas al aclarar

- 2026-11-08: la Y de la base es un campo opcional; vacío, todo queda como hoy. Se descartó que siempre
  tuviera un valor: quien no la necesita vería una altura que no ha pedido y que puede estar mal.
- 2026-11-08: la altura se ve en los tres sitios donde ya está el número de capa (texto de la capa,
  tabla por capas y PNG), sin sitios nuevos; el PNG es lo que se lleva al juego.
- 2026-11-08: en la cúpula la base es su propia capa 1 (la que se apoya en el suelo), igual que en la
  esfera. Se descartó pedir la base de la esfera completa: solo sirve para cúpulas sobre una esfera ya
  hecha y confunde en el caso normal.
- 2026-11-08: se guarda en el navegador como las coordenadas de las guías de chunk (cambio 008) y no
  viaja en el enlace ni en el archivo de proyecto: llevarla obligaría a una versión 2 del archivo con
  migración, y entonces lo lógico sería llevar también la X y la Z de las guías. Puede ser otra
  propuesta.

## Detalles propuestos al redactar (revisar antes de aprobar)

- El campo va en «Forma», junto a la variante 3D, y solo aparece con esfera o cúpula.
- No se avisa si la forma supera el límite de construcción del juego (Y 319): las versiones del juego
  y las dimensiones tienen límites distintos. Si hiciera falta, sería otra propuesta.
- Los lectores de pantalla, que ya anuncian «Capa 3 de 11: …», anuncian también la altura.

## Preguntas abiertas

Ninguna.
