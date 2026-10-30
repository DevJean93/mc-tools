# Área · Marcas

Código: `MAR`

## Propósito

Registra qué bloques ya se construyeron, permite deshacer y rehacer, y conserva el progreso
entre sesiones. Incluye la firma de geometría, la validación de lo guardado y los avisos
cuando el navegador no puede guardar.

## Requisitos

### MAR-01

Se marcan y desmarcan bloques reales de la forma. Marcar fuera de un bloque no hace nada;
la operación devuelve si cambió algo. El dibujo ve el conjunto vivo de marcas.

### MAR-02

Se pueden marcar o desmarcar todas las capas de golpe. La cuenta incluye solo los bloques
que cambian y el reparto por capa usa el índice de capa.

### MAR-03

La instantánea de las marcas se puede restaurar y es una copia: modificarla no altera las
marcas vivas.

### MAR-04

Deshacer y rehacer funcionan con un límite de 50 pasos (configurable). Una acción nueva
descarta lo que había para rehacer, y una acción que no cambia nada no ocupa historial.

### MAR-05

Las marcas se guardan asociadas a la firma de geometría y se recuperan al arrancar. Un
cambio real de geometría las limpia con un aviso que ofrece Deshacer; el zoom y las opciones
de vista no las tocan.

### MAR-06

Al cargar se descartan las celdas que no son bloque o que no existen. Marcas corruptas o con
formato raro no rompen la carga: se empieza sin marcas.

### MAR-07

La firma solo cambia con la geometría: forma, tamaño, modo y grosor, más la variante y la
orientación que declara la forma. Los valores de referencia de las marcas guardadas siguen
siendo válidos.

### MAR-08

El almacén nunca lanza y distingue los casos: si no se puede leer no hay nada que recuperar;
si solo falla la escritura se sigue leyendo; un almacén lleno es persistente y avisa al
primer guardado fallido; una cuota 0 o un permiso denegado no son persistentes.

### MAR-09

La nota fija de almacenamiento aparece desde el arranque si el navegador bloquea el guardado,
y al primer fallo si está lleno; se quita al volver a guardar. Es `role=status`, lleva icono,
sigue visible pasados los 5 s de un aviso temporal y no la tapa el aviso de grosor recortado.

### MAR-10

Los parámetros guardados se validan al cargar: los valores fuera de rango se recortan, los de
otro tipo se descartan y un JSON corrupto arranca con los valores por defecto. Guardar
informa si el almacén no escribe.

### MAR-11

Con el almacenamiento lleno se sigue recuperando el progreso guardado y la app no dice que el
navegador lo bloquea.

### MAR-12

Se marca arrastrando y se desmarca con clic derecho; el contador de progreso refleja cada
cambio. El teclado también marca la celda activa.

### MAR-13

La capa actual se recorta al rango válido y se guarda entre sesiones.

### MAR-14

Tocar o hacer clic en la banda de una fila de la regla izquierda —aunque ese número no se vea
con poco zoom— alterna toda la fila de la capa actual. Si todos sus bloques estaban
construidos, los desmarca; si no, los marca todos. Con el dibujo desplazado vale lo mismo con la
regla izquierda **fija**: la banda es la que se ve y la fila es la de ese punto del dibujo. Un
toque en la regla fija nunca marca el bloque que queda debajo.

### MAR-15

Lo mismo con la banda de una columna en la regla superior, también con la regla superior fija
cuando el dibujo está desplazado: alterna toda la columna. La esquina entre las dos reglas no
hace nada.

### MAR-16

Marcar una fila o columna es un solo paso de deshacer. Sale un aviso con el número de
bloques, la fila o columna y el botón «Deshacer». Los lectores de pantalla anuncian «Fila 3:
7 bloques marcados».

### MAR-17

Con el dibujo enfocado, `F` alterna la fila del cursor y `C` su columna.

### MAR-18

Una fila o columna sin bloques no cambia nada ni ocupa historial; se anuncia «La fila N no
tiene bloques». Tocar la esquina entre las dos reglas o los márgenes de la derecha y de abajo
no hace nada.

## Casos límite

- Un almacén que lanza al leer equivale a no tener nada guardado.
- Marcas de otra firma se ignoran por completo.
- Capa guardada fuera de rango: se limita al generar.
- Un trazo de arrastre completo ocupa un solo paso de historial.
- Con poco zoom la banda de una fila o columna mide menos de 24 px y su número no se ve; la
  zona sensible sigue siendo toda la banda.

## Fuera de alcance

- Generar la geometría (área FOR).
- La tabla de materiales y el porcentaje (área MAT).
- El desplazamiento y el pellizco táctiles (área TAC).

## Decisiones

- 2026-10-29: las marcas se guardan por geometría, no por forma suelta; así cambiar de forma
  no mezcla progreso y volver a la anterior lo recupera.
- 2026-10-29: la firma ocupa huecos fijos para variante y orientación. Añadir una forma no
  cambia las firmas ya guardadas.
- 2026-10-29: si el almacén solo está lleno se sigue leyendo el progreso (antes se perdía y
  la app decía que estaba bloqueado). La distinción lleno/bloqueado se hace probando lectura
  y escritura al crear el almacén.
- 2026-10-29: no se finge un almacén en memoria cuando el navegador bloquea: se avisa con una
  nota fija y la app sigue funcionando.
- 2026-10-29: el historial guarda instantáneas opacas y un trazo de arrastre es un solo paso.
- 2026-10-29: marcar filas y columnas se hace desde la regla, no con un botón ni un modo: en
  móvil no hay sitio para más botones y la regla ya está a la vista. La zona sensible es toda
  la banda de la fila o columna —no solo el número— porque con poco zoom el número se oculta.
- 2026-10-29: el toque en el margen solo cuenta como marca si el dedo se movió 10 px o menos;
  así el mismo borde sirve para empezar a desplazar el dibujo.
- 2026-10-29: una fila o columna se alterna como una unidad (si estaba entera, se desmarca) y
  ocupa un solo paso de historial, para que `Ctrl+Z` devuelva el estado anterior de golpe.
- 2026-10-29: `F` y `C` son la alternativa de teclado porque la banda mide menos de 24 px con
  poco zoom y no todo el mundo puede tocar con precisión.
- 2026-10-29: los márgenes derecho e inferior pertenecen a los tramos y no a la regla, y la
  esquina entre las dos reglas no marca nada: evita gestos accidentales.
- 2026-10-29: el desplazamiento y el pellizco siguen siendo del área TAC; marcar una línea con
  el dedo es de MAR, porque cambia las marcas y no la vista.
- 2026-10-29: con las reglas fijas, una fila o columna que queda oculta bajo la otra regla no se
  puede tocar, y el cursor del teclado se desplaza para no quedar tapado (cambio 005).
