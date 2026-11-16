// Validaciones D-11: finitos, enteros, escenario del producto y sin valores de reserva.
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
} from '@/domain/calculators';
import { eggsToIncubateCore, layingFemalesCore, meatBirdsCore } from '@/domain/calculators/core';
import { requireParameter, resolveScenario } from '@/domain/calculators/validation';
import type { ConsumptionLine, ScenarioDefinition } from '@/types';

const baseLine: ConsumptionLine = {
  ageGroup: '19+',
  peopleCount: 2,
  portionQty: 1,
  portionUnit: 'piezas',
  occasionsPerDay: 1,
  daysPerWeek: 7,
};
const withLine = (patch: Partial<ConsumptionLine>): ConsumptionLine[] => [{ ...baseLine, ...patch }];

const NON_FINITE = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
const LINE_FIELDS = ['peopleCount', 'portionQty', 'occasionsPerDay', 'daysPerWeek'] as const;

describe('líneas de consumo: números finitos', () => {
  for (const field of LINE_FIELDS) {
    for (const value of NON_FINITE) {
      test(`${field} = ${String(value)} → error`, () => {
        assert.throws(() => calculateWeeklyEggsDemand(withLine({ [field]: value })), /finito/);
        assert.throws(() => calculateHenEggs(withLine({ [field]: value }), 'hen_intermediate'), /finito/);
      });
    }
  }
});

describe('líneas de consumo: enteros', () => {
  test('personas = 1.5 → error', () => {
    assert.throws(() => calculateWeeklyEggsDemand(withLine({ peopleCount: 1.5 })), /entero/);
  });

  test('días por semana = 3.5 → error', () => {
    assert.throws(() => calculateWeeklyMeatDemand(withLine({ daysPerWeek: 3.5 })), /entero/);
  });

  test('porciones y ocasiones decimales sí se aceptan', () => {
    assert.equal(calculateWeeklyEggsDemand(withLine({ portionQty: 0.5, occasionsPerDay: 1.5 })), 10.5);
  });

  test('porción negativa → error', () => {
    assert.throws(() => calculateWeeklyEggsDemand(withLine({ portionQty: -1 })), /negativa/);
  });

  test('ocasiones negativas → error', () => {
    assert.throws(() => calculateWeeklyEggsDemand(withLine({ occasionsPerDay: -1 })), /negativas/);
  });
});

describe('escenario del producto', () => {
  test('huevos de gallina con escenario de codorniz → error', () => {
    assert.throws(() => calculateHenEggs(withLine({}), 'quail_conservative'), /pertenece a quail_eggs/);
  });

  test('huevos de codorniz con escenario de gallina → error', () => {
    assert.throws(() => calculateQuailEggs(withLine({}), 'hen_conservative'), /pertenece a hen_eggs/);
  });

  test('pollo con escenario de gallina → error (antes usaba Y = 1.20 de reserva)', () => {
    assert.throws(() => calculateChickenMeat(withLine({}), 'hen_conservative'), /pertenece a hen_eggs/);
  });

  test('codorniz carne con escenario de pollo → error', () => {
    assert.throws(() => calculateQuailMeat(withLine({}), 'chicken_fast_growing'), /pertenece a chicken_meat/);
  });

  test('escenario inexistente → error', () => {
    assert.throws(() => resolveScenario('no_existe', 'hen_eggs'), /Escenario no encontrado/);
  });
});

describe('sin valores de reserva', () => {
  const incomplete: ScenarioDefinition = {
    key: 'incompleto',
    productCode: 'hen_eggs',
    name: 'Incompleto',
    shortDescription: '',
    parameters: { safetyMargin: 0.15 },
    sourceRef: 'prueba',
  };

  test('parámetro ausente → error con el nombre del parámetro', () => {
    assert.throws(() => requireParameter(incomplete, 'layingRate'), /le falta el parámetro layingRate/);
  });

  test('parámetro no finito → error', () => {
    const broken = { ...incomplete, parameters: { safetyMargin: Number.NaN } };
    assert.throws(() => requireParameter(broken, 'safetyMargin'), /finito/);
  });

  test('parámetro presente → se devuelve tal cual', () => {
    assert.equal(requireParameter(incomplete, 'safetyMargin'), 0.15);
  });
});

describe('núcleos: parámetros finitos', () => {
  for (const value of NON_FINITE) {
    test(`F02 con P = ${String(value)} → error`, () => {
      assert.throws(
        () => layingFemalesCore(63, { layingRate: value, utilizationRate: 0.95, safetyMargin: 0.15 }),
        /finito/
      );
    });

    test(`F05/F06 con demanda = ${String(value)} → error`, () => {
      assert.throws(
        () => meatBirdsCore(value, { meatYieldKg: 1.2, mortalityRate: 0.05, safetyMargin: 0.1 }),
        /finito/
      );
    });

    test(`F07 con s = ${String(value)} → error`, () => {
      assert.throws(
        () => eggsToIncubateCore(10, { fertility: 0.8, hatchability: 0.75, survival: value, femaleRatio: 0.5 }),
        /finito/
      );
    });
  }
});

describe('reproducción: R entero >= 1 (enmienda D-11)', () => {
  test('R = 2.5 → error', () => {
    assert.throws(() => calculateQuailReproduction(2.5, 0.8, 0.75, 0.9, 0.5), /entero/);
  });

  test('R = 0 → error', () => {
    assert.throws(() => calculateQuailReproduction(0, 0.8, 0.75, 0.9, 0.5), /mayor a cero/);
  });

  test('R = -3 → error', () => {
    assert.throws(() => calculateQuailReproduction(-3, 0.8, 0.75, 0.9, 0.5), /mayor a cero/);
  });

  test('R = NaN → error', () => {
    assert.throws(() => calculateQuailReproduction(Number.NaN, 0.8, 0.75, 0.9, 0.5), /finito/);
  });

  test('R = 1 es válido', () => {
    assert.equal(calculateQuailReproduction(1, 0.8, 0.75, 0.9, 0.5).eggsToIncubate, 4);
  });

  test('tasas mayores a 1 → error', () => {
    assert.throws(() => calculateQuailReproduction(10, 1.2, 0.75, 0.9, 0.5), /hasta 100%/);
    assert.throws(() => calculateQuailReproduction(10, 0.8, 0.75, 0.9, 1.01), /hasta 100%/);
  });
});
