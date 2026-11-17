// Pruebas de integración motor → mapper → repositorio → mapper.
//
// NOTA: estas pruebas corren en Node con node:sqlite, no con expo-sqlite en el teléfono.
// El adaptador de abajo imita la API asíncrona de expo-sqlite (execAsync, runAsync,
// getFirstAsync, getAllAsync) sobre una base en memoria, igual que tests/plan.repository.test.ts.
// No cubren diferencias del motor SQLite del dispositivo ni del puente nativo.
//
// Flujo (el mismo que sigue src/app/plan/create.tsx al guardar):
//   líneas de consumo → función del motor → toStoredPlanInput → repository.create
//   → repository.findById → fromStoredPlan
//
// Deterministas: ids y fechas fijos; el reloj (Date) se congela con mock.timers porque el
// repositorio sella created_at/updated_at con new Date().
import assert from 'node:assert/strict';
import { after, before, describe, mock, test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';

import type { SQLiteDatabase } from 'expo-sqlite';

import {
  fromStoredPlan,
  toStoredPlanInput,
} from '../../src/application/mappers/plan.mapper';
import {
  FORMULA_VERSION,
  calculateChickenMeat,
  calculateHens,
  calculateQuailBreeding,
  calculateQuailEggs,
  calculateQuailMeat,
  distributeLots,
} from '../../src/domain/calculators';
import { initializeDatabase } from '../../src/database/migrations/001_initial';
import { migrateFamilyMetadata } from '../../src/database/migrations/002_family_metadata';
import { migratePlanCompatibility } from '../../src/database/migrations/003_plan_compatibility';
import {
  createPlanRepository,
  type PlanDb,
} from '../../src/database/repositories/plan.repository';
import type {
  AgeGroupKey,
  CalculationResult,
  ConsumptionLine,
  LotDistribution,
  Plan,
  ProductCode,
  QuailReproductionResult,
} from '../../src/types';
import type { ProductionPlan } from '../../src/types/plan.types';

// ============================================
// Entorno: base en memoria con las migraciones reales
// ============================================

type SqlValue = string | number | null;

const FIXED_NOW = '2026-11-16T12:00:00.000Z';
const FAMILY_ID = 'family-int-001';

function createTestAdapter(sqlite: DatabaseSync) {
  const db: PlanDb & { execAsync(sql: string): Promise<void> } = {
    async execAsync(sql: string) {
      sqlite.exec(sql);
    },

    async runAsync(sql: string, params: SqlValue[] = []) {
      const result = sqlite.prepare(sql).run(...params);
      return { changes: Number(result.changes) };
    },

    async getFirstAsync<T>(sql: string, params: SqlValue[] = []): Promise<T | null> {
      return (sqlite.prepare(sql).get(...params) ?? null) as T | null;
    },

    async getAllAsync<T>(sql: string, params: SqlValue[] = []): Promise<T[]> {
      return sqlite.prepare(sql).all(...params) as T[];
    },
  };

  return db;
}

/** Abre una base nueva, aplica 001 → 002 → 003 (igual que getDatabase) y crea la familia demo. */
async function openDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  const db = createTestAdapter(sqlite);
  const nativeDb = db as unknown as SQLiteDatabase;

  await initializeDatabase(nativeDb);
  await migrateFamilyMetadata(nativeDb);
  await migratePlanCompatibility(nativeDb);

  sqlite
    .prepare(
      `INSERT INTO profiles (
        id, name, children, adolescents, adults,
        consumption_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(FAMILY_ID, 'Familia demo', 1, 2, 2, '{}', FIXED_NOW, FIXED_NOW);

  return { sqlite, plans: createPlanRepository(db) };
}

type TestDatabase = Awaited<ReturnType<typeof openDatabase>>;

function countPlans(sqlite: DatabaseSync): number {
  const row = sqlite.prepare('SELECT COUNT(*) AS total FROM production_plans').get() as {
    total: number;
  };
  return Number(row.total);
}

// ============================================
// Familia demo: adultos 19+: 2; adolescentes 14-18: 2; niño 4-8: 1
// (mismas porciones que tests/domain/oracles.test.ts)
// ============================================

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

const HEN_EGGS_FAMILY = (): ConsumptionLine[] => [
  line('19+', 2, 2, 1, 7),
  line('14-18', 2, 2, 1, 7),
  line('4-8', 1, 1, 1, 7),
];
const QUAIL_EGGS_FAMILY = (): ConsumptionLine[] => [
  line('19+', 2, 5, 1, 4),
  line('14-18', 2, 5, 1, 4),
  line('4-8', 1, 3, 1, 4),
];
const CHICKEN_MEAT_FAMILY = (): ConsumptionLine[] => [
  line('19+', 2, 100, 1, 3, 'gramos'),
  line('14-18', 2, 100, 1, 3, 'gramos'),
  line('4-8', 1, 60, 1, 3, 'gramos'),
];
const QUAIL_MEAT_FAMILY = (): ConsumptionLine[] => [
  line('19+', 2, 100, 1, 1, 'gramos'),
  line('14-18', 2, 90, 1, 1, 'gramos'),
  line('4-8', 1, 50, 1, 1, 'gramos'),
];

// ============================================
// Flujo de la pantalla de crear plan
// ============================================

const ENGINE: Record<ProductCode, (lines: ConsumptionLine[], scenarioKey: string) => CalculationResult> = {
  hen_eggs: calculateHens,
  quail_eggs: calculateQuailEggs,
  chicken_meat: calculateChickenMeat,
  quail_meat: calculateQuailMeat,
};

interface PlanSpec {
  id: string;
  productCode: ProductCode;
  lines: ConsumptionLine[];
  scenarioKey: string;
  lotsCount?: number;
  breeding?: { desiredFemales: number; fertility: number; hatchability: number; survival: number; femaleRatio: number };
}

/** Calcula con el motor y arma el Plan como lo hace create.tsx (lots/reproduction ?? undefined). */
function buildPlan(spec: PlanSpec): Plan {
  const results = ENGINE[spec.productCode](spec.lines, spec.scenarioKey);
  const lots: LotDistribution | undefined =
    spec.lotsCount === undefined ? undefined : distributeLots(results.primaryBirdsCount, spec.lotsCount);
  const reproduction: QuailReproductionResult | undefined = spec.breeding
    ? calculateQuailBreeding(
        spec.breeding.desiredFemales,
        spec.breeding.fertility,
        spec.breeding.hatchability,
        spec.breeding.survival,
        spec.breeding.femaleRatio
      )
    : undefined;

  return {
    id: spec.id,
    familyId: FAMILY_ID,
    productCode: spec.productCode,
    name: `Plan ${spec.id}`,
    status: 'active',
    modelVersion: FORMULA_VERSION,
    consumptionLines: spec.lines,
    scenarioKey: spec.scenarioKey,
    results,
    lots,
    reproduction,
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
  };
}

/** toStoredPlanInput → create → findById → fromStoredPlan. Devuelve también la fila leída. */
async function saveAndLoad(
  plans: TestDatabase['plans'],
  plan: Plan
): Promise<{ stored: ProductionPlan; restored: Plan }> {
  await plans.create(toStoredPlanInput(plan));
  const stored = await plans.findById(plan.id);
  assert.ok(stored, `el plan ${plan.id} debe existir en la base`);
  return { stored, restored: fromStoredPlan(stored) };
}

// Reloj congelado para todo el archivo.
before(() => {
  mock.timers.enable({ apis: ['Date'], now: Date.parse(FIXED_NOW) });
});
after(() => {
  mock.timers.reset();
});

// ============================================
// 1) Casos felices: oráculos del dominio
// ============================================

const BREEDING_CP10 = { desiredFemales: 10, fertility: 0.8, hatchability: 0.75, survival: 0.9, femaleRatio: 0.5 };

interface HappyCase {
  title: string;
  spec: PlanSpec;
  weeklyDemand: number;
  annualDemand?: number;
  slaughterBirdsCount?: number;
  primaryBirdsCount: number;
  birdsPerLot?: number[];
  eggsToIncubate?: number;
}

const HAPPY_CASES: HappyCase[] = [
  // CP-01 a CP-03 · huevos de gallina (63/semana)
  ...(
    [
      ['hen_conservative', 20],
      ['hen_intermediate', 16],
      ['hen_good_management', 14],
    ] as const
  ).map(([scenarioKey, hens]) => ({
    title: `huevos de gallina · ${scenarioKey} → 63/semana, ${hens} gallinas`,
    spec: { id: `plan-hen-${scenarioKey}`, productCode: 'hen_eggs' as const, lines: HEN_EGGS_FAMILY(), scenarioKey },
    weeklyDemand: 63,
    primaryBirdsCount: hens,
  })),

  // CP-04 · carne de pollo, engorda rápida, con 6 lotes (CP-11)
  {
    title: 'carne de pollo · chicken_fast_growing → 1.38 kg/semana, 66/70, 6 lotes',
    spec: {
      id: 'plan-chicken-fast',
      productCode: 'chicken_meat',
      lines: CHICKEN_MEAT_FAMILY(),
      scenarioKey: 'chicken_fast_growing',
      lotsCount: 6,
    },
    weeklyDemand: 1.38,
    annualDemand: 71.76,
    slaughterBirdsCount: 66,
    primaryBirdsCount: 70,
    birdsPerLot: [12, 12, 12, 12, 11, 11],
  },

  // CP-05 · carne de pollo, crecimiento lento
  {
    title: 'carne de pollo · chicken_slow_growing → 1.38 kg/semana, 106/118',
    spec: {
      id: 'plan-chicken-slow',
      productCode: 'chicken_meat',
      lines: CHICKEN_MEAT_FAMILY(),
      scenarioKey: 'chicken_slow_growing',
    },
    weeklyDemand: 1.38,
    annualDemand: 71.76,
    slaughterBirdsCount: 106,
    primaryBirdsCount: 118,
  },

  // CP-06 a CP-08 · huevos de codorniz (92/semana); el intermedio lleva reproducción CP-10
  ...(
    [
      ['quail_conservative', 26],
      ['quail_intermediate', 23],
      ['quail_good_management', 19],
    ] as const
  ).map(([scenarioKey, females]) => {
    const withBreeding = scenarioKey === 'quail_intermediate';
    return {
      title: `huevos de codorniz · ${scenarioKey} → 92/semana, ${females} hembras${withBreeding ? ', reproducción 38' : ''}`,
      spec: {
        id: `plan-quail-${scenarioKey}`,
        productCode: 'quail_eggs' as const,
        lines: QUAIL_EGGS_FAMILY(),
        scenarioKey,
        breeding: withBreeding ? BREEDING_CP10 : undefined,
      },
      weeklyDemand: 92,
      primaryBirdsCount: females,
      eggsToIncubate: withBreeding ? 38 : undefined,
    };
  }),

  // CP-09 · carne de codorniz, con 6 lotes (CP-12)
  {
    title: 'carne de codorniz · quail_meat_reference → 0.43 kg/semana, 176/192, 6 lotes',
    spec: {
      id: 'plan-quail-meat',
      productCode: 'quail_meat',
      lines: QUAIL_MEAT_FAMILY(),
      scenarioKey: 'quail_meat_reference',
      lotsCount: 6,
    },
    weeklyDemand: 0.43,
    annualDemand: 22.36,
    slaughterBirdsCount: 176,
    primaryBirdsCount: 192,
    birdsPerLot: [32, 32, 32, 32, 32, 32],
  },
];

describe('1) motor → SQLite → motor: oráculos de la familia demo', () => {
  for (const item of HAPPY_CASES) {
    test(item.title, async () => {
      const { sqlite, plans } = await openDatabase();
      try {
        const plan = buildPlan(item.spec);

        // El motor produce el oráculo antes de guardar.
        assert.equal(plan.results.weeklyDemand, item.weeklyDemand);
        assert.equal(plan.results.primaryBirdsCount, item.primaryBirdsCount);
        assert.equal(plan.results.annualDemand, item.annualDemand);
        assert.equal(plan.results.slaughterBirdsCount, item.slaughterBirdsCount);
        assert.deepEqual(plan.lots?.birdsPerLot, item.birdsPerLot);
        assert.equal(plan.reproduction?.eggsToIncubate, item.eggsToIncubate);

        const { stored, restored } = await saveAndLoad(plans, plan);

        // Lo leído es idéntico al Plan original, campo por campo, sin redondeos.
        assert.deepEqual(restored, plan);
        assert.equal(restored.modelVersion, 'avicola-1.0.0');

        // Los valores exactos viajan tal cual en el JSON de la fila.
        assert.equal(restored.results.weeklyDemand, item.weeklyDemand);
        assert.equal(restored.results.annualDemand, item.annualDemand);
        assert.equal(restored.results.primaryBirdsCount, item.primaryBirdsCount);
        assert.equal(restored.results.slaughterBirdsCount, item.slaughterBirdsCount);
        assert.deepEqual(restored.lots?.birdsPerLot, item.birdsPerLot);
        assert.equal(restored.reproduction?.eggsToIncubate, item.eggsToIncubate);

        // Metadatos de la fila: tipo nuevo, versión textual en JSON y fechas del reloj fijo.
        assert.equal(stored.type, item.spec.productCode);
        assert.equal(stored.results.formulaVersion, 'avicola-1.0.0');
        assert.equal(stored.createdAt, FIXED_NOW);
        assert.equal(stored.updatedAt, FIXED_NOW);
        assert.equal(countPlans(sqlite), 1);
      } finally {
        sqlite.close();
      }
    });
  }
});

// ============================================
// 2) Consistencia: recalcular con las entradas guardadas
// ============================================

describe('2) consistencia: el motor reproduce lo guardado a partir de input_json', () => {
  for (const item of HAPPY_CASES) {
    test(`recalcula ${item.spec.id}`, async () => {
      const { sqlite, plans } = await openDatabase();
      try {
        const { stored, restored } = await saveAndLoad(plans, buildPlan(item.spec));

        // Solo se usan las entradas persistidas, no el Plan original.
        const inputs = stored.inputs as {
          consumptionLines: ConsumptionLine[];
          scenarioKey: string;
          lotsCount: number | null;
          reproductionInputs: PlanSpec['breeding'] | null;
        };

        const recomputed = ENGINE[restored.productCode](inputs.consumptionLines, inputs.scenarioKey);
        assert.deepEqual(recomputed, restored.results);

        if (inputs.lotsCount === null) {
          assert.equal(restored.lots, undefined);
        } else {
          assert.deepEqual(distributeLots(recomputed.primaryBirdsCount, inputs.lotsCount), restored.lots);
        }

        if (inputs.reproductionInputs === null) {
          assert.equal(restored.reproduction, undefined);
        } else {
          const r = inputs.reproductionInputs!;
          assert.deepEqual(
            calculateQuailBreeding(r.desiredFemales, r.fertility, r.hatchability, r.survival, r.femaleRatio),
            restored.reproduction
          );
        }
      } finally {
        sqlite.close();
      }
    });
  }
});
