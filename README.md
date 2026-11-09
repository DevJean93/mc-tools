# Formas MC

Planificador de formas en bloques para Minecraft. Dibuja la forma en una rejilla numerada, cuenta los materiales y te deja marcar lo que ya construiste.

## Uso rápido

Abre la web publicada: <https://devjean93.github.io/mc-tools/> (portada) y <https://devjean93.github.io/mc-tools/formas/> (Formas MC). Una vez cargada no necesita conexión: las fuentes van con el propio sitio.

En local: `npm install` y `npm run dev` (se abre en `http://localhost:4321/mc-tools/`). Ya no se abre con doble clic (`index.html` desapareció: es un sitio Astro).

## Funciones

- **Formas 2D:** círculo/óvalo, cuadrado/rectángulo, triángulo, rombo y hexágono (lado plano o punta arriba). Ancho y alto hasta 200; «Proporción 1:1» iguala el alto al ancho.
- **Formas 3D:** esfera y cúpula (mitad superior), diámetro hasta 100. Se trabaja capa por capa (la capa 1 es la base). Opcional: escribe la «Y de la base» y cada capa muestra su altura en el texto, la tabla y el PNG.
- **Modo:** sólido o hueco. En hueco, el **grosor del borde** se limita automáticamente al máximo que aún deja interior; si pides más, se recorta y se avisa.
- **Numeración:**
  - Regla 1..N en los bordes (cada 2 o 5 con poco zoom).
  - Regla relativa al centro: cuenta como los ejes, sin signos: el centro vale 1 y se llega hasta el borde (`8 … 2 1 | 1 2 … 8` con centro de 2×2; `8 … 2 1 2 … 8` con centro de 1×1). La línea de información dice la posición con flechas (`← 13, ↑ 11`).
  - Tramos por fila (derecha) y por columna (abajo): bloques seguidos, p. ej. `3 · 8 · 3`.
  - Tramos dentro del dibujo y distancia al centro sobre los ejes centrales.
  - Con mucho zoom, al desplazar el dibujo las reglas izquierda y superior se quedan fijas en el borde visible.
  - Guías de chunk (opcional): escribe la X y la Z del bloque central (F3 en el juego) y una línea fucsia marca cada frontera de chunk (cada 16 bloques del mundo).
  - Resumen: tamaño del centro y bloques del centro a cada borde.
- **Marcar lo construido:** clic o arrastre marca, clic derecho desmarca; botones para marcar/desmarcar la capa o todo. El clic en el número de una fila o columna de la regla marca o desmarca la línea entera (un solo paso de deshacer; `F` y `C` lo hacen con el cursor del teclado). Con el dibujo enfocado: flechas (Mayús = 5 celdas), Espacio/Intro, RePág/AvPág para cambiar de capa. `Ctrl+Z` / `Ctrl+Y` deshacen y rehacen. El progreso se guarda en el navegador y se recupera al volver.
- **Zoom:** de 2 a 48 px por bloque con los botones −/+, el deslizador, `Ctrl` + rueda (hacia el puntero), pellizcando en pantallas táctiles o con `+`/`-` en el teclado. **Ajustar** (o `0`) encaja la capa entera en la ventana, y si la forma crece y deja de caber, el zoom se reduce solo. Con poco zoom se ocultan los números que no caben y la regla numera cada 2, 5, 10… bloques.
- **En pantallas táctiles:** un toque corto marca el bloque, el toque en el número de una fila o columna de la regla la marca entera, arrastrar con un dedo mueve el dibujo (y la página cuando ya no cabe) y dos dedos hacen zoom.
- **Proyecto:** «Guardar proyecto» descarga un archivo `.json` con la forma y lo construido, y «Cargar proyecto» lo recupera (con aviso y «Deshacer»). Sirve de copia de seguridad y para pasar la obra a otro dispositivo; funciona aunque el navegador no pueda guardar.
- **Litematica:** en «Proyecto», «Descargar para Litematica» baja la forma entera (todas las capas, sin las marcas) como un `.litematic` para el mod Litematica de Minecraft 1.21.x, con el bloque que elijas en una lista corta (piedra por defecto, se recuerda). No lleva posición: se coloca en el juego. «Importar de Litematica» recupera la forma de un esquema descargado desde aquí (con aviso y «Deshacer» si se pierden marcas); los esquemas de otros programas se rechazan.
- **Enlace para compartir:** «Copiar enlace» copia una dirección que abre la misma forma (tipo, tamaño, modo, grosor…) sin lo construido; para pasar también el progreso, guarda un proyecto.
- **Tema claro u oscuro:** el botón de sol/luna de la cabecera (también en la portada) alterna entre los dos temas sin recargar; sin elección guardada se sigue el tema del sistema, y al tocarlo la elección se recuerda (clave `mc-tema`). El PNG sale con los colores del tema activo; la ficha imprimible siempre va en papel.
- **Exportar:** PNG de la capa actual o de todas las capas (una imagen por capa), con cabecera de forma, capa, bloques y fecha.
- **Imprimir ficha:** abre el diálogo de impresión (o «Guardar como PDF») con una ficha limpia, sin marcas: una página con el nombre, los materiales y, en 3D, la tabla por capas, y una página por capa con su dibujo numerado, en fondo blanco y verde suave para gastar poca tinta. Con capas de más de 60 bloques avisa de que las cifras saldrán pequeñas.

Si cambias la geometría con bloques marcados, las marcas se limpian y aparece un aviso con **Deshacer**.

## Materiales

| Unidad | Bloques |
|---|---:|
| 1 stack | 64 |
| 1 shulker box = 27 stacks | 1728 |
| 1 cofre doble = 54 stacks | 3456 |

Se muestran el total, los stacks, cuántos shulkers/cofres hacen falta (redondeado hacia arriba), los construidos y los que faltan. En 3D hay una tabla por capa con su porcentaje hecho.

## Límites conocidos

- Esfera/cúpula hasta 100 de diámetro.
- El progreso se guarda solo en el `localStorage` de ese navegador y equipo; borrar los datos del sitio lo elimina. Para no perderlo, guarda un proyecto en un archivo.
- Las imágenes muy grandes (zoom alto + forma grande) pueden fallar al exportar: reduce el zoom.
- Un solo material por forma.
- El enlace no lleva las marcas. Los enlaces de antes de la migración (`…/mc-tools/#forma=…`) siguen funcionando: la portada los redirige a `/formas/`. En local el enlace apunta a `localhost`: para compartirlo con otros hay que usar la web publicada.
- Pegar un enlace en una pestaña con la app ya abierta no lo aplica: ábrelo en una pestaña nueva.
- Tras publicar un cambio, un navegador que ya tenía la web puede tardar hasta unos 10 minutos en verlo (caché de GitHub Pages); recargar lo acelera. La versión del pie dice cuál se está ejecutando.

## Estructura

Sitio estático con [Astro](https://astro.build) (sin framework de interfaz), publicado en GitHub Pages bajo `/mc-tools/`.

| Archivo | Rol |
|---|---|
| `astro.config.mjs` | `site` y `base` (`/mc-tools`) del sitio. |
| `src/pages/index.astro` | Portada: presentación con dibujo en vivo, funciones, lista de herramientas y redirección de los enlaces antiguos. |
| `src/pages/formas/index.astro` | Formas MC: estructura del panel y del área de dibujo, y el script de la app. |
| `src/layouts/Base.astro` | Cabecera del documento, aviso de Mojang y pie con la versión. |
| `src/compartido/` | Lo que comparten las herramientas: versión del pie (`version.js`), fuentes autoalojadas (`fuentes.css`) el tema claro/oscuro (`tema.js` y el botón `BotonTema.astro`) y el dibujo en vivo de la portada (`dibujoVivo.js`). |
| `src/herramientas/formas/estilos.css` | Tokens de color/tipografía (el canvas lee los mismos) y layout. |
| `src/herramientas/formas/nucleo/almacen.js` | Almacenamiento clave/valor (localStorage o memoria), inyectable y sin lanzar errores. |
| `src/herramientas/formas/nucleo/formas.js` | Geometría pura y registro de formas, sin DOM. |
| `src/herramientas/formas/nucleo/estado.js` | Valores por defecto, validación, persistencia y firma de geometría. |
| `src/herramientas/formas/nucleo/documento.js` | Forma, marcas, proyecto y enlace: la lógica del documento. |
| `src/herramientas/formas/nucleo/historial.js` | Deshacer/rehacer con límite de pasos. |
| `src/herramientas/formas/nucleo/marcas.js` | Bloques marcados como construidos. |
| `src/herramientas/formas/nucleo/materiales.js` | Stacks, shulkers, cofres, porcentajes, resumen del centro y la lista de bloques del esquema. |
| `src/herramientas/formas/nucleo/nbt.js` | Lector y escritor de NBT (el formato de datos de Minecraft), sin DOM. |
| `src/herramientas/formas/nucleo/litematica.js` | El esquema `.litematic` (NBT con gzip): empaquetado, escritura y lectura. |
| `src/herramientas/formas/dibujo/render.js` | Dibujo de una capa en canvas por capas encadenables (pantalla y exportación). |
| `src/herramientas/formas/dibujo/zoom.js` | Zoom, anclaje al puntero y ajuste a la ventana. |
| `src/herramientas/formas/interfaz/` | `avisos`, `vista-materiales`, `panel`, `exportar` (PNG y ficha) y `menu`. |
| `src/herramientas/formas/entrada/` | `raton`, `tactil` y `teclado`. |
| `src/herramientas/formas/app.js` | Raíz de composición: crea los módulos, inyecta dependencias y conecta eventos. |

Los scripts son módulos ES (`import`/`export`); Astro y Vite los empaquetan con una huella en el nombre de cada archivo.

Las pruebas viven en `tests/unit/` (Vitest), `tests/e2e/` (Edge headless contra `astro preview`) y
`tests/herramientas/` (validador de specs). Las specs están en `specs/`: la constitución,
las áreas vivas (`specs/areas/<área>/spec.md`) y las propuestas de cambio
(`specs/cambios/`). Se versionan en git y no se publican.

## Desarrollo

```bash
npm install        # una vez
npm run dev        # servidor local en http://localhost:4321/mc-tools/
npm run build      # construye el sitio en dist/
npm run preview    # sirve dist/ (tras build)
npm run check      # astro check: comprobación del proyecto
npm test           # tests unitarios (Vitest), incluido el validador de specs
npm run e2e        # construye, sirve y comprueba en Edge headless (móvil y escritorio)
npm run specs      # valida las specs e imprime la cobertura requisito -> tests
```

## Publicación

Al subir a `main`, GitHub Actions (`.github/workflows/deploy.yml`) ejecuta `check`, las pruebas y el build, y solo si
todo pasa despliega `dist/` en GitHub Pages. En Ajustes > Pages del repositorio el origen debe ser **GitHub Actions**
(ya no «Deploy from a branch»). El pie muestra el commit corto desplegado.

## Metodología (SDD)

La spec es la fuente de verdad; el código y los tests la implementan.

1. Un cambio de comportamiento empieza con una propuesta en `specs/cambios/NNN-…/`.
2. La propuesta pasa por `Borrador` → `En revisión` → `Aprobada` (solo se aprueba con el
   visto bueno explícito).
3. Con `Aprobada` se escribe `plan.md` y se implementa tarea a tarea: primero el test en
   rojo con el ID del requisito, después el código.
4. Al terminar, el delta se aplica al área (`specs/areas/<área>/spec.md`) y la propuesta se
   archiva en `specs/cambios/archivo/`.

Cada requisito vigente tiene al menos un test que cita su ID (`NUM-07: …`). Solo se admite
`[verificación manual]`, con motivo, en lo puramente visual. El detalle está en
`specs/README.md` y los principios en `specs/constitucion.md`.

## Aviso

Proyecto no oficial. No está afiliado a Mojang Studios ni a Microsoft.

## Licencia

© 2026 DevJean93. Todos los derechos reservados. Puedes usar la app en la web y leer el código,
pero no copiarlo, modificarlo ni redistribuirlo sin permiso.
