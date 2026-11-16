// F08 · distribución de aves en lotes (CP-11, CP-12, CP-19 y enmienda D-11).
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { distributeLots } from '@/domain/calculators';

describe('distributeLots', () => {
  test('70 aves en 6 lotes → [12, 12, 12, 12, 11, 11] y la suma es exacta', () => {
    const result = distributeLots(70, 6);
    assert.deepEqual(result.birdsPerLot, [12, 12, 12, 12, 11, 11]);
    assert.equal(result.lotsCount, 6);
    assert.equal(result.totalBirds, 70);
  });

  test('192 aves en 6 lotes → seis lotes de 32', () => {
    assert.deepEqual(distributeLots(192, 6).birdsPerLot, [32, 32, 32, 32, 32, 32]);
  });

  test('CP-19: 0 aves → sin lotes, lotsCount = 0 y con explicación', () => {
    const result = distributeLots(0, 6);
    assert.deepEqual(result.birdsPerLot, []);
    assert.equal(result.lotsCount, 0);
    assert.equal(result.totalBirds, 0);
    assert.match(result.explanation, /CP-19/);
  });

  test('lotsCount siempre coincide con el largo del arreglo', () => {
    for (const [birds, lots] of [[0, 3], [1, 1], [5, 5], [70, 6], [101, 7]]) {
      const result = distributeLots(birds, lots);
      assert.equal(result.lotsCount, result.birdsPerLot.length);
    }
  });

  test('L = A es válido: un ave por lote', () => {
    assert.deepEqual(distributeLots(5, 5).birdsPerLot, [1, 1, 1, 1, 1]);
  });

  test('L > A → error claro (3 aves en 6 lotes)', () => {
    assert.throws(() => distributeLots(3, 6), /sin dejar lotes vacíos/);
  });

  test('aves no enteras → error claro (70.5)', () => {
    assert.throws(() => distributeLots(70.5, 6), /entero/);
  });

  test('aves negativas → error', () => {
    assert.throws(() => distributeLots(-1, 6), /negativo/);
  });

  for (const lots of [0, -2, 2.5]) {
    test(`L = ${lots} → error`, () => {
      assert.throws(() => distributeLots(70, lots), /entero positivo/);
    });
  }

  for (const value of [Number.NaN, Number.POSITIVE_INFINITY]) {
    test(`aves = ${String(value)} → error`, () => {
      assert.throws(() => distributeLots(value, 6), /finito/);
    });

    test(`L = ${String(value)} → error`, () => {
      assert.throws(() => distributeLots(70, value), /finito/);
    });
  }
});
