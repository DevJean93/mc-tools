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
  - Regla relativa al centro: con tamaño **impar** el centro es un bloque (`C`); con tamaño **par** el centro es de 2×2 y no hay 0 (`-1 | 1`).
  - Tramos por fila (derecha) y por columna (abajo): bloques seguidos, p. ej. `3 · 8 · 3`.
  - Tramos dentro del dibujo y distancia al centro sobre los ejes centrales.
  - Resumen: tamaño del centro y bloques del centro a cada borde.
- **Marcar lo construido:** clic o arrastre marca, clic derecho desmarca; botones para marcar/desmarcar la capa o todo. Con el dibujo enfocado: flechas (Mayús = 5 celdas), Espacio/Intro, RePág/AvPág para cambiar de capa. `Ctrl+Z` / `Ctrl+Y` deshacen y rehacen. El progreso se guarda en el navegador y se recupera al volver.
- **Zoom:** de 2 a 48 px por bloque con los botones −/+, el deslizador, `Ctrl` + rueda (hacia el puntero), pellizcando en pantallas táctiles o con `+`/`-` en el teclado. **Ajustar** (o `0`) encaja la capa entera en la ventana, y si la forma crece y deja de caber, el zoom se reduce solo. Con poco zoom se ocultan los números que no caben y la regla numera cada 2, 5, 10… bloques.
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
| `styles.css` | Tokens de color/tipografía (el canvas lee los mismos) y layout. |
| `shapes.js` | Geometría pura (`Formas.generar`), sin DOM; se prueba con Node. |
| `estado.js` | Valores por defecto, validación, persistencia y firma de geometría. |
| `render.js` | Dibujo de una capa en canvas (pantalla y exportación). |
| `app.js` | Interfaz: eventos, marcas, deshacer, materiales y exportación. |

Los scripts son clásicos (sin módulos ES ni `fetch`) para que funcione con `file://`.

## Desarrollo

```bash
npm test        # tests de geometría con node:test (sin dependencias)
npm run check   # verificación sintáctica
```

## Aviso

Proyecto no oficial. No está afiliado a Mojang Studios ni a Microsoft.
