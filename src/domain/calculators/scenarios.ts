import { ProductCode, ProductDefinition, ScenarioDefinition, FoodNutrientInfo } from '@/types';
import { Colors } from '@/constants/theme';

export const PRODUCTS: Record<ProductCode, ProductDefinition> = {
  hen_eggs: {
    code: 'hen_eggs',
    name: 'Huevos de Gallina',
    shortName: 'Gallinas ponedoras',
    species: 'Gallus gallus',
    purpose: 'eggs',
    unit: 'huevos',
    periodUnit: 'semana',
    iconName: 'egg',
    color: Colors.productHenEggs,
    hasLotsOption: false,
    hasBreedingOption: false,
    description: 'Estimación de gallinas ponedoras según consumo semanal, postura y margen de seguridad.',
  },
  chicken_meat: {
    code: 'chicken_meat',
    name: 'Carne de Pollo',
    shortName: 'Pollo de engorda',
    species: 'Gallus gallus',
    purpose: 'meat',
    unit: 'kg carne cocida',
    periodUnit: 'año',
    iconName: 'drumstick',
    color: Colors.productChickenMeat,
    hasLotsOption: true,
    hasBreedingOption: false,
    description: 'Demanda anual de carne comestible, aves para sacrificio y pollitos iniciales requeridos.',
  },
  quail_eggs: {
    code: 'quail_eggs',
    name: 'Huevos de Codorniz',
    shortName: 'Codorniz postura',
    species: 'Coturnix coturnix japonica',
    purpose: 'eggs',
    unit: 'huevos',
    periodUnit: 'semana',
    iconName: 'egg-outline',
    color: Colors.productQuailEggs,
    hasLotsOption: false,
    hasBreedingOption: true,
    description: 'Estimación de codornices hembras ponedoras y módulo opcional de reemplazo reproductivo.',
  },
  quail_meat: {
    code: 'quail_meat',
    name: 'Carne de Codorniz',
    shortName: 'Codorniz carne',
    species: 'Coturnix coturnix japonica',
    purpose: 'meat',
    unit: 'kg carne cocida',
    periodUnit: 'año',
    iconName: 'bone',
    color: Colors.productQuailMeat,
    hasLotsOption: true,
    hasBreedingOption: false,
    description: 'Aves para sacrificio y aves iniciales considerando rendimiento en canal y mortalidad.',
  },
};

export const PRODUCT_LIST: ProductDefinition[] = [
  PRODUCTS.hen_eggs,
  PRODUCTS.chicken_meat,
  PRODUCTS.quail_eggs,
  PRODUCTS.quail_meat,
];

export const SCENARIOS: ScenarioDefinition[] = [
  // --- Gallinas ponedoras (SRC-F1, PARAM-HEN) ---
  {
    key: 'hen_conservative',
    productCode: 'hen_eggs',
    name: 'Conservador (57 % postura)',
    shortDescription: 'Ambiente rústico de traspatio con recursos limitados.',
    parameters: {
      layingRate: 0.57,
      utilizationRate: 0.95,
      safetyMargin: 0.15,
    },
    sourceRef: 'SRC-F1 (Ejemplo oficial: 20 gallinas para 63 huevos/sem)',
    recommendedFor: 'Inicio en traspatio sin instalaciones acondicionadas.',
  },
  {
    key: 'hen_intermediate',
    productCode: 'hen_eggs',
    name: 'Intermedio (70 % postura)',
    shortDescription: 'Manejo balanceado con gallinero protegido y alimentación mixta.',
    parameters: {
      layingRate: 0.70,
      utilizationRate: 0.95,
      safetyMargin: 0.15,
    },
    sourceRef: 'SRC-F1 (Ejemplo oficial: 16 gallinas para 63 huevos/sem)',
    recommendedFor: 'Pequeñas granjas familiares con buen cuidado diario.',
  },
  {
    key: 'hen_good_management',
    productCode: 'hen_eggs',
    name: 'Buen manejo (82 % postura)',
    shortDescription: 'Aves de línea comercial con dieta formulada y fotoperiodo controlado.',
    parameters: {
      layingRate: 0.82,
      utilizationRate: 0.95,
      safetyMargin: 0.15,
    },
    sourceRef: 'SRC-F1 (Ejemplo oficial: 14 gallinas para 63 huevos/sem)',
    recommendedFor: 'Condiciones técnicas optimizadas.',
  },

  // --- Codornices ponedoras (SRC-F3, PARAM-QUAIL) ---
  {
    key: 'quail_conservative',
    productCode: 'quail_eggs',
    name: 'Conservador (60 % postura)',
    shortDescription: 'Jaulas básicas familiares con iluminación natural.',
    parameters: {
      layingRate: 0.60,
      utilizationRate: 0.95,
      safetyMargin: 0.10,
    },
    sourceRef: 'SRC-F3 (Ejemplo oficial: 26 hembras para 92 huevos/sem)',
    recommendedFor: 'Manejo en patio o iniciación avícola.',
  },
  {
    key: 'quail_intermediate',
    productCode: 'quail_eggs',
    name: 'Intermedio (68 % postura)',
    shortDescription: 'Jaulas protegidas, alimento ponedora y 14h de luz.',
    parameters: {
      layingRate: 0.68,
      utilizationRate: 0.95,
      safetyMargin: 0.10,
    },
    sourceRef: 'SRC-F3 (Ejemplo oficial: 23 hembras para 92 huevos/sem)',
    recommendedFor: 'Producción familiar estable.',
  },
  {
    key: 'quail_good_management',
    productCode: 'quail_eggs',
    name: 'Buen manejo (82 % postura)',
    shortDescription: 'Ambiente controlado y control estricto de temperatura/luz.',
    parameters: {
      layingRate: 0.82,
      utilizationRate: 0.95,
      safetyMargin: 0.10,
    },
    sourceRef: 'SRC-F3 (Ejemplo oficial: 19 hembras para 92 huevos/sem)',
    recommendedFor: 'Productores experimentados.',
  },

  // --- Pollos carne (SRC-F2, PARAM-CHICKEN-MEAT) ---
  {
    key: 'chicken_fast_growing',
    productCode: 'chicken_meat',
    name: 'Engorda rápida (1.2 kg / ave)',
    shortDescription: 'Línea de engorda rápida (tipo Ross/Cobb), ciclo ~7 semanas, mortalidad 5 %.',
    parameters: {
      meatYieldKg: 1.20,
      mortalityRate: 0.05,
      safetyMargin: 0.10,
    },
    sourceRef: 'SRC-F2 (Ejemplo oficial: 66 consumo, 70 pollitos iniciales)',
    recommendedFor: 'Alimentación balanceada comercial y espacio adecuado.',
  },
  {
    key: 'chicken_slow_growing',
    productCode: 'chicken_meat',
    name: 'Crecimiento lento / Criollo (0.75 kg / ave)',
    shortDescription: 'Aves criollas o campero, ciclo más largo (~14 semanas), mortalidad 10 %.',
    parameters: {
      meatYieldKg: 0.75,
      mortalityRate: 0.10,
      safetyMargin: 0.10,
    },
    sourceRef: 'SRC-F2 (Ejemplo oficial: 106 consumo, 118 pollitos iniciales)',
    recommendedFor: 'Pastoreo o aves de doble propósito en traspatio.',
  },

  // --- Codorniz carne (SRC-F3, PARAM-QUAIL-MEAT) ---
  {
    key: 'quail_meat_reference',
    productCode: 'quail_meat',
    name: 'Referencia oficial (0.14 kg / ave)',
    shortDescription: 'Codorniz cárnica a 5-6 semanas, canal comestible 140 g, mortalidad 8 %.',
    parameters: {
      meatYieldKg: 0.14,
      mortalityRate: 0.08,
      safetyMargin: 0.10,
    },
    sourceRef: 'SRC-F3 (Ejemplo oficial: 176 consumo, 192 aves iniciales)',
    recommendedFor: 'Lotes de codorniz japonesa para consumo cárnico.',
  },
];

export const NUTRIENT_REFERENCES: Record<ProductCode, FoodNutrientInfo> = {
  hen_eggs: {
    foodCode: 'hen_eggs',
    foodName: 'Huevo de gallina',
    proteinPerBasis: 6.5,
    basisDescription: 'por 1 huevo (~50 g)',
    source: 'SRC-F1 / Tablas de composición de alimentos',
  },
  quail_eggs: {
    foodCode: 'quail_eggs',
    foodName: 'Huevo de codorniz',
    proteinPerBasis: 1.54,
    basisDescription: 'por 1 huevo (~11-12 g)',
    source: 'SRC-F3 / Tablas de composición de alimentos',
  },
  chicken_meat: {
    foodCode: 'chicken_meat',
    foodName: 'Carne de pollo cocida',
    proteinPerBasis: 28.9,
    basisDescription: 'por 100 g de carne cocida comestible',
    source: 'SRC-F2 / Tablas nutricionales oficiales',
  },
  quail_meat: {
    foodCode: 'quail_meat',
    foodName: 'Carne de codorniz cocida',
    proteinPerBasis: 25.1,
    basisDescription: 'por 100 g de carne cocida comestible',
    source: 'SRC-F3 / Tablas nutricionales oficiales',
  },
};

