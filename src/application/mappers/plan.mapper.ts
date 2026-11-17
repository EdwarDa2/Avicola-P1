
import type {
    CalculationResult,
    ConsumptionLine,
    LotDistribution,
    Plan,
    ProductCode,
    QuailReproductionResult,
} from '../../types';

import type {
    CreatePlanInput,
    ProductionPlan,
} from '../../types/plan.types';

const SNAPSHOT_VERSION = 1;

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
    );
}

function isCalculationResult(
    value: unknown
): value is CalculationResult {
    return (
        isRecord(value) &&
        typeof value.productCode === 'string' &&
        typeof value.scenarioKey === 'string' &&
        typeof value.scenarioName === 'string' &&
        typeof value.weeklyDemand === 'number' &&
        typeof value.primaryBirdsCount === 'number' &&
        typeof value.primaryBirdsLabel === 'string' &&
        typeof value.explanation === 'string' &&
        typeof value.formulaText === 'string' &&
        Array.isArray(value.formulaVariables) &&
        isRecord(value.appliedParameters)
    );
}

function mapProductCode(
    type: ProductionPlan['type']
): ProductCode {
    switch (type) {
        case 'chicken_eggs':
            return 'hen_eggs';

        case 'broiler':
            return 'chicken_meat';

        case 'hen_eggs':
        case 'chicken_meat':
        case 'quail_eggs':
        case 'quail_meat':
            return type;

        default:
            throw new Error(
                `Tipo de producción no compatible: ${type}`
            );
    }
}

function mapStatus(
    status: ProductionPlan['status']
): Plan['status'] {
    switch (status) {
        case 'active':
            return 'active';

        case 'archived':
            return 'archived';

        case 'inactive':
        case 'draft':
        case 'completed':
            return 'inactive';

        default:
            return 'inactive';
    }
}

// ============================================
// INTERFAZ -> SQLITE
// ============================================

export function toStoredPlanInput(
    plan: Plan
): CreatePlanInput {
    const inputs: Record<string, unknown> = {
        consumptionLines: plan.consumptionLines,
        scenarioKey: plan.scenarioKey,
        lotsCount: plan.lots?.lotsCount ?? null,

        reproductionInputs: plan.reproduction
            ? {
                desiredFemales:
                    plan.reproduction.desiredFemales,
                fertility:
                    plan.reproduction.fertility,
                hatchability:
                    plan.reproduction.hatchability,
                survival:
                    plan.reproduction.survival,
                femaleRatio:
                    plan.reproduction.femaleRatio,
            }
            : null,
    };

    const results: Record<string, unknown> = {
        snapshotVersion: SNAPSHOT_VERSION,

        // Versión textual real del motor.
        formulaVersion: plan.modelVersion,

        // Resultado completo, sin redondear.
        calculation: plan.results,

        // Resultados opcionales.
        lots: plan.lots ?? null,
        reproduction: plan.reproduction ?? null,
    };

    return {
        id: plan.id,
        profileId: plan.familyId,
        name: plan.name,
        type: plan.productCode,
        status: plan.status,

        // Columna INTEGER de compatibilidad.
        // La versión textual está en results.
        calculationVersion: 1,

        inputs,
        results,
    };
}

// ============================================
// SQLITE -> INTERFAZ
// ============================================

export function fromStoredPlan(
    stored: ProductionPlan
): Plan {
    const inputs = stored.inputs;
    const results = stored.results;

    if (
        results.snapshotVersion !== SNAPSHOT_VERSION
    ) {
        throw new Error(
            `El plan "${stored.name}" utiliza un ` +
            'formato de almacenamiento no compatible.'
        );
    }

    if (
        !Array.isArray(inputs.consumptionLines)
    ) {
        throw new Error(
            `El plan "${stored.name}" no contiene ` +
            'sus líneas de consumo.'
        );
    }

    if (!isCalculationResult(results.calculation)) {
        throw new Error(
            `El plan "${stored.name}" no contiene ` +
            'un resultado de cálculo válido.'
        );
    }

    if (
        typeof results.formulaVersion !== 'string'
    ) {
        throw new Error(
            `El plan "${stored.name}" no contiene ` +
            'la versión del motor de cálculo.'
        );
    }

    return {
        id: stored.id,
        familyId: stored.profileId,
        productCode: mapProductCode(stored.type),
        name: stored.name,
        status: mapStatus(stored.status),

        modelVersion: results.formulaVersion,

        consumptionLines:
            inputs.consumptionLines as ConsumptionLine[],

        scenarioKey:
            typeof inputs.scenarioKey === 'string'
                ? inputs.scenarioKey
                : results.calculation.scenarioKey,

        results: results.calculation,


        lots:
            results.lots == null
                ? undefined
                : (results.lots as LotDistribution),

        reproduction:
            results.reproduction == null
                ? undefined
                : (results.reproduction as QuailReproductionResult),

        createdAt: stored.createdAt,
        updatedAt: stored.updatedAt,
    };
}
