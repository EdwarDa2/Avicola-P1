// Prueba provisional: confirma que `npm test` descubre tests/domain. Se elimina al agregar los oráculos.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { distributeLots } from '@/domain/calculators';

test('el dominio se importa desde tests/domain', () => {
  assert.equal(typeof distributeLots, 'function');
});
