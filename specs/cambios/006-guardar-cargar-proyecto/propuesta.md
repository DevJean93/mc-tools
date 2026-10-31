# 006 · Guardar y cargar un proyecto en un archivo

## Estado

Borrador

## Motivo

Hoy el progreso vive solo en el navegador de ese equipo (`localStorage`): borrar los datos del
sitio lo elimina, no se puede pasar de un móvil a un ordenador y no hay copia de seguridad. Una
construcción grande puede llevar días y perder las marcas sería muy molesto. Un archivo permitiría
guardar una copia, moverla de dispositivo y recuperarla. Idea de la auditoría inicial.

## Áreas afectadas

- `MAR` (marcas y progreso)

## Delta

### Añade

- Un botón para guardar el proyecto actual (la forma, sus parámetros y lo construido) como un
  archivo descargable, y otro para cargar un archivo guardado y recuperar ese estado. Los IDs de
  los requisitos se asignan al aclarar la propuesta.

### Modifica

Por decidir al aclarar (por ejemplo, si el guardado automático del navegador sigue igual).

### Retira

Nada.

## Criterios de aceptación

- **Dado** una forma con marcas, **cuando** se guarda el proyecto y se carga en otro navegador,
  **entonces** se ve la misma forma con las mismas marcas.
- **Dado** un archivo dañado o de otra aplicación, **cuando** se intenta cargar, **entonces** se
  avisa con un mensaje claro y no se pierde lo que había.
- **Dado** un archivo guardado con una versión anterior de la app, **cuando** se carga, **entonces**
  se abre o se explica por qué no se puede.

## Preguntas abiertas

- `[NECESITA ACLARACIÓN: ¿el archivo incluye las marcas o solo la forma y sus parámetros?]`
- `[NECESITA ACLARACIÓN: ¿al cargar un archivo se sustituye lo que hay en pantalla (con aviso y botón Deshacer) o se pregunta antes?]`
- `[NECESITA ACLARACIÓN: ¿qué se hace con un archivo de otra versión de la app: se rechaza, se migra o se abre lo que se pueda?]`
- `[NECESITA ACLARACIÓN: ¿el guardado automático del navegador se mantiene tal cual o el archivo pasa a ser la copia principal?]`
