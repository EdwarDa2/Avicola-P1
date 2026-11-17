
import assert from 'node:assert/strict';

import {
  fromStoredPlan,
  toStoredPlanInput,
} from '../src/application/mappers/plan.mapper';

import type {
  Plan,
} from '../src/types';

import type {
  ProductionPlan,
} from '../src/types/plan.types';

const now = new Date().toISOString();

const originalPlan: Plan = {
  id: 'plan-test-001',
  familyId: 'family-test-001',
  productCode: 'quail_eggs',
  name: 'Plan de codornices',

  status: 'active',
  modelVersion: 'avicola-1.0.0',

  consumptionLines: [
    {
      ageGroup: '19+',
      peopleCount: 2,
      portionQty: 5,
      portionUnit: 'piezas',
      occasionsPerDay: 1,
      daysPerWeek: 4,
    },
  ],

  scenarioKey: 'quail_intermediate',

  results: {
    productCode: 'quail_eggs',
    scenarioKey: 'quail_intermediate',
    scenarioName: 'Intermedio',
    weeklyDemand: 40,
    primaryBirdsCount: 10,
    primaryBirdsLabel: 'Codornices ponedoras',

    appliedParameters: {
      calendarWeeks: 52,
      safetyMargin: 0.15,
      layingRate: 0.75,
      utilizationRate: 0.95,
    },

    formulaText: 'G = ceil(...)',
    formulaVariables: [],
    explanation: 'Resultado de prueba.',
  },

  lots: {
    lotsCount: 2,
    birdsPerLot: [5, 5],
    totalBirds: 10,
    explanation: 'Distribución de prueba.',
  },

  reproduction: {
    desiredFemales: 10,
    fertility: 0.8,
    hatchability: 0.75,
    survival: 0.9,
    femaleRatio: 0.5,
    eggsToIncubate: 38,
    formulaText: 'H = ceil(...)',
  },

  createdAt: now,
  updatedAt: now,
};

function runTests() {
  console.log('\nPRUEBAS DEL ADAPTADOR DE PLANES\n');

  const input = toStoredPlanInput(originalPlan);

  assert.equal(
    input.type,
    'quail_eggs'
  );

  assert.equal(
    input.results.formulaVersion,
    'avicola-1.0.0'
  );

  console.log('✓ Plan convertido para SQLite');

  // Simular el registro recuperado de la BD.
  const storedPlan: ProductionPlan = {
    ...input,
    status: input.status ?? 'draft',
    calculationVersion:
      input.calculationVersion ?? 1,
    createdAt: now,
    updatedAt: now,
  };

  // Serialización igual a la de SQLite.
  storedPlan.inputs = JSON.parse(
    JSON.stringify(storedPlan.inputs)
  );

  storedPlan.results = JSON.parse(
    JSON.stringify(storedPlan.results)
  );

  const restored = fromStoredPlan(storedPlan);

  assert.equal(
    restored.familyId,
    originalPlan.familyId
  );

  assert.equal(
    restored.modelVersion,
    'avicola-1.0.0'
  );

  assert.deepEqual(
    restored.consumptionLines,
    originalPlan.consumptionLines
  );

  assert.deepEqual(
    restored.results,
    originalPlan.results
  );

  console.log('✓ Consumo y resultado recuperados');

  assert.deepEqual(
    restored.lots,
    originalPlan.lots
  );

  console.log('✓ Distribución de lotes conservada');

  assert.deepEqual(
    restored.reproduction,
    originalPlan.reproduction
  );

  console.log('✓ Reproducción conservada');

  console.log('\nTODAS LAS PRUEBAS PASARON\n');
}

runTests();
