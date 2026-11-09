# Área · Sitio

Código: `SIT`

## Propósito

Cubre lo que comparte el sitio «Herramientas MC» fuera de cada herramienta: la portada, que presenta
el sitio y lleva a cada herramienta, y lo que tengan en común las páginas. Cómo se construye y se
despliega sigue en `PUB`; lo que pasa dentro de cada herramienta, en sus propias áreas.

## Requisitos

### SIT-01

La portada, en la raíz del sitio, lista las herramientas que existen (hoy solo Formas MC), cada una con su
enlace (objetivo táctil de 44 px como mínimo). Lleva el botón de tema (INT-16) en su cabecera y respeta el
tema elegido (INT-17), el aviso de que el proyecto no es oficial de Mojang y el pie con la versión
(PUB-06). No anuncia herramientas futuras ni enlaza a sitios externos.

### SIT-02

La portada abre con una presentación: el nombre del sitio, una frase que dice qué es y para quién, y un
botón principal que lleva a Formas MC. En móvil (390 × 844) y en escritorio (1280 × 800) se ve sin
desplazarse.

### SIT-03

La portada enseña Formas MC con un dibujo en vivo, hecho con el mismo código de dibujo de la app y con los
colores del tema activo (se repinta al cambiar de tema): una esfera de 11 bloques que recorre sus capas
sola, de la base a la cima y en bucle (una capa cada 0,8 s). Con `prefers-reduced-motion` se muestra una
capa fija, sin animación. El dibujo no es interactivo y tiene un texto alternativo que dice qué muestra. La
animación se detiene cuando el dibujo no está a la vista o la pestaña está oculta.

### SIT-04

La portada resume lo que se puede hacer con Formas MC (formas 2D y 3D, numeración, marcar lo construido,
lista de materiales, exportar e imprimir), cada punto con un icono de contorno del mismo estilo que la app y
un texto: la información no depende solo del color.

### SIT-05

El estilo de la portada es el de la app (mismos colores, tipografía y tokens, en los dos temas) con una
rejilla de bloques sutil de fondo, hecha solo con CSS, que no compite con el texto (contraste de al menos
4,5:1 sobre ella). Sin fuentes nuevas. En móvil no hay desplazamiento horizontal y en escritorio el
contenido ocupa la pantalla de forma equilibrada (presentación en dos columnas, funciones en tres).

## Casos límite

- La portada con un fragmento en la URL redirige a `/formas/` antes de pintar nada (PUB-08).
- Sin `IntersectionObserver` el dibujo sigue animándose (solo se detiene con la pestaña oculta); sin
  `ResizeObserver` se dibuja una vez con el ancho inicial.
- Con el almacenamiento bloqueado la portada funciona igual: el tema sigue al sistema (INT-17).

## Fuera de alcance

- El build, la versión de los archivos y el despliegue (área `PUB`).
- La interfaz de Formas MC (área `INT`).

## Decisiones

- 2026-11-08: el sitio es un área propia, separada de `PUB`: la portada es diseño y contenido, y `PUB`
  queda para el build y el despliegue. Se descartó dejar la portada en `PUB` porque mezclaría las dos
  cosas.
- 2026-11-08 (cambio 017): la portada es más que una lista. El dibujo es en vivo y con el código de la app
  (siempre al día y con el tema activo); se descartaron una captura fija (habría que regenerarla) y un
  dibujo quieto. Solo se listan las herramientas que existen (se descartaron las tarjetas «Próximamente»:
  no se promete lo que no hay) y no hay enlaces externos, coherente con «todos los derechos reservados».
  Estilo sobrio de la app con una rejilla de bloques de fondo; se descartaron texturas y títulos
  pixelados, que desentonan con la app y añadirían fuentes.
- 2026-11-08 (cambio 017): la esfera de la portada es de 11 bloques y cambia de capa cada 800 ms. Con
  movimiento reducido se queda en la capa del ecuador (la 6.ª). La rejilla de fondo es el token `--grilla`
  de cada tema (5–6 % de opacidad), con un contraste del texto superior a 6:1 sobre ella. Los tokens siguen
  en `estilos.css` de Formas (la portada lo importa); no se movieron a `compartido/` para no tocar `/formas/`.
