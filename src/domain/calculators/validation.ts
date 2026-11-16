/**
 * Validadores del dominio (D-11, CP-13 a CP-19).
 *
 * Reglas:
 * - Todos los números deben ser finitos (se rechazan NaN e Infinity).
 * - Personas y días/semana son enteros; días entre 0 y 7. Porciones y ocasiones son finitas y >= 0.
 * - El escenario debe existir y pertenecer al producto que se calcula.
 * - No hay valores de reserva: si a un escenario le falta un parámetro es un error.
 *
 * Sin dependencias de React ni de base de datos.
 */
import type { ConsumptionLine, ProductCode, ScenarioDefinition } from '@/types';

import { SCENARIOS } from './scenarios';

/**
 * Género y número de la etiqueta, para que el verbo y el adjetivo del mensaje concuerden con ella.
 * Por defecto, masculino singular ("El número de personas debe ser…").
 */
export interface Agreement {
  feminine?: boolean;
  plural?: boolean;
}

/** "debe ser" o "deben ser". */
function mustBe(agreement: Agreement): string {
  return agreement.plural ? 'deben ser' : 'debe ser';
}

/** "no puede ser negativo", "no puede ser negativa", "no pueden ser negativos" o "no pueden ser negativas". */
function cannotBeNegative(agreement: Agreement): string {
  const verb = agreement.plural ? 'no pueden ser' : 'no puede ser';
  const adjective = `negativ${agreement.feminine ? 'a' : 'o'}${agreement.plural ? 's' : ''}`;
  return `${verb} ${adjective}`;
}

/** Exige un número finito. */
export function assertFinite(value: number, label: string, agreement: Agreement = {}): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} ${mustBe(agreement)} un número finito (se recibió ${String(value)}).`);
  }
}

/** Exige un número finito mayor o igual a cero. */
export function assertNonNegative(value: number, label: string, agreement: Agreement = {}): void {
  assertFinite(value, label, agreement);
  if (value < 0) {
    throw new Error(`${label} ${cannotBeNegative(agreement)}.`);
  }
}

/** Exige un entero mayor o igual a cero. */
export function assertNonNegativeInteger(value: number, label: string, agreement: Agreement = {}): void {
  assertNonNegative(value, label, agreement);
  if (!Number.isInteger(value)) {
    throw new Error(`${label} ${mustBe(agreement)} un número entero (se recibió ${String(value)}).`);
  }
}

/** Exige una proporción en el intervalo (0, 1]. */
export function assertRateInUnitInterval(value: number, label: string, caseId?: string): void {
  assertFinite(value, label);
  if (value <= 0 || value > 1) {
    const suffix = caseId ? ` (${caseId})` : '';
    throw new Error(`${label} debe ser mayor a 0 y hasta 100%${suffix}.`);
  }
}

/** Valida las líneas de consumo de F01/F03 (CP-16, CP-17 y D-11). */
export function validateConsumptionLines(lines: readonly ConsumptionLine[]): void {
  if (!Array.isArray(lines)) {
    throw new Error('Las líneas de consumo deben ser una lista.');
  }
  for (const line of lines) {
    assertFinite(line.peopleCount, 'El número de personas');
    if (line.peopleCount < 0) {
      throw new Error('El número de personas no puede ser negativo (CP-17).');
    }
    assertNonNegativeInteger(line.peopleCount, 'El número de personas');

    assertFinite(line.portionQty, 'La porción de consumo', { feminine: true });
    if (line.portionQty < 0) {
      throw new Error('La porción de consumo no puede ser negativa.');
    }

    assertFinite(line.occasionsPerDay, 'Las ocasiones por día', { feminine: true, plural: true });
    if (line.occasionsPerDay < 0) {
      throw new Error('Las ocasiones por día no pueden ser negativas.');
    }

    assertFinite(line.daysPerWeek, 'Los días por semana', { plural: true });
    if (line.daysPerWeek < 0 || line.daysPerWeek > 7) {
      throw new Error('Los días por semana deben estar entre 0 y 7 (CP-16).');
    }
    assertNonNegativeInteger(line.daysPerWeek, 'Los días por semana', { plural: true });
  }
}

/** Devuelve el escenario `scenarioKey` y exige que pertenezca a `productCode`. */
export function resolveScenario(scenarioKey: string, productCode: ProductCode): ScenarioDefinition {
  const scenario = SCENARIOS.find((item) => item.key === scenarioKey);
  if (!scenario) {
    throw new Error(`Escenario no encontrado: ${scenarioKey}`);
  }
  if (scenario.productCode !== productCode) {
    throw new Error(
      `El escenario ${scenarioKey} pertenece a ${scenario.productCode} y no se puede usar para ${productCode}.`
    );
  }
  return scenario;
}

type ScenarioParameter = keyof ScenarioDefinition['parameters'];

/** Lee un parámetro del escenario; si falta o no es finito es un error (sin valores de reserva). */
export function requireParameter(scenario: ScenarioDefinition, name: ScenarioParameter): number {
  const value = scenario.parameters[name];
  if (value === undefined) {
    throw new Error(`Al escenario ${scenario.key} le falta el parámetro ${name}.`);
  }
  assertFinite(value, `El parámetro ${name} del escenario ${scenario.key}`);
  return value;
}
