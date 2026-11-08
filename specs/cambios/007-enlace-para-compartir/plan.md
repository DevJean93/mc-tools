# Plan · 007 · Enlace para compartir una forma

## Enfoque

Casi todo existe ya. La validación de lo que viene del enlace es la misma que la de lo guardado
(`Estado.cargar` con un almacén de solo lectura, como hace `desdeArchivo` con el archivo de
proyecto), y aplicar un enlace es un cambio de documento como cargar un proyecto: una
instantánea en el historial y `regenerar({ sinLeer: true, conservar: true })`. No hace falta
ningún módulo nuevo:

- **`Estado`**: dos funciones puras. `aEnlace(st)` devuelve el fragmento (`forma=circulo&w=30&…`) y
  `desdeEnlace(fragmento)` devuelve la forma validada o `null` si el fragmento no es de forma. La
  validación de un objeto crudo de parámetros se extrae a una función común que ya usa
  `desdeArchivo`, de modo que archivo, enlace y navegador no pueden validar distinto.
- **`Documento`**: `enlace()` (el fragmento de la forma actual) y `abrirEnlace(fragmento)`, que
  aplica la forma con historial y aviso.
- **`Avisos`**: `avisar` admite una duración opcional, para que el enlace mostrado a mano no
  desaparezca a los 5 s.
- **`app.js`**: el botón, la copia al portapapeles (con su alternativa), la lectura del
  fragmento al arrancar y su retirada de la barra de direcciones.

**Formato del fragmento:** `forma=circulo&w=30&h=30&igualar=1&modo=hueco&grosor=2&esfera=esfera&orient=plano&capa=0`.
Lleva todas las claves de `Estado.CLAVES_GEO` más la capa, con los booleanos como `1`/`0`, y nada
de zoom ni vista. Un fragmento es «de forma» si lleva alguna de esas claves. Lo que falte toma el
valor por defecto de la app (no lo que hubiera guardado), para que un mismo enlace dé la misma
forma en cualquier navegador.

**Al arrancar:** primero se genera la forma guardada con sus marcas, como siempre, y justo
después se aplica el enlace. Así hay un estado anterior al que volver con «Deshacer». Si el
enlace pisa una geometría distinta con marcas, sale el aviso «Se abrió la forma del enlace. Tu
progreso anterior se borró.» con «Deshacer». Con la misma geometría las marcas se conservan sin
aviso, y sin marcas tampoco hay aviso. Después se quita el fragmento de la barra de direcciones
con `history.replaceState`.

**Interfaz** (con la skill `ui-ux-pro-max`): en la sección «Proyecto», un tercer botón «Copiar
enlace» (icono de enlace, de contorno, como los demás) que ocupa las dos columnas de la
rejilla, debajo de «Guardar proyecto» y «Cargar proyecto». Al copiar sale «Enlace copiado.». Si
el navegador no deja usar el portapapeles, el aviso muestra el enlace entero seleccionado y se
queda 15 s.

## Archivos a tocar

- `src/nucleo/estado.js`: `aEnlace`, `desdeEnlace` y la función común de validación.
- `src/nucleo/documento.js`: `enlace()` y `abrirEnlace(fragmento)`.
- `src/interfaz/avisos.js`: duración opcional en `avisar`.
- `src/app.js`: botón, copia con alternativa, arranque con enlace y retirada del fragmento.
- `index.html` y `src/estilos.css`: el botón, el icono `i-enlace` y el botón de ancho completo.
- `tests/unit/estado.test.js`, `tests/unit/documento.test.js`, `tests/e2e/e2e.js`.
- `specs/areas/formas/spec.md`, `specs/areas/interfaz/spec.md`: el delta al archivar.
- `README.md`: en «Funciones» y en «Límites conocidos».

## Chequeo de la constitución

- [x] Sin instalación ni dependencias nuevas: `navigator.clipboard`, `URLSearchParams` y
      `history.replaceState` son del navegador.
- [x] Español en interfaz, specs y comentarios.
- [x] Lógica pura sin DOM (`Estado`, `Documento`); `app.js` solo compone.
- [x] Spec y test primero; IDs `FOR-16` a `FOR-18` e `INT-10` en los tests.
- [x] `mc-formas-v1*` y la firma de marcas **sin cambios**: el enlace no se guarda; lo que se
      guarda al abrirlo es la forma resultante, por el camino de siempre.
- [x] Accesibilidad y móvil: botón con texto visible, icono `aria-hidden`, 44 px, avisos en la
      región `role="status"` que ya existe.
- [x] UI con la skill `ui-ux-pro-max`; `check`, `test`, `specs` y `e2e` en verde; capturas reales
      en móvil y escritorio.
- [x] Lo mínimo que cumple la spec: sin menú nativo de compartir y sin actualizar la barra de
      direcciones mientras se edita.

## Riesgos

- **Datos guardados:** abrir un enlace con otra geometría borra las marcas guardadas; por eso el
  aviso con «Deshacer», que se prueba de extremo a extremo (vuelven la forma y las marcas).
- **Doble generación al arrancar:** se genera la forma guardada y luego la del enlace. Para una
  esfera de Ø100 son un par de cientos de milisegundos más, solo cuando hay enlace.
- **Entrada hostil:** el fragmento lo puede escribir cualquiera. Todo pasa por la validación de
  `Estado.cargar` (rangos, listas de valores válidos) y nunca se inserta como HTML.
- **Portapapeles:** puede fallar (permiso, `file://`, navegador antiguo). La alternativa muestra
  el enlace seleccionado. En las pruebas se sustituye `navigator.clipboard` para controlarlo.
- **`file://`:** el enlace apunta al archivo local y solo sirve en ese equipo (decidido en la
  propuesta). Se anota en el README.
- **Cambio de `#` con la app ya abierta** (pegar un enlace en la misma pestaña) no recarga la
  página y no se atiende: queda fuera del alcance aprobado y se anota como límite.

## Pruebas

**Unitarios (`estado.test.js`):**
- `FOR-16`: `aEnlace` devuelve exactamente la cadena de referencia de un caso (círculo hueco de
  30, grosor 2); lleva las claves de `CLAVES_GEO` y la capa, y ni zoom ni vista; los booleanos
  van como `1`/`0`.
- `FOR-17`, `desdeEnlace` con:
  - la cadena de referencia → la misma forma (ida y vuelta);
  - `forma=nada&w=999` → círculo con ancho 200; `grosor=-3`, `w=abc` y `capa=zzz` → valores válidos;
  - una esfera con ancho 150 → recortado a 100;
  - un fragmento vacío, `hola` o `x=1` → `null`;
  - un fragmento con `#` delante, o con claves repetidas o con `%`, no falla.

**Unitarios (`documento.test.js`):**
- `FOR-17`: `abrirEnlace` aplica la forma, la guarda en el almacén, no toca el zoom ni la vista y
  un fragmento ajeno no cambia nada ni ocupa historial.
- `FOR-18`: con marcas y otra geometría, las marcas se borran, el aviso es «Se abrió la forma
  del enlace. Tu progreso anterior se borró.» con «Deshacer», y un solo Deshacer devuelve la
  forma y las marcas. Con la misma geometría las marcas se conservan sin aviso; sin marcas no
  hay aviso. Un solo paso de historial.

**E2E (`e2e.js`):**
- `FOR-16`, `INT-10`: botón visible en el menú con su nombre, copia en el portapapeles (sustituido
  por un registro) la dirección con el `#…` de la forma actual y avisa «Enlace copiado.».
- `INT-10`: con el portapapeles roto, el aviso muestra el enlace entero.
- `FOR-17`: abrir `index.html#forma=rombo&w=20&modo=hueco&grosor=3` muestra esa forma y deja la
  barra de direcciones sin `#`; `#forma=nada&w=999` arranca con valores válidos; `#hola` arranca
  con lo guardado y no se quita.
- `FOR-18`: con una esfera marcada guardada, abrir un enlace de un rombo da el aviso y «Deshacer»
  devuelve la esfera y sus marcas; con el mismo círculo las marcas siguen sin aviso.
- `INT-10` en móvil: los tres botones caben y el nuevo mide al menos 44 px.

## Validación visual

- Capturas reales en escritorio y en móvil 390×844 de la sección «Proyecto» con los tres botones,
  del aviso «Enlace copiado.» y del aviso con el enlace a mano.
- Comparación píxel a píxel del lienzo contra la versión anterior: no debe cambiar.
- Sin errores de consola.
- A mano en un móvil real: que el portapapeles funcione desde la web publicada (HTTPS) y que el
  enlace se abra en otra pestaña.

## Tareas

- [x] T01 — Test en rojo de `FOR-16` y `FOR-17` y después `Estado.aEnlace`, `Estado.desdeEnlace` y la validación común extraída de `desdeArchivo`. Archivos: `src/nucleo/estado.js`, `tests/unit/estado.test.js`. Hecho cuando: pasan los tests nuevos y los de `desdeArchivo` siguen en verde. Commit: «FOR-16, FOR-17: Estado.aEnlace y Estado.desdeEnlace».
- [x] T02 — Test en rojo de `FOR-17` y `FOR-18` y después `Documento.enlace` y `Documento.abrirEnlace`. Archivos: `src/nucleo/documento.js`, `tests/unit/documento.test.js`. Hecho cuando: el enlace se aplica con un solo paso de historial, y el aviso con «Deshacer» devuelve la forma y las marcas. Commit: «FOR-17, FOR-18: Documento.abrirEnlace».
- [x] T03 — Test E2E en rojo de `FOR-16`, `FOR-17`, `FOR-18` e `INT-10` y después el botón «Copiar enlace», la copia con alternativa, la duración opcional de los avisos y el arranque con enlace. Archivos: `index.html`, `src/estilos.css`, `src/app.js`, `src/interfaz/avisos.js`, `tests/e2e/e2e.js`. Hecho cuando: pasa el E2E completo y el botón mide 44 px o más en móvil. Commit: «INT-10, FOR-16 a 18: botón Copiar enlace y apertura de enlaces».
- [x] T04 — Validación visual con la skill `ui-ux-pro-max`: capturas en escritorio y móvil, comparación píxel a píxel del lienzo y consola sin errores. Hecho cuando: las capturas se ven bien y no hay diferencias de píxeles; si hay que retocar estilos, se hace aquí. Commit: solo si hay cambios.
- [ ] T05 — Archivar: aplicar `FOR-16` a `FOR-18` al área de formas e `INT-10` al área de interfaz con sus decisiones, actualizar el README, pasar la propuesta a `Hecha` y moverla a `specs/cambios/archivo/`. Hecho cuando: el validador de specs está en verde con todos los IDs cubiertos. Commit: «SDD: archiva la propuesta 007 (enlace para compartir)».
