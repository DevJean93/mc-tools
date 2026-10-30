# Plan · 001 · Regla relativa al centro sin números negativos

## Enfoque

La cuenta de la regla relativa es la misma que ya calculan los ejes: `distFranja(i, a, b) + 1`
con la franja de `centro(n)`. Se extrae a funciones puras de `render.js` (`reglaRelativa`,
`cifrasReglaRelativa` y `textoRelativo`) para probarlas en Node, y `capaReglas` y `describir`
solo las usan. Se eliminan `relativo` y `etiquetaRel`, que quedan sin uso.

## Archivos a tocar

- `src/dibujo/render.js`: las tres funciones puras, `capaReglas` y la exportación.
- `src/app.js`: `describir()`.
- `tests/unit/render.test.js`: `NUM-10`, `NUM-13`, `NUM-14`.
- `tests/e2e/e2e.js`: `NUM-14` con el puntero real.
- `specs/areas/numeracion/spec.md`: delta al archivar.
- `README.md`: la línea de la regla relativa.

## Chequeo de la constitución

- [x] Sin instalación ni dependencias nuevas.
- [x] Español en interfaz, specs y comentarios.
- [x] Lógica pura sin DOM; `app.js` solo compone.
- [x] Spec y test primero; IDs en los tests; `NUM-10` deja de ser verificación manual.
- [x] `mc-formas-v1*` y la firma de marcas sin cambios (`rel` sigue siendo una opción de vista).
- [x] Accesibilidad: la flecha de la línea de información se lee mejor que un signo; el
      criterio de color de la regla no cambia.
- [x] `check`, `test`, `specs` y `e2e` en verde; capturas revisadas.
- [x] Lo mínimo que cumple la spec.

## Riesgos

- Con paso > 1 las dos cifras 1 de una franja de 2 quedarían pegadas: se muestra solo la del
  último bloque de la franja (`NUM-13`).
- Es el único cambio que altera el dibujo: con la regla relativa apagada el lienzo debe ser
  idéntico píxel a píxel.

## Pruebas

- Unitarios (`render.test.js`): la cuenta para 30, 16, 15, 1 y 2 bloques; ninguna cifra
  negativa; visibilidad con paso 1, 2 y 5; texto con flechas en los cuatro lados y en la franja.
- E2E: pasar el ratón sobre un bloque da una línea con flechas y sin `-`.

## Validación visual

- Capturas de escritorio y móvil con la regla relativa encendida (pares e impares).
- Comparación píxel a píxel con la regla relativa apagada: idéntica en los casos de referencia.

## Tareas

- [x] T01 Propuesta y plan; el validador en verde.
- [x] T02 `NUM-10` y `NUM-13`: unitarios en rojo → `reglaRelativa`, `cifrasReglaRelativa` y
      `capaReglas` → verde.
- [ ] T03 `NUM-14`: unitarios y E2E en rojo → `textoRelativo` y `describir` → verde.
- [ ] T04 Archivar: delta en `specs/areas/numeracion/spec.md`, README, propuesta en `Hecha` y a
      `specs/cambios/archivo/`.
