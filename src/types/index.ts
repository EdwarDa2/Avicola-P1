/**
 * Tipos y Contratos del Sistema Avícola Familiar
 * Alineados con la especificación V1.0 y las decisiones de diseño D-01 a D-08.
 */

export type AgeGroupKey = '0-3' | '4-8' | '9-13' | '14-18' | '19+';

export interface AgeGroupDefinition {
  key: AgeGroupKey;
  label: string;
  ageRange: string;
  description: string;
  isSpecialChildGroup?: boolean; // 0-3 años: no mostrar porciones predeterminadas sugeridas (D-03)
}

export const AGE_GROUPS: AgeGroupDefinition[] = [
  {
    key: '0-3',
    label: 'Primera infancia',
    ageRange: '0 a 3 años',
    description: 'Consumo registrado exclusivamente a criterio del planificador familiar.',
    isSpecialChildGroup: true,
  },
  {
    key: '4-8',
    label: 'Infancia temprana',
    ageRange: '4 a 8 años',
    description: 'Niñas y niños en edad escolar inicial.',
  },
  {
    key: '9-13',
    label: 'Infancia y pubertad',
    ageRange: '9 a 13 años',
    description: 'Etapa de desarrollo y crecimiento activo.',
  },
  {
    key: '14-18',
    label: 'Adolescencia',
    ageRange: '14 a 18 años',
    description: 'Jóvenes en desarrollo físico sostenido.',
  },
  {
    key: '19+',
    label: 'Adultos',
    ageRange: '19 años o más',
    description: 'Personas adultas y adultas mayores de la familia.',
  },
];

export interface Family {
  id: string;
  name: string;
  archived: boolean;
  ageCounts: Record<AgeGroupKey, number>;
  createdAt: string;
  updatedAt: string;
}

export type ProductCode = 'hen_eggs' | 'chicken_meat' | 'quail_eggs' | 'quail_meat';

export interface ProductDefinition {
  code: ProductCode;
  name: string;
  shortName: string;
  species: 'Gallus gallus' | 'Coturnix coturnix japonica';
  purpose: 'eggs' | 'meat';
  unit: string;
  periodUnit: string;
  iconName: string;
  color: string;
  hasLotsOption: boolean;
  hasBreedingOption: boolean;
  description: string;
}

export interface ScenarioDefinition {
  key: string;
  productCode: ProductCode;
  name: string;
  shortDescription: string;
  parameters: {
    layingRate?: number;       // P (0 a 1)
    utilizationRate?: number;  // U (ej. 0.95)
    safetyMargin: number;      // S (ej. 0.15 o 0.10)
    meatYieldKg?: number;      // Y (kg carne cocida comestible / ave)
    mortalityRate?: number;    // m (0 a 1)
  };
  sourceRef: string;
  recommendedFor?: string;
}

export interface ConsumptionLine {
  ageGroup: AgeGroupKey;
  peopleCount: number;
  portionQty: number;      // piezas/ocasión (huevos) o gramos cocidos/ocasión (carne)
  portionUnit: 'piezas' | 'gramos';
  occasionsPerDay: number; // veces al día (ej. 1)
  daysPerWeek: number;     // 0 a 7
}

export interface CalculationResult {
  productCode: ProductCode;
  scenarioKey: string;
  scenarioName: string;
  
  // Métricas de demanda
  weeklyDemand: number;        // huevos/semana o kg carne cocida/semana
  annualDemand?: number;       // kg carne cocida/año (multiplicado por 52 semanas, D-01)
  
  // Salida animal principal
  primaryBirdsCount: number;   // Gallinas ponedoras o Pollitos/Aves iniciales
  primaryBirdsLabel: string;   // Ej: "Gallinas ponedoras", "Pollitos iniciales"
  
  // Pasos intermedios para transparencia (M10, RF-13)
  slaughterBirdsCount?: number;// Aves necesarias para sacrificio (antes de mortalidad)
  
  // Parámetros aplicados en el snapshot
  appliedParameters: {
    calendarWeeks: number;     // 52 según D-01
    layingRate?: number;
    utilizationRate?: number;
    safetyMargin: number;
    meatYieldKg?: number;
    mortalityRate?: number;
  };
  
  formulaText: string;
  formulaVariables: Array<{ symbol: string; meaning: string; value: string }>;
  explanation: string;
}

export interface LotDistribution {
  lotsCount: number;
  birdsPerLot: number[];
  totalBirds: number;
  explanation: string;
}

export interface QuailReproductionResult {
  desiredFemales: number;
  fertility: number;         // f (ej. 0.80)
  hatchability: number;      // h (ej. 0.75)
  survival: number;          // s (ej. 0.90)
  femaleRatio: number;       // p_female (ej. 0.50)
  eggsToIncubate: number;    // H (F07)
  formulaText: string;
}

export interface Plan {
  id: string;
  familyId: string;
  productCode: ProductCode;
  name: string;
  status: 'active' | 'inactive' | 'archived';
  modelVersion: string;
  consumptionLines: ConsumptionLine[];
  scenarioKey: string;
  results: CalculationResult;
  lots?: LotDistribution;
  reproduction?: QuailReproductionResult;
  createdAt: string;
  updatedAt: string;
}

export interface BasketItem {
  productCode: ProductCode;
  productName: string;
  planId: string;
  planName: string;
  scenarioName: string;
  weeklyDemandText: string;
  annualDemandText?: string;
  birdsSummaryText: string;
  accentColor: string;
  lotsSummary?: string;
  breedingSummary?: string;
  updatedAt: string;
}

export interface FoodNutrientInfo {
  foodCode: ProductCode;
  foodName: string;
  proteinPerBasis: number; // gramos de proteína
  basisDescription: string; // "por huevo (~50g)" o "por 100g cocidos"
  source: string;
}

