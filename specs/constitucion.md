# Constitución de Formas MC

Versión: 2.0 — 08/11/2026

Estos principios no son negociables. Un cambio que los contradiga exige enmendar este
documento antes de implementarse.

## Principios

1. **Sitio estático.** La app se construye con Astro y se publica como archivos estáticos:
   sin servidor ni servicios propios, y sin pedir nada a otros dominios una vez cargada. Se
   usa desde la web publicada o con `npm run dev` en local; ya no se abre con doble clic.

2. **Idioma.** La interfaz, las specs, los comentarios y los commits van en español.

3. **Módulos.** Módulos ES con `import/export`. Una responsabilidad por módulo. La lógica
   pura no toca el DOM y se prueba sin navegador; el DOM se inyecta; el archivo raíz de cada
   herramienta solo compone. Se extiende por registro (`Formas.registrar`,
   `Render.registrar`), no editando listas a mano.

4. **Spec primero.** Todo cambio de comportamiento pasa antes por una propuesta en
   `specs/cambios/`. Los errores se corrigen con un test de regresión que lleva el ID del
   requisito.

5. **Test primero.** Primero el test en rojo, después el código. Todo requisito vigente
   tiene al menos un test que cita su ID. Solo se admite `[verificación manual]`, con su
   motivo, en lo puramente visual.

6. **Compatibilidad de datos.** Las claves `mc-formas-v1*` y la firma de las marcas no
   cambian sin migración y sin un test con cadenas de referencia. La migración a Astro las
   conserva tal cual.

7. **Accesibilidad y móvil.**
   - objetivos táctiles de 44 px;
   - `role` y `aria` donde haga falta;
   - nunca transmitir información solo por color;
   - respeto a `prefers-reduced-motion`;
   - campos de texto a 16 px.

   En toda tarea de interfaz se usa la skill `ui-ux-pro-max`.

8. **Definición de hecho.**
   - `npm run check`, `npm test` y `npm run e2e` en verde;
   - capturas reales revisadas en móvil (390×844, toques reales) y escritorio;
   - comparación píxel a píxel cuando el dibujo no deba cambiar;
   - sin errores de consola.

9. **Simplicidad.** Lo mínimo que cumple la spec. Una dependencia nueva exige una propuesta
   y enmendar esta constitución. Vigentes: `astro`, `vitest`, `typescript` (con
   `@astrojs/check`) y `@fontsource`, todas de build o de desarrollo: al navegador solo
   llegan archivos estáticos.

10. **Enmiendas.** Se anotan al final de este archivo con fecha, versión y motivo.

## Enmiendas

- **2.0 — 08/11/2026.** Migración a Astro (propuesta 015). Cambian los principios 1
  (sitio estático en vez de doble clic y sin build), 3 (módulos ES en vez de IIFE y globales),
  6 (se anota que la migración conserva los datos) y 9 (dependencias vigentes). Motivo: poder
  alojar varias herramientas MC en un sitio y hacer crecer cada una con módulos, tipos y
  versionado automático.
