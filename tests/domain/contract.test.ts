// Contrato de integración (D-12, D-13), proteína F13 (D-07) y enmienda D-11 sobre el alias tolerante.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  calculateChickenMeat,
  calculateHenEggs,
  calculateHens,
  calculateProtein,
  calculateProteinGrams,
  calculateQuailBreeding,
  calculateQuailEggs,
  calculateQuailMeat,
  calculateQuailReproduction,
  distributeLots,
  FORMULA_VERSION,
} from '@/domain/calculators';
import type { ProductCode } from '@/types';

describe('contrato de nombres (D-12)', () => {
  test('el dominio exporta las siete funciones del contrato', () => {
    for (const fn of [
      calculateHens,
      calculateChickenMeat,
      calculateQuailEggs,
      calculateQuailMeat,
      calculateQuailBreeding,
      distributeLots,
      calculateProtein,
    ]) {
      assert.equal(typeof fn, 'function');
    }
  });

  test('calculateHenEggs es alias exacto de calculateHens', () => {
    assert.equal(calculateHenEggs, calculateHens);
  });

  test('calculateQuailReproduction es alias exacto de calculateQuailBreeding', () => {
    assert.equal(calculateQuailReproduction, calculateQuailBreeding);
    assert.equal(calculateQuailReproduction(10, 0.8, 0.75, 0.9, 0.5).eggsToIncubate, 38);
  });
});

describe('versión del modelo (D-13)', () => {
  test("FORMULA_VERSION = 'avicola-1.0.0'", () => {
    assert.equal(FORMULA_VERSION, 'avicola-1.0.0');
  });
});

describe('calculateProtein (F13, estricto)', () => {
  const oracles: [ProductCode, number, number][] = [
    ['chicken_meat', 50, 14.5], // 14.45 → 14.5 half-up
    ['quail_meat', 50, 12.6], // 12.55 → 12.6 half-up
    ['quail_eggs', 5, 7.7],
    ['hen_eggs', 2, 13],
    ['chicken_meat', 100, 28.9],
    ['quail_meat', 0, 0],
  ];
  for (const [product, amount, expected] of oracles) {
    test(`${product}, ${amount} → ${expected} g`, () => {
      assert.equal(calculateProtein(product, amount), expected);
    });
  }

  for (const amount of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    test(`cantidad ${String(amount)} → error`, () => {
      assert.throws(() => calculateProtein('hen_eggs', amount));
    });
  }

  test('producto desconocido → error', () => {
    assert.throws(() => calculateProtein('duck_eggs' as ProductCode, 1), /Producto desconocido/);
  });
});

describe('calculateProteinGrams (alias @deprecated, tolerante)', () => {
  test('con valores válidos coincide con calculateProtein', () => {
    assert.equal(calculateProteinGrams('chicken_meat', 50), calculateProtein('chicken_meat', 50));
    assert.equal(calculateProteinGrams('quail_eggs', 5), 7.7);
  });

  for (const amount of [0, -3, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    test(`cantidad ${String(amount)} → 0 sin lanzar error`, () => {
      assert.equal(calculateProteinGrams('hen_eggs', amount), 0);
    });
  }
});
