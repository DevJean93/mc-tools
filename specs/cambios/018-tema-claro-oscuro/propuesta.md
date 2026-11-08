# 018 · Tema claro y oscuro con selector

## Estado

En curso

## Motivo

La app y la portada solo tienen tema oscuro (`color-scheme: dark`, paleta slate). Con luz de día, en
exteriores o para quien lee mejor texto oscuro sobre fondo claro, cuesta usarla, y hay quien prefiere
un tema claro sin más. Un selector de tema que se recuerde entre visitas permite elegir sin perder la
preferencia al recargar.

## Áreas afectadas

- `INT` (interfaz): el selector, los colores del tema claro y la persistencia.
- `PUB` (publicación): la portada comparte el tema y el selector.
- `MAT` (materiales y exportación): la imagen exportada sigue el tema activo.

La ficha imprimible no cambia: siempre usa la paleta para papel (`MAT-14`).

## Delta

### Añade

- `INT-16`: un botón de tema en la cabecera de la app (junto a «Ocultar menú») y en la de la portada
  alterna entre tema claro y oscuro al instante, sin recargar y sin perder la forma, las marcas ni el
  historial. Tiene nombre accesible que dice a qué tema cambia, indica el tema actual
  (`aria-pressed`), lleva un icono de contorno (sol en el tema oscuro, luna en el claro) y mide 44 px
  en móvil.
- `INT-17`: sin elección guardada, el tema sigue el del sistema (`prefers-color-scheme`), también si
  el sistema cambia mientras la página está abierta. Al tocar el botón, la elección se guarda en el
  navegador y manda desde entonces, en la app y en la portada, y se aplica antes de pintar la página
  (sin destello del otro tema). Se guarda en una clave propia, sin tocar las claves `mc-formas-v1*`;
  si el navegador no deja guardar, el botón funciona igual durante la visita.
- `INT-18`: el tema claro tiene su propia paleta para la interfaz y para el lienzo (fondo claro,
  bloques verdes, cifras oscuras), distinta de la de papel (`MAT-14`). El texto y las cifras sobre los
  bloques tienen un contraste de al menos 4,5:1, y el centro, los ejes, los construidos y las guías
  de chunk se distinguen sin depender solo del color, igual que en el tema oscuro. El tema oscuro
  queda idéntico al de ahora.

### Modifica

- `MAT-07`:
  - antes: la imagen PNG de la capa se dibuja siempre con los colores oscuros de la app.
  - después: la imagen se dibuja con los colores del tema activo; con el tema oscuro es idéntica a la
    de ahora.
- `PUB-04`:
  - antes: la portada lista las herramientas, el aviso de Mojang y el pie con la versión.
  - después: además lleva el botón de tema de `INT-16` y respeta el tema elegido (`INT-17`).

### Retira

Nada.

## Criterios de aceptación

- **Dado** la app en tema oscuro, **cuando** se toca el botón de tema, **entonces** toda la interfaz y
  el lienzo pasan a tema claro sin recargar y la forma y las marcas siguen igual (`INT-16`).
- **Dado** un sistema en tema claro y nada guardado, **cuando** se abre la app por primera vez,
  **entonces** se ve en tema claro (`INT-17`).
- **Dado** el tema oscuro elegido con el botón y un sistema en tema claro, **cuando** se recarga,
  **entonces** la app abre en oscuro sin mostrar antes el claro (`INT-17`).
- **Dado** el tema claro elegido en la app, **cuando** se abre la portada, **entonces** también está
  en tema claro (`INT-17`, `PUB-04`).
- **Dado** el tema claro, **cuando** se mide el contraste de las cifras sobre los bloques y del texto
  sobre el fondo, **entonces** es de al menos 4,5:1 (`INT-18`).
- **Dado** el tema claro, **cuando** se ve en escala de grises, **entonces** el centro, los ejes y los
  construidos se distinguen de los bloques normales (`INT-18`).
- **Dado** el tema claro, **cuando** se descarga el PNG de una capa, **entonces** sale con los colores
  claros; con el tema oscuro sale idéntico al de antes (`MAT-07`).
- **Dado** el tema oscuro, **cuando** se compara el lienzo con la versión anterior, **entonces** es
  idéntico píxel a píxel (`INT-18`).
- **Dado** el móvil (390 px), **cuando** se abre la app, **entonces** el botón cabe en la cabecera y
  mide al menos 44 px (`INT-16`).

## Decisiones tomadas al aclarar

- 2026-11-08: sin elección guardada se sigue el tema del sistema, y el botón tiene dos posiciones
  (claro / oscuro). Tocarlo guarda la elección. Se descartaron tres posiciones con «Automático»
  (ocupa más en la cabecera del móvil) y abrir siempre en oscuro.
- 2026-11-08: el PNG sigue el tema activo: se descarga como se ve. Se descartaron siempre oscuro y
  siempre claro (para papel ya está la ficha, `MAT-14`).
- 2026-11-08: con el tema claro el lienzo también es claro, con paleta propia. Se descartó dejar el
  lienzo oscuro dentro de una interfaz clara.
- 2026-11-08: el botón va en la cabecera, en la app y en la portada, siempre en el mismo sitio. Se
  descartó ponerlo en «Vista», que la portada no tiene.

## Detalles propuestos al redactar (revisar al implementar)

- Los colores exactos del tema claro se eligen en el plan con la skill `ui-ux-pro-max`, con tests de
  contraste y de luminancia como los de `MAT-14`.
- La clave de guardado propuesta es `mc-tema` (valores `claro` / `oscuro`).
- El tema se aplica con un atributo en `<html>` (p. ej. `data-tema`) y variables CSS; un script en
  línea en el `<head>` lo pone antes de pintar.

## Preguntas abiertas

Ninguna.
