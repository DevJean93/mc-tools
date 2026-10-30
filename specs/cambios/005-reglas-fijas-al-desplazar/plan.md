# Plan · 005 · Reglas fijas al desplazar el dibujo

## Enfoque

Dos lienzos de superposición (`#reglaSup`, `#reglaIzq`) dentro de un ancla de tamaño cero con
`position: sticky; top: 0; left: 0` que es el primer hijo de `.lienzoWrap` (el contenedor con
scroll). El navegador pega el ancla al borde visible; mientras el contenido no se ha desplazado
más que el relleno del contenedor, el ancla está en su posición natural y coincide exactamente
con las reglas reales, así que no hay salto. Cada lienzo dibuja solo su regla con el mismo código
que el dibujo normal, desplazado lo que se haya movido el contenido (`dx`, `dy`).

- **Visibles solo si hace falta:** `#reglaSup` cuando `scrollTop > 0` y `#reglaIzq` cuando
  `scrollLeft > 0`. El origen visible es exactamente lo desplazado: `x0 = scrollLeft`,
  `y0 = scrollTop` (Chromium pega el ancla sticky al borde del *contenido*, no al del contenedor,
  así que el relleno no entra en la cuenta; lo midió el E2E). Como el relleno queda fuera del ancla,
  los lienzos se extienden hacia él para tapar la tira por la que asomarían los bloques.
- **Sin eventos:** `pointer-events: none`; el puntero llega al lienzo principal. Por eso la
  geometría del puntero se generaliza con el **origen visible** `{ x0: dx, y0: dy }`: las bandas
  de la regla fija ocupan `[x0, x0+L)` y `[y0, y0+T)` en coordenadas del dibujo, y las celdas solo
  existen fuera de ellas. Sin desplazamiento `x0 = y0 = 0` y todo se comporta como hoy.
- **Lógica pura** en `render.js`: `zonaRegla(geo, px, py, origen)`, `zonaCelda(geo, px, py,
  origen)` (hoy es la función `celda` de `app.js`) y el pintado de cada regla por separado
  (`pintarReglaSuperior`, `pintarReglaIzquierda`) que `capaReglas` y las superpuestas comparten.
- Las entradas (ratón, táctil, teclado) **no cambian**: siguen pidiendo `regla(ev)` y `celda(ev)`.

## Archivos a tocar

- `src/dibujo/render.js`: pintado de reglas separado, `zonaRegla` con origen, `zonaCelda`,
  `dibujarReglasFijas` y datos extra (`paso`, `fuente`) en el valor que devuelve `dibujar`.
- `src/app.js`: `origenVisible()`, `celda`/`regla` con origen, `verCursor` que no deja el cursor
  bajo la banda y el repintado de las superpuestas (al desplazar, al cambiar el tamaño y tras
  `dibujar()`).
- `index.html`: el ancla y los dos lienzos.
- `src/estilos.css`: ancla sticky, lienzos de superposición y tema.
- `tests/unit/render.test.js`, `tests/e2e/e2e.js`.
- `specs/areas/numeracion/spec.md`, `specs/areas/marcas/spec.md`: delta al archivar.
- `README.md`: una línea en Funciones.

## Chequeo de la constitución

- [x] Sin instalación ni dependencias nuevas.
- [x] Español en interfaz, specs y comentarios.
- [x] Lógica pura sin DOM (`zonaRegla`, `zonaCelda`); `app.js` solo compone.
- [x] Spec y test primero; IDs en los tests.
- [x] `mc-formas-v1*` y la firma de marcas sin cambios.
- [x] Accesibilidad y móvil: los lienzos de superposición son `aria-hidden` (las reglas ya
      se anuncian de otro modo) y no reciben eventos; el cursor del teclado no queda bajo ellos.
- [x] UI con la skill `ui-ux-pro-max`; `check`, `test`, `specs` y `e2e` en verde; capturas reales
      en móvil y escritorio.
- [x] Lo mínimo que cumple la spec.

## Riesgos

- Que el ancla sticky añada desplazamiento al contenedor: se comprueba que `scrollWidth` y
  `scrollHeight` no cambian al mostrarlo.
- Que el sticky se ancle al borde del relleno y no al del contenido: se mide en el navegador.
- Redibujar en cada evento de scroll: se hace en `requestAnimationFrame` y solo se pintan las
  reglas (unos cientos de textos).
- La exportación PNG usa su propio lienzo y no se ve afectada.

## Pruebas

- Unitarios: `zonaRegla` y `zonaCelda` con origen y sin él (bandas desplazadas, esquina, celdas
  bajo una banda fija, comportamiento idéntico sin desplazamiento).
- E2E con un círculo de 60 a zoom 24 en escritorio y a zoom 48 en móvil:
  - sin desplazar, las reglas fijas están ocultas y no cambian `scrollWidth`/`scrollHeight`;
  - tras desplazar, están en el borde visible, su contenido no está en blanco y sus rectángulos
    coinciden con el contenedor;
  - clic (escritorio) y toque real (móvil) en la regla fija marcan la fila o columna correcta, no
    un bloque suelto, y la esquina no hace nada;
  - un toque en un bloque visible sigue marcando solo ese bloque;
  - pellizco y arrastre siguen funcionando; el teclado no deja el cursor bajo una regla fija.

## Validación visual

- Capturas desplazadas en escritorio y móvil con toques reales (390×844).
- Comparación píxel a píxel del lienzo principal con la versión anterior: idéntica.

## Tareas

- [x] T01 Propuesta y plan; el validador en verde.
- [x] T02 Lógica pura: tests de `zonaRegla`/`zonaCelda` con origen en rojo → implementación;
      `capaReglas` con las dos reglas por separado (el dibujo no cambia).
- [x] T03 Superposición: ancla y lienzos, `origenVisible()` y repintado; E2E en rojo → verde.
- [ ] T04 Clic y toque en la regla fija, esquina y teclado: E2E en rojo → verde.
- [ ] T05 Validación visual con la skill de UI; ajustes de estilo.
- [ ] T06 Archivar: delta en NUM y MAR, README, propuesta en `Hecha` y a `specs/cambios/archivo/`.
