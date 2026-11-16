// Validaciones D-11: finitos, enteros, escenario del producto y sin valores de reserva.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  calculateChickenMeat,
  calculateHenEggs,
  calculateHens,
  calculateProtein,
  calculateQuailEggs,
  calculateQuailMeat,
  calculateQuailReproduction,
  calculateWeeklyEggsDemand,
  calculateWeeklyMeatDemand,
} from '@/domain/calculators';
import { eggsToIncubateCore, layingFemalesCore, meatBirdsCore } from '@/domain/calculators/core';
import { SCENARIOS } from '@/domain/calculators/scenarios';
import { requireParameter, resolveScenario } from '@/domain/calculators/validation';
import type { ConsumptionLine, ProductCode, ScenarioDefinition } from '@/types';

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

describe('concordancia gramatical de los mensajes', () => {
  const messageOf = (fn: () => unknown): string => {
    try {
      fn();
    } catch (error) {
      return (error as Error).message;
    }
    return 'sin error';
  };

  test('plural femenino: "Las ocasiones por día deben ser…"', () => {
    assert.equal(
      messageOf(() => calculateWeeklyEggsDemand(withLine({ occasionsPerDay: Number.NaN }))),
      'Las ocasiones por día deben ser un número finito (se recibió NaN).'
    );
  });

  test('plural masculino: "Los días por semana deben ser…" (finito y entero)', () => {
    assert.equal(
      messageOf(() => calculateWeeklyEggsDemand(withLine({ daysPerWeek: Number.NaN }))),
      'Los días por semana deben ser un número finito (se recibió NaN).'
    );
    assert.equal(
      messageOf(() => calculateWeeklyEggsDemand(withLine({ daysPerWeek: 3.5 }))),
      'Los días por semana deben ser un número entero (se recibió 3.5).'
    );
  });

  test('singular femenino: "La cantidad para calcular proteína no puede ser negativa."', () => {
    assert.equal(
      messageOf(() => calculateProtein('hen_eggs', -1)),
      'La cantidad para calcular proteína no puede ser negativa.'
    );
  });

  test('los mensajes en singular no cambian', () => {
    assert.equal(
      messageOf(() => calculateWeeklyEggsDemand(withLine({ peopleCount: 1.5 }))),
      'El número de personas debe ser un número entero (se recibió 1.5).'
    );
    assert.equal(
      messageOf(() => calculateWeeklyEggsDemand(withLine({ portionQty: Number.NaN }))),
      'La porción de consumo debe ser un número finito (se recibió NaN).'
    );
    assert.equal(
      messageOf(() => calculateQuailReproduction(2.5, 0.8, 0.75, 0.9, 0.5)),
      'La cantidad de hembras deseadas debe ser un número entero (se recibió 2.5).'
    );
  });

  test('las clases de error no cambian: Error', () => {
    assert.throws(() => calculateWeeklyEggsDemand(withLine({ daysPerWeek: 3.5 })), (error) => {
      return error instanceof Error && error.constructor === Error;
    });
    assert.throws(() => calculateProtein('hen_eggs', -1), (error) => {
      return error instanceof Error && error.constructor === Error;
    });
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

describe('sin valores de reserva en las funciones públicas', () => {
  // Demanda positiva para que el cálculo llegue a usar todos los parámetros del escenario.
  const eggs = withLine({});
  const meat = withLine({ portionQty: 100, portionUnit: 'gramos' });
  const PUBLIC_FUNCTIONS: [string, ProductCode, (key: string) => unknown][] = [
    ['calculateHens', 'hen_eggs', (key) => calculateHens(eggs, key)],
    ['calculateQuailEggs', 'quail_eggs', (key) => calculateQuailEggs(eggs, key)],
    ['calculateChickenMeat', 'chicken_meat', (key) => calculateChickenMeat(meat, key)],
    ['calculateQuailMeat', 'quail_meat', (key) => calculateQuailMeat(meat, key)],
  ];
  type Parameters = ScenarioDefinition['parameters'];
  const MODES: [string, (params: Parameters, name: keyof Parameters) => Parameters][] = [
    [
      'sin el parámetro',
      (params, name) => {
        const copy = { ...params };
        delete copy[name];
        return copy;
      },
    ],
    ['con el parámetro en undefined', (params, name) => ({ ...params, [name]: undefined })],
  ];

  for (const [fnName, productCode, calculate] of PUBLIC_FUNCTIONS) {
    for (const scenario of SCENARIOS.filter((item) => item.productCode === productCode)) {
      const names = Object.keys(scenario.parameters) as (keyof Parameters)[];
      for (const name of names) {
        for (const [modeName, mutate] of MODES) {
          test(`${fnName}(${scenario.key}) ${modeName} ${name} → error`, () => {
            const original = scenario.parameters;
            scenario.parameters = mutate(original, name);
            try {
              assert.throws(() => calculate(scenario.key), new RegExp(`le falta el parámetro ${name}`));
            } finally {
              scenario.parameters = original;
            }
          });
        }
      }
    }
  }

  test('cada función pública tiene escenarios con parámetros que probar', () => {
    for (const [, productCode] of PUBLIC_FUNCTIONS) {
      const scenarios = SCENARIOS.filter((item) => item.productCode === productCode);
      assert.ok(scenarios.length > 0);
      for (const scenario of scenarios) assert.equal(Object.keys(scenario.parameters).length, 3);
    }
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
