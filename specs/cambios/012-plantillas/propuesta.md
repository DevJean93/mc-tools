# 012 · Formas guardadas como plantillas

## Estado

Borrador

## Motivo

Quien construye con frecuencia las mismas cosas (una torre redonda de 12, una cúpula de 30) tiene
que volver a elegir tipo, tamaño, modo y grosor cada vez. Guardar una configuración con un nombre
permitiría recuperarla con un clic. Idea de la auditoría inicial.

## Áreas afectadas

- `FOR` (formas)

## Delta

### Añade

- La posibilidad de guardar la configuración actual de la forma con un nombre y de aplicarla más
  tarde desde una lista. Los IDs de los requisitos se asignan al aclarar la propuesta.

### Modifica

Por decidir al aclarar: dónde aparece la lista en el panel «Forma».

### Retira

Nada.

## Criterios de aceptación

- **Dado** una forma configurada, **cuando** se guarda como plantilla con un nombre, **entonces**
  aparece en la lista.
- **Dado** una plantilla guardada, **cuando** se aplica, **entonces** los parámetros de la forma
  pasan a ser los de la plantilla, con el mismo aviso y botón Deshacer que ante cualquier cambio de
  forma con marcas.
- **Dado** una plantilla que ya no se quiere, **cuando** se borra, **entonces** desaparece de la
  lista y no afecta a lo que hay en pantalla.

## Preguntas abiertas

- `[NECESITA ACLARACIÓN: ¿la plantilla guarda solo los parámetros de la forma o también las marcas de lo construido?]`
- `[NECESITA ACLARACIÓN: ¿dónde se guardan: en el navegador, o también dentro del archivo de proyecto de la propuesta 006?]`
- `[NECESITA ACLARACIÓN: ¿se pueden renombrar y borrar, y hay un máximo de plantillas?]`
