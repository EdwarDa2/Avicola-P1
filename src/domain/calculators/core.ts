/**
 * Núcleos puros del motor de cálculo (`avicola-1.0.0`).
 *
 * Reciben los parámetros de forma explícita (sin escenarios) y calculan con racionales exactos
 * (D-10): no hay redondeos intermedios y cada `ceil` se aplica sobre el cociente exacto.
 * Las funciones públicas de `index.ts` resuelven el escenario y llaman a estos núcleos.
 *
 * Módulo puro: sin dependencias de React Native, Expo ni de la interfaz.
 */
import type { ConsumptionLine } from '@/types';

import {
  add,
  bigintToSafeNumber,
  ceil,
  div,
  type Exact,
  mul,
  rational,
  type Rational,
  sign,
  sub,
} from '../math/rational';
import { assertFinite, assertNonNegativeInteger, assertRateInUnitInterval } from './validation';

/** Un `number` debe ser finito; un racional ya lo es por construcción. */
function assertExactFinite(value: Exact, label: string): void {
  if (typeof value === 'number') assertFinite(value, label);
}

/** D-01: semanas por año para la demanda anual de carne. */
export const CALENDAR_WEEKS = 52;

/** Gramos por kilogramo (F03). */
const GRAMS_PER_KG = 1000;

/** Días por semana en el denominador de F02. */
const DAYS_PER_WEEK = 7;

/**
 * Σ (N_i · Q_i · F_i · D_i) exacto, en la unidad de la porción
 * (huevos para F01, gramos de carne cocida para F03).
 */
export function weeklyPortionSum(lines: readonly ConsumptionLine[]): Rational {
  let total: Rational = rational(BigInt(0));
  for (const line of lines) {
    const product = mul(
      mul(line.peopleCount, line.portionQty),
      mul(line.occasionsPerDay, line.daysPerWeek)
    );
    total = add(total, product);
  }
  return total;
}

/** F01 — E_sem = Σ (N_i · H_i · F_i · D_i), en huevos/semana. */
export function weeklyEggsExact(lines: readonly ConsumptionLine[]): Rational {
  return weeklyPortionSum(lines);
}

/** F03 — M_sem = Σ (N_i · M_i · F_i · D_i) / 1000, en kg de carne cocida/semana. */
export function weeklyMeatKgExact(lines: readonly ConsumptionLine[]): Rational {
  return div(weeklyPortionSum(lines), GRAMS_PER_KG);
}

/** F04 — M_año = M_sem · 52, en kg/año. */
export function annualMeatKgExact(weeklyKg: Exact): Rational {
  return mul(weeklyKg, CALENDAR_WEEKS);
}

export interface LayingParameters {
  /** P: postura diaria (proporción 0–1). */
  layingRate: number;
  /** U: aprovechamiento (proporción 0–1). */
  utilizationRate: number;
  /** S: margen de seguridad (proporción). */
  safetyMargin: number;
}

/**
 * F02 — G = ceil( E_sem · (1 + S) / (7 · P · U) ).
 * Con E_sem = 0 devuelve 0; con demanda positiva exige P > 0 y U > 0 (CP-13).
 */
export function layingFemalesCore(weeklyEggs: Exact, params: LayingParameters): number {
  assertExactFinite(weeklyEggs, 'La demanda semanal de huevos');
  assertFinite(params.layingRate, 'La tasa de postura');
  assertFinite(params.utilizationRate, 'La tasa de aprovechamiento');
  assertFinite(params.safetyMargin, 'El margen de seguridad');
  if (sign(weeklyEggs) <= 0) return 0;
  if (sign(params.layingRate) <= 0) {
    throw new Error('La tasa de postura no puede ser 0 o negativa con demanda positiva (CP-13).');
  }
  if (sign(params.utilizationRate) <= 0) {
    throw new Error('La tasa de aprovechamiento debe ser mayor a 0.');
  }
  const numerator = mul(weeklyEggs, add(1, params.safetyMargin));
  const denominator = mul(DAYS_PER_WEEK, mul(params.layingRate, params.utilizationRate));
  return bigintToSafeNumber(ceil(div(numerator, denominator)));
}

export interface MeatParameters {
  /** Y: kg de carne cocida comestible por ave. */
  meatYieldKg: number;
  /** m: mortalidad esperada (proporción 0–1). */
  mortalityRate: number;
  /** S: margen de seguridad (proporción). */
  safetyMargin: number;
}

export interface MeatBirds {
  /** A_s: aves para consumo (primera etapa de redondeo). */
  slaughterBirds: number;
  /** A_i: aves iniciales (segunda etapa de redondeo). */
  initialBirds: number;
}

/**
 * F05 y F06 en dos etapas de redondeo, a partir de la demanda anual exacta:
 *   A_s = ceil( M_año · (1 + S) / Y )
 *   A_i = ceil( A_s / (1 − m) )
 * No se usa la "fórmula para copiar" de un solo ceil de los PDF (ver README del dominio).
 * Con M_año = 0 devuelve 0/0; con demanda positiva exige Y > 0 (CP-14) y m < 1 (CP-15).
 */
export function meatBirdsCore(annualKg: Exact, params: MeatParameters): MeatBirds {
  assertExactFinite(annualKg, 'La demanda anual de carne');
  assertFinite(params.meatYieldKg, 'El rendimiento en carne');
  assertFinite(params.mortalityRate, 'La mortalidad');
  assertFinite(params.safetyMargin, 'El margen de seguridad');
  if (sign(annualKg) <= 0) return { slaughterBirds: 0, initialBirds: 0 };
  if (sign(params.meatYieldKg) <= 0) {
    throw new Error('El rendimiento en carne no puede ser 0 o menor (CP-14).');
  }
  const survival = sub(1, params.mortalityRate);
  if (sign(survival) <= 0) {
    throw new Error('La mortalidad no puede ser del 100% o superior (CP-15).');
  }
  const slaughter = ceil(div(mul(annualKg, add(1, params.safetyMargin)), params.meatYieldKg));
  const initial = ceil(div(rational(slaughter), survival));
  return {
    slaughterBirds: bigintToSafeNumber(slaughter),
    initialBirds: bigintToSafeNumber(initial),
  };
}

export interface BreedingParameters {
  /** f: fertilidad. */
  fertility: number;
  /** h: incubabilidad. */
  hatchability: number;
  /** s: supervivencia. */
  survival: number;
  /** p_hembras: proporción de hembras. */
  femaleRatio: number;
}

/**
 * F07 — H = ceil( R / (f · h · s · p_hembras) ), huevos a incubar.
 * R debe ser entero >= 1 (son hembras); f, h, s y p_hembras en (0, 1] (CP-18, enmienda D-11).
 */
export function eggsToIncubateCore(desiredFemales: number, params: BreedingParameters): number {
  assertFinite(desiredFemales, 'La cantidad de hembras deseadas');
  if (desiredFemales <= 0) {
    throw new Error('La cantidad de hembras deseadas debe ser mayor a cero.');
  }
  assertNonNegativeInteger(desiredFemales, 'La cantidad de hembras deseadas');
  assertRateInUnitInterval(params.fertility, 'La fertilidad', 'CP-18');
  assertRateInUnitInterval(params.hatchability, 'La incubabilidad', 'CP-18');
  assertRateInUnitInterval(params.survival, 'La supervivencia');
  assertRateInUnitInterval(params.femaleRatio, 'La proporción de hembras');
  const efficiency = mul(
    mul(params.fertility, params.hatchability),
    mul(params.survival, params.femaleRatio)
  );
  return bigintToSafeNumber(ceil(div(desiredFemales, efficiency)));
}

/**
 * F08 (regla del equipo) — base = floor(A/L); resto = A mod L; lote_j = base + (j <= resto ? 1 : 0).
 * Opera con enteros, así que no necesita racionales.
 */
export function lotsCore(birds: number, lots: number): number[] {
  const base = Math.floor(birds / lots);
  const remainder = birds % lots;
  const result: number[] = [];
  for (let j = 1; j <= lots; j++) {
    result.push(base + (j <= remainder ? 1 : 0));
  }
  return result;
}
