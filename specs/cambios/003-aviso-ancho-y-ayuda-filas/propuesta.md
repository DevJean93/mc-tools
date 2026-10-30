# 003 · Aviso con el ancho disponible y ayuda para filas finas

## Estado

Aprobada

## Motivo

Al validar la propuesta 002 en móvil, el aviso «Marcados 16 bloques de la fila 11» salía en una
columna estrecha de 5 líneas que tapaba la ayuda. El aviso se centra con `left: 50%`, así que el
navegador solo le deja la mitad derecha de la pantalla; pasaba desde la primera versión, pero con
los mensajes de filas y columnas, más largos, se nota mucho más.

Además, con el zoom con el que abre el móvil cada fila de la regla mide 15 px de alto, menos que
un dedo (WCAG 2.2 pide 24 px como mínimo para un objetivo). Marcar bloque a bloque sigue siendo el
control equivalente, pero la ayuda debe decir que conviene acercar el zoom si la fila es fina.

El usuario aprobó corregir los dos puntos el 29/10/2026.

## Áreas afectadas

- `INT` (Interfaz)

## Delta

### Añade

- `INT-08`: Los avisos temporales aparecen centrados abajo y usan el ancho disponible: en móvil,
  todo el ancho de la pantalla menos 16 px a cada lado; en escritorio, como mucho unos 60
  caracteres por línea. Ejemplo: en un móvil de 375 px, «Marcados 16 bloques de la fila 8.» con
  su botón «Deshacer» ocupa como mucho dos líneas.

### Modifica

- `INT-07`:
  - antes: la ayuda táctil y la de ratón explican el gesto de marcar una fila o columna entera,
    y la de teclado dice que `F` alterna la fila y `C` la columna.
  - después: además, la ayuda táctil sugiere acercar el zoom si las filas se ven finas
    («si la fila es fina, acércate antes de tocarla»).

### Retira

Nada.

## Criterios de aceptación

- **Dado** un móvil de 375 px, **cuando** se marca una fila tocando su número, **entonces** el
  aviso queda centrado, dentro de la pantalla y su texto ocupa como mucho dos líneas (`INT-08`).
- **Dado** el escritorio, **cuando** sale el aviso de una fila, **entonces** queda centrado y no
  pasa de unos 60 caracteres de ancho (`INT-08`).
- **Dado** un dispositivo táctil, **cuando** se lee la ayuda del lienzo, **entonces** dice que se
  acerque el zoom si la fila es fina (`INT-07`).

## Preguntas abiertas

Ninguna.
