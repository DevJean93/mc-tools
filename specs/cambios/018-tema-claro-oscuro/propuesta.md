# 018 · Tema claro y oscuro con selector

## Estado

Borrador

## Motivo

La app y la portada solo tienen tema oscuro (`color-scheme: dark`, paleta slate). Con luz de día, en
exteriores o para quien lee mejor texto oscuro sobre fondo claro, cuesta usarla, y hay quien prefiere
un tema claro sin más. Un selector de tema que se recuerde entre visitas permite elegir sin perder la
preferencia al recargar.

## Áreas afectadas

- `INT` (interfaz): el selector, los colores del tema claro y la persistencia.
- `PUB` (publicación): la portada y el pie comparten el tema y el selector.
- `MAT` (materiales y exportación): qué colores lleva la imagen exportada según el tema.

La ficha imprimible no cambia: siempre usa la paleta para papel (`MAT-14`).

## Delta

### Añade

- `INT-16`: un selector de tema, visible en la cabecera de la app y de la portada, cambia entre tema
  claro y oscuro al instante, sin recargar y sin perder la forma ni las marcas. Tiene nombre accesible,
  dice cuál es el tema actual (`aria-pressed` o equivalente), un icono de contorno (sol / luna) y mide
  44 px en móvil.
- `INT-17`: el tema elegido se recuerda en el navegador y se aplica al volver, en la app y en la
  portada, antes de pintar la página (sin parpadeo del otro tema). Si el navegador no deja guardar,
  el selector sigue funcionando en esa visita. Guardarlo no toca las claves `mc-formas-v1*`.
- `INT-18`: el tema claro tiene su propia paleta para la interfaz y para el lienzo: el texto y las
  cifras sobre los bloques mantienen un contraste de al menos 4,5:1, y el centro, los ejes, los
  construidos y las guías de chunk se siguen distinguiendo sin depender solo del color, igual que en
  el tema oscuro.

### Modifica

- `MAT-07` (alcance pendiente de aclarar: los colores del PNG exportado con el tema claro).

### Retira

Nada.

## Criterios de aceptación

- **Dado** la app en tema oscuro, **cuando** se toca el selector, **entonces** toda la interfaz y el
  lienzo pasan a tema claro sin recargar y la forma y las marcas siguen igual (`INT-16`).
- **Dado** el tema claro elegido, **cuando** se recarga o se vuelve otro día, **entonces** la app
  abre en tema claro sin mostrar antes el oscuro (`INT-17`).
- **Dado** el tema claro elegido en la app, **cuando** se abre la portada, **entonces** también está
  en tema claro (`INT-17`).
- **Dado** el tema claro, **cuando** se mide el contraste de las cifras sobre los bloques y del texto
  sobre el fondo, **entonces** es de al menos 4,5:1 (`INT-18`).
- **Dado** el tema claro, **cuando** se ve en escala de grises, **entonces** el centro, los ejes y los
  construidos se distinguen de los bloques normales (`INT-18`).
- **Dado** el móvil (390 px), **cuando** se abre la app, **entonces** el selector cabe en la cabecera
  y mide al menos 44 px (`INT-16`).
- **Dado** el tema oscuro, **cuando** se compara el lienzo con la versión anterior, **entonces** es
  idéntico píxel a píxel (`INT-18`).

## Preguntas abiertas

- `[NECESITA ACLARACIÓN: La primera vez (sin tema guardado), ¿qué tema se ve: el del sistema (prefers-color-scheme), siempre oscuro como ahora, o siempre claro? ¿Y el selector tiene dos posiciones (claro / oscuro) o tres (claro / oscuro / según el sistema)?]`
- `[NECESITA ACLARACIÓN: ¿El PNG exportado sigue siempre en oscuro como ahora, sigue el tema activo, o pasa siempre a claro?]`
- `[NECESITA ACLARACIÓN: En el tema claro, ¿el lienzo también es claro (fondo blanco como la ficha, MAT-14) o se queda oscuro aunque el resto de la interfaz sea clara?]`
- `[NECESITA ACLARACIÓN: ¿Dónde va el selector: en la cabecera junto a «Ocultar menú» (y en la cabecera de la portada), o dentro de la sección «Vista» del menú?]`
