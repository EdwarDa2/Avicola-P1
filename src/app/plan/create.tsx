import { useApp } from '@/application/state/AppContext';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormulaBreakdown,
  Header,
  Input,
  LotGrid,
  SectionTitle
} from '@/components';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import {
  calculateChickenMeat,
  calculateHens,
  calculateQuailBreeding,
  calculateQuailEggs,
  calculateQuailMeat,
  calculateWeeklyEggsDemand,
  calculateWeeklyMeatDemand,
  distributeLots,
  FORMULA_VERSION,
} from '@/domain/calculators';
import { PRODUCTS, SCENARIOS } from '@/domain/calculators/scenarios';
import {
  AGE_GROUPS,
  AgeGroupKey,
  CalculationResult,
  ConsumptionLine,
  LotDistribution,
  ProductCode,
  QuailReproductionResult,
} from '@/types';
import { formatNumber, formatPercent } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Step = 'consume' | 'scenario' | 'result';

const STEP_ORDER: Step[] = ['consume', 'scenario', 'result'];
const STEP_LABELS: Record<Step, string> = {
  consume: 'Consumo',
  scenario: 'Escenario',
  result: 'Resultado',
};
const STEP_ICONS: Record<Step, keyof typeof Ionicons.glyphMap> = {
  consume: 'cart-outline',
  scenario: 'options-outline',
  result: 'stats-chart-outline',
};

interface GroupInput {
  portion: string;
  occasions: string;
  days: string;
}

/**
 * Convierte el texto de un campo en número sin ocultar lo inválido (RF-15): los negativos y los
 * textos no numéricos llegan al motor, que los rechaza y devuelve el motivo para mostrarlo.
 */
const parseInput = (value: string): number => {
  const normalized = value.replace(',', '.').trim();
  return normalized === '' ? 0 : Number(normalized);
};

const buildDefaultInputs = (purpose: 'eggs' | 'meat'): Record<AgeGroupKey, GroupInput> => {
  const portion = purpose === 'eggs' ? '1' : '100';
  const days = purpose === 'eggs' ? '3' : '2';
  const record = {} as Record<AgeGroupKey, GroupInput>;

  for (const group of AGE_GROUPS) {
    record[group.key] = {
      // D-03: para la primera infancia no se sugiere una porción predeterminada.
      portion: group.key === '0-3' ? '0' : portion,
      occasions: '1',
      days,
    };
  }

  return record;
};

export default function CreatePlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ product?: string }>();
  const { activeFamily, savePlanSaved, plansLoading, planStorageError } = useApp();

  const rawProduct = params.product as ProductCode | undefined;
  const productCode: ProductCode = rawProduct && PRODUCTS[rawProduct] ? rawProduct : 'hen_eggs';
  const product = PRODUCTS[productCode];
  const scenarios = useMemo(
    () => SCENARIOS.filter((item) => item.productCode === productCode),
    [productCode]
  );

  const [step, setStep] = useState<Step>('consume');
  const [inputs, setInputs] = useState<Record<AgeGroupKey, GroupInput>>(() =>
    buildDefaultInputs(product.purpose)
  );
  const [scenarioKey, setScenarioKey] = useState<string>(scenarios[0]?.key ?? '');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [planName, setPlanName] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  const [includeLots, setIncludeLots] = useState(false);
  const [lotsInput, setLotsInput] = useState('3');
  const [includeBreeding, setIncludeBreeding] = useState(false);
  const [breeding, setBreeding] = useState({
    females: '10',
    fertility: '80',
    hatchability: '75',
    survival: '90',
    femaleRatio: '50',
  });

  const updateInput = (key: AgeGroupKey, field: keyof GroupInput, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const ageCounts = activeFamily?.ageCounts;
  const activeGroups = AGE_GROUPS.filter((group) => (ageCounts?.[group.key] ?? 0) > 0);

  const lines: ConsumptionLine[] = useMemo(() => {
    if (!ageCounts) return [];
    return AGE_GROUPS.filter((group) => (ageCounts[group.key] ?? 0) > 0).map((group) => ({
      ageGroup: group.key,
      peopleCount: ageCounts[group.key],
      portionQty: parseInput(inputs[group.key].portion),
      portionUnit: product.purpose === 'eggs' ? 'piezas' : 'gramos',
      occasionsPerDay: parseInput(inputs[group.key].occasions),
      daysPerWeek: parseInput(inputs[group.key].days),
    }));
  }, [ageCounts, inputs, product.purpose]);

  const demand = useMemo(() => {
    try {
      const value =
        product.purpose === 'eggs'
          ? calculateWeeklyEggsDemand(lines)
          : calculateWeeklyMeatDemand(lines);
      return { value, error: '' };
    } catch (error) {
      return {
        value: 0,
        error: error instanceof Error ? error.message : 'Revisa los datos introducidos.',
      };
    }
  }, [lines, product.purpose]);

  // El motor valida y explica: aquí solo se guarda su mensaje para mostrarlo (INTEGRACION.md §4).
  const lotsOutcome = useMemo((): { lots: LotDistribution | null; message: string } => {
    if (!includeLots || !result) return { lots: null, message: '' };
    try {
      return {
        lots: distributeLots(result.primaryBirdsCount, Math.floor(parseInput(lotsInput))),
        message: '',
      };
    } catch (error) {
      return {
        lots: null,
        message:
          error instanceof Error
            ? error.message
            : 'No se pudieron repartir las aves en lotes.',
      };
    }
  }, [includeLots, lotsInput, result]);
  const lots = lotsOutcome.lots;

  const breedingOutcome = useMemo((): {
    reproduction: QuailReproductionResult | null;
    message: string;
  } => {
    if (!includeBreeding) return { reproduction: null, message: '' };
    try {
      return {
        reproduction: calculateQuailBreeding(
          parseInput(breeding.females),
          parseInput(breeding.fertility) / 100,
          parseInput(breeding.hatchability) / 100,
          parseInput(breeding.survival) / 100,
          parseInput(breeding.femaleRatio) / 100
        ),
        message: '',
      };
    } catch (error) {
      return {
        reproduction: null,
        message:
          error instanceof Error
            ? error.message
            : 'No se pudo calcular el reemplazo reproductivo.',
      };
    }
  }, [includeBreeding, breeding]);
  const reproduction = breedingOutcome.reproduction;

  const reproductionVariables = reproduction
    ? [
        {
          symbol: 'H',
          meaning: 'Huevos fértiles a incubar',
          value: `${reproduction.eggsToIncubate} huevos`,
        },
        {
          symbol: 'R',
          meaning: 'Hembras de reemplazo deseadas',
          value: `${reproduction.desiredFemales} hembras`,
        },
        {
          symbol: 'f',
          meaning: 'Fertilidad',
          value: formatPercent(reproduction.fertility),
        },
        {
          symbol: 'h',
          meaning: 'Incubabilidad',
          value: formatPercent(reproduction.hatchability),
        },
        {
          symbol: 's',
          meaning: 'Supervivencia',
          value: formatPercent(reproduction.survival),
        },
        {
          symbol: 'p_female',
          meaning: 'Proporción de hembras',
          value: formatPercent(reproduction.femaleRatio),
        },
      ]
    : [];

  if (!activeFamily) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Nuevo plan" showBack={true} onBack={() => router.back()} />
        <View style={styles.centered}>
          <EmptyState
            iconName="people-outline"
            title="Selecciona una familia"
            description="Los planes se calculan para el perfil familiar activo. Elige o crea una familia para continuar."
            actionTitle="Ir a familias"
            onAction={() => router.replace('/families' as any)}
          />
        </View>
      </SafeAreaView>
    );
  }

  const goToStep = (next: Step) => {
    setSaveError('');
    setStep(next);
  };

  const handleBack = () => {
    const index = STEP_ORDER.indexOf(step);
    if (index <= 0) {
      router.back();
      return;
    }
    goToStep(STEP_ORDER[index - 1]);
  };

  const handleContinueFromConsume = () => {
    if (demand.value <= 0) return;
    goToStep('scenario');
  };

  const handleScenarioResult = () => {
    if (!scenarioKey) return;
    try {
      const computed =
        productCode === 'hen_eggs'
          ? calculateHens(lines, scenarioKey)
          : productCode === 'quail_eggs'
            ? calculateQuailEggs(lines, scenarioKey)
            : productCode === 'chicken_meat'
              ? calculateChickenMeat(lines, scenarioKey)
              : calculateQuailMeat(lines, scenarioKey);
      setResult(computed);
      goToStep('result');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No fue posible calcular el plan.');
    }
  };

  const handleSave = async () => {
    if (!result || savingRef.current || !canSave) return;
    if (plansLoading) {
      setSaveError('Los planes todavía se están cargando.');
      return;
    }
    if (planStorageError) {
      setSaveError(`No se pudo cargar el almacenamiento: ${planStorageError}`);
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    setSaveError('');
    const finalName = planName.trim() || `${product.name} · ${result.scenarioName}`;

    try {
      const saved = await savePlanSaved(
        {
          familyId: activeFamily.id,
          productCode,
          name: finalName,
          status: 'active',
          modelVersion: FORMULA_VERSION,
          consumptionLines: lines,
          scenarioKey,
          results: result,
          lots: lots ?? undefined,
          reproduction: reproduction ?? undefined,
        },
        true
      );
      console.log('Plan confirmado en SQLite:', saved.id);
      router.replace('/history' as any);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'No se pudo guardar el plan.'
      );
      console.error('Error al guardar el plan:', error);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const canSave = Boolean(result) && !(includeLots && !lots) && !(includeBreeding && !reproduction);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Nuevo plan"
        subtitle={product.name}
        showBack={true}
        onBack={handleBack}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.stepRow}>
            {STEP_ORDER.map((item) => (
              <Badge
                key={item}
                label={STEP_LABELS[item]}
                icon={
                  <Ionicons
                    name={STEP_ICONS[item]}
                    size={12}
                    color={item === step ? Colors.ink : Colors.ash}
                  />
                }
                variant={item === step ? 'primary' : 'muted'}
                size="sm"
              />
            ))}
          </View>

          {step === 'consume' && (
            <>
              <View style={styles.intro}>
                <Text style={styles.title}>¿Cuánto consume tu familia?</Text>
                <Text style={styles.subtitle}>
                  Ajusta la porción, la frecuencia y los días para cada grupo de edad.
                </Text>
              </View>

              <Card variant="obsidian" style={styles.demandCard}>
                <View style={styles.demandLabelRow}>
                  <Ionicons name="cart-outline" size={14} color={Colors.primary} />
                  <Text style={styles.demandLabel}>DEMANDA ESTIMADA</Text>
                </View>
                <Text style={styles.demandValue}>
                  {demand.error ? '—' : formatNumber(demand.value)}
                </Text>
                <Text style={styles.demandUnit}>
                  {product.purpose === 'eggs' ? 'huevos por semana' : 'kg de carne por semana'}
                </Text>
              </Card>

              {demand.error ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
                  <Text style={styles.errorText}>{demand.error}</Text>
                </View>
              ) : null}

              {activeGroups.map((group) => (
                <Card key={group.key} style={styles.groupCard}>
                  <Text style={styles.groupTitle}>{group.label}</Text>
                  <Text style={styles.groupMeta}>
                    {ageCounts?.[group.key]} {ageCounts?.[group.key] === 1 ? 'persona' : 'personas'} · {group.ageRange}
                  </Text>

                  <View style={styles.fieldRow}>
                    <Input
                      label={product.purpose === 'eggs' ? 'Porción (huevos)' : 'Porción (g)'}
                      value={inputs[group.key].portion}
                      onChangeText={(value) => updateInput(group.key, 'portion', value)}
                      keyboardType="numeric"
                      containerStyle={styles.field}
                      labelContainerStyle={styles.fieldLabel}
                      helperText={group.isSpecialChildGroup ? 'A criterio de la familia' : undefined}
                    />
                    <Input
                      label="Veces al día"
                      value={inputs[group.key].occasions}
                      onChangeText={(value) => updateInput(group.key, 'occasions', value)}
                      keyboardType="numeric"
                      containerStyle={styles.field}
                      labelContainerStyle={styles.fieldLabel}
                    />
                    <Input
                      label="Días / semana"
                      value={inputs[group.key].days}
                      onChangeText={(value) => updateInput(group.key, 'days', value)}
                      keyboardType="numeric"
                      containerStyle={styles.field}
                      labelContainerStyle={styles.fieldLabel}
                    />
                  </View>
                </Card>
              ))}

              <Button
                title="Continuar"
                onPress={handleContinueFromConsume}
                variant="primary"
                disabled={demand.value <= 0 || Boolean(demand.error)}
                style={styles.primaryButton}
              />
            </>
          )}

          {step === 'scenario' && (
            <>
              <View style={styles.intro}>
                <Text style={styles.title}>Elige el escenario</Text>
                <Text style={styles.subtitle}>
                  Los escenarios cambian solo los parámetros productivos; la demanda familiar
                  se mantiene idéntica para que puedas comparar.
                </Text>
              </View>

              {scenarios.map((scenario) => {
                const selected = scenario.key === scenarioKey;
                const params2 = scenario.parameters;

                return (
                  <Pressable
                    key={scenario.key}
                    onPress={() => setScenarioKey(scenario.key)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Escenario ${scenario.name}`}
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.scenarioCard,
                      selected && styles.scenarioCardSelected,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <View style={styles.scenarioHeader}>
                      <Text style={styles.scenarioName}>{scenario.name}</Text>
                      {selected && (
                        <View style={styles.checkCircle}>
                          <Ionicons name="checkmark" size={14} color={Colors.ink} />
                        </View>
                      )}
                    </View>

                    <Text style={styles.scenarioDescription}>{scenario.shortDescription}</Text>

                    <View style={styles.scenarioParams}>
                      {params2.layingRate !== undefined && (
                        <Text style={styles.scenarioParam}>
                          Postura {formatPercent(params2.layingRate)}
                        </Text>
                      )}
                      {params2.meatYieldKg !== undefined && (
                        <Text style={styles.scenarioParam}>
                          Rendimiento {formatNumber(params2.meatYieldKg)} kg/ave
                        </Text>
                      )}
                      {params2.mortalityRate !== undefined && (
                        <Text style={styles.scenarioParam}>
                          Mortalidad {formatPercent(params2.mortalityRate)}
                        </Text>
                      )}
                      <Text style={styles.scenarioParam}>
                        Margen {formatPercent(params2.safetyMargin)}
                      </Text>
                    </View>

                    <Text style={styles.scenarioSource}>{scenario.sourceRef}</Text>
                  </Pressable>
                );
              })}

              {saveError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
                  <Text style={styles.errorText}>{saveError}</Text>
                </View>
              ) : null}

              <Button
                title="Ver resultado"
                onPress={handleScenarioResult}
                variant="primary"
                style={styles.primaryButton}
              />
              <Button
                title="Volver"
                onPress={handleBack}
                variant="secondary"
                style={styles.secondaryButton}
              />
            </>
          )}

          {step === 'result' && result && (
            <>
              <Card variant="obsidian" style={styles.resultHero}>
                <Badge
                  label="RESULTADO"
                  variant="obsidian"
                  size="sm"
                  icon={<Ionicons name="analytics-outline" size={12} color={Colors.primary} />}
                />
                <Text style={styles.resultNumber}>{result.primaryBirdsCount}</Text>
                <Text style={styles.resultLabel}>{result.primaryBirdsLabel}</Text>
              </Card>

              <Card style={styles.metricsCard}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Demanda semanal</Text>
                  <Text style={styles.metricValue}>
                    {formatNumber(result.weeklyDemand)} {product.purpose === 'eggs' ? 'huevos' : 'kg'}
                  </Text>
                </View>
                {result.annualDemand !== undefined && (
                  <>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Demanda anual (52 semanas)</Text>
                      <Text style={styles.metricValue}>
                        {formatNumber(result.annualDemand)} kg
                      </Text>
                    </View>
                  </>
                )}
                {result.slaughterBirdsCount !== undefined && (
                  <>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Aves para sacrificio</Text>
                      <Text style={styles.metricValue}>{result.slaughterBirdsCount}</Text>
                    </View>
                  </>
                )}
                <View style={styles.metricDivider} />
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Escenario</Text>
                  <Text style={styles.metricValue}>{result.scenarioName}</Text>
                </View>
              </Card>

              <Card style={styles.blockCard}>
                <SectionTitle
                  icon="information-circle-outline"
                  title="Qué significa"
                  size="block"
                />
                <Text style={styles.blockText}>{result.explanation}</Text>
              </Card>

              <Card style={styles.blockCard}>
                <SectionTitle icon="calculator-outline" title="Cómo se calculó" size="block" />
                <View style={styles.formulaSpacer} />
                <FormulaBreakdown
                  formulaText={result.formulaText}
                  variables={result.formulaVariables}
                />
              </Card>

              {product.hasLotsOption && (
                <Card style={styles.blockCard}>
                  <Pressable
                    onPress={() => setIncludeLots((prev) => !prev)}
                    accessible={true}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: includeLots }}
                    accessibilityLabel="Organizar las aves en lotes"
                    style={styles.toggleRow}
                  >
                    <Ionicons
                      name={includeLots ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={includeLots ? Colors.ink : Colors.ash}
                    />
                    <View style={styles.toggleTextWrap}>
                      <Text style={styles.blockTitle}>Organizar en lotes (opcional)</Text>
                      <Text style={styles.toggleHint}>
                        Reparte las aves iniciales en grupos sin alterar el total.
                      </Text>
                    </View>
                  </Pressable>

                  {includeLots && (
                    <>
                      <Input
                        label="Número de lotes"
                        value={lotsInput}
                        onChangeText={setLotsInput}
                        keyboardType="numeric"
                        containerStyle={styles.lotsInput}
                      />
                      {lots ? (
                        <LotGrid birdsPerLot={lots.birdsPerLot} totalBirds={lots.totalBirds} />
                      ) : (
                        <Text style={styles.invalidText} accessibilityRole="alert">
                          {lotsOutcome.message}
                        </Text>
                      )}
                    </>
                  )}
                </Card>
              )}

              {product.hasBreedingOption && (
                <Card style={styles.blockCard}>
                  <Pressable
                    onPress={() => setIncludeBreeding((prev) => !prev)}
                    accessible={true}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: includeBreeding }}
                    accessibilityLabel="Planificar reemplazo reproductivo"
                    style={styles.toggleRow}
                  >
                    <Ionicons
                      name={includeBreeding ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={includeBreeding ? Colors.ink : Colors.ash}
                    />
                    <View style={styles.toggleTextWrap}>
                      <Text style={styles.blockTitle}>Reproducción propia (opcional)</Text>
                      <Text style={styles.toggleHint}>
                        Calcula los huevos fértiles a incubar para reemplazos.
                      </Text>
                    </View>
                  </Pressable>

                  {includeBreeding && (
                    <>
                      <View style={styles.fieldRow}>
                        <Input
                          label="Hembras deseadas"
                          value={breeding.females}
                          onChangeText={(value) => setBreeding((prev) => ({ ...prev, females: value }))}
                          keyboardType="numeric"
                          containerStyle={styles.field}
                        />
                        <Input
                          label="Fertilidad (%)"
                          value={breeding.fertility}
                          onChangeText={(value) => setBreeding((prev) => ({ ...prev, fertility: value }))}
                          keyboardType="numeric"
                          containerStyle={styles.field}
                        />
                      </View>
                      <View style={styles.fieldRow}>
                        <Input
                          label="Incubabilidad (%)"
                          value={breeding.hatchability}
                          onChangeText={(value) =>
                            setBreeding((prev) => ({ ...prev, hatchability: value }))
                          }
                          keyboardType="numeric"
                          containerStyle={styles.field}
                        />
                        <Input
                          label="Supervivencia (%)"
                          value={breeding.survival}
                          onChangeText={(value) => setBreeding((prev) => ({ ...prev, survival: value }))}
                          keyboardType="numeric"
                          containerStyle={styles.field}
                        />
                      </View>
                      <Input
                        label="Proporción de hembras (%)"
                        value={breeding.femaleRatio}
                        onChangeText={(value) =>
                          setBreeding((prev) => ({ ...prev, femaleRatio: value }))
                        }
                        keyboardType="numeric"
                        containerStyle={styles.lotsInput}
                      />

                      {reproduction ? (
                        <View style={styles.breedingResult}>
                          <Text style={styles.breedingValue}>{reproduction.eggsToIncubate}</Text>
                          <Text style={styles.breedingLabel}>huevos fértiles a incubar</Text>
                        </View>
                      ) : (
                        <Text style={styles.invalidText} accessibilityRole="alert">
                          {breedingOutcome.message}
                        </Text>
                      )}

                      {reproduction ? (
                        <View style={styles.breedingFormulaWrap}>
                          <FormulaBreakdown
                            formulaText={reproduction.formulaText}
                            variables={reproductionVariables}
                            caption="Cada símbolo del cálculo reproductivo:"
                          />
                        </View>
                      ) : null}
                    </>
                  )}
                </Card>
              )}

              <Card style={styles.blockCard}>
                <Input
                  label="Nombre del plan"
                  placeholder={`${product.name} · ${result.scenarioName}`}
                  value={planName}
                  onChangeText={setPlanName}
                  maxLength={40}
                  containerStyle={styles.nameInput}
                />
              </Card>

              {saveError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
                  <Text style={styles.errorText}>{saveError}</Text>
                </View>
              ) : null}

              <Button
                title={isSaving ? "Guardando..." : "Guardar plan"}
                onPress={() => { void handleSave(); }}
                variant="primary"
                disabled={!canSave || isSaving || plansLoading || Boolean(planStorageError)}
                style={styles.primaryButton}
              />
              <Button
                title="Volver"
                onPress={handleBack}
                variant="secondary"
                style={styles.secondaryButton}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bone,
  },
  centered: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  intro: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.ash,
    marginTop: Spacing.xs,
    lineHeight: 21,
  },
  demandCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  demandLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demandLabel: {
    ...Typography.captionBold,
    color: Colors.primary,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  demandValue: {
    ...Typography.numberDisplayLarge,
    fontSize: 40,
    lineHeight: 46,
    marginTop: Spacing.xs,
  },
  demandUnit: {
    ...Typography.caption,
    color: Colors.textLightMuted,
    marginTop: 2,
  },
  groupCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  groupTitle: {
    ...Typography.bodyBold,
    color: Colors.ink,
  },
  groupMeta: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  field: {
    flex: 1,
    marginBottom: 0,
  },
  fieldLabel: {
    height: 48,
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    flex: 1,
  },
  scenarioCard: {
    backgroundColor: Colors.paper,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.hairline,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  scenarioCardSelected: {
    borderColor: Colors.ink,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scenarioName: {
    ...Typography.bodyBold,
    color: Colors.ink,
    flex: 1,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenarioDescription: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  scenarioParams: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  scenarioParam: {
    ...Typography.captionBold,
    color: Colors.ink,
  },
  scenarioSource: {
    ...Typography.caption,
    color: Colors.ash,
    fontSize: 11,
    marginTop: Spacing.sm,
  },
  resultHero: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  resultNumber: {
    ...Typography.numberDisplayLarge,
    fontSize: 52,
    lineHeight: 58,
    marginTop: Spacing.sm,
  },
  resultLabel: {
    ...Typography.bodyBold,
    color: Colors.paper,
    marginTop: 2,
  },
  metricsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  metricRow: {
    paddingVertical: Spacing.xs,
  },
  metricDivider: {
    height: 1,
    backgroundColor: Colors.hairline,
    marginVertical: Spacing.xs,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.ash,
  },
  metricValue: {
    ...Typography.bodyBold,
    color: Colors.ink,
    marginTop: 2,
  },
  blockCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  blockTitle: {
    ...Typography.bodyBold,
    color: Colors.ink,
  },
  blockText: {
    ...Typography.body,
    color: Colors.ash,
    marginTop: Spacing.xs,
    lineHeight: 21,
  },
  formulaSpacer: {
    height: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  toggleTextWrap: {
    flex: 1,
  },
  toggleHint: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: 2,
  },
  lotsInput: {
    marginTop: Spacing.md,
    marginBottom: 0,
  },
  invalidText: {
    ...Typography.caption,
    color: Colors.warning,
    marginTop: Spacing.sm,
  },
  breedingResult: {
    backgroundColor: Colors.bone,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  breedingValue: {
    ...Typography.numberDisplay,
    color: Colors.ink,
  },
  breedingLabel: {
    ...Typography.caption,
    color: Colors.ash,
  },
  breedingFormulaWrap: {
    marginTop: Spacing.md,
  },
  nameInput: {
    marginBottom: 0,
  },
  primaryButton: {
    marginBottom: Spacing.md,
  },
  secondaryButton: {
    marginBottom: Spacing.md,
  },
});
