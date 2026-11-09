# Pendientes e ideas

Lo que se ha hablado pero todavía no está decidido. Cuando algo se decide, pasa a
`specs/cambios/NNN-…/propuesta.md` con `/sdd-proponer` y se quita de aquí. Las ideas de la auditoría inicial
ya son propuestas hechas y archivadas (006 a 018, en `specs/cambios/archivo/`): aquí solo quedan las ideas
que todavía no tienen propuesta.

## Ideas sin propuesta

- **Migración a TypeScript, módulo a módulo:** los módulos ya son ES, pero conservan el objeto de espacio de
  nombres y el envoltorio de función (`export const Formas = (() => {…})()`). Pasarlos a `.ts` con
  exportaciones con nombre y tipos, de uno en uno y sin cambiar comportamiento; `astro check` ya está listo.
- **Enlace pegado en la misma pestaña (`hashchange`):** con la app ya abierta, pegar un enlace compartido en
  la barra no lo aplica (no se escucha `hashchange`).
