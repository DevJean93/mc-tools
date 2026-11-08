# 016 · Exportar e importar archivos de Litematica

## Estado

Borrador

## Motivo

Mucha gente construye en el juego con el mod Litematica: carga un esquema (`.litematic`) y el mod
muestra un holograma de los bloques que faltan, capa a capa. Hoy Formas MC solo da el plano numerado
(en pantalla, PNG o ficha) y hay que copiarlo a mano bloque a bloque. Poder descargar la forma como
`.litematic` evita ese paso y los errores al contar.

En sentido contrario, importar un `.litematic` permitiría seguir en Formas MC la construcción de un
esquema que ya se tiene (numerado y con marcas), o recuperar una forma exportada antes.

## Áreas afectadas

- `MAT` (materiales y exportación): la descarga del archivo de Litematica.
- `FOR` (formas): lo que se obtiene al importar un archivo.
- `INT` (interfaz): los botones de descargar e importar.

## Delta

### Añade

- `MAT-15`: «Descargar para Litematica» descarga la forma actual como un archivo `.litematic` que el
  mod Litematica carga sin errores. Contiene todas las capas de la forma, una por altura (la capa 1
  abajo), con un bloque por cada bloque de la forma y aire en el resto. El nombre del archivo sigue la
  regla del PNG (`MAT-07`) sin la parte de la capa, y el nombre del esquema dentro del archivo es el de
  la forma con sus dimensiones.
- `MAT-16`: el esquema exportado lleva la forma entera, sin tener en cuenta las marcas de lo
  construido, y no cambia la forma, las marcas ni las opciones de vista de la app.
- `FOR-19`: «Importar de Litematica» abre un archivo `.litematic` y lo convierte en la forma actual
  (alcance exacto pendiente de aclarar). Un archivo que no es de Litematica, está dañado o es de un
  tamaño que la app no admite no cambia nada y muestra un error que dice por qué.
- `INT-15`: los dos botones van en la interfaz junto a las demás acciones de exportar y de proyecto,
  con icono, texto visible, nombre accesible y 44 px en móvil.

### Modifica

Nada.

### Retira

Nada.

## Criterios de aceptación

- **Dado** una esfera de 11 sólida, **cuando** se descarga para Litematica y se carga en el juego con
  el mod, **entonces** el holograma tiene 11 capas y los mismos bloques en cada capa que el dibujo de
  la app (`MAT-15`).
- **Dado** un círculo de 16 (una capa), **cuando** se descarga, **entonces** el esquema mide 16 × 1 ×
  16 y tiene 208 bloques (`MAT-15`).
- **Dado** una forma con marcas hechas, **cuando** se descarga, **entonces** el esquema tiene la forma
  entera y la app sigue con sus marcas (`MAT-16`).
- **Dado** un archivo descargado por Formas MC, **cuando** se importa, **entonces** se obtiene la misma
  forma (`FOR-19`).
- **Dado** un archivo que no es de Litematica, **cuando** se importa, **entonces** la forma no cambia y
  sale un error claro (`FOR-19`).
- **Dado** el móvil (390 px), **cuando** se abren los controles, **entonces** los dos botones caben y
  miden al menos 44 px (`INT-15`).

## Preguntas abiertas

- `[NECESITA ACLARACIÓN: ¿Qué se puede importar? (a) solo archivos descargados por Formas MC, que vuelven a ser la misma forma con sus parámetros; (b) cualquier .litematic, convertido en una forma «libre» capa a capa que se numera y se marca como las demás (no se puede cambiar de tamaño ni de modo, y es mucho más trabajo); o (c) por ahora solo exportar.]`
- `[NECESITA ACLARACIÓN: ¿Qué bloque lleva el esquema? Un bloque fijo (p. ej. piedra o lana blanca), uno que se elige en la app de una lista corta, o el que salga de la propuesta 011 (varios materiales).]`
- `[NECESITA ACLARACIÓN: ¿Para qué versión de Minecraft? El archivo indica la versión de los datos: una fija reciente (p. ej. 1.21), o un selector de versión.]`
- `[NECESITA ACLARACIÓN: ¿Dónde van los botones: en «Vista», con «PNG de la capa» e «Imprimir ficha», o en «Proyecto», con «Guardar» y «Cargar proyecto»?]`
- `[NECESITA ACLARACIÓN: ¿Se usa la Y de la base (NUM-18) como altura de origen del esquema, o el esquema no lleva posición y se coloca en el juego donde se quiera (lo habitual en Litematica)?]`
