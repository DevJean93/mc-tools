---
description: Crea una propuesta SDD en Borrador a partir de una idea
argument-hint: <idea>
---

Idea del usuario: $ARGUMENTS

Trabaja en español y en modo solo lectura sobre el código (no implementes nada).

1. Lee `specs/constitucion.md`, `specs/README.md` y todas las specs de
   `specs/areas/*/spec.md`.
2. Identifica qué áreas toca la idea. Si no encaja en ninguna, dilo y propone si hace falta
   un área nueva.
3. Toma el siguiente número libre en `specs/cambios/` (tres dígitos) y crea
   `specs/cambios/NNN-<nombre-corto-en-kebab-case>/propuesta.md` usando
   `specs/_plantillas/propuesta.md`.
4. Rellena `## Estado` con `Borrador`, `## Motivo`, `## Áreas afectadas` y `## Delta`
   (Añade / Modifica / Retira) con IDs `CÓDIGO-nn` nuevos o existentes. No reutilices IDs
   retirados.
5. Escribe los criterios de aceptación en formato Dado / Cuando / Entonces.
6. Añade como máximo 5 `[NECESITA ACLARACIÓN: …]` concretas en `## Preguntas abiertas`.

No decidas tecnología, no escribas código ni tests y no apruebes la propuesta.
Al terminar, resume el número asignado y las preguntas abiertas.
