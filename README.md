# Formas MC

Planificador de formas en bloques para Minecraft. Dibuja la forma en una rejilla numerada, cuenta los materiales y te deja marcar lo que ya construiste.

## Uso rápido

Abre `index.html` con doble clic. No hace falta instalar nada ni conexión (sin Internet se usan las fuentes del sistema).

## Funciones

- **Formas 2D:** círculo/óvalo, cuadrado/rectángulo, triángulo, rombo y hexágono (lado plano o punta arriba). Ancho y alto hasta 200; «Proporción 1:1» iguala el alto al ancho.
- **Formas 3D:** esfera y cúpula (mitad superior), diámetro hasta 100. Se trabaja capa por capa (la capa 1 es la base).
- **Modo:** sólido o hueco. En hueco, el **grosor del borde** se limita automáticamente al máximo que aún deja interior; si pides más, se recorta y se avisa.
- **Numeración:**
  - Regla 1..N en los bordes (cada 2 o 5 con poco zoom).
  - Regla relativa al centro: cuenta como los ejes, sin signos: el centro vale 1 y se llega hasta el borde (`8 … 2 1 | 1 2 … 8` con centro de 2×2; `8 … 2 1 2 … 8` con centro de 1×1). La línea de información dice la posición con flechas (`← 13, ↑ 11`).
  - Tramos por fila (derecha) y por columna (abajo): bloques seguidos, p. ej. `3 · 8 · 3`.
  - Tramos dentro del dibujo y distancia al centro sobre los ejes centrales.
  - Con mucho zoom, al desplazar el dibujo las reglas izquierda y superior se quedan fijas en el borde visible.
  - Resumen: tamaño del centro y bloques del centro a cada borde.
- **Marcar lo construido:** clic o arrastre marca, clic derecho desmarca; botones para marcar/desmarcar la capa o todo. El clic en el número de una fila o columna de la regla marca o desmarca la línea entera (un solo paso de deshacer; `F` y `C` lo hacen con el cursor del teclado). Con el dibujo enfocado: flechas (Mayús = 5 celdas), Espacio/Intro, RePág/AvPág para cambiar de capa. `Ctrl+Z` / `Ctrl+Y` deshacen y rehacen. El progreso se guarda en el navegador y se recupera al volver.
- **Zoom:** de 2 a 48 px por bloque con los botones −/+, el deslizador, `Ctrl` + rueda (hacia el puntero), pellizcando en pantallas táctiles o con `+`/`-` en el teclado. **Ajustar** (o `0`) encaja la capa entera en la ventana, y si la forma crece y deja de caber, el zoom se reduce solo. Con poco zoom se ocultan los números que no caben y la regla numera cada 2, 5, 10… bloques.
- **En pantallas táctiles:** un toque corto marca el bloque, el toque en el número de una fila o columna de la regla la marca entera, arrastrar con un dedo mueve el dibujo (y la página cuando ya no cabe) y dos dedos hacen zoom.
- **Exportar:** PNG de la capa actual o de todas las capas (una imagen por capa), con cabecera de forma, capa, bloques y fecha.

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
- El progreso vive en el `localStorage` de ese navegador y equipo; borrar los datos del sitio lo elimina.
- Las imágenes muy grandes (zoom alto + forma grande) pueden fallar al exportar: reduce el zoom.
- Un solo material por forma.

## Estructura

| Archivo | Rol |
|---|---|
| `index.html` | Estructura del panel y del área de dibujo. |
| `src/estilos.css` | Tokens de color/tipografía (el canvas lee los mismos) y layout. |
| `src/nucleo/almacen.js` | Almacenamiento clave/valor (localStorage o memoria), inyectable y sin lanzar errores. |
| `src/nucleo/formas.js` | Geometría pura y registro de formas, sin DOM; se prueba con Node. |
| `src/nucleo/estado.js` | Valores por defecto, validación, persistencia y firma de geometría. |
| `src/nucleo/historial.js` | Deshacer/rehacer con límite de pasos. |
| `src/nucleo/marcas.js` | Bloques marcados como construidos. |
| `src/nucleo/materiales.js` | Stacks, shulkers, cofres, porcentajes y resumen del centro. |
| `src/dibujo/render.js` | Dibujo de una capa en canvas por capas encadenables (pantalla y exportación). |
| `src/interfaz/avisos.js` | Avisos flotantes, errores y anuncios accesibles. |
| `src/interfaz/vista-materiales.js` | Tabla de capas, totales y barra de progreso. |
| `src/interfaz/panel.js` | Enlace entre el formulario y los parámetros. |
| `src/dibujo/zoom.js` | Zoom, anclaje al puntero y ajuste a la ventana. |
| `src/interfaz/exportar.js` | Exportación PNG de una capa o de todas. |
| `src/interfaz/menu.js` | Menú plegable, hoja móvil y barra inferior. |
| `src/entrada/raton.js` | Ratón y lápiz. |
| `src/entrada/tactil.js` | Toques: marcar, desplazar y pellizcar. |
| `src/entrada/teclado.js` | Cursor de celdas y atajos de teclado. |
| `src/app.js` | Raíz de composición: crea los módulos, inyecta dependencias y conecta eventos. |

Los scripts son clásicos (sin módulos ES ni `fetch`) para que funcione con `file://`.

Las pruebas viven en `tests/unit/` (Node), `tests/e2e/` (Edge headless) y
`tests/herramientas/` (sintaxis y validador). Las specs están en `specs/`: la constitución,
las áreas vivas (`specs/areas/<área>/spec.md`) y las propuestas de cambio
(`specs/cambios/`). Se versionan en git y no se publican en GitHub Pages.

## Desarrollo

```bash
npm test        # 112 tests unitarios, incluido el validador de specs
npm run check   # sintaxis de todos los scripts de src/ y tests/
npm run e2e     # 63 comprobaciones en Edge headless (móvil y escritorio)
npm run specs   # valida las specs e imprime la cobertura requisito -> tests
```

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
