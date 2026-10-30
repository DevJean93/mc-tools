// Lógica pura del validador de specs. Trabaja sobre un mapa { rutaRelativa: contenido },
// así los tests pueden validar repositorios de prueba en memoria.
const fs = require('fs');
const path = require('path');

const SECCIONES_AREA = ['## Propósito', '## Requisitos', '## Casos límite', '## Fuera de alcance', '## Decisiones'];
const SECCIONES_PROPUESTA = ['## Estado', '## Motivo', '## Áreas afectadas', '## Delta', '## Criterios de aceptación', '## Preguntas abiertas'];
const ESTADOS = ['Borrador', 'En revisión', 'Aprobada', 'En curso', 'Hecha', 'Descartada'];
const ESTADOS_CON_PREGUNTAS = ['Borrador', 'En revisión'];
const ESTADOS_ARCHIVADOS = ['Hecha', 'Descartada'];
const RE_ID = /\b([A-Z]{3})-(\d{2})\b/g;

const posix = p => p.split(path.sep).join('/');

function recorrer(carpeta, raiz, salida) {
  for (const entrada of fs.readdirSync(carpeta, { withFileTypes: true })) {
    if (entrada.name === 'node_modules' || entrada.name.startsWith('.')) continue;
    const completa = path.join(carpeta, entrada.name);
    if (entrada.isDirectory()) recorrer(completa, raiz, salida);
    else if (/\.(md|js)$/.test(entrada.name)) salida[posix(path.relative(raiz, completa))] = fs.readFileSync(completa, 'utf8');
  }
}

// Lee specs/ y tests/ del repositorio como un mapa de fuentes.
function leerFuentes(raiz) {
  const salida = {};
  for (const nombre of ['specs', 'tests']) {
    const carpeta = path.join(raiz, nombre);
    if (fs.existsSync(carpeta)) recorrer(carpeta, raiz, salida);
  }
  return salida;
}

// Devuelve el cuerpo de una sección, hasta la siguiente cabecera del mismo nivel o superior.
function seccion(texto, titulo) {
  const nivel = (titulo.match(/^#+/)[0] || '#').length;
  const buscar = new RegExp('^' + escapar(titulo) + '\\s*$', 'm');
  const encontrado = buscar.exec(texto);
  if (!encontrado) return null;
  const resto = texto.slice(encontrado.index + encontrado[0].length);
  const fin = resto.search(new RegExp('^#{1,' + nivel + '} ', 'm'));
  const cuerpo = fin < 0 ? resto : resto.slice(0, fin);
  return cuerpo;
}

function escapar(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ids(texto) {
  return [...texto.matchAll(RE_ID)].map(m => `${m[1]}-${m[2]}`);
}

function estadoDe(texto) {
  const cuerpo = seccion(texto, '## Estado');
  if (cuerpo === null) return null;
  return cuerpo.split(/\r?\n/).map(l => l.trim()).find(Boolean) || '';
}

function validarConstitucion(fuentes, errores) {
  const texto = fuentes['specs/constitucion.md'];
  if (!texto) {
    errores.push('Falta specs/constitucion.md.');
    return;
  }
  const principios = texto.match(/^\d+\.\s+\*\*/gm) || [];
  if (principios.length < 5) errores.push('specs/constitucion.md: no tiene principios numerados (se esperan al menos 5).');
}

function parsearAreas(fuentes, errores) {
  const areas = new Map();
  for (const [ruta, texto] of Object.entries(fuentes)) {
    if (!/^specs\/areas\/[^/]+\/spec\.md$/.test(ruta)) continue;
    const codigoM = texto.match(/Código:\s*`?([A-Z]{3})`?/);
    if (!codigoM) {
      errores.push(`${ruta}: falta «Código: XXX».`);
      continue;
    }
    const codigo = codigoM[1];
    if (areas.has(codigo)) {
      errores.push(`${ruta}: el código ${codigo} ya lo usa ${areas.get(codigo).ruta}.`);
      continue;
    }
    for (const titulo of SECCIONES_AREA) {
      if (!texto.includes(titulo)) errores.push(`${ruta}: falta la sección «${titulo}».`);
    }
    const requisitos = new Map();
    const buscar = /^###\s+([A-Z]{3})-(\d{2})\s*$/gm;
    let hallado;
    while ((hallado = buscar.exec(texto))) {
      const ident = `${hallado[1]}-${hallado[2]}`;
      if (hallado[1] !== codigo) errores.push(`${ruta}: el requisito ${ident} no lleva el prefijo ${codigo}-.`);
      if (requisitos.has(ident)) {
        errores.push(`${ruta}: el ID ${ident} está repetido.`);
        continue;
      }
      const resto = texto.slice(hallado.index + hallado[0].length);
      const fin = resto.search(/^#{2,3}\s/m);
      const cuerpo = fin < 0 ? resto : resto.slice(0, fin);
      requisitos.set(ident, {
        id: ident,
        cuerpo,
        retirado: /\(retirado en cambio \d{3}\)/.test(cuerpo),
      });
    }
    areas.set(codigo, { codigo, ruta, texto, requisitos });
  }
  return areas;
}

// Los archivos del propio validador no cuentan como cobertura ni como citas.
function archivosDePrueba(fuentes) {
  return Object.entries(fuentes).filter(([ruta]) => ruta.startsWith('tests/') && ruta.endsWith('.js')
    && !ruta.startsWith('tests/herramientas/') && ruta !== 'tests/unit/specs.test.js');
}

function buscarRequisito(areas, ident) {
  for (const area of areas.values()) if (area.requisitos.has(ident)) return area.requisitos.get(ident);
  return null;
}

function validarCobertura(fuentes, areas, errores) {
  const pruebas = archivosDePrueba(fuentes);
  const cobertura = [];

  for (const [ruta, texto] of pruebas) {
    const citados = new Set(ids(texto));
    for (const ident of citados) {
      const requisito = buscarRequisito(areas, ident);
      if (!requisito) errores.push(`${ruta}: cita ${ident}, que no existe en ninguna área (huérfano).`);
      else if (requisito.retirado) errores.push(`${ruta}: cita ${ident}, que está retirado.`);
    }
  }

  for (const area of areas.values()) {
    for (const [ident, requisito] of area.requisitos) {
      if (requisito.retirado) continue;
      const tests = pruebas.filter(([, texto]) => new RegExp(`\\b${ident}\\b`).test(texto)).map(([ruta]) => ruta);
      const manual = /\[verificación manual:\s*\S[^\]]*\]/.test(requisito.cuerpo);
      if (!tests.length && !manual) errores.push(`El requisito ${ident} (${area.ruta}) está sin test.`);
      cobertura.push({ id: ident, area: area.codigo, tests });
    }
  }

  cobertura.sort((a, b) => a.id.localeCompare(b.id));
  return cobertura;
}

function validarPropuestas(fuentes, areas, errores) {
  for (const [ruta, texto] of Object.entries(fuentes)) {
    if (!ruta.startsWith('specs/cambios/') || !ruta.endsWith('/propuesta.md')) continue;
    const partes = ruta.match(/^specs\/cambios\/(archivo\/)?(\d{3})-([^/]+)\/propuesta\.md$/);
    if (!partes) {
      errores.push(`${ruta}: la carpeta debe llamarse NNN-nombre (tres dígitos y guion).`);
      continue;
    }
    const archivada = Boolean(partes[1]);

    for (const titulo of SECCIONES_PROPUESTA) {
      if (!texto.includes(titulo)) errores.push(`${ruta}: falta la sección «${titulo}».`);
    }

    const estado = estadoDe(texto);
    if (!ESTADOS.includes(estado)) {
      errores.push(`${ruta}: estado no válido («${estado || 'vacío'}»).`);
      continue;
    }

    if (!ESTADOS_CON_PREGUNTAS.includes(estado) && texto.includes('[NECESITA ACLARACIÓN')) {
      errores.push(`${ruta}: tiene preguntas abiertas (NECESITA ACLARACIÓN) en estado ${estado}.`);
    }

    const afectadas = seccion(texto, '## Áreas afectadas') || '';
    for (const codigo of new Set(afectadas.match(/\b[A-Z]{3}\b/g) || [])) {
      if (!areas.has(codigo)) errores.push(`${ruta}: cita el área ${codigo}, que no existe.`);
    }

    const delta = seccion(texto, '## Delta') || '';
    for (const ident of new Set(ids(delta))) {
      if (!areas.has(ident.slice(0, 3))) errores.push(`${ruta}: el ID ${ident} no es de un área existente.`);
    }

    const plan = fuentes[ruta.replace(/propuesta\.md$/, 'plan.md')];
    if (plan) {
      const tareas = seccion(plan, '## Tareas');
      if (tareas !== null) {
        for (const linea of tareas.split(/\r?\n/)) {
          if (/^\s*- /.test(linea) && !/^\s*- \[[ xX]\] /.test(linea)) {
            errores.push(`${ruta.replace(/propuesta\.md$/, 'plan.md')}: cada tarea necesita una casilla «- [ ]».`);
            break;
          }
        }
      }
    }

    if (archivada) {
      if (!ESTADOS_ARCHIVADOS.includes(estado)) {
        errores.push(`${ruta}: una propuesta en archivo/ debe estar Hecha o Descartada (está ${estado}).`);
      }
      const anade = seccion(delta, '### Añade') || '';
      for (const ident of new Set(ids(anade))) {
        const requisito = buscarRequisito(areas, ident);
        if (!requisito || requisito.retirado) errores.push(`${ruta}: añade ${ident}, que no existe como requisito vigente en su área.`);
      }
    }
  }
}

function validarTodo(fuentes) {
  const errores = [];
  validarConstitucion(fuentes, errores);
  const areas = parsearAreas(fuentes, errores);
  const cobertura = validarCobertura(fuentes, areas, errores);
  validarPropuestas(fuentes, areas, errores);
  return { errores, cobertura, areas };
}

function formatearCobertura(resultado) {
  if (!resultado.cobertura.length) return 'Cobertura: sin áreas todavía.';
  const filas = resultado.cobertura.map(c => `  ${c.id}  ${c.tests.length ? c.tests.join(', ') : 'sin test'}`);
  return ['Cobertura de requisitos:', ...filas].join('\n');
}

module.exports = { leerFuentes, validarTodo, formatearCobertura, ESTADOS, SECCIONES_AREA, SECCIONES_PROPUESTA };
