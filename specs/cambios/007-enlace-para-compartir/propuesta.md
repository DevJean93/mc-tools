# 007 · Enlace para compartir una forma

## Estado

Borrador

## Motivo

Para enseñar a otra persona la forma que se ha planificado hay que decirle los parámetros uno a
uno (tipo, tamaño, modo, grosor, orientación). Un enlace con esos parámetros en la dirección
permitiría abrir la misma forma con un clic, y también guardarla como favorito. Idea de la
auditoría inicial.

## Áreas afectadas

- `FOR` (formas)

## Delta

### Añade

- Un botón «Copiar enlace» que deja en el portapapeles una dirección que, al abrirla, muestra la
  misma forma con los mismos parámetros. Los IDs de los requisitos se asignan al aclarar la
  propuesta.

### Modifica

Por decidir al aclarar: qué tiene prioridad al abrir la app, el enlace o lo que había guardado.

### Retira

Nada.

## Criterios de aceptación

- **Dado** una forma configurada, **cuando** se copia el enlace y se abre en otro navegador,
  **entonces** aparece la misma forma con los mismos parámetros.
- **Dado** un enlace con parámetros no válidos (un tamaño enorme, una forma que no existe),
  **cuando** se abre, **entonces** la app arranca con valores válidos y no falla.
- **Dado** un enlace abierto, **cuando** había progreso guardado de otra forma, **entonces** no se
  pierde sin avisar.

## Preguntas abiertas

- `[NECESITA ACLARACIÓN: ¿el enlace incluye también las marcas de lo construido? Pueden ser muchas y alargarían mucho la dirección.]`
- `[NECESITA ACLARACIÓN: al abrir un enlace, ¿se sustituye la forma y las marcas guardadas, o se avisa y se deja elegir?]`
- `[NECESITA ACLARACIÓN: ¿basta un botón «Copiar enlace» o la dirección debe ir actualizándose sola mientras se cambian los parámetros?]`
