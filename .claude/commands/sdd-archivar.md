---
description: Aplica el delta de una propuesta al área y la archiva
argument-hint: [NNN]
---

Propuesta: $ARGUMENTS

1. Exige que la propuesta esté `En curso` (o `Aprobada` si ya está implementada) y que
   `npm test` esté en verde.
2. Aplica el `## Delta` a `specs/areas/<área>/spec.md`:
   - **Añade:** crea los requisitos con su ID en el lugar temático, no al final por orden de
     llegada.
   - **Modifica:** reescribe el requisito y anota antes/después en `## Decisiones` con fecha.
   - **Retira:** deja `XXX-nn (retirado en cambio NNN)` y explica el motivo.
3. Añade a `## Decisiones` el porqué del cambio y lo descartado.
4. Pasa el estado de la propuesta a `Hecha` (o `Descartada`, con motivo) y muévela a
   `specs/cambios/archivo/NNN-<nombre>/`.
5. Ejecuta `npm run specs` y `npm test`; el validador debe quedar en verde.
6. Haz un commit en español, sin push.

Si el delta no se puede aplicar tal cual (el área cambió mientras tanto), detente y explica
la discrepancia en vez de inventar.
