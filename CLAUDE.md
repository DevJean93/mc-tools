# Formas MC

Planificador de formas en bloques para Minecraft. Se abre con doble clic en `index.html`:
sin dependencias, sin build y sin red. Scripts clásicos (IIFE + espacio de nombres global)
que también se exportan a Node para los tests. Todo en español.

## Comandos

```bash
npm run check   # sintaxis de src/ y tests/ (recursivo)
npm test        # tests unitarios (incluye el validador de specs)
npm run e2e     # 63 comprobaciones en Edge headless vía CDP
npm run specs   # valida las specs e imprime la cobertura ID -> tests
```

## Estructura

- `src/nucleo/` — lógica pura sin DOM (`formas`, `estado`, `documento`, `marcas`,
  `historial`, `materiales`, `almacen`).
- `src/dibujo/` — canvas (`render`, `zoom`).
- `src/interfaz/` — DOM del panel, avisos, menú, exportación.
- `src/entrada/` — ratón, táctil y teclado.
- `src/app.js` — raíz de composición; no tiene reglas de negocio.
- `tests/unit/`, `tests/e2e/`, `tests/herramientas/`.
- `specs/` — constitución, áreas vivas y propuestas de cambio.

## Metodología (SDD)

La spec es la fuente de verdad; el código y los tests la implementan.

1. Un cambio de comportamiento empieza con una propuesta en `specs/cambios/NNN-…/`.
2. La propuesta pasa por `Borrador` → `En revisión` → `Aprobada` (solo el usuario aprueba).
3. Con `Aprobada` se escribe `plan.md` y se implementa tarea a tarea: primero el test en
   rojo con el ID del requisito, después el código.
4. Al terminar, el delta se aplica al área (`specs/areas/<área>/spec.md`) y la propuesta se
   archiva en `specs/cambios/archivo/`.

Detalle y comandos: `specs/README.md`. Principios: `specs/constitucion.md`.

## Reglas

- Cada requisito vigente tiene al menos un test que cita su ID (`NUM-07: …`). Solo se
  admite `[verificación manual]`, con motivo, en lo puramente visual.
- Test primero: rojo y luego verde. Un bug se corrige con un test de regresión con ID.
- No se tocan las claves `mc-formas-v1*` ni la firma de las marcas sin migración y test.
- En tareas de interfaz se usa la skill `ui-ux-pro-max` y se valida con capturas reales
  (móvil 390×844 con toques reales y escritorio).
- Lo mínimo que cumple la spec. Una dependencia nueva exige enmendar la constitución.
- Commits en español y **sin push** salvo que el usuario lo pida.

## Trampas conocidas

- **E2E con Edge headless:** `edge.kill()` no cierra el navegador en Windows. Si hay
  `msedge.exe --headless` huérfanos en el puerto 9333, la siguiente ejecución se conecta al
  navegador viejo (con su emulación móvil) y falla en masa. El arnés cierra por carpeta de
  perfil; si hace falta, matar los procesos a mano.
- **`file://`:** todas las páginas locales comparten el mismo `localStorage`. Los E2E lo
  limpian entre escenarios.
- **Firma de marcas:** un cambio real de geometría borra las marcas. No ampliar la firma
  con zoom ni opciones de vista.
- **Dibujo:** si un cambio no debe alterarlo, comprobar píxel a píxel contra la versión
  anterior antes de dar por hecho el trabajo.
- **Toques simulados con CDP:** en `Input.dispatchTouchEvent`, los puntos de `touchEnd` son los
  dedos que **se levantan**, no los que quedan. Pasar los que siguen apoyados levanta esos.
- **Cifras del lienzo:** solo se pintan con celdas de 16 px o más; en una captura con poco zoom
  no aparecen y no es un fallo.

## Publicación

GitHub Pages desde la rama `main`, carpeta raíz: `https://devjean93.github.io/mc-tools/`, sin
dominio propio. `_config.yml` excluye de la web `specs/`, `.claude/`, `CLAUDE.md`, `tests/` y
`package.json`; la app es `index.html` + `src/`. No se hace push sin que lo pida el usuario.

## Dónde está cada cosa

- Qué hace la app y por qué: `specs/areas/<área>/spec.md` (con sus `## Decisiones`).
- Cambios en marcha: `specs/cambios/NNN-…/` (`propuesta.md` y `plan.md`, versionados).
- Ideas sin propuesta: `specs/pendientes.md`.
- Historia: `git log` (un commit por tarea).
