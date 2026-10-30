# Plan · 003 · Aviso con el ancho disponible y ayuda para filas finas

## Enfoque

El aviso deja de centrarse con `left: 50%` + `translateX(-50%)`, que limita su ancho a la mitad
derecha de la pantalla. Se ancla a los dos lados (`left: 0; right: 0`) con `margin-inline: auto` y
`width: max-content`, de modo que sigue centrado y se ajusta a su contenido, con un tope de
`min(100% − 32px, 60ch)`. La ayuda táctil gana una frase. No cambia ninguna lógica ni el dibujo.

## Archivos a tocar

- `src/estilos.css`: regla `.aviso`.
- `index.html`: frase de la ayuda táctil.
- `tests/e2e/e2e.js`: `INT-08` en escritorio y en móvil; `INT-07` comprueba la frase nueva.
- `specs/areas/interfaz/spec.md`: delta al archivar.

## Chequeo de la constitución

- [x] Sin instalación ni dependencias nuevas.
- [x] Español en interfaz, specs y comentarios.
- [x] Sin lógica nueva: solo estilo y texto.
- [x] Spec y test primero; IDs en los tests.
- [x] `mc-formas-v1*` y la firma de marcas sin cambios.
- [x] Accesibilidad y móvil: el aviso no tapa el contenido más de lo necesario y sigue en
      `role="status"`; la ayuda orienta sobre objetivos pequeños.
- [x] `check`, `test`, `specs` y `e2e` en verde; capturas revisadas.
- [x] Lo mínimo que cumple la spec.

## Riesgos

- El aviso móvil se coloca encima de la barra inferior con su propia regla de `bottom`; el
  cambio de anclaje no debe romperla.
- Sin `transform`, cualquier animación que dependiera de él dejaría de centrar: no hay ninguna
  sobre `.aviso`.

## Pruebas

- E2E `INT-08`: en escritorio, el aviso de una fila queda centrado y no pasa de ~60 caracteres;
  en móvil a 375 px, queda centrado, dentro de la pantalla y en dos líneas como mucho.
- E2E `INT-07`: la ayuda táctil incluye «acércate».

## Validación visual

- Capturas de móvil (390×844, toque real en la regla) y escritorio con el aviso visible.
- Comparación píxel a píxel del lienzo con la versión anterior: idéntica.

## Tareas

- [x] T01 Propuesta y plan; el validador en verde (`specs` falla hasta que `INT-08` tenga test).
- [x] T02 `INT-08`: tests E2E en rojo (escritorio y móvil) → cambio de `.aviso` → verde.
- [x] T03 `INT-07`: el E2E pide «acércate» en rojo → frase en la ayuda táctil → verde.
- [ ] T04 Archivar: delta en `specs/areas/interfaz/spec.md` (con su decisión), propuesta en
      `Hecha` y a `specs/cambios/archivo/`.
