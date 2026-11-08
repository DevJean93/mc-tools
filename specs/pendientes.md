# Pendientes e ideas

Lo que se ha hablado pero todavía no está decidido. Cuando algo se decide, pasa a
`specs/cambios/NNN-…/propuesta.md` con `/sdd-proponer` y se quita de aquí.

## Propuestas en borrador, sin aclarar

Las ideas de la auditoría inicial ya son propuestas en `Borrador`, cada una con sus preguntas
abiertas. Ya están hechas la 006 (guardar y cargar un proyecto), la 007 (enlace para compartir), la
008 (guías de chunk), la 009 (altura Y de cada capa), la 010 (ficha imprimible), la 013 (versionar por la caché), la 014 (ficha en fondo claro), la 015 (migración a Astro) y la 018 (tema claro y oscuro). El
siguiente paso es `/sdd-aclarar NNN` con la que se quiera decidir primero:

- `011-varios-materiales` — varios materiales por forma (área MAT).
- `012-plantillas` — formas guardadas como plantillas (área FOR).
- `016-litematica` — exportar e importar archivos de Litematica (áreas MAT, FOR e INT).
- `017-portada` — portada más completa: presentación, imagen de la herramienta y funciones (área PUB).

## Ideas sin propuesta

- **Migración a TypeScript, módulo a módulo:** los módulos ya son ES, pero conservan el objeto de espacio de
  nombres y el envoltorio de función (`export const Formas = (() => {…})()`). Pasarlos a `.ts` con
  exportaciones con nombre y tipos, de uno en uno y sin cambiar comportamiento; `astro check` ya está listo.
- **Enlace pegado en la misma pestaña (`hashchange`):** con la app ya abierta, pegar un enlace compartido en
  la barra no lo aplica (no se escucha `hashchange`).
