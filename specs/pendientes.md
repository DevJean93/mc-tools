# Pendientes e ideas

Lo que se ha hablado pero todavía no está decidido. Cuando algo se decide, pasa a
`specs/cambios/NNN-…/propuesta.md` con `/sdd-proponer` y se quita de aquí.

## Propuestas en borrador, sin aclarar

Las ideas de la auditoría inicial ya son propuestas en `Borrador`, cada una con sus preguntas
abiertas. Ya están hechas la 006 (guardar y cargar un proyecto), la 007 (enlace para compartir), la
008 (guías de chunk), la 009 (altura Y de cada capa), la 010 (ficha imprimible), la 013 (versionar por la caché) y la 014 (ficha en fondo claro). El
siguiente paso es `/sdd-aclarar NNN` con la que se quiera decidir primero:

- `011-varios-materiales` — varios materiales por forma (área MAT).
- `012-plantillas` — formas guardadas como plantillas (área FOR).

## Ideas sin propuesta

- **Enlace pegado en la misma pestaña:** con la app ya abierta, pegar un enlace compartido en la barra
  no lo aplica (no se escucha `hashchange`).
- **Fuentes de Google:** la constitución dice «sin red», pero `index.html` carga fuentes de Google (sin
  conexión se usan las del sistema). Decidir si se incluyen en el repositorio o se ajusta el texto.
