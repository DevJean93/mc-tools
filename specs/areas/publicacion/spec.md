# Área · Publicación

Código: `PUB`

## Propósito

Cubre cómo llega a las personas lo que se despliega: que un navegador que ya tenía la app guardada
reciba la versión nueva en cuanto se publica, y que las herramientas de desarrollo que lo garantizan
no cambien cómo se usa la app (sigue abriéndose con doble clic, sin instalación).

## Requisitos

_(Ninguno todavía: entran al archivar la propuesta 013.)_

## Casos límite

_(Se añaden con los requisitos.)_

## Fuera de alcance

- Qué hace la app una vez cargada (áreas de formas, marcas, interfaz…).
- El alojamiento en sí (GitHub Pages) y su configuración de caché, que no se puede cambiar desde el
  repositorio.

## Decisiones

- 2026-11-08: la publicación es un área propia y no parte de `INT`: trata del despliegue y de los
  archivos, no de la interfaz. Se descartó meterla en `INT` porque mezclaría una herramienta de
  desarrollo con lo que ve la persona que usa la app.
