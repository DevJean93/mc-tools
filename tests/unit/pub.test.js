// Publicación: versión del pie.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { versionDe } from '../../src/compartido/version.js';

const SHA = '8b03d4ea1f2c3b4d5e6f708192a3b4c5d6e7f809';

test('PUB-06: con el commit de GitHub Actions la versión es su forma corta', () => {
  assert.equal(versionDe({ GITHUB_SHA: SHA }), '8b03d4e');
});

test('PUB-06: sin commit (en local) la versión es «dev»', () => {
  assert.equal(versionDe({}), 'dev');
  assert.equal(versionDe({ GITHUB_SHA: '' }), 'dev');
});

test('PUB-06: un valor que no es un commit no se muestra', () => {
  assert.equal(versionDe({ GITHUB_SHA: 'no es un commit' }), 'dev');
  assert.equal(versionDe({ GITHUB_SHA: '<script>' }), 'dev');
});
