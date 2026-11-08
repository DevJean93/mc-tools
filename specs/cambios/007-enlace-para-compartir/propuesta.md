# 007 · Enlace para compartir una forma

## Estado

Aprobada

## Motivo

Para enseñar a otra persona la forma que se ha planificado hay que decirle los parámetros uno a
uno (tipo, tamaño, modo, grosor, orientación). Un enlace con esos parámetros en la dirección
permitiría abrir la misma forma con un clic, y también guardarla como favorito. Idea de la
auditoría inicial.

Lo construido no viaja en el enlace: para mover el progreso a otro dispositivo ya está «Guardar
proyecto» (cambio 006).

## Áreas afectadas

- `FOR` (formas)
- `INT` (interfaz)

## Delta

### Añade

- `FOR-16`: la forma actual se puede expresar como un enlace: la dirección de la app con los
  parámetros de la forma en el fragmento (`#`): tipo, ancho, alto, proporción, modo, grosor,
  variante, orientación y capa actual. No lleva las marcas, el zoom ni las opciones de vista.
  Ejemplo: `…/mc-tools/#forma=circulo&w=30&h=30&igualar=1&modo=hueco&grosor=2&capa=0`.
- `FOR-17`: al abrir la app con un enlace de forma, se abre esa forma. Los valores se validan con
  las mismas reglas que lo guardado en el navegador: los fuera de rango se recortan y los
  desconocidos se descartan o caen en el valor por defecto. Un enlace con un fragmento que no es
  de forma (vacío o con otras claves) se ignora y la app arranca como siempre. Después de
  aplicarlo, el fragmento se quita de la barra de direcciones, para que recargar no vuelva a
  pisar los cambios que se hagan después.
  Ejemplo: `#forma=nada&w=999` abre el círculo por defecto con ancho 200.
- `FOR-18`: si el enlace abre una forma con otra geometría que la guardada y había marcas, las
  marcas se borran como en cualquier cambio de geometría (MAR-05) y sale el aviso «Se abrió la
  forma del enlace. Tu progreso anterior se borró.» con «Deshacer», que devuelve la forma y las
  marcas anteriores. Si la geometría es la misma, las marcas se conservan y no hay aviso; si no
  había marcas, tampoco.
- `INT-10`: la sección «Proyecto» del menú tiene un botón «Copiar enlace», con texto visible,
  nombre accesible y objetivo táctil de 44 px en móvil. Copia el enlace de FOR-16 al portapapeles
  y avisa «Enlace copiado.». Si el navegador no deja usar el portapapeles, el aviso muestra el
  enlace seleccionado para copiarlo a mano.

### Modifica

Nada: las claves `mc-formas-v1*` y la firma de las marcas no cambian. El enlace no se guarda; lo
que se guarda al abrirlo es la forma resultante, como cualquier cambio de parámetros.

### Retira

Nada.

## Criterios de aceptación

- **Dado** un círculo hueco de 30 con grosor 2, **cuando** se pulsa «Copiar enlace», **entonces**
  el portapapeles tiene la dirección de la app con `#forma=circulo&w=30…&modo=hueco&grosor=2…` y
  sale «Enlace copiado.».
- **Dado** ese enlace, **cuando** se abre en un navegador sin nada guardado, **entonces** aparece
  el mismo círculo con los mismos parámetros y la barra de direcciones ya no lleva el `#…`.
- **Dado** un enlace con parámetros no válidos (`w=999`, `forma=nada`, `grosor=-3`), **cuando** se
  abre, **entonces** la app arranca con valores válidos y no falla.
- **Dado** un navegador con una esfera de 20 y marcas guardadas, **cuando** se abre el enlace de
  un rombo, **entonces** se ve el rombo sin marcas y el aviso con «Deshacer»; al pulsarlo vuelven
  la esfera y sus marcas.
- **Dado** un navegador con un círculo de 30 y marcas, **cuando** se abre el enlace del mismo
  círculo con otra capa o igual, **entonces** las marcas siguen y no hay aviso.
- **Dado** un navegador sin portapapeles permitido, **cuando** se pulsa «Copiar enlace»,
  **entonces** el enlace se ve seleccionado para copiarlo a mano.
- **Dado** un enlace con un fragmento ajeno (`#hola`), **cuando** se abre, **entonces** la app
  arranca como siempre con lo guardado.

## Decisiones tomadas al aclarar

- 2026-10-31: el enlace lleva solo la forma, no las marcas: así es corto y legible, y no lo cortan
  los chats. Lo construido se pasa con el archivo de proyecto (006).
- 2026-10-31: al abrir un enlace se sustituye con aviso y «Deshacer», el mismo patrón que «Cargar
  proyecto»; se descartó preguntar antes (interrumpe y exige un componente nuevo) y dar prioridad
  a lo guardado (el enlace parecería no funcionar).
- 2026-10-31: se obtiene con un botón «Copiar enlace»; la barra de direcciones no se actualiza
  sola mientras se cambia la forma. Se descartó el menú nativo de compartir del móvil para no
  tener dos caminos que probar; puede ser otra propuesta.
- 2026-10-31: el fragmento se quita tras aplicarlo para que recargar no deshaga el trabajo hecho
  después de abrir el enlace.
- 2026-10-31: abierta la app con doble clic (`file://`) el enlace apunta al archivo local y solo
  sirve en ese equipo; el enlace útil para otros es el de la web publicada.

## Preguntas abiertas

Ninguna.
