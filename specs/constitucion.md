# Constitución de Formas MC

Versión: 1.0 — 29/10/2026

Estos principios no son negociables. Un cambio que los contradiga exige enmendar este
documento antes de implementarse.

## Principios

1. **Sin instalación.** La app funciona abriendo `index.html` con doble clic: sin
   dependencias, sin build, sin red. Los scripts son clásicos (IIFE + espacio de nombres
   global) y se exportan a Node para las pruebas.

2. **Idioma.** La interfaz, las specs, los comentarios y los commits van en español.

3. **Módulos.** Una responsabilidad por módulo. La lógica pura no toca el DOM y se prueba
   en Node; el DOM se inyecta; `src/app.js` solo compone. Se extiende por registro
   (`Formas.registrar`, `Render.registrar`), no editando listas a mano.

4. **Spec primero.** Todo cambio de comportamiento pasa antes por una propuesta en
   `specs/cambios/`. Los errores se corrigen con un test de regresión que lleva el ID del
   requisito.

5. **Test primero.** Primero el test en rojo, después el código. Todo requisito vigente
   tiene al menos un test que cita su ID. Solo se admite `[verificación manual]`, con su
   motivo, en lo puramente visual.

6. **Compatibilidad de datos.** Las claves `mc-formas-v1*` y la firma de las marcas no
   cambian sin migración y sin un test con cadenas de referencia.

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

9. **Simplicidad.** Lo mínimo que cumple la spec. Una dependencia nueva exige enmendar
   esta constitución.

10. **Enmiendas.** Se anotan al final de este archivo con fecha, versión y motivo.

## Enmiendas

_(ninguna todavía)_
