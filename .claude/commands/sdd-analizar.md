---
description: Informe de solo lectura sobre cobertura y estado de las specs
argument-hint: [NNN | área]
---

Alcance: $ARGUMENTS (si está vacío, todo el proyecto)

No edites ningún archivo. Genera un informe en español con:

1. **Cobertura:** ejecuta `npm run specs` y resume los IDs sin test, los que solo tienen
   `[verificación manual]` (con su motivo) y los que citan tests que no parecen comprobar lo
   que dice el requisito.
2. **Huérfanos:** IDs citados en `tests/` que no existen en ningún área, e IDs retirados que
   se siguen citando.
3. **Propuestas atascadas:** estado actual, días desde el último commit de su carpeta y qué
   falta para avanzar. Señala preguntas abiertas en estados que no las admiten.
4. **Choques con la constitución:** dependencias nuevas, lógica con DOM fuera de
   `interfaz`/`dibujo`/`entrada`, cambios en `mc-formas-v1*` o en la firma sin migración,
   tests sin ID en requisitos vigentes.
5. **Siguiente paso recomendado**, en una frase.

Si el alcance es un área, limita el informe a ella; si es una propuesta, a su carpeta.
