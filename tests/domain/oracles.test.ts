// Oráculos golden CP-01 a CP-12 y tablas rápidas de los PDF del cliente ([F1] gallinas, [F3] codornices).
// Fuente: documentación maestra §12 y .context/oracles_and_tests.md §2 y §5.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  calculateChickenMeat,
  calculateHenEggs,
  calculateQuailEggs,
  calculateQuailMeat,
  calculateQuailReproduction,
  calculateWeeklyEggsDemand,
  calculateWeeklyMeatDemand,
  distributeLots,
} from '@/domain/calculators';
import type { AgeGroupKey, ConsumptionLine } from '@/types';

function line(
  ageGroup: AgeGroupKey,
  peopleCount: number,
  portionQty: number,
  occasionsPerDay: number,
  daysPerWeek: number,
  portionUnit: ConsumptionLine['portionUnit'] = 'piezas'
): ConsumptionLine {
  return { ageGroup, peopleCount, portionQty, portionUnit, occasionsPerDay, daysPerWeek };
}

/** Una sola línea cuya demanda semanal es exactamente `eggsPerWeek` huevos. */
const weeklyEggs = (eggsPerWeek: number): ConsumptionLine[] => [line('19+', eggsPerWeek, 1, 1, 1)];

// Familia del ejemplo de los PDF: 2 adultos, 2 adolescentes y 1 niño de 4–8 años.
const HEN_EGGS_FAMILY = [line('19+', 2, 2, 1, 7), line('14-18', 2, 2, 1, 7), line('4-8', 1, 1, 1, 7)];
const QUAIL_EGGS_FAMILY = [line('19+', 2, 5, 1, 4), line('14-18', 2, 5, 1, 4), line('4-8', 1, 3, 1, 4)];
const CHICKEN_MEAT_FAMILY = [
  line('19+', 2, 100, 1, 3, 'gramos'),
  line('14-18', 2, 100, 1, 3, 'gramos'),
  line('4-8', 1, 60, 1, 3, 'gramos'),
];
const QUAIL_MEAT_FAMILY = [
  line('19+', 2, 100, 1, 1, 'gramos'),
  line('14-18', 2, 90, 1, 1, 'gramos'),
  line('4-8', 1, 50, 1, 1, 'gramos'),
];

const HEN_SCENARIOS = ['hen_conservative', 'hen_intermediate', 'hen_good_management'];
const QUAIL_EGG_SCENARIOS = ['quail_conservative', 'quail_intermediate', 'quail_good_management'];

describe('CP-01 a CP-03 · gallinas ponedoras', () => {
  test('la familia del ejemplo consume 63 huevos/semana', () => {
    assert.equal(calculateWeeklyEggsDemand(HEN_EGGS_FAMILY), 63);
  });

  test('P = .57/.70/.82 → 20/16/14 gallinas', () => {
    const hens = HEN_SCENARIOS.map((key) => calculateHenEggs(HEN_EGGS_FAMILY, key).primaryBirdsCount);
    assert.deepEqual(hens, [20, 16, 14]);
  });
});

describe('CP-04 y CP-05 · pollo de engorda', () => {
  test('la familia del ejemplo consume 1.38 kg/semana', () => {
    assert.equal(calculateWeeklyMeatDemand(CHICKEN_MEAT_FAMILY), 1.38);
  });

  test('CP-04 engorda rápida → 66 para consumo y 70 iniciales (71.76 kg/año)', () => {
    const result = calculateChickenMeat(CHICKEN_MEAT_FAMILY, 'chicken_fast_growing');
    assert.equal(result.annualDemand, 71.76);
    assert.equal(result.slaughterBirdsCount, 66);
    assert.equal(result.primaryBirdsCount, 70);
  });

  test('CP-05 crecimiento lento → 106 para consumo y 118 iniciales', () => {
    const result = calculateChickenMeat(CHICKEN_MEAT_FAMILY, 'chicken_slow_growing');
    assert.equal(result.slaughterBirdsCount, 106);
    assert.equal(result.primaryBirdsCount, 118);
  });
});

describe('CP-06 a CP-08 · codorniz ponedora', () => {
  test('la familia del ejemplo consume 92 huevos/semana', () => {
    assert.equal(calculateWeeklyEggsDemand(QUAIL_EGGS_FAMILY), 92);
  });

  test('P = .60/.68/.82 → 26/23/19 hembras', () => {
    const females = QUAIL_EGG_SCENARIOS.map(
      (key) => calculateQuailEggs(QUAIL_EGGS_FAMILY, key).primaryBirdsCount
    );
    assert.deepEqual(females, [26, 23, 19]);
  });
});

describe('CP-09 · codorniz para carne', () => {
  test('0.43 kg/semana, 22.36 kg/año → 176 para consumo y 192 iniciales', () => {
    const result = calculateQuailMeat(QUAIL_MEAT_FAMILY, 'quail_meat_reference');
    assert.equal(result.weeklyDemand, 0.43);
    assert.equal(result.annualDemand, 22.36);
    assert.equal(result.slaughterBirdsCount, 176);
    assert.equal(result.primaryBirdsCount, 192);
  });
});

describe('CP-10 · reproducción de codornices', () => {
  test('R = 10, f = .80, h = .75, s = .90, p = .50 → 38 huevos a incubar', () => {
    assert.equal(calculateQuailReproduction(10, 0.8, 0.75, 0.9, 0.5).eggsToIncubate, 38);
  });
});

describe('CP-11 y CP-12 · lotes', () => {
  test('70 pollitos en 6 lotes → [12, 12, 12, 12, 11, 11]', () => {
    assert.deepEqual(distributeLots(70, 6).birdsPerLot, [12, 12, 12, 12, 11, 11]);
  });

  test('192 codornices en 6 lotes → seis lotes de 32', () => {
    assert.deepEqual(distributeLots(192, 6).birdsPerLot, [32, 32, 32, 32, 32, 32]);
  });
});

describe('Tabla rápida [F1] · gallinas (U = .95, S = .15)', () => {
  const table: [number, [number, number, number]][] = [
    [21, [7, 6, 5]],
    [28, [9, 7, 6]],
    [35, [11, 9, 8]],
    [42, [13, 11, 9]],
    [49, [15, 13, 11]],
    [56, [17, 14, 12]],
    [63, [20, 16, 14]],
    [70, [22, 18, 15]],
  ];
  for (const [eggs, expected] of table) {
    test(`${eggs} huevos/semana → ${expected.join('/')}`, () => {
      const hens = HEN_SCENARIOS.map((key) => calculateHenEggs(weeklyEggs(eggs), key).primaryBirdsCount);
      assert.deepEqual(hens, expected);
    });
  }

  test('ejemplo del PDF: 36 huevos/semana con P = .70 → 9 gallinas', () => {
    assert.equal(calculateHenEggs(weeklyEggs(36), 'hen_intermediate').primaryBirdsCount, 9);
  });
});

describe('Tabla rápida [F3] · codorniz huevos (U = .95, S = .10)', () => {
  const table: [number, [number, number, number]][] = [
    [35, [10, 9, 8]],
    [50, [14, 13, 11]],
    [75, [21, 19, 16]],
    [100, [28, 25, 21]],
    [125, [35, 31, 26]],
    [150, [42, 37, 31]],
    [175, [49, 43, 36]],
    [200, [56, 49, 41]],
  ];
  for (const [eggs, expected] of table) {
    test(`${eggs} huevos/semana → ${expected.join('/')}`, () => {
      const females = QUAIL_EGG_SCENARIOS.map(
        (key) => calculateQuailEggs(weeklyEggs(eggs), key).primaryBirdsCount
      );
      assert.deepEqual(females, expected);
    });
  }
});
