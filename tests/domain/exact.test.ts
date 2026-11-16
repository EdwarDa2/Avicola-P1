// Aritmética exacta sin redondeos intermedios (D-10).
// La referencia de la prueba de propiedad está escrita aquí con enteros BigInt y NO importa
// nada de core.ts ni de rational.ts, para que sea un cálculo independiente.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  calculateChickenMeat,
  calculateQuailEggs,
  calculateQuailMeat,
  calculateWeeklyEggsDemand,
} from '@/domain/calculators';
import { meatBirdsCore } from '@/domain/calculators/core';
import type { CalculationResult, ConsumptionLine } from '@/types';

const gramsPerWeek = (grams: number): ConsumptionLine[] => [
  { ageGroup: '19+', peopleCount: 1, portionQty: grams, portionUnit: 'gramos', occasionsPerDay: 1, daysPerWeek: 1 },
];

/** ceil(a / b) para enteros positivos. */
function ceilDiv(a: bigint, b: bigint): bigint {
  return (a + b - BigInt(1)) / b;
}

/**
 * Referencia independiente de F03–F06 con parámetros escalados a enteros:
 *   A_s = ceil( g·52/1000 · (100+S%)/100 / (Y_g/1000) ) = ceil( g·52·(100+S%) / (100·Y_g) )
 *   A_i = ceil( A_s · 100 / (100 − m%) )
 */
function referenceMeatBirds(grams: number, yieldGrams: number, safetyPct: number, mortalityPct: number) {
  const slaughter = ceilDiv(
    BigInt(grams) * BigInt(52) * BigInt(100 + safetyPct),
    BigInt(100) * BigInt(yieldGrams)
  );
  const initial = ceilDiv(slaughter * BigInt(100), BigInt(100 - mortalityPct));
  return { slaughter: Number(slaughter), initial: Number(initial) };
}

const MEAT_SCENARIOS: {
  key: string;
  calculate: (lines: ConsumptionLine[], key: string) => CalculationResult;
  yieldGrams: number;
  safetyPct: number;
  mortalityPct: number;
}[] = [
  { key: 'chicken_fast_growing', calculate: calculateChickenMeat, yieldGrams: 1200, safetyPct: 10, mortalityPct: 5 },
  { key: 'chicken_slow_growing', calculate: calculateChickenMeat, yieldGrams: 750, safetyPct: 10, mortalityPct: 10 },
  { key: 'quail_meat_reference', calculate: calculateQuailMeat, yieldGrams: 140, safetyPct: 10, mortalityPct: 8 },
];

describe('propiedad: 1..2000 g/semana coinciden con la referencia exacta', () => {
  for (const scenario of MEAT_SCENARIOS) {
    test(scenario.key, () => {
      const mismatches: string[] = [];
      for (let grams = 1; grams <= 2000; grams++) {
        const result = scenario.calculate(gramsPerWeek(grams), scenario.key);
        const expected = referenceMeatBirds(grams, scenario.yieldGrams, scenario.safetyPct, scenario.mortalityPct);
        if (result.slaughterBirdsCount !== expected.slaughter || result.primaryBirdsCount !== expected.initial) {
          mismatches.push(
            `${grams} g: ${result.slaughterBirdsCount}/${result.primaryBirdsCount} ≠ ${expected.slaughter}/${expected.initial}`
          );
        }
      }
      assert.deepEqual(mismatches, []);
    });
  }
});

describe('casos que distinguen aritmética exacta de doubles y redondeo intermedio', () => {
  test('pollo rápido, 21 g/semana → A_s = 2, A_i = 3 (antes 1/2, a la baja)', () => {
    const result = calculateChickenMeat(gramsPerWeek(21), 'chicken_fast_growing');
    assert.equal(result.slaughterBirdsCount, 2);
    assert.equal(result.primaryBirdsCount, 3);
  });

  test('codorniz carne, 93 g/semana → A_s = 38, A_i = 42 (antes 39/43)', () => {
    const result = calculateQuailMeat(gramsPerWeek(93), 'quail_meat_reference');
    assert.equal(result.annualDemand, 4.836);
    assert.equal(result.slaughterBirdsCount, 38);
    assert.equal(result.primaryBirdsCount, 42);
  });

  test('codorniz conservadora, E_sem = 399 → 110 hembras (antes 111)', () => {
    const lines: ConsumptionLine[] = [
      { ageGroup: '19+', peopleCount: 399, portionQty: 1, portionUnit: 'piezas', occasionsPerDay: 1, daysPerWeek: 1 },
    ];
    assert.equal(calculateQuailEggs(lines, 'quail_conservative').primaryBirdsCount, 110);
  });

  test('E_sem = 3 personas × 0.333 × 1 × 7 = 6.993 (antes 6.99)', () => {
    const lines: ConsumptionLine[] = [
      { ageGroup: '19+', peopleCount: 3, portionQty: 0.333, portionUnit: 'piezas', occasionsPerDay: 1, daysPerWeek: 7 },
    ];
    assert.equal(calculateWeeklyEggsDemand(lines), 6.993);
  });
});

describe('Tabla rápida [F2] · pollos, A_s con S = .10 (Y = .75/1.00/1.20/1.40)', () => {
  const yields = [0.75, 1.0, 1.2, 1.4];
  const table: [number, number[]][] = [
    [25, [37, 28, 23, 20]],
    [40, [59, 44, 37, 32]],
    [55, [81, 61, 51, 44]],
    [70, [103, 77, 65, 55]],
    [85, [125, 94, 78, 67]],
    // El PDF imprime 111 en la celda Y = 1.00; el valor exacto de su propia fórmula es 110 (Q1).
    [100, [147, 110, 92, 79]],
  ];
  for (const [annualKg, expected] of table) {
    test(`${annualKg} kg/año → ${expected.join('/')}`, () => {
      const slaughter = yields.map(
        (meatYieldKg) => meatBirdsCore(annualKg, { meatYieldKg, mortalityRate: 0.05, safetyMargin: 0.1 }).slaughterBirds
      );
      assert.deepEqual(slaughter, expected);
    });
  }
});

describe('Tabla rápida [F3] · codorniz carne, A_s con S = .10 (Y = .12/.14/.16)', () => {
  const yields = [0.12, 0.14, 0.16];
  const table: [number, number[]][] = [
    [10, [92, 79, 69]],
    [20, [184, 158, 138]],
    [30, [275, 236, 207]],
    [40, [367, 315, 275]],
    [50, [459, 393, 344]],
    [60, [550, 472, 413]],
  ];
  for (const [annualKg, expected] of table) {
    test(`${annualKg} kg/año → ${expected.join('/')}`, () => {
      const slaughter = yields.map(
        (meatYieldKg) => meatBirdsCore(annualKg, { meatYieldKg, mortalityRate: 0.08, safetyMargin: 0.1 }).slaughterBirds
      );
      assert.deepEqual(slaughter, expected);
    });
  }
});
