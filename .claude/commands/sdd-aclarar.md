---
description: Resuelve las preguntas abiertas de una propuesta SDD
argument-hint: [NNN]
---

Propuesta: $ARGUMENTS

Si no se indica número, busca la propuesta en `specs/cambios/` que esté en `Borrador` o
`En revisión` y confirma con el usuario cuál es.

1. Lee `specs/constitucion.md`, las áreas afectadas y la `propuesta.md`.
2. Plantea al usuario las `[NECESITA ACLARACIÓN: …]` de una en una, con opciones concretas
   cuando ayuden. No inventes la respuesta.
3. Con cada respuesta, actualiza el `## Delta` y los criterios de aceptación. Si una
   respuesta cambia el alcance, dilo.
4. Cuando no queden preguntas, pasa el estado a `En revisión`.
5. Solo pasa a `Aprobada` cuando el usuario lo diga de forma explícita. No la apruebes por
   tu cuenta.

No escribas código, tests ni `plan.md`.
