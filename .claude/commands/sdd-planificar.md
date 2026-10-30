---
description: Escribe el plan técnico y las tareas de una propuesta aprobada
argument-hint: [NNN]
---

Propuesta: $ARGUMENTS

1. Exige que `specs/cambios/NNN-*/propuesta.md` esté en `Aprobada` y sin
   `[NECESITA ACLARACIÓN]`. Si no lo está, detente y dilo.
2. Lee `specs/constitucion.md`, las áreas afectadas y el código y tests actuales que
   implementan esos requisitos.
3. Crea `plan.md` en la misma carpeta con `specs/_plantillas/plan.md`:
   - enfoque reutilizando lo que ya existe;
   - archivos a tocar (sin crear módulos nuevos si no hace falta);
   - chequeo de la constitución punto por punto;
   - riesgos (datos guardados, firma, móvil, rendimiento);
   - pruebas (unitarias con ID, E2E con ID, cadenas de referencia);
   - validación visual con capturas;
   - `## Tareas` con casillas `- [ ] Tnn`, cada una con su par test en rojo +
     implementación, archivos, «hecho cuando…» y un commit.
4. Si hay interfaz, invoca la skill `ui-ux-pro-max` antes de decidir el diseño.

No toques código, tests ni el estado de la propuesta (sigue `Aprobada` hasta implementar).
