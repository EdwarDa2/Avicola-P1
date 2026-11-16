// Las explicaciones se generan con los parámetros del escenario, sin porcentajes fijos.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { calculateHens, calculateQuailEggs, calculateQuailMeat } from '@/domain/calculators';
import type { ConsumptionLine } from '@/types';

const eggs: ConsumptionLine[] = [
  { ageGroup: '19+', peopleCount: 63, portionQty: 1, portionUnit: 'piezas', occasionsPerDay: 1, daysPerWeek: 1 },
];
const meat: ConsumptionLine[] = [
  { ageGroup: '19+', peopleCount: 1, portionQty: 430, portionUnit: 'gramos', occasionsPerDay: 1, daysPerWeek: 1 },
];

describe('explicaciones', () => {
  test('gallinas: usa P, U y S del escenario (S = 15 %)', () => {
    const { explanation } = calculateHens(eggs, 'hen_conservative');
    assert.match(explanation, /postura al 57%/);
    assert.match(explanation, /aprovechamiento del 95%/);
    assert.match(explanation, /margen de seguridad del 15%/);
    assert.match(explanation, /20 gallinas/);
  });

  test('codorniz huevos: usa S = 10 % del escenario y también U', () => {
    const { explanation } = calculateQuailEggs(eggs, 'quail_good_management');
    assert.match(explanation, /postura al 82%/);
    assert.match(explanation, /aprovechamiento del 95%/);
    assert.match(explanation, /margen de seguridad del 10%/);
  });

  test('variables de la fórmula con porcentajes exactos', () => {
    const { formulaVariables } = calculateHens(eggs, 'hen_conservative');
    const values = Object.fromEntries(formulaVariables.map((v) => [v.symbol, v.value]));
    assert.equal(values.S, '15 %');
    assert.equal(values.P, '57 % (0.57)');
    assert.equal(values.U, '95 % (0.95)');
  });

  test('codorniz carne: Y en gramos sin ruido de punto flotante (140 g, no 140.00000000000003)', () => {
    const { formulaVariables } = calculateQuailMeat(meat, 'quail_meat_reference');
    const yieldText = formulaVariables.find((v) => v.symbol === 'Y')?.value;
    assert.equal(yieldText, '0.14 kg/ave (140 g)');
  });
});
