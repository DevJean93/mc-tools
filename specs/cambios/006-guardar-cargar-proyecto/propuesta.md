# 006 · Guardar y cargar un proyecto en un archivo

## Estado

En curso

## Motivo

Hoy el progreso vive solo en el navegador de ese equipo (`localStorage`): borrar los datos del
sitio lo elimina, no se puede pasar de un móvil a un ordenador y no hay copia de seguridad. Una
construcción grande puede llevar días y perder las marcas sería muy molesto. Un archivo permite
guardar una copia, moverla de dispositivo y recuperarla; además sigue funcionando cuando el
navegador bloquea el almacenamiento (hoy en ese caso el progreso se pierde al recargar). Idea de
la auditoría inicial.

## Decisiones del usuario (31/10/2026)

- El archivo contiene **la forma y las marcas** (lo construido).
- Al cargar, el archivo **sustituye** lo que hay en pantalla, con aviso y botón **Deshacer**; no
  se pide confirmación antes.
- El archivo lleva un **número de versión**: se abre el de la versión actual y uno más nuevo o que
  no sea de esta app se rechaza con un mensaje claro, sin tocar nada.
- El guardado automático del navegador **se mantiene tal cual**; el archivo es una copia manual.

## Áreas afectadas

- `MAR` (marcas y progreso)
- `INT` (interfaz)

## Delta

### Añade

- `MAR-19`: el proyecto actual se puede guardar como un archivo descargable. El archivo contiene
  el nombre de la aplicación, la versión del formato, los parámetros de la forma (tipo, ancho,
  alto, proporción, modo, grosor, variante, orientación y capa actual) y las marcas en el mismo
  formato compacto que ya usa el navegador. No incluye el zoom ni las opciones de vista, que son
  preferencias de cada dispositivo. El nombre del archivo dice la forma y el tamaño.
- `MAR-20`: un archivo de proyecto se puede cargar. Si es válido, sustituye la forma y las marcas
  actuales, se guarda también en el navegador (para que sobreviva a recargar) y sale un aviso con
  el botón «Deshacer». Deshacer, o `Ctrl+Z`, devuelve de una vez la forma y las marcas anteriores.
- `MAR-21`: un archivo que no es un proyecto de Formas MC (no es JSON o no lleva el nombre de la
  app) o que es de una versión más nueva se rechaza con un mensaje que lo explica, y no cambia
  nada. Los valores de un archivo válido se validan con las mismas reglas que lo guardado en el
  navegador (los fuera de rango se recortan, los desconocidos se descartan). Unas marcas que no
  corresponden a la forma del archivo se descartan y se avisa.
- `MAR-22`: guardar y cargar archivos funciona aunque el navegador bloquee el almacenamiento.
- `INT-09`: el menú tiene dos botones, «Guardar proyecto» y «Cargar proyecto», con texto visible,
  objetivo táctil de 44 px en móvil y nombre accesible. «Cargar proyecto» abre el selector de
  archivos del dispositivo.

### Modifica

Nada: las claves `mc-formas-v1*` y la firma de las marcas no cambian.

### Retira

Nada.

## Criterios de aceptación

- **Dado** una forma con marcas, **cuando** se guarda el proyecto y se carga en otro navegador,
  **entonces** se ve la misma forma con las mismas marcas (`MAR-19`, `MAR-20`).
- **Dado** un proyecto cargado, **cuando** se pulsa «Deshacer», **entonces** vuelven la forma y las
  marcas que había antes, en un solo paso (`MAR-20`).
- **Dado** un archivo que no es un proyecto de Formas MC, **cuando** se intenta cargar, **entonces**
  se avisa «No es un proyecto de Formas MC.» y no cambia nada (`MAR-21`).
- **Dado** un archivo de una versión más nueva que la de la app, **cuando** se intenta cargar,
  **entonces** se avisa de que es más nuevo y que hay que actualizar, y no cambia nada (`MAR-21`).
- **Dado** un archivo con un tamaño fuera de los límites, **cuando** se carga, **entonces** se
  recorta como lo guardado en el navegador (`MAR-21`).
- **Dado** un archivo con marcas que no corresponden a su forma, **cuando** se carga, **entonces**
  se abre la forma sin esas marcas y se avisa (`MAR-21`).
- **Dado** el almacenamiento del navegador bloqueado, **cuando** se guarda y se carga un proyecto,
  **entonces** funciona y la nota fija de almacenamiento sigue visible (`MAR-22`).
- **Dado** un móvil de 390 px, **cuando** se abre el menú, **entonces** los dos botones se ven,
  caben en la pantalla y se pueden pulsar con el dedo (`INT-09`).

## Preguntas abiertas

Ninguna.
