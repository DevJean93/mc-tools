# 016 · Exportar e importar archivos de Litematica

## Estado

Aprobada

## Motivo

Mucha gente construye en el juego con el mod Litematica: carga un esquema (`.litematic`) y el mod
muestra un holograma de los bloques que faltan, capa a capa. Hoy Formas MC solo da el plano numerado
(en pantalla, PNG o ficha) y hay que copiarlo a mano bloque a bloque. Poder descargar la forma como
`.litematic` evita ese paso y los errores al contar. Importar un esquema descargado antes permite
recuperar la forma.

## Áreas afectadas

- `MAT` (materiales y exportación): la descarga del archivo de Litematica y el bloque que lleva.
- `FOR` (formas): importar un archivo descargado por Formas MC.
- `INT` (interfaz): los botones y el selector de bloque.

## Delta

### Añade

- `MAT-15`: «Descargar para Litematica» descarga la forma actual como un archivo `.litematic` que el
  mod Litematica carga sin errores en Minecraft 1.21.x. Contiene todas las capas de la forma, una por
  altura (la capa 1 abajo), con un bloque por cada bloque de la forma y aire en el resto, sin posición
  en el mundo (se coloca en el juego con las herramientas del mod). El nombre del archivo sigue la
  regla del PNG (`MAT-07`) sin la parte de la capa, con la extensión `.litematic`, y el nombre del
  esquema dentro del archivo es el de la forma con sus dimensiones.
- `MAT-16`: el esquema lleva la forma entera, sin tener en cuenta las marcas de lo construido.
  Descargarlo no cambia la forma, las marcas, el historial ni las opciones de vista.
- `MAT-17`: el bloque del esquema se elige en una lista corta de bloques comunes del juego (piedra por
  defecto). La elección se recuerda en el navegador como una opción de vista: no entra en la firma de
  las marcas, no cambia la forma y no viaja en el enlace.
- `FOR-19`: «Importar de Litematica» abre un `.litematic` descargado por Formas MC y lo convierte en la
  misma forma (mismos parámetros) y el mismo bloque. Si cambia la forma y había marcas, se aplica la
  misma regla que al abrir un enlace o un proyecto: aviso con «Deshacer». Un archivo que no es de
  Litematica, está dañado o no lo hizo Formas MC no cambia nada y muestra un error que dice por qué
  («Este esquema no lo hizo Formas MC: solo se pueden importar los descargados desde aquí.»).
- `INT-15`: en la sección «Proyecto», junto a «Guardar proyecto», «Cargar proyecto» y «Copiar enlace»,
  van «Descargar para Litematica», «Importar de Litematica» y el selector de bloque, con etiqueta
  visible, icono de contorno, nombre accesible y 44 px en móvil.

### Modifica

Nada.

### Retira

Nada.

## Criterios de aceptación

- **Dado** una esfera de 11 sólida, **cuando** se descarga para Litematica y se carga en el juego con
  el mod, **entonces** el holograma tiene 11 capas y los mismos bloques en cada capa que el dibujo de
  la app (`MAT-15`).
- **Dado** un círculo de 16 (una capa), **cuando** se descarga, **entonces** el esquema mide 16 × 1 ×
  16 y tiene 208 bloques del bloque elegido (`MAT-15`, `MAT-17`).
- **Dado** una forma con marcas hechas, **cuando** se descarga, **entonces** el esquema tiene la forma
  entera y la app sigue con sus marcas (`MAT-16`).
- **Dado** ladrillos elegidos como bloque, **cuando** se recarga la página, **entonces** sigue elegido
  y las marcas no cambian (`MAT-17`).
- **Dado** un archivo descargado por Formas MC, **cuando** se importa, **entonces** se obtiene la misma
  forma con el mismo bloque (`FOR-19`).
- **Dado** un `.litematic` hecho con otro programa o un archivo que no es de Litematica, **cuando** se
  importa, **entonces** la forma no cambia y sale un error claro (`FOR-19`).
- **Dado** el móvil (390 px), **cuando** se abre «Proyecto», **entonces** los botones y el selector
  caben y miden al menos 44 px (`INT-15`).

## Decisiones tomadas al aclarar

- 2026-11-08: solo se importan esquemas descargados por Formas MC, que vuelven a ser la misma forma.
  Se descartó importar cualquier `.litematic` como forma «libre» (nuevo tipo de forma, firma y límites
  de tamaño: mucho más trabajo; podría ser otra propuesta) y dejar solo la descarga.
- 2026-11-08: el bloque se elige en una lista corta, piedra por defecto. Se descartaron un bloque fijo
  y el texto libre (un error de escritura da un esquema que el juego no carga bien).
- 2026-11-08: una versión fija reciente (1.21.x). Se descartó un selector de versión: más que probar
  y mantener.
- 2026-11-08: los botones van en «Proyecto»: son archivos de la forma entera que se guardan y se
  abren, como el proyecto.
- 2026-11-08: el esquema no lleva posición; se coloca en el juego. Se descartó usar la Y de la base,
  que el mod no aplica solo al cargar.

## Detalles propuestos al redactar (revisar al implementar)

- El archivo es NBT comprimido con gzip; el navegador comprime y descomprime gzip de forma nativa,
  así que no hace falta ninguna dependencia nueva (constitución, principio 9). El lector y el escritor
  de NBT son lógica pura, probada con cadenas de referencia.
- Para reconocer un esquema propio al importar, el archivo guarda los parámetros de la forma en sus
  metadatos (autor «Formas MC» y descripción con los parámetros), sin afectar a cómo lo lee el mod.
- Lista inicial de bloques: piedra, ladrillos de piedra, ladrillos, tablones de roble, cristal, lana
  blanca, hormigón blanco y piedra lisa.
- La prueba en el juego con el mod es manual (`[verificación manual]` con motivo); en los tests se
  comprueba el archivo contra una referencia y se vuelve a leer.
- La propuesta 011 (varios materiales) amplía después el esquema a un bloque por zona.

## Preguntas abiertas

Ninguna.
