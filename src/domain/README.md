# Motor de cálculo del dominio (`avicola-1.0.0`)

Este paquete contiene las funciones puras que calculan las aves necesarias para autoconsumo, los lotes, la reproducción de codornices y el aporte de proteína. Lo mantiene el Integrante 2 (M02, M03, M04 y M08).

- **TypeScript puro.** No depende de React Native, de Expo ni de la interfaz. Se prueba con `npm test` en Node.
- **Fórmulas del cliente inmutables (D-09).** Las ecuaciones vienen de los tres PDF del cliente: [F1] gallinas de postura, [F2] pollos para carne y [F3] codornices. Lo que agregó el equipo se marca como *regla del equipo*.
- **Versión del modelo:** `FORMULA_VERSION = 'avicola-1.0.0'`. Cada plan guardado debe registrarla.

Fuente de verdad: `src/Agentes/Planificador_Avicola_Conocimiento_Completo.md` (§5 y §12).

## Estructura

| Archivo | Contenido |
| --- | --- |
| `calculators/index.ts` | API pública: resuelve el escenario, valida y arma `CalculationResult`, `LotDistribution` y `QuailReproductionResult` |
| `calculators/core.ts` | Núcleos puros con parámetros explícitos (F01–F08, F13) |
| `calculators/validation.ts` | Validadores de D-11 (CP-13 a CP-19) |
| `calculators/scenarios.ts` | Productos, escenarios fijos (D-02, D-04) y referencias de proteína (D-07) |
| `math/rational.ts` | Racionales exactos con BigInt |

## API pública (contrato de integración, D-12)

| Función | Fórmulas | Devuelve |
| --- | --- | --- |
| `calculateHens(lines, scenarioKey)` | F01, F02 | Gallinas ponedoras |
| `calculateQuailEggs(lines, scenarioKey)` | F01, F02 | Codornices hembras ponedoras |
| `calculateChickenMeat(lines, scenarioKey)` | F03–F06 | Pollos para consumo e iniciales |
| `calculateQuailMeat(lines, scenarioKey)` | F03–F06 | Codornices para consumo e iniciales |
| `calculateQuailBreeding(R, f, h, s, p)` | F07 | Huevos a incubar |
| `distributeLots(aves, lotes)` | F08 | Aves por lote |
| `calculateProtein(producto, cantidad)` | F13 | Gramos de proteína (1 decimal) |
| `calculateWeeklyEggsDemand(lines)` / `calculateWeeklyMeatDemand(lines)` | F01 / F03 | Demanda semanal |

Alias `@deprecated`, que se conservan hasta que los Integrantes 1 y 3 migren:

- `calculateHenEggs` → `calculateHens`
- `calculateQuailReproduction` → `calculateQuailBreeding`
- `calculateProteinGrams` → `calculateProtein`

Ojo: `calculateProteinGrams` es tolerante y devuelve 0 si la cantidad no es finita o es ≤ 0, porque `nutrients.tsx` lo llama sin try/catch. `calculateProtein` es estricto y lanza un error.

Los números se entregan **sin redondear**: por ejemplo, la demanda de 3 × 0.333 × 7 se entrega como 6.993. La interfaz decide cómo formatearlos.

## Ecuaciones

Notación: N_i = personas del grupo i, F_i = ocasiones por día, D_i = días por semana.

| ID | Ecuación | Fuente | Unidad del resultado |
| --- | --- | --- | --- |
| F01 | E_sem = Σ (N_i · H_i · F_i · D_i) | [F1], [F3] | huevos/semana |
| F02 | G = ceil( E_sem · (1 + S) / (7 · P · U) ) | [F1], [F3] | hembras ponedoras |
| F03 | M_sem = Σ (N_i · M_i · F_i · D_i) / 1000 | [F2], [F3] | kg de carne cocida/semana |
| F04 | M_año = M_sem · 52 | [F2], [F3] | kg/año |
| F05 | A_s = ceil( M_año · (1 + S) / Y ) | [F2], [F3] | aves para consumo (etapa 1) |
| F06 | A_i = ceil( A_s / (1 − m) ) | [F2], [F3] | aves iniciales (etapa 2) |
| F07 | H = ceil( R / (f · h · s · p_hembras) ) | [F3], Ec. 9 | huevos a incubar |
| F08 | base = floor(A_i / L); resto = A_i mod L; lote_j = base + (j ≤ resto ? 1 : 0) | **regla del equipo** | aves por lote; suma = A_i |
| F13 | proteína = huevos · g/huevo, o bien carne_g · g/100 g / 100 | [F1], [F2], [F3] | g de proteína (1 decimal, half-up) |

### Variables

| Símbolo | Significado | Unidad interna | En código |
| --- | --- | --- | --- |
| H_i | Huevos por persona y ocasión | unidades | `portionQty` |
| M_i | Carne cocida comestible por persona y ocasión | gramos | `portionQty` |
| N_i, F_i, D_i | Personas, ocasiones/día, días/semana | entero, decimal ≥ 0, entero 0–7 | `peopleCount`, `occasionsPerDay`, `daysPerWeek` |
| P | Postura diaria | proporción 0–1 | `layingRate` |
| U | Aprovechamiento | proporción (0.95, fijo) | `utilizationRate` |
| S | Margen de seguridad | 0.15 en gallinas; 0.10 en pollo y codorniz | `safetyMargin` |
| Y | Carne cocida comestible por ave | kg/ave | `meatYieldKg` |
| m | Mortalidad esperada | proporción 0–1 | `mortalityRate` |
| R | Hembras de reemplazo deseadas | entero ≥ 1 | `desiredFemales` |
| f, h, s, p_hembras | Fertilidad, incubabilidad, supervivencia, proporción de hembras | proporción en (0, 1] | `fertility`, `hatchability`, `survival`, `femaleRatio` |
| L | Número de lotes | entero ≥ 1 | `lotsCount` |

### Escenarios fijos (D-02, D-04)

| Producto | Escenario | Parámetros |
| --- | --- | --- |
| Gallina, huevos | conservador / intermedio / buen manejo | P = .57 / .70 / .82; U = .95; S = .15 |
| Codorniz, huevos | conservador / intermedio / buen manejo | P = .60 / .68 / .82; U = .95; S = .10 |
| Pollo, carne | engorda rápida / crecimiento lento | Y = 1.20 / .75 kg; m = .05 / .10; S = .10 |
| Codorniz, carne | referencia | Y = .14 kg; m = .08; S = .10 |

## Aritmética exacta y redondeo (D-10)

- Cada `number` se convierte a un racional exacto **desde su texto decimal**: 0.95 se toma como 95/100, no como 0.94999999999999995559…. Las cuentas se hacen con racionales `BigInt`.
- **No hay redondeos intermedios.** Los únicos redondeos del modelo son los `ceil` de F02, F05, F06 y F07, y se aplican sobre el cociente exacto.
- En carne el redondeo es **en dos etapas**: primero A_s y luego A_i, calculado a partir de A_s ya entero.
- Antes de este cambio, redondear la demanda anual a 2 decimales y E_sem a 2 decimales producía resultados distintos a la fórmula en 5, 9 y 42 de 2000 casos (pollo rápido, pollo lento y codorniz carne). Varios eran a la baja: con 21 g/semana de pollo daba 1/2 aves en lugar de 2/3. Además, con doubles, E_sem = 399 en codorniz conservadora daba 111 en lugar de 110.
- Hermes (React Native) soporta `BigInt`. El código evita el operador `**` con BigInt porque algunos transpiladores lo convierten en `Math.pow`.

## Validaciones (D-11)

- Todo número debe ser finito: se rechazan NaN e Infinity.
- Personas y días/semana deben ser enteros, con días entre 0 y 7. Porciones y ocasiones deben ser finitas y ≥ 0.
- El escenario debe pertenecer al producto. Por ejemplo, `calculateHens(…, 'quail_conservative')` es un error.
- **No hay valores de reserva**: si a un escenario le falta un parámetro, es un error.
- Orden de las comprobaciones: con demanda 0 el resultado es 0 aves (CP-19). Con demanda positiva, P ≤ 0 o U ≤ 0 (CP-13), Y ≤ 0 (CP-14) y m ≥ 1 (CP-15) bloquean el cálculo.
- Reproducción: R debe ser entero ≥ 1, y f, h, s y p_hembras deben estar en (0, 1] (CP-18).
- Lotes:
  - L debe ser entero ≥ 1 y las aves un entero ≥ 0.
  - Con 0 aves se devuelve `{ lotsCount: 0, birdsPerLot: [], totalBirds: 0 }`.
  - Si L > aves, se rechaza con un mensaje claro, porque F08 dejaría lotes de 0 aves. F08 no se modifica.
  - `lotsCount` siempre coincide con `birdsPerLot.length`.

Como los escenarios son fijos, CP-13, CP-14 y CP-15 no se pueden provocar desde la interfaz. Se prueban llamando a los núcleos de `core.ts` con parámetros explícitos.

## Notas de fidelidad a los PDF

- **"Fórmula para copiar".** Los PDF de pollos y codornices incluyen una fórmula de un solo `ceil`: `ceil(M·(1+S)/Y/(1−m))`. **No se usa**, porque da 117 (pollo lento) y 191 (codorniz carne), lo que contradice los ejemplos del mismo PDF (118 y 192). Se usan las ecuaciones 3 y 4 en dos etapas.
- **Tabla rápida de pollos.** Para 100 kg/año, Y = 1.00 y S = 10 %, el PDF imprime 111, pero su propia fórmula da exactamente 110 (100 × 1.1 / 1.00). El motor da 110. Está consultado con el cliente (Q1).
- **Lotes (F08).** El PDF indica `ceil(A_i / L)` aves por lote (70/6 → 12). El reparto exacto 12, 12, 12, 12, 11, 11 es una regla del equipo (Q4).
- **Letras.** En el PDF de codornices `L` son las hembras ponedoras; en el de pollos `L` son los lotes por año. En código: `G` = hembras ponedoras y `L` = lotes. `H` también aparece como huevos por porción (H_i); por eso el código usa nombres descriptivos.
- **D_i.** Los PDF dicen de 1 a 7 días; la app permite de 0 a 7, que hace falta para representar consumo 0.
- **Y.** Es un valor didáctico de kg de carne cocida comestible por ave. El PDF advierte que no se use para comprar aves sin validarlo, y la interfaz debe mostrar esa advertencia.
- **F07.** El resultado es el total de huevos que se ponen en la incubadora, porque la fertilidad ya está en el denominador. La interfaz y la especificación del equipo lo llaman "huevos fértiles a incubar"; el PDF dice "huevos a incubar" (D-14, Q5). Las tasas de CP-10 (0.80 / 0.75 / 0.90 / 0.50) son ilustrativas del equipo, porque el PDF no trae un ejemplo numérico (Q2).
- **52 semanas (D-01).** Con 52.14, CP-09 pasaría a 177/193.

## Pruebas

```bash
npm test   # tsx --test "tests/**/*.test.ts"
```

| Archivo | Qué cubre |
| --- | --- |
| `tests/domain/oracles.test.ts` | CP-01 a CP-12 con entradas completas y tablas rápidas de huevos de [F1] y [F3] |
| `tests/domain/exact.test.ts` | Prueba de propiedad de 1 a 2000 g/semana en los 3 escenarios de carne contra una referencia BigInt independiente; casos 21 g, 93 g, 399 y 6.993; tablas de carne de [F2] y [F3] |
| `tests/domain/rational.test.ts` | Conversión decimal exacta (enteros, negativos, `1e-7`, `1e21`) y operaciones |
| `tests/domain/validation.test.ts` | D-11: finitos, enteros, escenario del producto, sin valores de reserva, R entero |
| `tests/domain/validators.test.ts` | CP-13 a CP-19 |
| `tests/domain/lots.test.ts` | F08 y CP-19 |
| `tests/domain/contract.test.ts` | Alias, `FORMULA_VERSION` y proteína F13 |
| `tests/domain/explanations.test.ts` | Textos generados a partir de los parámetros |

## Cómo cambiar una fórmula o un parámetro

No se cambian constantes en silencio. Primero se abre una propuesta de cambio con el cliente; después se incrementa `FORMULA_VERSION` y se actualizan las pruebas golden, este README y la documentación maestra.
