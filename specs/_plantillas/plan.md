# Plan · NNN · <Título>

## Enfoque

<Cómo se implementa el delta con lo que ya existe, en pocas frases.>

## Archivos a tocar

- `src/…`: <qué cambia.>
- `tests/unit/….test.js`: <tests con sus IDs.>
- `specs/areas/…/spec.md`: <delta que se aplicará al archivar.>

## Chequeo de la constitución

- [ ] Sin instalación ni dependencias nuevas.
- [ ] Español en interfaz, specs y comentarios.
- [ ] Lógica pura sin DOM; `app.js` solo compone.
- [ ] Spec y test primero; IDs en los tests.
- [ ] `mc-formas-v1*` y la firma de marcas sin cambios (o con migración y test).
- [ ] Accesibilidad y móvil (44 px, `role`/`aria`, no solo color, 16 px).
- [ ] `check`, `test` y `e2e` en verde; capturas revisadas.
- [ ] Lo mínimo que cumple la spec.

## Riesgos

- <Datos guardados, firma, móvil, rendimiento…>

## Pruebas

- <Unitarios con ID, E2E con ID, cadenas de referencia.>

## Validación visual

- <Capturas en móvil 390×844 y escritorio; comparación píxel a píxel si no debe cambiar.>

## Tareas

- [ ] T01 — <test en rojo + implementación>. Archivos: <…>. Hecho cuando: <criterio>. Commit: <mensaje>.
- [ ] T02 — <…>
