# Guía de integración del motor de cálculo

Para quien conecta la interfaz y SQLite con el motor (`avicola-1.0.0`). El detalle de las fórmulas está en [README.md](README.md).

## 1. Regla de oro

La interfaz y la base de datos **solo llaman a `src/domain`**. Nadie recalcula fórmulas fuera del motor: ni en pantallas, ni en repositorios, ni en consultas SQL.

- Importa las funciones de `@/domain/calculators` y los catálogos (productos, escenarios, referencias de proteína) de `@/domain/calculators/scenarios`.
- Si una pantalla necesita un número que el motor no da, se agrega al motor con su prueba. No se calcula aparte.

## 2. Contrato

Todas las funciones son síncronas. Los errores de validación son `Error` con un mensaje en español listo para mostrar. Las funciones de cálculo también pueden lanzar `RangeError` si el resultado excede el rango entero seguro de JavaScript (`El resultado … excede el rango entero seguro.`), algo que solo pasa con entradas absurdas.

### Tipos de entrada comunes

`ConsumptionLine` (de `@/types`), una por grupo de edad:

| Campo | Tipo | Unidad y regla |
| --- | --- | --- |
| `ageGroup` | `'0-3' \| '4-8' \| '9-13' \| '14-18' \| '19+'` | grupo de edad |
| `peopleCount` | `number` | personas; entero ≥ 0 |
| `portionQty` | `number` | huevos por ocasión, o **gramos de carne cocida** por ocasión; ≥ 0 |
| `portionUnit` | `'piezas' \| 'gramos'` | informativo |
| `occasionsPerDay` | `number` | veces al día; ≥ 0, admite decimales |
| `daysPerWeek` | `number` | entero de 0 a 7 |

**Errores de líneas (L)**, en este orden, para el primer campo que falle:

- `Las líneas de consumo deben ser una lista.`
- `El número de personas debe ser un número finito (se recibió X).`
- `El número de personas no puede ser negativo (CP-17).`
- `El número de personas debe ser un número entero (se recibió X).`
- `La porción de consumo debe ser un número finito (se recibió X).`
- `La porción de consumo no puede ser negativa.`
- `Las ocasiones por día deben ser un número finito (se recibió X).`
- `Las ocasiones por día no pueden ser negativas.`
- `Los días por semana deben ser un número finito (se recibió X).`
- `Los días por semana deben estar entre 0 y 7 (CP-16).`
- `Los días por semana deben ser un número entero (se recibió X).`

**Errores de escenario (E):**

- `Escenario no encontrado: <clave>`
- `El escenario <clave> pertenece a <producto> y no se puede usar para <producto>.`
- `Al escenario <clave> le falta el parámetro <nombre>.` (error de datos del catálogo; no debería pasar)

Claves de escenario válidas:

| Producto | Claves |
| --- | --- |
| `hen_eggs` | `hen_conservative`, `hen_intermediate`, `hen_good_management` |
| `quail_eggs` | `quail_conservative`, `quail_intermediate`, `quail_good_management` |
| `chicken_meat` | `chicken_fast_growing`, `chicken_slow_growing` |
| `quail_meat` | `quail_meat_reference` |

### `calculateHens(lines, scenarioKey)`

| | |
| --- | --- |
| Parámetros | `lines: ConsumptionLine[]` (huevos por ocasión); `scenarioKey: string` de `hen_eggs` |
| Devuelve | `CalculationResult`: `weeklyDemand` = huevos/semana; `primaryBirdsCount` = gallinas ponedoras (entero) |
| Errores | E, luego L |

### `calculateQuailEggs(lines, scenarioKey)`

| | |
| --- | --- |
| Parámetros | `lines: ConsumptionLine[]` (huevos por ocasión); `scenarioKey: string` de `quail_eggs` |
| Devuelve | `CalculationResult`: `weeklyDemand` = huevos/semana; `primaryBirdsCount` = codornices hembras ponedoras |
| Errores | E, luego L |

### `calculateChickenMeat(lines, scenarioKey)`

| | |
| --- | --- |
| Parámetros | `lines: ConsumptionLine[]` (gramos de carne cocida por ocasión); `scenarioKey: string` de `chicken_meat` |
| Devuelve | `CalculationResult`: `weeklyDemand` = kg/semana; `annualDemand` = kg/año (52 semanas); `slaughterBirdsCount` = aves para consumo; `primaryBirdsCount` = pollitos iniciales |
| Errores | E, luego L |

### `calculateQuailMeat(lines, scenarioKey)`

| | |
| --- | --- |
| Parámetros | `lines: ConsumptionLine[]` (gramos de carne cocida por ocasión); `scenarioKey: string` de `quail_meat` |
| Devuelve | `CalculationResult`: igual que pollo; `primaryBirdsCount` = codornices iniciales |
| Errores | E, luego L |

Con demanda 0, las cuatro funciones devuelven 0 aves (no es error).

### `calculateQuailBreeding(desiredFemales, fertility, hatchability, survival, femaleRatio = 0.50)`

| | |
| --- | --- |
| Parámetros | `desiredFemales: number`: hembras de reemplazo, entero ≥ 1. `fertility`, `hatchability`, `survival`, `femaleRatio: number`: proporciones en (0, 1], por ejemplo `0.8`, **no** `80` |
| Devuelve | `QuailReproductionResult`: `eggsToIncubate` = huevos a poner en incubadora (entero), más las entradas y `formulaText` |
| Errores | `La cantidad de hembras deseadas debe ser un número finito (se recibió X).` · `La cantidad de hembras deseadas debe ser mayor a cero.` · `La cantidad de hembras deseadas debe ser un número entero (se recibió X).` · `La fertilidad debe ser mayor a 0 y hasta 100% (CP-18).` · `La incubabilidad debe ser mayor a 0 y hasta 100% (CP-18).` · `La supervivencia debe ser mayor a 0 y hasta 100%.` · `La proporción de hembras debe ser mayor a 0 y hasta 100%.` · para una tasa no finita: `La fertilidad debe ser un número finito (se recibió X).` (igual con las otras tres) |

### `distributeLots(initialBirds, lotsCount)`

| | |
| --- | --- |
| Parámetros | `initialBirds: number`: aves, entero ≥ 0 (usa `primaryBirdsCount`). `lotsCount: number`: lotes, entero ≥ 1 |
| Devuelve | `LotDistribution`: `birdsPerLot` (por ejemplo 70 en 6 → `[12, 12, 12, 12, 11, 11]`), `lotsCount`, `totalBirds`, `explanation`. Con 0 aves: `lotsCount: 0`, `birdsPerLot: []` |
| Errores | `El número de lotes debe ser un número finito (se recibió X).` · `El número de lotes debe ser un entero positivo mayor a cero.` · `El número de aves a distribuir debe ser un número finito (se recibió X).` · `El número de aves a distribuir no puede ser negativo.` · `El número de aves a distribuir debe ser un número entero (se recibió X).` · `No se pueden repartir N aves en L lotes sin dejar lotes vacíos: usa como máximo N lotes.` |

### `calculateProtein(productCode, amount)`

| | |
| --- | --- |
| Parámetros | `productCode: ProductCode`. `amount: number`: huevos (unidades) o gramos de carne cocida; ≥ 0 |
| Devuelve | `number`: gramos de proteína, redondeados a 1 decimal |
| Errores | `Producto desconocido: <código>` · `La cantidad para calcular proteína debe ser un número finito (se recibió X).` · `La cantidad para calcular proteína no puede ser negativa.` |

Otras exportaciones útiles: `FORMULA_VERSION` (texto), `calculateWeeklyEggsDemand(lines)` y `calculateWeeklyMeatDemand(lines)` (demanda semanal sin escenario; lanzan errores L), y `validateConsumptionLines(lines)`.

## 3. Migración de nombres

Los nombres anteriores siguen funcionando, pero están marcados `@deprecated` y se eliminarán.

| Nombre anterior | Nombre nuevo | Diferencia |
| --- | --- | --- |
| `calculateHenEggs` | `calculateHens` | ninguna (es el mismo objeto) |
| `calculateQuailReproduction` | `calculateQuailBreeding` | ninguna (es el mismo objeto) |
| `calculateProteinGrams` | `calculateProtein` | el anterior devuelve `0` con cantidades no finitas o ≤ 0; el nuevo lanza error. Al migrar, agrega `try/catch` |

Hoy usan los nombres anteriores `src/app/plan/create.tsx` y `src/app/nutrients.tsx`.

## 4. Errores

Envuelve cada llamada en `try/catch` y muestra `error.message`. **No** tragues el error (`catch { return null }`) ni lo conviertas en 0: el usuario debe saber qué dato corregir, y un plan con error no se guarda.

```tsx
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { calculateHens } from '@/domain/calculators';
import type { CalculationResult, ConsumptionLine } from '@/types';

type Outcome = { ok: true; result: CalculationResult } | { ok: false; message: string };

function runHens(lines: ConsumptionLine[], scenarioKey: string): Outcome {
  try {
    return { ok: true, result: calculateHens(lines, scenarioKey) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo calcular el plan.';
    return { ok: false, message };
  }
}

export function HensSummary({ lines, scenarioKey }: { lines: ConsumptionLine[]; scenarioKey: string }) {
  const outcome = useMemo(() => runHens(lines, scenarioKey), [lines, scenarioKey]);

  if (!outcome.ok) {
    // Se muestra el motivo y no se ofrece guardar.
    return <Text accessibilityRole="alert">{outcome.message}</Text>;
  }

  return (
    <View>
      <Text>
        {outcome.result.primaryBirdsLabel}: {outcome.result.primaryBirdsCount}
      </Text>
    </View>
  );
}
```

## 5. Mostrar resultados

- Las cantidades de aves, huevos a incubar y lotes ya son **enteros**: muéstralas tal cual.
- Las demandas (`weeklyDemand`, `annualDemand`) se entregan **sin redondear**; por ejemplo, `0.3333333333333333`. Redondea solo al mostrar y nunca guardes ni recalcules con el valor redondeado.
- El proyecto todavía no tiene un helper de formato. Hasta que exista, usa algo como esto:

```ts
/** Texto con hasta `decimals` decimales, sin ceros sobrantes: 71.76 → "71.76", 0.3333… → "0.33". */
export function formatNumber(value: number, decimals = 2): string {
  return String(Number(value.toFixed(decimals)));
}

/** Proporción a porcentaje para mostrar: 0.57 → "57 %" (evita 56.99999999999999). */
export function formatPercent(rate: number, decimals = 1): string {
  return `${formatNumber(rate * 100, decimals)} %`;
}
```

**Porcentajes de entrada:** el motor recibe **proporciones** (`0.8`), no porcentajes (`80`). Si el usuario teclea `80`, pásalo como `80 / 100`. El motor normaliza cada número a 15 cifras significativas, así que `33.3 / 100` se toma como 0.333 exacto. Si pasas `80` por error, el motor responde, por ejemplo, `La fertilidad debe ser mayor a 0 y hasta 100% (CP-18).`

## 6. Guardar en la base de datos

Con cada plan, guarda:

1. **Las entradas**: las `ConsumptionLine[]` y, si aplica, el número de lotes y las entradas de reproducción.
2. **La clave del escenario** (`scenarioKey`).
3. **El resultado completo** que devolvió el motor: `CalculationResult` y, si aplica, `LotDistribution` y `QuailReproductionResult`.
4. **`FORMULA_VERSION` como texto** (`'avicola-1.0.0'`).

¿Por qué? Un plan guardado es una foto: si mañana cambia una fórmula o un parámetro, los planes viejos deben seguir mostrando lo que se calculó ese día, y la versión dice con qué modelo se calculó. Al abrir un plan, **muestra el resultado guardado; no lo recalcules**. Recalcula solo si el usuario edita el plan, y entonces guarda el nuevo resultado con la versión vigente.

```ts
import { calculateHens, FORMULA_VERSION } from '@/domain/calculators';
import type { CalculationResult, ConsumptionLine, LotDistribution, QuailReproductionResult } from '@/types';

export interface PlanSnapshot {
  formulaVersion: string;
  scenarioKey: string;
  consumptionLines: ConsumptionLine[];
  lotsCount?: number;
  result: CalculationResult;
  lots?: LotDistribution;
  reproduction?: QuailReproductionResult;
}

export function buildHensSnapshot(lines: ConsumptionLine[], scenarioKey: string): PlanSnapshot {
  // Si calculateHens lanza error, no se construye ni se guarda nada.
  const result = calculateHens(lines, scenarioKey);
  return { formulaVersion: FORMULA_VERSION, scenarioKey, consumptionLines: lines, result };
}

// Para SQLite: JSON.stringify(snapshot) en una columna TEXT; al leer, JSON.parse y mostrar tal cual.
```

**Pendiente en el esquema actual** (`src/database/migrations/001_initial.ts`):

- `production_plans.calculation_version` es `INTEGER` y no puede guardar `'avicola-1.0.0'`. Hasta que haya una columna de texto, guarda `formulaVersion` dentro de `result_json`, como en `PlanSnapshot`.
- El `CHECK` de `production_plans.type` solo admite `chicken_eggs`, `broiler` y `quail_eggs`. No coincide con los `ProductCode` del motor y no permite `quail_meat`.
- `src/app/plan/create.tsx` guarda el literal `'V1.0'`; debe usar `FORMULA_VERSION`.

## 7. Valores para probar la integración

Familia demo: 2 adultos (`19+`), 2 adolescentes (`14-18`) y 1 niño de 4 a 8 años (`4-8`). Todas las líneas tienen 1 ocasión al día.

| Producto | Consumo por persona y ocasión (19+ / 14-18 / 4-8) | Días/semana | Demanda | Resultado esperado |
| --- | --- | --- | --- | --- |
| Huevo de gallina | 2 / 2 / 1 huevos | 7 | 63 huevos/semana | 20 / 16 / 14 gallinas (conservador / intermedio / buen manejo) |
| Huevo de codorniz | 5 / 5 / 3 huevos | 4 | 92 huevos/semana | 26 / 23 / 19 hembras (conservador / intermedio / buen manejo) |
| Pollo, engorda rápida | 100 / 100 / 60 g | 3 | 1.38 kg/semana; 71.76 kg/año | 66 para consumo; 70 pollitos iniciales |
| Pollo, crecimiento lento | 100 / 100 / 60 g | 3 | 1.38 kg/semana; 71.76 kg/año | 106 para consumo; 118 pollitos iniciales |
| Codorniz, carne | 100 / 90 / 50 g | 1 | 0.43 kg/semana; 22.36 kg/año | 176 para consumo; 192 iniciales |

| Otra función | Llamada | Resultado esperado |
| --- | --- | --- |
| Reproducción | `calculateQuailBreeding(10, 0.8, 0.75, 0.9, 0.5)` | `eggsToIncubate: 38` |
| Lotes de pollo | `distributeLots(70, 6)` | `[12, 12, 12, 12, 11, 11]` |
| Lotes de codorniz | `distributeLots(192, 6)` | `[32, 32, 32, 32, 32, 32]` |
| Sin aves | `distributeLots(0, 6)` | `lotsCount: 0`, `birdsPerLot: []` |
| Proteína | `calculateProtein('chicken_meat', 50)` / `('quail_meat', 50)` / `('quail_eggs', 5)` | 14.5 / 12.6 / 7.7 g |
| Error esperado | `distributeLots(3, 6)` | `No se pueden repartir 3 aves en 6 lotes sin dejar lotes vacíos: usa como máximo 3 lotes.` |

Las líneas de la familia demo para huevo de gallina:

```ts
import { calculateHens } from '@/domain/calculators';
import type { ConsumptionLine } from '@/types';

export const demoHenEggs: ConsumptionLine[] = [
  { ageGroup: '19+', peopleCount: 2, portionQty: 2, portionUnit: 'piezas', occasionsPerDay: 1, daysPerWeek: 7 },
  { ageGroup: '14-18', peopleCount: 2, portionQty: 2, portionUnit: 'piezas', occasionsPerDay: 1, daysPerWeek: 7 },
  { ageGroup: '4-8', peopleCount: 1, portionQty: 1, portionUnit: 'piezas', occasionsPerDay: 1, daysPerWeek: 7 },
];

export const demoHens = calculateHens(demoHenEggs, 'hen_intermediate').primaryBirdsCount; // 16
```
