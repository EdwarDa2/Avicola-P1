// Validadores CP-13 a CP-19 (documentación maestra §12, .context/oracles_and_tests.md §3).
// Como los escenarios son fijos (D-04), CP-13/14/15 no se alcanzan desde la UI: se prueban
// llamando a los núcleos puros con parámetros explícitos.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  calculateChickenMeat,
  calculateHenEggs,
  calculateQuailEggs,
  calculateQuailMeat,
  calculateQuailReproduction,
  distributeLots,
} from '@/domain/calculators';
import { eggsToIncubateCore, layingFemalesCore, meatBirdsCore } from '@/domain/calculators/core';
import type { ConsumptionLine } from '@/types';

const line = (patch: Partial<ConsumptionLine> = {}): ConsumptionLine[] => [
  { ageGroup: '19+', peopleCount: 2, portionQty: 1, portionUnit: 'piezas', occasionsPerDay: 1, daysPerWeek: 7, ...patch },
];

describe('CP-13 · postura 0 con demanda positiva', () => {
  test('P = 0 → error con motivo', () => {
    assert.throws(
      () => layingFemalesCore(63, { layingRate: 0, utilizationRate: 0.95, safetyMargin: 0.15 }),
      /postura no puede ser 0 o negativa.*CP-13/
    );
  });

  test('P negativa → error', () => {
    assert.throws(
      () => layingFemalesCore(63, { layingRate: -0.5, utilizationRate: 0.95, safetyMargin: 0.15 }),
      /CP-13/
    );
  });

  test('U = 0 → error', () => {
    assert.throws(
      () => layingFemalesCore(63, { layingRate: 0.7, utilizationRate: 0, safetyMargin: 0.15 }),
      /aprovechamiento/
    );
  });

  test('con demanda 0, P = 0 no bloquea: resultado 0 (orden de D-11)', () => {
    assert.equal(layingFemalesCore(0, { layingRate: 0, utilizationRate: 0.95, safetyMargin: 0.15 }), 0);
  });
});

describe('CP-14 · rendimiento comestible 0', () => {
  test('Y = 0 con demanda positiva → error (no divide entre cero)', () => {
    assert.throws(
      () => meatBirdsCore(71.76, { meatYieldKg: 0, mortalityRate: 0.05, safetyMargin: 0.1 }),
      /rendimiento en carne.*CP-14/
    );
  });

  test('Y negativo → error', () => {
    assert.throws(
      () => meatBirdsCore(71.76, { meatYieldKg: -1, mortalityRate: 0.05, safetyMargin: 0.1 }),
      /CP-14/
    );
  });
});

describe('CP-15 · mortalidad 100 %', () => {
  test('m = 1 → error (no calcula aves iniciales)', () => {
    assert.throws(
      () => meatBirdsCore(71.76, { meatYieldKg: 1.2, mortalityRate: 1, safetyMargin: 0.1 }),
      /mortalidad.*CP-15/
    );
  });

  test('m > 1 → error', () => {
    assert.throws(
      () => meatBirdsCore(71.76, { meatYieldKg: 1.2, mortalityRate: 1.5, safetyMargin: 0.1 }),
      /CP-15/
    );
  });
});

describe('CP-16 · días por semana mayores a 7', () => {
  test('días = 8 → error en los cuatro productos', () => {
    assert.throws(() => calculateHenEggs(line({ daysPerWeek: 8 }), 'hen_intermediate'), /CP-16/);
    assert.throws(() => calculateQuailEggs(line({ daysPerWeek: 8 }), 'quail_intermediate'), /CP-16/);
    assert.throws(() => calculateChickenMeat(line({ daysPerWeek: 8 }), 'chicken_fast_growing'), /CP-16/);
    assert.throws(() => calculateQuailMeat(line({ daysPerWeek: 8 }), 'quail_meat_reference'), /CP-16/);
  });

  test('días negativos → error', () => {
    assert.throws(() => calculateHenEggs(line({ daysPerWeek: -1 }), 'hen_intermediate'), /CP-16/);
  });

  test('días = 0 y días = 7 son válidos', () => {
    assert.doesNotThrow(() => calculateHenEggs(line({ daysPerWeek: 0 }), 'hen_intermediate'));
    assert.doesNotThrow(() => calculateHenEggs(line({ daysPerWeek: 7 }), 'hen_intermediate'));
  });
});

describe('CP-17 · integrantes negativos', () => {
  test('personas = -1 → error', () => {
    assert.throws(() => calculateHenEggs(line({ peopleCount: -1 }), 'hen_intermediate'), /negativo.*CP-17/);
    assert.throws(() => calculateChickenMeat(line({ peopleCount: -1 }), 'chicken_fast_growing'), /CP-17/);
  });
});

describe('CP-18 · fertilidad o incubabilidad 0 con reemplazos positivos', () => {
  test('f = 0 → error', () => {
    assert.throws(() => calculateQuailReproduction(10, 0, 0.75, 0.9, 0.5), /fertilidad.*CP-18/);
  });

  test('h = 0 → error', () => {
    assert.throws(() => calculateQuailReproduction(10, 0.8, 0, 0.9, 0.5), /incubabilidad.*CP-18/);
  });

  test('núcleo F07 con f = 0 → error', () => {
    assert.throws(
      () => eggsToIncubateCore(10, { fertility: 0, hatchability: 0.75, survival: 0.9, femaleRatio: 0.5 }),
      /CP-18/
    );
  });

  test('s = 0 o p_hembras = 0 → error', () => {
    assert.throws(() => calculateQuailReproduction(10, 0.8, 0.75, 0, 0.5), /supervivencia/);
    assert.throws(() => calculateQuailReproduction(10, 0.8, 0.75, 0.9, 0), /proporción de hembras/);
  });

  test('tasas = 1 (100 %) son válidas: R = 10 → 20 huevos con p = .50', () => {
    assert.equal(calculateQuailReproduction(10, 1, 1, 1, 0.5).eggsToIncubate, 20);
  });
});

describe('CP-19 · consumo total 0', () => {
  const zero = line({ portionQty: 0 });

  test('huevos de gallina y de codorniz → 0 aves', () => {
    assert.equal(calculateHenEggs(zero, 'hen_conservative').primaryBirdsCount, 0);
    assert.equal(calculateQuailEggs(zero, 'quail_conservative').primaryBirdsCount, 0);
  });

  test('pollo y codorniz carne → 0 para consumo y 0 iniciales', () => {
    for (const result of [
      calculateChickenMeat(zero, 'chicken_slow_growing'),
      calculateQuailMeat(zero, 'quail_meat_reference'),
    ]) {
      assert.equal(result.weeklyDemand, 0);
      assert.equal(result.annualDemand, 0);
      assert.equal(result.slaughterBirdsCount, 0);
      assert.equal(result.primaryBirdsCount, 0);
    }
  });

  test('sin familia (lista vacía) → 0 aves', () => {
    assert.equal(calculateHenEggs([], 'hen_intermediate').primaryBirdsCount, 0);
  });

  test('las 0 aves no generan lotes vacíos', () => {
    const birds = calculateChickenMeat(zero, 'chicken_fast_growing').primaryBirdsCount;
    assert.deepEqual(distributeLots(birds, 6).birdsPerLot, []);
  });
});
