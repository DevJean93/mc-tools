# 002 · Marcar una fila o columna entera tocando su número

## Estado

Aprobada

## Motivo

En móvil y tablet solo se puede marcar bloque a bloque: un toque marca un bloque y arrastrar
con un dedo desplaza el dibujo. En formas grandes, construir una fila supone decenas de
toques. Se quiere marcar de una vez una fila (horizontal) o una columna (vertical) como
construida tocando su número en la regla, y lo mismo con el ratón en escritorio.

## Áreas afectadas

- `MAR` (marcas)
- `INT` (interfaz)

## Delta

### Añade

- `MAR-14`: tocar o hacer clic en la banda de una fila de la regla izquierda —aunque ese
  número no se vea con poco zoom— alterna toda la fila de la capa actual. Si todos sus
  bloques estaban construidos, los desmarca; si no, los marca todos.
- `MAR-15`: lo mismo con la banda de una columna en la regla superior: alterna toda la
  columna.
- `MAR-16`: marcar una fila o columna es un solo paso de deshacer. Sale un aviso con el
  número de bloques, la fila o columna y el botón «Deshacer». Los lectores de pantalla
  anuncian «Fila 3: 7 bloques marcados».
- `MAR-17`: con el dibujo enfocado, `F` alterna la fila del cursor y `C` su columna.
- `MAR-18`: una fila o columna sin bloques no cambia nada ni ocupa historial; se anuncia
  «La fila N no tiene bloques». Tocar la esquina entre las dos reglas o los márgenes de la
  derecha y de abajo no hace nada.
- `INT-07`: la ayuda táctil y la de ratón explican el gesto («toca el número de una fila o
  columna para marcarla entera»).

### Modifica

- Ninguno.

### Retira

- Ninguno.

## Criterios de aceptación

- **Dado** un círculo de 16 con el dibujo despejado, **cuando** se toca el número de la fila
  8 en la regla izquierda, **entonces** se marcan sus 16 bloques y el contador lo refleja
  (`MAR-14`).
- **Dado** la misma fila ya marcada, **cuando** se vuelve a tocar su número, **entonces** se
  desmarca entera (`MAR-14`).
- **Dado** un círculo de 16, **cuando** se toca el número de una columna en la regla
  superior, **entonces** se marca toda la columna (`MAR-15`).
- **Dado** una fila recién marcada, **cuando** se pulsa `Ctrl+Z`, **entonces** vuelve al
  estado anterior en un solo paso (`MAR-16`).
- **Dado** el dibujo enfocado, **cuando** se pulsa `F` o `C`, **entonces** se alterna la fila
  o la columna del cursor y se anuncia el resultado (`MAR-17`).
- **Dado** una fila sin bloques, **cuando** se toca su número, **entonces** no cambia nada,
  no ocupa historial y se anuncia «La fila N no tiene bloques» (`MAR-18`).
- **Dado** la ayuda visible, **cuando** se lee, **entonces** menciona el gesto de marcar una
  fila o columna entera (`INT-07`).

## Preguntas abiertas

Ninguna.
