import { defineConfig } from 'astro/config';

// Sitio estático en GitHub Pages: https://devjean93.github.io/mc-tools/
export default defineConfig({
  site: 'https://devjean93.github.io',
  base: '/mc-tools',
  trailingSlash: 'always',
  // El HTML se sirve tal cual (sin colapsar espacios): el diseño de la app no debe cambiar.
  compressHTML: false,
  // Hojas de estilos siempre como archivo aparte con huella (PUB-05), nunca incrustadas.
  build: { inlineStylesheets: 'never' },
});
