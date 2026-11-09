# 012 · Formas guardadas como plantillas

## Estado

Hecha

## Motivo

Quien construye con frecuencia las mismas cosas (una torre redonda de 12, una cúpula de 30) tiene
que volver a elegir tipo, tamaño, modo y grosor cada vez. Guardar una configuración con un nombre
permitiría recuperarla con un clic. Idea de la auditoría inicial.

## Áreas afectadas

- `FOR` (formas)

## Delta

### Añade

- `FOR-20`: en la sección «Forma» se puede guardar la configuración actual como plantilla con un
  nombre (de 1 a 40 caracteres). La plantilla guarda solo los parámetros: tipo, ancho, alto,
  proporción, modo, grosor, variante, orientación y el reparto de materiales (`MAT-18`); no guarda las
  marcas ni las opciones de vista. Guardar con un nombre que ya existe sustituye esa plantilla.
- `FOR-21`: las plantillas aparecen en una lista en «Forma»; aplicar una cambia la forma a sus
  parámetros con la misma regla que cualquier cambio de forma: si cambia y había marcas, aviso con
  «Deshacer».
- `FOR-22`: una plantilla se puede borrar, con aviso y «Deshacer»; borrarla no cambia lo que hay en
  pantalla. No se renombran. Hay como máximo 20: con 20, guardar una nueva no se puede y se dice por
  qué (sustituir una existente sí).
- `FOR-23`: las plantillas se guardan solo en el navegador, en una clave propia (sin tocar las claves
  `mc-formas-v1*`), y siguen ahí al recargar. Si el navegador no deja guardar, se avisa al guardar.

### Modifica

Nada.

### Retira

Nada.

## Criterios de aceptación

- **Dado** una cúpula de 30 hueca con grosor 2, **cuando** se guarda como «Cúpula grande», **entonces**
  aparece en la lista (`FOR-20`).
- **Dado** una plantilla guardada y otra forma en pantalla con marcas, **cuando** se aplica la
  plantilla, **entonces** la forma pasa a la de la plantilla y sale el aviso con «Deshacer», que
  devuelve la forma y las marcas (`FOR-21`).
- **Dado** una plantilla, **cuando** se borra, **entonces** desaparece de la lista, lo que hay en
  pantalla no cambia y «Deshacer» la recupera (`FOR-22`).
- **Dado** 20 plantillas, **cuando** se intenta guardar otra con un nombre nuevo, **entonces** no se
  guarda y se dice que hay que borrar alguna (`FOR-22`).
- **Dado** plantillas guardadas, **cuando** se recarga la página, **entonces** siguen en la lista
  (`FOR-23`).
- **Dado** el móvil (390 px), **cuando** se abre «Forma», **entonces** la lista y los botones caben y
  miden al menos 44 px (`FOR-21`).

## Decisiones tomadas al aclarar

- 2026-11-08: la plantilla guarda solo los parámetros de la forma (y el reparto de materiales). Las
  marcas son de una construcción concreta: para eso está el archivo de proyecto.
- 2026-11-08: solo en el navegador. Para llevar una forma a otro equipo ya están el enlace y el
  archivo de proyecto. Se descartó exportar la lista de plantillas.
- 2026-11-08: se pueden borrar (con «Deshacer») pero no renombrar, como mucho 20. Se descartaron
  renombrar y un máximo de 50: más interfaz que probar para poco uso.

## Detalles propuestos al redactar (revisar al implementar)

- La lista va al principio de «Forma»: un desplegable «Plantillas» con «Aplicar» y «Borrar», y un
  botón «Guardar como plantilla» que pide el nombre en un campo en línea (sin ventanas emergentes).
- La clave propuesta es `mc-plantillas-v1`.
- Se implementa después de la 011, para guardar también el reparto de materiales.

## Preguntas abiertas

Ninguna.
