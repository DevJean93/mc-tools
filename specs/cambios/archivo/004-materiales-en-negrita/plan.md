# Plan · 004 · Números del desglose de materiales en negrita

## Enfoque

Es solo estilo: la regla `.mat b` de `src/estilos.css` pasa de peso 400 a 600, el mismo peso que
las cifras del lienzo. La tabla por capas no se toca: con todo en negrita se perdería la
jerarquía, y la capa seleccionada ya se distingue por su fondo.

## Archivos a tocar

- `src/estilos.css`: regla `.mat b`.
- `tests/e2e/e2e.js`: `MAT-10`.
- `specs/areas/materiales/spec.md`: delta al archivar.

## Chequeo de la constitución

- [x] Sin instalación ni dependencias nuevas.
- [x] Español en interfaz, specs y comentarios.
- [x] Sin lógica nueva: solo estilo.
- [x] Spec y test primero; ID en el test.
- [x] `mc-formas-v1*` y la firma de marcas sin cambios.
- [x] Accesibilidad: el contraste no cambia; la negrita mejora la lectura de las cantidades.
- [x] `check`, `test`, `specs` y `e2e` en verde; capturas revisadas.
- [x] Lo mínimo que cumple la spec.

## Riesgos

- Con cifras anchas (`11 × 64 + 35`) la columna derecha del desglose es más ancha: se revisa en
  móvil que no se parta.

## Pruebas

- E2E `MAT-10`: el peso calculado de los números del desglose es 600 y el de sus etiquetas, 400;
  el de las celdas de la tabla por capas (esfera) sigue siendo 400.

## Validación visual

- Capturas del panel en escritorio y móvil.
- Comparación píxel a píxel del lienzo con la versión anterior: idéntica.

## Tareas

- [x] T01 Propuesta y plan; el validador en verde.
- [x] T02 `MAT-10`: el E2E en rojo → `.mat b` en negrita → verde.
- [x] T03 Archivar: delta en `specs/areas/materiales/spec.md` con su decisión, propuesta en `Hecha`
      y a `specs/cambios/archivo/`.
