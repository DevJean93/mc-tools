---
description: Implementa las tareas de una propuesta SDD, test primero
argument-hint: [NNN] [Tnn]
---

Propuesta: $ARGUMENTS

1. Comprueba que existe `plan.md` y que la propuesta está `Aprobada` o `En curso`.
2. Pasa el estado a `En curso`. Si se indica `Tnn`, ejecuta solo esa tarea; si no, en orden.
3. Por cada tarea:
   - escribe primero el test con el ID del requisito y comprueba que **falla**;
   - implementa lo mínimo para que pase;
   - actualiza `specs/areas/<área>/spec.md` solo si el delta ya está listo para archivarse
     (lo normal es hacerlo en `/sdd-archivar`);
   - marca la casilla en `plan.md`;
   - ejecuta `npm run check`, `npm test` y `npm run e2e`;
   - si hay interfaz, saca capturas reales (móvil 390×844 y escritorio) y revisa que no
     haya errores de consola;
   - haz **un commit por tarea**, en español, sin push.
4. Si un test existente cambia solo de nombre para llevar el ID, no cambies su lógica.
5. Si aparece trabajo fuera del plan, detente y propón una propuesta nueva.

No hagas push ni amplíes el alcance. Al terminar, resume tareas, commits y resultados.
