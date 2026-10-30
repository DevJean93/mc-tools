# Specs de Formas MC

Las specs son la fuente de verdad de **qué** hace la app y **por qué**, sin entrar en
tecnología. El código y los tests las implementan. Están versionadas en git y se excluyen
de GitHub Pages.

## Dos piezas

- **Áreas vivas** (`specs/areas/<área>/spec.md`): describen el comportamiento actual y
  siempre dicen la verdad de hoy. Cada área tiene un código y requisitos numerados.
- **Propuestas de cambio** (`specs/cambios/NNN-<nombre>/`): describen una mejora, su delta
  sobre las áreas y cómo se va a hacer. Al terminar, el delta se aplica al área y la
  propuesta se archiva en `specs/cambios/archivo/`.

## Áreas y códigos

| Área | Código | Carpeta |
|---|---|---|
| Formas | `FOR` | `specs/areas/formas/spec.md` |
| Numeración | `NUM` | `specs/areas/numeracion/spec.md` |
| Marcas | `MAR` | `specs/areas/marcas/spec.md` |
| Zoom | `ZOO` | `specs/areas/zoom/spec.md` |
| Táctil | `TAC` | `specs/areas/tactil/spec.md` |
| Materiales | `MAT` | `specs/areas/materiales/spec.md` |
| Interfaz | `INT` | `specs/areas/interfaz/spec.md` |

## Identificadores

- Formato: `CÓDIGO-nn`, con dos dígitos y guion (`NUM-07`, `FOR-12`).
- Son **estables**: nunca se reutilizan. Si un requisito desaparece se marca
  `NUM-nn (retirado en cambio NNN)` y su ID no vuelve a usarse.
- El ID va en el nombre del test que lo verifica: `NUM-07: …`. En los E2E va al principio
  del mensaje: `ok(..., 'NUM-07: …')`.
- Un test técnico (rendimiento, detalle de implementación) puede no llevar ID; el
  validador no lo exige.
- Un requisito sin test automático se escribe igual y se marca `[verificación manual:
  motivo]` dentro de la spec.

## Estados de una propuesta

`Borrador` → `En revisión` → `Aprobada` → `En curso` → `Hecha` (o `Descartada`).

- `Borrador`: recién creada; puede tener preguntas abiertas.
- `En revisión`: las preguntas se están resolviendo con el usuario.
- `Aprobada`: sin preguntas abiertas y con el visto bueno explícito del usuario.
- `En curso`: se está implementando; ya hay `plan.md`.
- `Hecha`: el delta está aplicado al área y la propuesta vive en `archivo/`.
- `Descartada`: no se hará; también se archiva con el motivo.

## Flujo

1. `/sdd-proponer <idea>` crea la propuesta en `Borrador`.
2. `/sdd-aclarar NNN` resuelve las dudas y la pasa a `En revisión`.
3. `/sdd-planificar NNN` exige `Aprobada` y escribe `plan.md`.
4. `/sdd-implementar NNN [Tnn]` ejecuta las tareas: test rojo, código, verde, commit.
5. `/sdd-archivar NNN` aplica el delta al área y mueve la propuesta a `archivo/`.
6. `/sdd-analizar [NNN | área]` informa sin editar: cobertura, huérfanos y bloqueos.

## Comandos

```bash
npm run check   # sintaxis de src/ y tests/ (recursivo)
npm test        # tests unitarios (incluye el validador de specs)
npm run e2e     # comprobaciones en Edge headless
npm run specs   # valida las specs e imprime la cobertura ID -> tests
```

## Reglas de redacción

- Presente de indicativo: «La cuenta de los ejes llega hasta el bloque del borde».
- Un requisito = una frase verificable, con ejemplo concreto si ayuda
  («círculo de 30 → 15 … 1 | 1 … 15»).
- Las decisiones van en `## Decisiones` con su fecha y el motivo: es la historia útil del
  proyecto (lo que se probó, lo que se descartó y por qué).
- Las ideas que aún no son propuesta van en `specs/pendientes.md`.
- Las preguntas abiertas se marcan `[NECESITA ACLARACIÓN: …]` y solo pueden existir en
  `Borrador` o `En revisión`.
