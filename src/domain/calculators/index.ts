import {
  ConsumptionLine,
  CalculationResult,
  ProductCode,
  LotDistribution,
  QuailReproductionResult,
} from '@/types';
import { NUTRIENT_REFERENCES, PRODUCTS } from './scenarios';
import {
  annualMeatKgExact,
  eggsToIncubateCore,
  layingFemalesCore,
  lotsCore,
  meatBirdsCore,
  proteinGramsCore,
  weeklyEggsExact,
  weeklyMeatKgExact,
} from './core';
import { mul, sign, toNumber } from '../math/rational';
import {
  assertNonNegative,
  requireParameter,
  resolveScenario,
  validateConsumptionLines,
} from './validation';

export { validateConsumptionLines } from './validation';

/** Proporción → porcentaje exacto para textos (0.95 → 95, 0.075 → 7.5). */
function percent(rate: number): number {
  return toNumber(mul(rate, 100));
}

/** Versión del modelo de cálculo que se guarda con cada plan (D-13, documentación §9.1). */
export const FORMULA_VERSION = 'avicola-1.0.0';

/**
 * F01 — Demanda semanal de huevos
 * E_sem = Σ (N_i * H_i * F_i * D_i)
 */
export function calculateWeeklyEggsDemand(lines: ConsumptionLine[]): number {
  validateConsumptionLines(lines);
  return toNumber(weeklyEggsExact(lines));
}

/**
 * F03 — Demanda semanal de carne cocida en kg
 * M_sem = Σ (N_i * M_i * F_i * D_i) / 1000
 */
export function calculateWeeklyMeatDemand(lines: ConsumptionLine[]): number {
  validateConsumptionLines(lines);
  return toNumber(weeklyMeatKgExact(lines));
}

/**
 * F02 & F01 — Cálculo para Huevos de Gallina (SRC-F1)
 */
export function calculateHens(
  lines: ConsumptionLine[],
  scenarioKey: string
): CalculationResult {
  const scenario = resolveScenario(scenarioKey, 'hen_eggs');

  validateConsumptionLines(lines);
  const weeklyEggs = weeklyEggsExact(lines);
  const weeklyDemand = toNumber(weeklyEggs);
  const P = requireParameter(scenario, 'layingRate');
  const U = requireParameter(scenario, 'utilizationRate');
  const S = requireParameter(scenario, 'safetyMargin');

  if (sign(weeklyEggs) <= 0) {
    return {
      productCode: 'hen_eggs',
      scenarioKey: scenario.key,
      scenarioName: scenario.name,
      weeklyDemand: 0,
      primaryBirdsCount: 0,
      primaryBirdsLabel: 'Gallinas ponedoras',
      appliedParameters: { calendarWeeks: 52, layingRate: P, utilizationRate: U, safetyMargin: S },
      formulaText: 'G = ceil(E_sem · (1 + S) / (7 · P · U))',
      formulaVariables: [
        { symbol: 'E_sem', meaning: 'Demanda semanal', value: '0 huevos' },
        { symbol: 'S', meaning: 'Margen de seguridad', value: `${percent(S)} %` },
        { symbol: 'P', meaning: 'Tasa de postura', value: `${percent(P)} %` },
        { symbol: 'U', meaning: 'Aprovechamiento', value: `${percent(U)} %` },
      ],
      explanation: 'Con demanda de 0 huevos no se requieren ponedoras.',
    };
  }

  // F02: G = ceil(E_sem · (1 + S) / (7 · P · U)), con aritmética exacta
  const layingHens = layingFemalesCore(weeklyEggs, {
    layingRate: P,
    utilizationRate: U,
    safetyMargin: S,
  });

  return {
    productCode: 'hen_eggs',
    scenarioKey: scenario.key,
    scenarioName: scenario.name,
    weeklyDemand,
    primaryBirdsCount: layingHens,
    primaryBirdsLabel: 'Gallinas ponedoras',
    appliedParameters: {
      calendarWeeks: 52,
      layingRate: P,
      utilizationRate: U,
      safetyMargin: S,
    },
    formulaText: 'G = ceil(E_sem · (1 + S) / (7 · P · U))',
    formulaVariables: [
      { symbol: 'E_sem', meaning: 'Demanda semanal', value: `${weeklyDemand} huevos/semana` },
      { symbol: 'S', meaning: 'Margen de seguridad', value: `${percent(S)} %` },
      { symbol: 'P', meaning: 'Postura diaria', value: `${percent(P)} % (${P})` },
      { symbol: 'U', meaning: 'Aprovechamiento', value: `${percent(U)} % (${U})` },
    ],
    explanation: `Para cubrir ${weeklyDemand} huevos/semana con postura al ${percent(P)}%, aprovechamiento del ${percent(U)}% y margen de seguridad del ${percent(S)}%, se calculan ${layingHens} gallinas ponedoras.`,
  };
}

/**
 * F02 & F01 — Cálculo para Huevos de Codorniz (SRC-F3)
 */
export function calculateQuailEggs(
  lines: ConsumptionLine[],
  scenarioKey: string
): CalculationResult {
  const scenario = resolveScenario(scenarioKey, 'quail_eggs');

  validateConsumptionLines(lines);
  const weeklyEggs = weeklyEggsExact(lines);
  const weeklyDemand = toNumber(weeklyEggs);
  const P = requireParameter(scenario, 'layingRate');
  const U = requireParameter(scenario, 'utilizationRate');
  const S = requireParameter(scenario, 'safetyMargin');

  if (sign(weeklyEggs) <= 0) {
    return {
      productCode: 'quail_eggs',
      scenarioKey: scenario.key,
      scenarioName: scenario.name,
      weeklyDemand: 0,
      primaryBirdsCount: 0,
      primaryBirdsLabel: 'Codornices ponedoras',
      appliedParameters: { calendarWeeks: 52, layingRate: P, utilizationRate: U, safetyMargin: S },
      formulaText: 'G = ceil(E_sem · (1 + S) / (7 · P · U))',
      formulaVariables: [
        { symbol: 'E_sem', meaning: 'Demanda semanal', value: '0 huevos' },
        { symbol: 'S', meaning: 'Margen de seguridad', value: `${percent(S)} %` },
        { symbol: 'P', meaning: 'Tasa de postura', value: `${percent(P)} %` },
        { symbol: 'U', meaning: 'Aprovechamiento', value: `${percent(U)} %` },
      ],
      explanation: 'Con demanda de 0 huevos no se requieren codornices.',
    };
  }

  // F02: G = ceil(E_sem · (1 + S) / (7 · P · U)), con aritmética exacta
  const layingFemales = layingFemalesCore(weeklyEggs, {
    layingRate: P,
    utilizationRate: U,
    safetyMargin: S,
  });

  return {
    productCode: 'quail_eggs',
    scenarioKey: scenario.key,
    scenarioName: scenario.name,
    weeklyDemand,
    primaryBirdsCount: layingFemales,
    primaryBirdsLabel: 'Codornices ponedoras',
    appliedParameters: {
      calendarWeeks: 52,
      layingRate: P,
      utilizationRate: U,
      safetyMargin: S,
    },
    formulaText: 'G = ceil(E_sem · (1 + S) / (7 · P · U))',
    formulaVariables: [
      { symbol: 'E_sem', meaning: 'Demanda semanal', value: `${weeklyDemand} huevos/semana` },
      { symbol: 'S', meaning: 'Margen de seguridad', value: `${percent(S)} %` },
      { symbol: 'P', meaning: 'Postura diaria', value: `${percent(P)} % (${P})` },
      { symbol: 'U', meaning: 'Aprovechamiento', value: `${percent(U)} % (${U})` },
    ],
    explanation: `Para cubrir ${weeklyDemand} huevos/semana con postura al ${percent(P)}%, aprovechamiento del ${percent(U)}% y margen de seguridad del ${percent(S)}%, se calculan ${layingFemales} codornices hembras.`,
  };
}

/**
 * F03, F04, F05, F06 — Cálculo para Carne de Pollo (SRC-F2)
 */
export function calculateChickenMeat(
  lines: ConsumptionLine[],
  scenarioKey: string
): CalculationResult {
  const scenario = resolveScenario(scenarioKey, 'chicken_meat');

  validateConsumptionLines(lines);
  const weeklyKg = weeklyMeatKgExact(lines);
  const annualKg = annualMeatKgExact(weeklyKg); // F04, D-01: 52 semanas
  const weeklyDemandKg = toNumber(weeklyKg);
  const annualDemandKg = toNumber(annualKg);
  const Y = requireParameter(scenario, 'meatYieldKg');
  const m = requireParameter(scenario, 'mortalityRate');
  const S = requireParameter(scenario, 'safetyMargin');

  if (sign(annualKg) <= 0) {
    return {
      productCode: 'chicken_meat',
      scenarioKey: scenario.key,
      scenarioName: scenario.name,
      weeklyDemand: 0,
      annualDemand: 0,
      primaryBirdsCount: 0,
      primaryBirdsLabel: 'Pollitos iniciales',
      slaughterBirdsCount: 0,
      appliedParameters: { calendarWeeks: 52, meatYieldKg: Y, mortalityRate: m, safetyMargin: S },
      formulaText: 'A_slaughter = ceil(M_año · (1 + S) / Y); A_initial = ceil(A_slaughter / (1 - m))',
      formulaVariables: [
        { symbol: 'M_año', meaning: 'Demanda anual', value: '0 kg' },
        { symbol: 'Y', meaning: 'Rendimiento comestible', value: `${Y} kg/ave` },
        { symbol: 'm', meaning: 'Mortalidad', value: `${percent(m)} %` },
      ],
      explanation: 'Con demanda de 0 kg no se requieren aves de engorda.',
    };
  }

  // F05 y F06 en dos etapas: A_s = ceil(M_año·(1+S)/Y); A_i = ceil(A_s/(1−m))
  const { slaughterBirds: birdsToSlaughter, initialBirds: initialChicks } = meatBirdsCore(annualKg, {
    meatYieldKg: Y,
    mortalityRate: m,
    safetyMargin: S,
  });

  return {
    productCode: 'chicken_meat',
    scenarioKey: scenario.key,
    scenarioName: scenario.name,
    weeklyDemand: weeklyDemandKg,
    annualDemand: annualDemandKg,
    primaryBirdsCount: initialChicks,
    primaryBirdsLabel: 'Pollitos iniciales requeridos',
    slaughterBirdsCount: birdsToSlaughter,
    appliedParameters: {
      calendarWeeks: 52,
      meatYieldKg: Y,
      mortalityRate: m,
      safetyMargin: S,
    },
    formulaText: 'A_slaughter = ceil(M_año · (1+S)/Y); A_initial = ceil(A_slaughter/(1-m))',
    formulaVariables: [
      { symbol: 'M_sem', meaning: 'Demanda semanal', value: `${weeklyDemandKg} kg/semana` },
      { symbol: 'M_año', meaning: 'Demanda anual (52 sem)', value: `${annualDemandKg} kg/año` },
      { symbol: 'Y', meaning: 'Rendimiento comestible', value: `${Y} kg/ave` },
      { symbol: 'S', meaning: 'Margen de seguridad', value: `${percent(S)} %` },
      { symbol: 'm', meaning: 'Mortalidad esperada', value: `${percent(m)} %` },
    ],
    explanation: `Para abastecer ${annualDemandKg} kg/año se requieren ${birdsToSlaughter} aves para sacrificio. Considerando ${percent(m)}% de mortalidad, deben iniciarse ${initialChicks} pollitos.`,
  };
}

/**
 * F03, F04, F05, F06 — Cálculo para Carne de Codorniz (SRC-F3)
 */
export function calculateQuailMeat(
  lines: ConsumptionLine[],
  scenarioKey: string
): CalculationResult {
  const scenario = resolveScenario(scenarioKey, 'quail_meat');

  validateConsumptionLines(lines);
  const weeklyKg = weeklyMeatKgExact(lines);
  const annualKg = annualMeatKgExact(weeklyKg); // F04, D-01: 52 semanas
  const weeklyDemandKg = toNumber(weeklyKg);
  const annualDemandKg = toNumber(annualKg);
  const Y = requireParameter(scenario, 'meatYieldKg');
  const m = requireParameter(scenario, 'mortalityRate');
  const S = requireParameter(scenario, 'safetyMargin');

  if (sign(annualKg) <= 0) {
    return {
      productCode: 'quail_meat',
      scenarioKey: scenario.key,
      scenarioName: scenario.name,
      weeklyDemand: 0,
      annualDemand: 0,
      primaryBirdsCount: 0,
      primaryBirdsLabel: 'Codornices iniciales',
      slaughterBirdsCount: 0,
      appliedParameters: { calendarWeeks: 52, meatYieldKg: Y, mortalityRate: m, safetyMargin: S },
      formulaText: 'A_slaughter = ceil(M_año · (1 + S) / Y); A_initial = ceil(A_slaughter / (1 - m))',
      formulaVariables: [
        { symbol: 'M_año', meaning: 'Demanda anual', value: '0 kg' },
        { symbol: 'Y', meaning: 'Rendimiento', value: `${Y} kg/ave` },
        { symbol: 'm', meaning: 'Mortalidad', value: `${percent(m)} %` },
      ],
      explanation: 'Con demanda de 0 kg no se requieren codornices para engorda.',
    };
  }

  // F05 y F06 en dos etapas: A_s = ceil(M_año·(1+S)/Y); A_i = ceil(A_s/(1−m))
  const { slaughterBirds: birdsToSlaughter, initialBirds } = meatBirdsCore(annualKg, {
    meatYieldKg: Y,
    mortalityRate: m,
    safetyMargin: S,
  });

  return {
    productCode: 'quail_meat',
    scenarioKey: scenario.key,
    scenarioName: scenario.name,
    weeklyDemand: weeklyDemandKg,
    annualDemand: annualDemandKg,
    primaryBirdsCount: initialBirds,
    primaryBirdsLabel: 'Aves iniciales requeridas',
    slaughterBirdsCount: birdsToSlaughter,
    appliedParameters: {
      calendarWeeks: 52,
      meatYieldKg: Y,
      mortalityRate: m,
      safetyMargin: S,
    },
    formulaText: 'A_slaughter = ceil(M_año · (1+S)/Y); A_initial = ceil(A_slaughter/(1-m))',
    formulaVariables: [
      { symbol: 'M_sem', meaning: 'Demanda semanal', value: `${weeklyDemandKg} kg/semana` },
      { symbol: 'M_año', meaning: 'Demanda anual (52 sem)', value: `${annualDemandKg} kg/año` },
      { symbol: 'Y', meaning: 'Rendimiento canal comestible', value: `${Y} kg/ave (${toNumber(mul(Y, 1000))} g)` },
      { symbol: 'S', meaning: 'Margen de seguridad', value: `${percent(S)} %` },
      { symbol: 'm', meaning: 'Mortalidad esperada', value: `${percent(m)} %` },
    ],
    explanation: `Para abastecer ${annualDemandKg} kg/año se requieren ${birdsToSlaughter} codornices al sacrificio. Previendo ${percent(m)}% de mortalidad, se inician ${initialBirds} aves.`,
  };
}

/**
 * F08 — Distribución exacta de aves en lotes (SRC-F2, SRC-F3)
 * base = floor(A / L)
 * remainder = A mod L
 * lote_j = base + (j <= remainder ? 1 : 0)
 */
export function distributeLots(initialBirds: number, lotsCount: number): LotDistribution {
  // El núcleo valida L entero >= 1, aves enteras >= 0 y L <= aves (CP-19, D-11)
  const birdsPerLot = lotsCore(initialBirds, lotsCount);

  if (birdsPerLot.length === 0) {
    return {
      lotsCount: 0,
      birdsPerLot,
      totalBirds: 0,
      explanation: 'Sin aves para distribuir: no se generan lotes vacíos (CP-19).',
    };
  }

  const totalCalculated = birdsPerLot.reduce((a, b) => a + b, 0);
  if (totalCalculated !== initialBirds) {
    throw new Error(`Inconsistencia en suma de lotes: ${totalCalculated} != ${initialBirds}`);
  }

  return {
    lotsCount: birdsPerLot.length,
    birdsPerLot,
    totalBirds: initialBirds,
    explanation: `Distribución exacta de ${initialBirds} aves en ${lotsCount} lotes: ${birdsPerLot.join(', ')} aves. Suma total idéntica: ${totalCalculated} aves (RF-18).`,
  };
}

/**
 * F07 — Planificación de reproducción de codorniz ponedora (SRC-F3, Ec. 9)
 * H = ceil(R / (f * h * s * p_female))
 */
export function calculateQuailBreeding(
  desiredFemales: number,
  fertility: number,
  hatchability: number,
  survival: number,
  femaleRatio: number = 0.50
): QuailReproductionResult {
  // F07 con aritmética exacta; el núcleo valida R entero >= 1 y tasas en (0, 1] (CP-18)
  const eggsToIncubate = eggsToIncubateCore(desiredFemales, {
    fertility,
    hatchability,
    survival,
    femaleRatio,
  });

  return {
    desiredFemales,
    fertility,
    hatchability,
    survival,
    femaleRatio,
    eggsToIncubate,
    formulaText: 'H = ceil(R / (f · h · s · p_female))',
  };
}

/**
 * F13 — Proteína aproximada aportada (SRC-F1, SRC-F2, SRC-F3, D-07).
 * Huevos: cantidad en unidades; carne: gramos de carne cocida comestible.
 * Devuelve gramos redondeados a 1 decimal (half-up) con aritmética exacta.
 * Lanza error si la cantidad no es finita o es negativa, o si el producto no existe.
 */
export function calculateProtein(productCode: ProductCode, amount: number): number {
  const reference = NUTRIENT_REFERENCES[productCode];
  const product = PRODUCTS[productCode];
  if (!reference || !product) {
    throw new Error(`Producto desconocido: ${String(productCode)}`);
  }
  assertNonNegative(amount, 'La cantidad para calcular proteína', { feminine: true });
  const basisUnits = product.purpose === 'eggs' ? 1 : 100;
  return proteinGramsCore(amount, reference.proteinPerBasis, basisUnits);
}

// --- Alias @deprecated (D-12): se conservan hasta que los Integrantes 1 y 3 migren ---

/** @deprecated Usa `calculateHens` (contrato de integración, D-12). */
export const calculateHenEggs = calculateHens;

/** @deprecated Usa `calculateQuailBreeding` (contrato de integración, D-12). */
export const calculateQuailReproduction = calculateQuailBreeding;

/**
 * @deprecated Usa `calculateProtein` (D-12). A diferencia de `calculateProtein`, este alias es
 * tolerante: devuelve 0 si la cantidad no es finita o es <= 0, porque `nutrients.tsx` lo llama
 * sin try/catch. Se eliminará cuando el Integrante 1 migre esa pantalla.
 */
export function calculateProteinGrams(productCode: ProductCode, amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return calculateProtein(productCode, amount);
}
