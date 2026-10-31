# Plan · 006 · Guardar y cargar un proyecto en un archivo

## Enfoque

Casi todo existe ya. El formato del archivo reutiliza el formato compacto de las marcas que
`Estado` guarda en el navegador, y la validación reutiliza `Estado.cargar` (mismas reglas que lo
guardado). Cargar es un cambio de documento como deshacer: se apila una instantánea en el
historial y se regenera con `regenerar({ sinLeer: true, conservar: true })`. La descarga usa
`Exportar.descargar(blob, nombre)`, que ya baja los PNG. No hace falta ningún módulo nuevo:

- **`Estado`** (persistencia): sabe escribir y leer el archivo. Para ello se extraen dos
  funciones puras que hoy van dentro de `guardarMarcas` y `cargarMarcas`, de modo que el
  navegador y el archivo comparten exactamente el mismo formato.
- **`Documento`**: produce el contenido del archivo y aplica uno cargado, con historial, avisos y
  guardado en el navegador.
- **`app.js`**: conecta los dos botones nuevos, el `<input type="file">` oculto y la descarga.

**Formato del archivo (versión 1):**

```json
{
  "app": "formas-mc",
  "version": 1,
  "forma": { "forma": "circulo", "w": 30, "h": 30, "igualar": true, "modo": "hueco",
             "grosor": 2, "esfera": "esfera", "orient": "plano", "capa": 0 },
  "marcas": { "firma": "circulo|30|30|hueco|2||", "porCapa": { "0": [3, 0, 4, 0] } }
}
```

`forma` lleva solo los parámetros de geometría (`Estado.CLAVES_GEO`) y la capa actual: ni el
zoom ni las opciones de vista. `marcas` es el mismo objeto que hoy se guarda en
`mc-formas-v1:marcas`.

**Interfaz** (con la skill `ui-ux-pro-max`): una sección nueva **«Proyecto»** al final del menú,
debajo de «Materiales». Lleva una frase de ayuda («Guarda una copia con la forma y lo construido
para moverla a otro dispositivo o recuperarla») y los dos botones en la rejilla de dos columnas
que ya usan los de exportar: «Guardar proyecto» (icono de descarga ya existente) y «Cargar
proyecto» (icono nuevo de subir, de contorno, como los demás). El `<input type="file">` va
oculto; el control accesible es el botón. La barra inferior del móvil no cambia: la sección se
alcanza desplazando la hoja del menú.

**Mensajes:**
- al guardar, un aviso «Proyecto guardado: formas-mc-circulo-30x30.json»;
- al cargar, un aviso «Proyecto cargado.» con el botón «Deshacer» (la forma cargada ya se ve en
  pantalla);
- si hay error, un aviso con el motivo y qué hacer: «No es un proyecto de Formas MC. Elige un
  archivo .json guardado con «Guardar proyecto».» / «Este proyecto es de una versión más nueva
  de Formas MC. Actualiza la app para abrirlo.»;
- si se descartan marcas, el mismo aviso lo dice, porque solo se ve un aviso a la vez: «Proyecto
  cargado. Sus marcas no correspondían a la forma y se descartaron.».

## Archivos a tocar

- `src/nucleo/estado.js`:
  - funciones puras `compactarMarcas(firma, hechos)` y `marcasDesde(raw, firma, capas)`, que
    `guardarMarcas` y `cargarMarcas` pasan a usar sin cambiar su resultado;
  - funciones puras `aArchivo(st, firma, hechos)` (devuelve el texto JSON),
    `desdeArchivo(texto)` (devuelve `{ ok: true, st, marcas }` o `{ ok: false, motivo, mensaje }`)
    y `nombreArchivoProyecto(st)`.
- `src/nucleo/documento.js`: `proyecto()` y `cargarProyecto(texto)`.
- `src/app.js`: conexión de los botones, del selector de archivos y de la descarga.
- `index.html`: la sección «Proyecto», el `<input type="file" accept=".json,application/json"
  hidden>` y el icono `i-subir`.
- `tests/unit/estado.test.js`, `tests/unit/documento.test.js`, `tests/e2e/e2e.js`.
- `specs/areas/marcas/spec.md`, `specs/areas/interfaz/spec.md`: el delta al archivar.
- `README.md`: en «Funciones» y en «Límites conocidos» (el progreso ya no depende solo del
  navegador).

## Chequeo de la constitución

- [x] Sin instalación ni dependencias nuevas: `Blob`, `<a download>` y `<input type="file">`
      funcionan con `file://` (la exportación PNG ya descarga así).
- [x] Español en interfaz, specs y comentarios.
- [x] Lógica pura sin DOM (`Estado`, `Documento`); `app.js` solo compone.
- [x] Spec y test primero; IDs `MAR-19` a `MAR-22` e `INT-09` en los tests.
- [x] `mc-formas-v1*` y la firma de marcas **sin cambios**. El formato del archivo se fija con una
      cadena de referencia en un test, y el formato compacto actual también, para que la
      extracción de funciones no lo altere.
- [x] Accesibilidad y móvil: botones con texto visible, iconos `aria-hidden`, 44 px en móvil,
      avisos en la región `role="status"` que ya existe; el selector de archivos es el nativo.
- [x] UI con la skill `ui-ux-pro-max`; `check`, `test`, `specs` y `e2e` en verde; capturas reales
      en móvil y escritorio.
- [x] Lo mínimo que cumple la spec: no hay gestor de proyectos ni lista de archivos recientes.

## Riesgos

- **Datos guardados:** la extracción de `compactarMarcas`/`marcasDesde` toca la ruta del
  progreso. Antes de extraer se fija con un test la cadena exacta que se guarda hoy.
- **Deshacer tras cargar:** no debe saltar el aviso «La forma cambió: se limpiaron las marcas»
  ni apilar dos pasos. Por eso se usa `conservar: true` y se apila una sola instantánea.
- **Tamaño del archivo:** una esfera de Ø100 llena y toda marcada son unos 520 000 bloques y
  pueden dar varios MB de JSON. Es aceptable, porque el navegador ya guarda lo mismo. Se prueba
  que una esfera grande se guarda y se carga en un tiempo razonable.
- **Móvil:**
  - en iOS la descarga de un blob abre el panel de compartir o «Descargas»;
  - algunos selectores de Android filtran por tipo y pueden no ofrecer `.json`;
  - por eso `accept` incluye la extensión y el tipo;
  - el selector real no se puede manejar en el navegador sin interfaz, así que se marca para
    probarlo a mano en un móvil y se avisa al usuario.
- **Rendimiento:** leer el archivo es asíncrono (`file.text()`); mientras tanto no se bloquea la
  interfaz.

## Pruebas

**Unitarios (`estado.test.js`):**
- `MAR-05`: cadena de referencia del formato compacto actual de las marcas (antes de extraer).
- `MAR-19`:
  - `aArchivo` devuelve exactamente la cadena de referencia de un caso pequeño (círculo de 4 con
    2 marcas);
  - lleva solo `CLAVES_GEO` y la capa, no el zoom ni la vista;
  - `nombreArchivoProyecto` da `formas-mc-circulo-30x30.json`, `formas-mc-esfera-11.json` o
    `formas-mc-cupula-16.json`.
- `MAR-21`, `desdeArchivo` con:
  - texto que no es JSON, una lista, sin `app`, con otra `app` o con `version: 2` → error con el
    motivo y el mensaje;
  - versión 1 válida → `st` validado: un ancho fuera de rango se recorta, una forma desconocida
    pasa a la de por defecto;
  - sin `marcas` → se abre sin marcas.

**Unitarios (`documento.test.js`):**
- `MAR-20`:
  - `cargarProyecto` aplica la forma y las marcas, las guarda en el almacén y avisa con
    «Deshacer»;
  - un solo `deshacer()` devuelve la forma y las marcas anteriores, y `rehacer()` vuelve a la
    cargada;
  - el zoom y las opciones de vista no cambian;
  - `proyecto()` → `cargarProyecto()` deja el mismo estado (ida y vuelta).
- `MAR-21`:
  - un archivo erróneo no cambia nada ni apila historial;
  - unas marcas con otra firma se descartan y se avisa.
- `MAR-22`: con un almacén que no guarda (`persistente: false`), guardar y cargar funcionan.

**E2E (`e2e.js`):**
- `MAR-19`: «Guardar proyecto» descarga `formas-mc-*.json` y su contenido trae las marcas hechas.
- `MAR-20`:
  - se cambia la forma, se carga el archivo con `DOM.setFileInputFiles` y vuelven la forma y las
    marcas;
  - «Deshacer» en el aviso devuelve la forma de antes.
- `MAR-21`: un archivo que no es JSON muestra el mensaje y no cambia nada.
- `MAR-22`: con el almacenamiento bloqueado, guardar y cargar funcionan y la nota fija sigue.
- `INT-09`:
  - en escritorio y en móvil (390 px) los dos botones se ven, caben y tienen nombre;
  - en móvil miden al menos 44 px.

## Validación visual

- Capturas de la sección «Proyecto» en escritorio y en la hoja del menú móvil (390×844), y del
  aviso tras cargar.
- Comparación píxel a píxel del lienzo con la versión anterior en los casos de referencia:
  idéntica (el dibujo no cambia).
- A mano en un móvil real (no se puede automatizar): el selector de archivos ofrece el `.json`
  guardado y la descarga llega a «Descargas».

## Tareas

- [x] T01 Fijar el formato actual: test `MAR-05` con la cadena de referencia de las marcas
      guardadas (en verde) → extraer `compactarMarcas` y `marcasDesde` en `estado.js` sin cambiar
      el resultado. Hecho cuando: todos los tests siguen en verde. Commit.
- [x] T02 `MAR-19`: tests de `aArchivo` y `nombreArchivoProyecto` en rojo → implementar. Hecho
      cuando: la cadena de referencia y los nombres pasan. Commit.
- [x] T03 `MAR-21`: tests de `desdeArchivo` en rojo → implementar reutilizando `Estado.cargar` con
      un almacén de solo lectura sobre la forma del archivo. Hecho cuando: errores y validación
      pasan. Commit.
- [x] T04 `MAR-20`, `MAR-21`, `MAR-22`: tests de `Documento.proyecto` y `cargarProyecto` en rojo →
      implementar con historial, `regenerar({ sinLeer, conservar })` y avisos. Hecho cuando: la
      ida y vuelta, deshacer y rehacer, las marcas descartadas y el almacén sin persistencia
      pasan. Commit.
- [x] T05 `INT-09` y E2E de `MAR-19` a `MAR-22`: E2E en rojo → sección «Proyecto» en
      `index.html`, icono `i-subir`, selector oculto y conexión en `app.js`. Hecho cuando: todos
      los E2E pasan en escritorio y móvil. Commit.
- [ ] T06 Validación visual con la skill de UI: capturas en escritorio y móvil, ajustes de estilo
      si hacen falta y comparación píxel a píxel del lienzo. Commit si hay ajustes.
- [ ] T07 Archivar: el delta pasa a `specs/areas/marcas/spec.md` (`MAR-19` a `MAR-22`) y a
      `specs/areas/interfaz/spec.md` (`INT-09`) con sus decisiones; se actualiza `README.md`; la
      propuesta queda en `Hecha` y se mueve a `specs/cambios/archivo/`. Hecho cuando: `npm run
      specs` en verde sin requisitos sin test. Commit.
