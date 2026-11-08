// Versión que muestra el pie: el commit corto desde el que se construyó el sitio (GitHub Actions lo
// da en GITHUB_SHA) o «dev» cuando se construye o se sirve en local.
export function versionDe(entorno) {
  const commit = String((entorno && entorno.GITHUB_SHA) || '').trim();
  return /^[0-9a-f]{7,40}$/i.test(commit) ? commit.slice(0, 7).toLowerCase() : 'dev';
}
