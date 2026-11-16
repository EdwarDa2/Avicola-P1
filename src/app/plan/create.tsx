import { useApp } from '@/application/state/AppContext';
import { Badge, Button, Card, EmptyState, Header, Input } from '@/components';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import {
    calculateChickenMeat,
    calculateHenEggs,
    calculateQuailEggs,
    calculateQuailMeat,
    calculateQuailReproduction,
    calculateWeeklyEggsDemand,
    calculateWeeklyMeatDemand,
    distributeLots,
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
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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

const MODEL_VERSION = 'V1.0';

type Step = 'consume' | 'scenario' | 'result';

const STEP_ORDER: Step[] = ['consume', 'scenario', 'result'];
const STEP_LABELS: Record<Step, string> = {
  consume: 'Consumo',
  scenario: 'Escenario',
  result: 'Resultado',
};

interface GroupInput {
  portion: string;
  occasions: string;
  days: string;
}

const toNumber = (value: string): number => {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
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
  const { activeFamily, savePlan } = useApp();

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
      portionQty: toNumber(inputs[group.key].portion),
      portionUnit: product.purpose === 'eggs' ? 'piezas' : 'gramos',
      occasionsPerDay: toNumber(inputs[group.key].occasions),
      daysPerWeek: toNumber(inputs[group.key].days),
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

  const lots: LotDistribution | null = useMemo(() => {
    if (!includeLots || !result) return null;
    const count = Math.floor(toNumber(lotsInput));
    try {
      return distributeLots(result.primaryBirdsCount, count);
    } catch {
      return null;
    }
  }, [includeLots, lotsInput, result]);

  const reproduction: QuailReproductionResult | null = useMemo(() => {
    if (!includeBreeding) return null;
    try {
      return calculateQuailReproduction(
        toNumber(breeding.females),
        toNumber(breeding.fertility) / 100,
        toNumber(breeding.hatchability) / 100,
        toNumber(breeding.survival) / 100,
        toNumber(breeding.femaleRatio) / 100
      );
    } catch {
      return null;
    }
  }, [includeBreeding, breeding]);

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
          ? calculateHenEggs(lines, scenarioKey)
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

  const handleSave = () => {
    if (!result) return;
    const finalName =
      planName.trim() || `${product.name} · ${result.scenarioName}`;

    savePlan(
      {
        familyId: activeFamily.id,
        productCode,
        name: finalName,
        status: 'active',
        modelVersion: MODEL_VERSION,
        consumptionLines: lines,
        scenarioKey,
        results: result,
        lots: lots ?? undefined,
        reproduction: reproduction ?? undefined,
      },
      true
    );

    router.replace('/history' as any);
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
                <Text style={styles.demandLabel}>DEMANDA ESTIMADA</Text>
                <Text style={styles.demandValue}>
                  {demand.error ? '—' : demand.value}
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
                      helperText={group.isSpecialChildGroup ? 'A criterio de la familia' : undefined}
                    />
                    <Input
                      label="Veces al día"
                      value={inputs[group.key].occasions}
                      onChangeText={(value) => updateInput(group.key, 'occasions', value)}
                      keyboardType="numeric"
                      containerStyle={styles.field}
                    />
                    <Input
                      label="Días / semana"
                      value={inputs[group.key].days}
                      onChangeText={(value) => updateInput(group.key, 'days', value)}
                      keyboardType="numeric"
                      containerStyle={styles.field}
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
                          Postura {(params2.layingRate * 100).toFixed(0)} %
                        </Text>
                      )}
                      {params2.meatYieldKg !== undefined && (
                        <Text style={styles.scenarioParam}>
                          Rendimiento {params2.meatYieldKg} kg/ave
                        </Text>
                      )}
                      {params2.mortalityRate !== undefined && (
                        <Text style={styles.scenarioParam}>
                          Mortalidad {(params2.mortalityRate * 100).toFixed(0)} %
                        </Text>
                      )}
                      <Text style={styles.scenarioParam}>
                        Margen {(params2.safetyMargin * 100).toFixed(0)} %
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
                <Badge label="RESULTADO" variant="obsidian" size="sm" />
                <Text style={styles.resultNumber}>{result.primaryBirdsCount}</Text>
                <Text style={styles.resultLabel}>{result.primaryBirdsLabel}</Text>
              </Card>

              <Card style={styles.metricsCard}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Demanda semanal</Text>
                  <Text style={styles.metricValue}>
                    {result.weeklyDemand} {product.purpose === 'eggs' ? 'huevos' : 'kg'}
                  </Text>
                </View>
                {result.annualDemand !== undefined && (
                  <>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Demanda anual (52 semanas)</Text>
                      <Text style={styles.metricValue}>{result.annualDemand} kg</Text>
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
                <Text style={styles.blockTitle}>Qué significa</Text>
                <Text style={styles.blockText}>{result.explanation}</Text>
              </Card>

              <Card style={styles.blockCard}>
                <Text style={styles.blockTitle}>Cómo se calculó</Text>
                <View style={styles.formulaBox}>
                  <Text style={styles.formulaCode}>{result.formulaText}</Text>
                </View>
                {result.formulaVariables.map((variable) => (
                  <View key={variable.symbol} style={styles.variableRow}>
                    <Text style={styles.variableSymbol}>{variable.symbol}</Text>
                    <Text style={styles.variableMeaning}>{variable.meaning}</Text>
                    <Text style={styles.variableValue}>{variable.value}</Text>
                  </View>
                ))}
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
                        <View style={styles.lotsPreview}>
                          {lots.birdsPerLot.map((birds, index) => (
                            <View key={`lot-${index}`} style={styles.lotPill}>
                              <Text style={styles.lotPillText}>
                                Lote {index + 1} · {birds} aves
                              </Text>
                            </View>
                          ))}
                          <Text style={styles.lotsTotal}>
                            Total: {lots.totalBirds} aves (suma exacta)
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.invalidText}>
                          Introduce un número de lotes entero mayor a cero.
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
                          <Text style={styles.breedingFormula}>{reproduction.formulaText}</Text>
                        </View>
                      ) : (
                        <Text style={styles.invalidText}>
                          Verifica que los porcentajes estén entre 1 % y 100 %.
                        </Text>
                      )}
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
                title="Guardar plan"
                onPress={handleSave}
                variant="primary"
                disabled={!canSave}
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
  formulaBox: {
    backgroundColor: Colors.bone,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  formulaCode: {
    ...Typography.bodyBold,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.ink,
    fontSize: 13,
  },
  variableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  variableSymbol: {
    ...Typography.captionBold,
    color: Colors.ink,
    width: 68,
  },
  variableMeaning: {
    ...Typography.caption,
    color: Colors.ash,
    flex: 1,
  },
  variableValue: {
    ...Typography.captionBold,
    color: Colors.ink,
    textAlign: 'right',
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
  lotsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  lotPill: {
    backgroundColor: Colors.bone,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
  },
  lotPillText: {
    ...Typography.captionBold,
    color: Colors.ink,
  },
  lotsTotal: {
    ...Typography.caption,
    color: Colors.ash,
    width: '100%',
    marginTop: Spacing.xs,
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
  breedingFormula: {
    ...Typography.caption,
    color: Colors.ash,
    fontSize: 11,
    marginTop: Spacing.xs,
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
