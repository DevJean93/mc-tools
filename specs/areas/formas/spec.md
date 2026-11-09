# Área · Formas

Código: `FOR`

## Propósito

Genera la geometría de la forma elegida, en 2D o en 3D, sólida o hueca, y ofrece un
registro abierto para añadir formas sin tocar el resto de la app. Es la base de la cuenta
de materiales y del dibujo.

## Requisitos

### FOR-01

La app genera formas 2D —círculo/óvalo, cuadrado/rectángulo, triángulo, rombo y hexágono—
con ancho y alto de 1 a 200 bloques.

Ejemplo: círculo de 16×16 → 208 bloques, simétrico en ambos ejes.

### FOR-02

La app genera formas 3D —esfera y cúpula— con diámetro de 1 a 100, una capa por nivel
vertical; la capa 1 es la base. El total de cada capa coincide con sus bloques.

Ejemplo: esfera de 16 → 2176 bloques en 16 capas; una esfera nueva de 3D genera una capa
por nivel y usa el máximo 3D.

### FOR-03

El modo sólido llena la forma y el modo hueco deja solo el borde. El hueco siempre es un
subconjunto del sólido: ninguna celda hueca cae fuera de la forma llena.

Ejemplo: círculo 16 hueco con grosor 2 → 84 bloques.

### FOR-04

En modo hueco, el grosor del borde se limita al máximo que aún deja interior. Si se pide
más, se recorta al máximo y se avisa.

Ejemplo: círculo 16 con grosor 50 → se recorta a 7 y no devuelve el sólido.

### FOR-05

La cúpula es exactamente la mitad superior de la esfera del mismo diámetro.

Ejemplo: esfera 16 → 16 capas; cúpula 16 → las 8 capas de arriba.

### FOR-06

El centro de la forma es de 2×2 bloques cuando el tamaño es par y de 1×1 cuando es impar.

Ejemplo: círculo 16 → centro en (7,7), (7,8), (8,7) y (8,8); círculo 15 → centro en (7,7).

### FOR-07

Los tamaños degenerados (1×1, 2×2, 3×3, esfera de 1) no fallan y respetan el marco pedido.

### FOR-08

Los parámetros inválidos se recortan al límite o fallan con un mensaje claro; una forma
desconocida da «Forma desconocida» y un ancho no numérico da un error de ancho.

### FOR-09

El registro de formas es abierto: registrar una forma nueva la hace disponible en toda la
app (selector, validación, geometría y firma) sin tocar `estado.js` ni `app.js`.

### FOR-10

Cada forma declara sus propias variantes y orientaciones. Una variante u orientación solo
vale para la forma que la declara; en las demás se descarta y se cae en la primera.

### FOR-11

Toda forma registrada cumple el contrato común: genera al menos un bloque, respeta sus
dimensiones, es simétrica en horizontal y sus totales coinciden con las capas. Una
definición mal formada, vacía o duplicada no se registra.

### FOR-12

El selector de formas sale del registro y conserva su orden. Se construye una vez: escribir
un tamaño no lo reconstruye.

### FOR-13

El hexágono ofrece orientación de lado plano o punta arriba. La elección se recuerda al
volver a la forma y se restaura al recargar; la fila solo aparece en las formas que la
ofrecen.

### FOR-14

La variante 3D (esfera o cúpula) se recuerda y se restaura al recargar. Una variante
guardada que no pertenece a la forma activa cae en la primera de esa forma.

### FOR-15

Los campos numéricos se pueden vaciar para teclear otro número: mientras están vacíos no se
aplica el mínimo ni cambia la forma; al teclear se aplica el valor escrito.

Ejemplo: borrar el ancho y teclear «20» da 20, no 1 ni 2.

### FOR-16

La forma actual se puede expresar como un enlace: la dirección de la app con los parámetros de la
forma en el fragmento (`#`): tipo, ancho, alto, proporción, modo, grosor, variante, orientación y
capa actual. No lleva las marcas, el zoom ni las opciones de vista. Los booleanos van como `1` y `0`.

Ejemplo: `…/mc-tools/#forma=circulo&w=30&h=30&igualar=1&modo=hueco&grosor=2&esfera=esfera&orient=plano&capa=0`.

### FOR-17

Al abrir la app con un enlace de forma, se abre esa forma. Los valores se validan con las mismas
reglas que lo guardado en el navegador: los fuera de rango se recortan y los desconocidos caen en
el valor por defecto de la app (no en lo que hubiera guardado). Un fragmento que no es de forma
(vacío o sin ninguna de sus claves) se ignora y la app arranca como siempre, con el fragmento
intacto. Tras aplicar un enlace, el fragmento se quita de la barra de direcciones para que recargar
no pise los cambios posteriores.

Ejemplo: `#forma=nada&w=999` abre el círculo por defecto con ancho 200.

### FOR-18

Si el enlace abre una forma con otra geometría que la guardada y había marcas, las marcas se borran
como en cualquier cambio de geometría (MAR-05) y sale el aviso «Se abrió la forma del enlace. Tu
progreso anterior se borró.» con «Deshacer», que devuelve de una vez la forma y las marcas
anteriores. Si la geometría es la misma, las marcas se conservan y no hay aviso; si no había marcas,
tampoco. Abrir un enlace ocupa un solo paso de historial, y uno que deja todo igual no ocupa ninguno.

### FOR-19

«Importar de Litematica» abre un `.litematic` descargado por Formas MC y lo convierte en la misma forma
(mismos parámetros) y el mismo bloque. Si cambia la forma y había marcas, se aplica la misma regla que al
abrir un enlace (FOR-18): las marcas se borran y sale el aviso «Se importó la forma del esquema. Tu
progreso anterior se borró.» con «Deshacer», que devuelve de una vez la forma y las marcas; con la misma
geometría las marcas se conservan. Si no se pierde nada, el aviso dice «Esquema importado.». Importar
ocupa un solo paso de historial y no cambia el zoom ni la vista (salvo el bloque, MAT-17). Un archivo que
no es de Litematica, está dañado o no lo hizo Formas MC no cambia nada y muestra un error que dice por
qué: «Este archivo no es un esquema de Litematica o está dañado.» o «Este esquema no lo hizo Formas MC:
solo se pueden importar los descargados desde aquí.» (también si, con el autor de Formas MC, faltan los
datos de la forma o su bloque no es de la lista).

## Casos límite

- 2D en el máximo: círculo 200 → 31 428 bloques; hexágono 200 plano → 30 000.
- 3D en el máximo: esfera Ø100 hueca con grosor 50 se genera en menos de 300 ms.
- Rectángulo 10×10 hueco con grosor 1 → 36 bloques.
- Grosor 50 en una forma pequeña se recorta al máximo real (7 en el círculo 16).
- Un enlace con claves repetidas usa la primera; con texto mal codificado o con símbolos no falla y nunca se inserta como HTML.
- Un enlace de una esfera con ancho 150 se recorta a 100.
- Un esquema de otro programa, un archivo sin gzip, un NBT truncado o un archivo vacío no cambian nada y dicen por qué.

## Fuera de alcance

- La numeración de ejes y tramos (área NUM).
- El dibujo en canvas y el zoom (áreas ZOO y NUM).
- La cuenta de materiales (área MAT).

## Decisiones

- 2026-10-29: el registro es abierto (`Formas.registrar`) y valida un contrato mínimo al
  registrar; así una forma nueva aparece sola en selectores, validación y firma.
- 2026-10-29: las variantes y orientaciones las declara cada forma, no una lista central.
  Se descartó mantener listas por id en `estado.js` porque obligaba a tocar dos archivos por
  cada forma nueva.
- 2026-10-29: el hueco se calcula por distancia BFS en una pasada (4-vecinos en 2D,
  6 en 3D) en lugar de erosiones repetidas: mismo resultado y mucho más rápido (esfera Ø100
  hueca de 625 ms a unos 24 ms).
- 2026-10-29: el grosor máximo es la distancia máxima menos 1; si se pide más se recorta y
  se avisa, para que «hueco» nunca sea igual al sólido.
- 2026-10-29: la cúpula se obtiene cortando las capas superiores de la esfera ya generada,
  no con una fórmula aparte.
- 2026-11-08: el enlace lleva solo la forma, no las marcas: es corto y legible y no lo cortan los
  chats. Lo construido se pasa con el archivo de proyecto (cambio 006).
- 2026-11-08: abrir un enlace sustituye con aviso y «Deshacer», el mismo patrón que «Cargar
  proyecto». Se descartó preguntar antes (interrumpe y exige un componente nuevo) y dar prioridad a
  lo guardado (el enlace parecería no funcionar).
- 2026-11-08: lo que falta en un enlace toma el valor por defecto de la app y no lo guardado, para
  que el mismo enlace dé la misma forma en cualquier navegador.
- 2026-11-08: la validación de la forma de un enlace y la de un archivo de proyecto es la misma
  función (`formaValidada`, sobre `Estado.cargar`): ni el navegador, ni el archivo ni el enlace
  pueden validar distinto.
- 2026-11-08: el enlace se aplica después de generar lo guardado y no antes, para que haya un
  estado anterior al que volver con «Deshacer». El coste es generar dos veces al arrancar, solo
  cuando hay enlace.
- 2026-11-08: el fragmento se quita tras aplicarlo para que recargar no deshaga el trabajo hecho
  después. Un cambio de `#` con la app ya abierta (pegar un enlace en la misma pestaña) no recarga
  la página y no se atiende: queda fuera de esta versión.
- 2026-11-08 (cambio 016): solo se importan esquemas descargados por Formas MC (autor «Formas MC» y la
  forma como enlace en la descripción, validada con `Estado.desdeEnlace`; el bloque sale de la paleta).
  Se descartó importar cualquier `.litematic` como forma «libre» (nuevo tipo de forma, firma y límites de
  tamaño: mucho más trabajo; podría ser otra propuesta) y dejar solo la descarga.
- 2026-11-08 (cambio 016): abrir un enlace e importar un esquema comparten `aplicarForma` en el documento
  (misma regla de marcas, mismo paso de historial); cada uno pone su aviso. El bloque es una opción de
  vista: «Deshacer» devuelve la forma y las marcas, pero no el bloque.
