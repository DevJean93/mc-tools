# Plan · 009 · Altura Y de cada capa en las formas 3D

## Enfoque

Casi todo existe ya. El número de capa se compone en tres sitios (el texto sobre el dibujo en
`app.js`, la tabla en `vista-materiales.js` y la cabecera del PNG en `exportar.js`) y la altura se
añade al lado en cada uno. La validación y el guardado de la Y reutilizan lo de las guías de chunk:
`Estado.coordenada` (entero de ±30 000 000 o `null`) y el guardado de todo `st`. No hace falta
ningún módulo nuevo:

- **`Estado`**: campo nuevo `baseY` (por defecto `null`), validado con `coordenada` en `cargar`, y la
  función pura `alturaCapa(st, i)`: la Y de la capa `i` (0 = base) o `null` si la forma no es 3D o no
  hay Y de la base. Es `baseY + i`. `baseY` no es geometría (`CLAVES_GEO` no cambia), así que ni la
  firma, ni el enlace, ni el archivo de proyecto lo llevan, y `mc-formas-v1` sigue cargando igual.
- **`Panel`**: lee y escribe el campo (vacío ⇒ `null`; no pisa el campo mientras se teclea), lo
  muestra solo con esfera o cúpula y avisa a la app con un tercer callback, `alCambiarAltura`, porque
  esta opción no repinta solo el lienzo: hay que rehacer el texto de la capa y la tabla.
- **`app.js`**: el texto de la capa pasa a `Capa 3 de 11 · Y 66`, la etiqueta accesible del lienzo
  suma la altura y `alCambiarAltura` guarda y llama a `refrescar()`. `vista.pintar` recibe `altura`
  (la función `i => Y | null`) y el contexto de exportación también.
- **`VistaMateriales`**: si `altura(0) !== null`, la tabla lleva una columna «Y» tras «Capa».
- **`Exportar`**: la línea de la capa en la cabecera suma ` · Y 66`.
- **`index.html`**: la fila «Y de la base» en «Forma», tras la variante, con su ayuda.

**Interfaz** (con la skill `ui-ux-pro-max`): el campo es un `type="number"` sin `inputmode` (para que
el móvil ofrezca el signo menos, como las coordenadas de las guías), con la etiqueta «Y de la base»,
`placeholder` vacío y una ayuda corta («Altura de la capa 1, la que se apoya en el suelo (F3). Vacío:
solo el número de capa.»), visible solo con esfera o cúpula.

## Archivos a tocar

- `src/nucleo/estado.js`: `baseY` y `alturaCapa`.
- `src/interfaz/panel.js`: el campo y el callback `alCambiarAltura`.
- `src/app.js`: el texto de la capa, la etiqueta accesible y los callbacks.
- `src/interfaz/vista-materiales.js`: la columna «Y».
- `src/interfaz/exportar.js`: la cabecera del PNG.
- `index.html`, `src/estilos.css` (solo si hace falta): el campo y su ayuda. Tras tocar `src/` o
  `index.html`, `npm run versionar` en el mismo commit.
- `tests/unit/estado.test.js`, `tests/e2e/e2e.js`.
- `specs/areas/numeracion/spec.md`, `specs/areas/interfaz/spec.md`: el delta al archivar.
- `README.md`: en «Funciones».

## Chequeo de la constitución

- [x] Sin instalación ni dependencias nuevas.
- [x] Español en interfaz, specs y comentarios.
- [x] Lógica pura sin DOM: `alturaCapa` y la validación van en `Estado`; `app.js` solo compone.
- [x] Spec y test primero; IDs `NUM-18`, `NUM-19` e `INT-13` en los tests.
- [x] `mc-formas-v1*` y la firma de marcas **sin cambios de formato**: un campo nuevo con valor por
      defecto, con una cadena de referencia del formato antiguo como prueba.
- [x] Accesibilidad y móvil: etiqueta visible, 16 px y 44 px; la altura es texto, no solo color; los
      lectores de pantalla la anuncian.
- [x] UI con la skill `ui-ux-pro-max`; `check`, `test`, `specs` y `e2e` en verde; capturas reales en
      móvil y escritorio; comparación píxel a píxel con la opción vacía.
- [x] Lo mínimo que cumple la spec: un campo, sin avisos de límites de altura ni nuevas opciones.

## Riesgos

- **Cada commit debe dejar la app arrancando.** `Panel` busca un elemento por cada campo que lee:
  el HTML, `Panel` y `app.js` del campo van en la misma tarea (T02), y se pasa el E2E en cada tarea
  aunque la lógica sea pura (lección de la 008).
- **Datos guardados:** `cargar` debe seguir aceptando el `mc-formas-v1` de antes (test con la cadena
  literal del formato anterior). Un `null` guardado vuelve como `null`.
- **Dibujo:** esta opción no toca el lienzo; se comprueba píxel a píxel que, vacía, nada cambia.
- **Anuncios:** el texto de la capa también lo lee el teclado para anunciar el cambio de capa; con
  Y escrita lo dirá. Se prueba en el E2E.
- **PNG y tabla:** sin Y, el texto y la tabla deben ser exactamente los de hoy (E2E con comparación
  del HTML de la tabla y del texto).
- **Móvil:** un campo más en «Forma» con esfera; se comprueba que cabe en 390 px.

## Pruebas

**Unitarios (`estado.test.js`):**
- `NUM-19`: por defecto `baseY` es `null`; un `mc-formas-v1` escrito antes de este cambio carga igual
  y sin altura; se guarda y se recupera; se redondea, se recorta a ±30 000 000 y un texto o vacío es
  `null`; `baseY` no entra en `CLAVES_GEO`, en la firma, en `aEnlace` ni en `aArchivo`.
- `NUM-18`, `alturaCapa`:
  - esfera de 11 con base 64 → capa 0 = 64, capa 2 = 66, capa 10 = 74;
  - cúpula con base 70 → capa 0 = 70 (su propia capa 1);
  - base negativa −60 → capa 4 = −56;
  - sin `baseY` → `null`;
  - forma 2D con `baseY` guardada → `null`.

**E2E (`e2e.js`):**
- `INT-13`: con el círculo (2D) no hay campo «Y de la base»; con la esfera aparece con su etiqueta y
  su ayuda; se recuerda al recargar; en móvil cabe y mide 44 px, con 16 px de letra.
- `NUM-18`: esfera de 11 con base 64: el texto dice «Capa 3 de 11 · Y 66» en la capa 3 y «Capa 1 de
  11 (base) · Y 64» en la 1; la tabla tiene la columna «Y» con 64 … 74; la cabecera del PNG lleva
  «Y 66»; la etiqueta accesible del lienzo la incluye; cúpula: su capa 1 vale la base.
- `NUM-19`: con el campo vacío el texto, la tabla y la cabecera son los de hoy; con un círculo y una Y
  guardada no hay altura; cambiar la Y no toca las marcas ni saca avisos; un estado antiguo carga
  igual.

## Validación visual

- Capturas reales en escritorio y en móvil 390×844: esfera de 11 con base 64 (texto de la capa, tabla
  con la columna Y y el campo con su ayuda).
- Comparación píxel a píxel del lienzo contra la versión anterior: idéntico.
- Sin errores de consola.

## Tareas

- [x] T01 — Test en rojo de `NUM-18` y `NUM-19` (`alturaCapa`, valores por defecto, formato antiguo, recorte, no entra en geometría ni en enlace ni en proyecto) y después `baseY` y `alturaCapa` en `Estado`. Archivos: `src/nucleo/estado.js`, `tests/unit/estado.test.js`. Hecho cuando: pasan los tests nuevos y el E2E completo sigue en verde (la app no cambia todavía). Commit: «NUM-18, NUM-19: Estado guarda baseY y calcula la altura de cada capa» (con `npm run versionar`).
- [ ] T02 — Test E2E en rojo de `INT-13` y del texto de la capa de `NUM-18`/`NUM-19`, y después el campo «Y de la base» en `index.html`, `Panel` (leer, poner y el callback `alCambiarAltura`) y `app.js` (texto de la capa, etiqueta accesible y refresco), todo en la misma tarea para que la app no se rompa. Con la skill `ui-ux-pro-max`. Archivos: `index.html`, `src/interfaz/panel.js`, `src/app.js`, `src/estilos.css` si hace falta, `tests/e2e/e2e.js`. Hecho cuando: pasa el E2E completo y el campo mide 44 px en móvil. Commit: «INT-13, NUM-18, NUM-19: campo Y de la base y altura en el texto de la capa» (con `npm run versionar`).
- [ ] T03 — Test E2E en rojo de la tabla y de la cabecera del PNG (`NUM-18`, `NUM-19`) y después la columna «Y» en `VistaMateriales` y la línea de la capa en `Exportar`. Archivos: `src/interfaz/vista-materiales.js`, `src/interfaz/exportar.js`, `src/app.js`, `tests/e2e/e2e.js`. Hecho cuando: pasa el E2E completo y, sin Y, tabla y cabecera son las de hoy. Commit: «NUM-18: columna Y en la tabla y altura en la cabecera del PNG» (con `npm run versionar`).
- [ ] T04 — Validación visual: capturas en escritorio y móvil, comparación píxel a píxel del lienzo y consola sin errores. Hecho cuando: las capturas se ven bien; si hay retoques, se hacen aquí y se vuelve a versionar. Commit: solo si hay cambios.
- [ ] T05 — Archivar: `NUM-18` y `NUM-19` al área de numeración e `INT-13` al de interfaz con sus decisiones, `README.md`, propuesta a `Hecha` y moverla al archivo. Hecho cuando: el validador está en verde con todos los IDs cubiertos. Commit: «SDD: archiva la propuesta 009 (altura Y de cada capa)».
