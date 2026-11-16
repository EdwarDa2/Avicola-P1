import {
  ConsumptionLine,
  CalculationResult,
  ProductCode,
  ScenarioDefinition,
  LotDistribution,
  QuailReproductionResult,
} from '@/types';
import { SCENARIOS, PRODUCTS } from './scenarios';
import {
  annualMeatKgExact,
  eggsToIncubateCore,
  layingFemalesCore,
  lotsCore,
  meatBirdsCore,
  weeklyEggsExact,
  weeklyMeatKgExact,
} from './core';
import { sign, toNumber } from '../math/rational';

/**
 * Validaciones matemáticas estrictas (CP13 - CP19)
 */
export function validateConsumptionLines(lines: ConsumptionLine[]): void {
  for (const line of lines) {
    if (line.peopleCount < 0) {
      throw new Error('El número de personas no puede ser negativo (CP-17).');
    }
    if (line.portionQty < 0) {
      throw new Error('La porción de consumo no puede ser negativa.');
    }
    if (line.occasionsPerDay < 0) {
      throw new Error('Las ocasiones por día no pueden ser negativas.');
    }
    if (line.daysPerWeek < 0 || line.daysPerWeek > 7) {
      throw new Error('Los días por semana deben estar entre 0 y 7 (CP-16).');
    }
  }
}

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
export function calculateHenEggs(
  lines: ConsumptionLine[],
  scenarioKey: string
): CalculationResult {
  const scenario = SCENARIOS.find((s) => s.key === scenarioKey);
  if (!scenario) throw new Error(`Escenario no encontrado: ${scenarioKey}`);

  validateConsumptionLines(lines);
  const weeklyEggs = weeklyEggsExact(lines);
  const weeklyDemand = toNumber(weeklyEggs);
  const P = scenario.parameters.layingRate ?? 0.70;
  const U = scenario.parameters.utilizationRate ?? 0.95;
  const S = scenario.parameters.safetyMargin ?? 0.15;

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
        { symbol: 'S', meaning: 'Margen de seguridad', value: `${(S * 100).toFixed(0)} %` },
        { symbol: 'P', meaning: 'Tasa de postura', value: `${(P * 100).toFixed(0)} %` },
        { symbol: 'U', meaning: 'Aprovechamiento', value: `${(U * 100).toFixed(0)} %` },
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
      { symbol: 'S', meaning: 'Margen de seguridad', value: `${(S * 100).toFixed(0)} %` },
      { symbol: 'P', meaning: 'Postura diaria', value: `${(P * 100).toFixed(0)} % (${P})` },
      { symbol: 'U', meaning: 'Aprovechamiento', value: `${(U * 100).toFixed(0)} % (${U})` },
    ],
    explanation: `Para cubrir ${weeklyDemand} huevos/semana con postura al ${(P * 100).toFixed(0)}% y aprovechamiento del 95%, se calculan exactamente ${layingHens} gallinas ponedoras.`,
  };
}

/**
 * F02 & F01 — Cálculo para Huevos de Codorniz (SRC-F3)
 */
export function calculateQuailEggs(
  lines: ConsumptionLine[],
  scenarioKey: string
): CalculationResult {
  const scenario = SCENARIOS.find((s) => s.key === scenarioKey);
  if (!scenario) throw new Error(`Escenario no encontrado: ${scenarioKey}`);

  validateConsumptionLines(lines);
  const weeklyEggs = weeklyEggsExact(lines);
  const weeklyDemand = toNumber(weeklyEggs);
  const P = scenario.parameters.layingRate ?? 0.68;
  const U = scenario.parameters.utilizationRate ?? 0.95;
  const S = scenario.parameters.safetyMargin ?? 0.10;

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
        { symbol: 'S', meaning: 'Margen de seguridad', value: `${(S * 100).toFixed(0)} %` },
        { symbol: 'P', meaning: 'Tasa de postura', value: `${(P * 100).toFixed(0)} %` },
        { symbol: 'U', meaning: 'Aprovechamiento', value: `${(U * 100).toFixed(0)} %` },
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
      { symbol: 'S', meaning: 'Margen de seguridad', value: `${(S * 100).toFixed(0)} %` },
      { symbol: 'P', meaning: 'Postura diaria', value: `${(P * 100).toFixed(0)} % (${P})` },
      { symbol: 'U', meaning: 'Aprovechamiento', value: `${(U * 100).toFixed(0)} % (${U})` },
    ],
    explanation: `Para cubrir ${weeklyDemand} huevos/semana con postura al ${(P * 100).toFixed(0)}% y seguridad del 10%, se calculan exactamente ${layingFemales} codornices hembras.`,
  };
}

/**
 * F03, F04, F05, F06 — Cálculo para Carne de Pollo (SRC-F2)
 */
export function calculateChickenMeat(
  lines: ConsumptionLine[],
  scenarioKey: string
): CalculationResult {
  const scenario = SCENARIOS.find((s) => s.key === scenarioKey);
  if (!scenario) throw new Error(`Escenario no encontrado: ${scenarioKey}`);

  validateConsumptionLines(lines);
  const weeklyKg = weeklyMeatKgExact(lines);
  const annualKg = annualMeatKgExact(weeklyKg); // F04, D-01: 52 semanas
  const weeklyDemandKg = toNumber(weeklyKg);
  const annualDemandKg = toNumber(annualKg);
  const Y = scenario.parameters.meatYieldKg ?? 1.20;
  const m = scenario.parameters.mortalityRate ?? 0.05;
  const S = scenario.parameters.safetyMargin ?? 0.10;

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
        { symbol: 'm', meaning: 'Mortalidad', value: `${(m * 100).toFixed(0)} %` },
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
      { symbol: 'S', meaning: 'Margen de seguridad', value: `${(S * 100).toFixed(0)} %` },
      { symbol: 'm', meaning: 'Mortalidad esperada', value: `${(m * 100).toFixed(0)} %` },
    ],
    explanation: `Para abastecer ${annualDemandKg} kg/año se requieren ${birdsToSlaughter} aves para sacrificio. Considerando ${(m * 100).toFixed(0)}% de mortalidad, deben iniciarse ${initialChicks} pollitos.`,
  };
}

/**
 * F03, F04, F05, F06 — Cálculo para Carne de Codorniz (SRC-F3)
 */
export function calculateQuailMeat(
  lines: ConsumptionLine[],
  scenarioKey: string
): CalculationResult {
  const scenario = SCENARIOS.find((s) => s.key === scenarioKey);
  if (!scenario) throw new Error(`Escenario no encontrado: ${scenarioKey}`);

  validateConsumptionLines(lines);
  const weeklyKg = weeklyMeatKgExact(lines);
  const annualKg = annualMeatKgExact(weeklyKg); // F04, D-01: 52 semanas
  const weeklyDemandKg = toNumber(weeklyKg);
  const annualDemandKg = toNumber(annualKg);
  const Y = scenario.parameters.meatYieldKg ?? 0.14;
  const m = scenario.parameters.mortalityRate ?? 0.08;
  const S = scenario.parameters.safetyMargin ?? 0.10;

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
        { symbol: 'm', meaning: 'Mortalidad', value: `${(m * 100).toFixed(0)} %` },
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
      { symbol: 'Y', meaning: 'Rendimiento canal comestible', value: `${Y} kg/ave (${Y * 1000} g)` },
      { symbol: 'S', meaning: 'Margen de seguridad', value: `${(S * 100).toFixed(0)} %` },
      { symbol: 'm', meaning: 'Mortalidad esperada', value: `${(m * 100).toFixed(0)} %` },
    ],
    explanation: `Para abastecer ${annualDemandKg} kg/año se requieren ${birdsToSlaughter} codornices al sacrificio. Previendo ${(m * 100).toFixed(0)}% de mortalidad, se inician ${initialBirds} aves.`,
  };
}

/**
 * F08 — Distribución exacta de aves en lotes (SRC-F2, SRC-F3)
 * base = floor(A / L)
 * remainder = A mod L
 * lote_j = base + (j <= remainder ? 1 : 0)
 */
export function distributeLots(initialBirds: number, lotsCount: number): LotDistribution {
  if (lotsCount <= 0 || !Number.isInteger(lotsCount)) {
    throw new Error('El número de lotes debe ser un entero positivo mayor a cero.');
  }
  if (initialBirds <= 0) {
    return {
      lotsCount,
      birdsPerLot: new Array(lotsCount).fill(0),
      totalBirds: 0,
      explanation: 'Sin aves para distribuir en lotes (CP-19).',
    };
  }

  const birdsPerLot = lotsCore(initialBirds, lotsCount);

  const totalCalculated = birdsPerLot.reduce((a, b) => a + b, 0);
  if (totalCalculated !== initialBirds) {
    throw new Error(`Inconsistencia en suma de lotes: ${totalCalculated} != ${initialBirds}`);
  }

  return {
    lotsCount,
    birdsPerLot,
    totalBirds: initialBirds,
    explanation: `Distribución exacta de ${initialBirds} aves en ${lotsCount} lotes: ${birdsPerLot.join(', ')} aves. Suma total idéntica: ${totalCalculated} aves (RF-18).`,
  };
}

/**
 * F07 — Planificación de reproducción de codorniz ponedora (SRC-F3, Ec. 9)
 * H = ceil(R / (f * h * s * p_female))
 */
export function calculateQuailReproduction(
  desiredFemales: number,
  fertility: number,
  hatchability: number,
  survival: number,
  femaleRatio: number = 0.50
): QuailReproductionResult {
  if (desiredFemales <= 0) {
    throw new Error('La cantidad de hembras deseadas debe ser mayor a cero.');
  }
  if (fertility <= 0 || fertility > 1) {
    throw new Error('La fertilidad debe ser mayor a 0 y hasta 100% (CP-18).');
  }
  if (hatchability <= 0 || hatchability > 1) {
    throw new Error('La incubabilidad debe ser mayor a 0 y hasta 100% (CP-18).');
  }
  if (survival <= 0 || survival > 1) {
    throw new Error('La supervivencia debe ser mayor a 0 y hasta 100%.');
  }
  if (femaleRatio <= 0 || femaleRatio > 1) {
    throw new Error('La proporción de hembras debe ser mayor a 0 y hasta 100%.');
  }

  // F07 con aritmética exacta
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
 * F13 — Proteína aproximada aportada (SRC-F1, SRC-F2, SRC-F3, D-07)
 */
export function calculateProteinGrams(
  productCode: ProductCode,
  amount: number // unidades (huevos) o gramos cocidos (carne)
): number {
  if (amount <= 0) return 0;
  switch (productCode) {
    case 'hen_eggs':
      return Math.round(amount * 6.5 * 10) / 10;
    case 'quail_eggs':
      return Math.round(amount * 1.54 * 10) / 10;
    case 'chicken_meat':
      return Math.round((amount / 100) * 28.9 * 10) / 10;
    case 'quail_meat':
      return Math.round((amount / 100) * 25.1 * 10) / 10;
    default:
      return 0;
  }
}

