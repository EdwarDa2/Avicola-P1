import { useApp } from '@/application/state/AppContext';
import { Badge, Button, Card, ConfirmModal, EmptyState, Header } from '@/components';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { PRODUCTS } from '@/domain/calculators/scenarios';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PlanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plans, getActivePlanForProduct, togglePlanActive, duplicatePlan, deletePlan } = useApp();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const plan = plans.find((item) => item.id === id);

  if (!plan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Detalle del plan" showBack={true} onBack={() => router.back()} />
        <View style={styles.centered}>
          <EmptyState
            iconName="document-text-outline"
            title="Plan no encontrado"
            description="Este plan ya no está disponible en el historial de la familia activa."
            actionTitle="Volver a mis planes"
            onAction={() => router.replace('/history' as any)}
          />
        </View>
      </SafeAreaView>
    );
  }

  const product = PRODUCTS[plan.productCode];
  const result = plan.results;
  const isActive = getActivePlanForProduct(plan.productCode)?.id === plan.id;
  const savedOn = new Date(plan.createdAt).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handleDuplicate = () => {
    const copy = duplicatePlan(plan.id);
    router.replace(`/plan/${copy.id}` as any);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    deletePlan(plan.id);
    router.replace('/history' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Detalle del plan"
        subtitle={product.name}
        showBack={true}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <Card variant="obsidian" style={styles.heroCard}>
          <Badge label={isActive ? 'ACTIVO EN LA CANASTA' : 'INACTIVO'} variant="obsidian" size="sm" />
          <Text style={styles.heroName}>{plan.name}</Text>
          <Text style={styles.heroMeta}>
            {result.scenarioName} · Guardado el {savedOn} · Modelo {plan.modelVersion}
          </Text>

          <View style={styles.heroFigures}>
            <Text style={styles.heroNumber}>{result.primaryBirdsCount}</Text>
            <Text style={styles.heroLabel}>{result.primaryBirdsLabel}</Text>
          </View>
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

        {plan.lots && (
          <Card style={styles.blockCard}>
            <Text style={styles.blockTitle}>Lotes de producción</Text>
            <Text style={styles.blockText}>{plan.lots.explanation}</Text>
            <View style={styles.lotsPreview}>
              {plan.lots.birdsPerLot.map((birds, index) => (
                <View key={`lot-${index}`} style={styles.lotPill}>
                  <Text style={styles.lotPillText}>
                    Lote {index + 1} · {birds} aves
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {plan.reproduction && (
          <Card style={styles.blockCard}>
            <Text style={styles.blockTitle}>Reproducción y reemplazos</Text>
            <Text style={styles.blockText}>
              Para obtener {plan.reproduction.desiredFemales} hembras de reemplazo se estiman{' '}
              {plan.reproduction.eggsToIncubate} huevos fértiles a incubar.
            </Text>
            <View style={styles.variableRow}>
              <Text style={styles.variableSymbol}>Fertilidad</Text>
              <Text style={styles.variableMeaning} />
              <Text style={styles.variableValue}>
                {(plan.reproduction.fertility * 100).toFixed(0)} %
              </Text>
            </View>
            <View style={styles.variableRow}>
              <Text style={styles.variableSymbol}>Incubabilidad</Text>
              <Text style={styles.variableMeaning} />
              <Text style={styles.variableValue}>
                {(plan.reproduction.hatchability * 100).toFixed(0)} %
              </Text>
            </View>
            <View style={styles.variableRow}>
              <Text style={styles.variableSymbol}>Supervivencia</Text>
              <Text style={styles.variableMeaning} />
              <Text style={styles.variableValue}>
                {(plan.reproduction.survival * 100).toFixed(0)} %
              </Text>
            </View>
          </Card>
        )}

        <Card style={styles.blockCard}>
          <Text style={styles.blockTitle}>Recursos vinculados</Text>
          <Text style={styles.blockText}>
            Consulta el alimento estimado y las referencias aplicables a este plan.
          </Text>
          <Button
            title="Ver recursos"
            onPress={() => router.push('/resources' as any)}
            variant="secondary"
            style={styles.resourceButton}
          />
        </Card>

        <View style={styles.actions}>
          <Button
            title={isActive ? 'Quitar de la canasta' : 'Activar en la canasta'}
            onPress={() => togglePlanActive(plan.id)}
            variant={isActive ? 'secondary' : 'primary'}
            style={styles.actionButton}
          />
          <Button
            title="Duplicar plan"
            onPress={handleDuplicate}
            variant="secondary"
            icon={<Ionicons name="copy-outline" size={18} color={Colors.ink} />}
            style={styles.actionButton}
          />
          <Button
            title="Eliminar plan"
            onPress={() => setShowDeleteModal(true)}
            variant="danger"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showDeleteModal}
        title="¿Eliminar este plan?"
        message="El plan se quitará del historial de la familia activa. Esta acción no afecta a otros planes ni a las demás familias."
        confirmText="Eliminar"
        cancelText="Cancelar"
        destructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />
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
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  heroCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  heroName: {
    ...Typography.h2,
    color: Colors.paper,
    marginTop: Spacing.sm,
  },
  heroMeta: {
    ...Typography.caption,
    color: Colors.textLightMuted,
    marginTop: Spacing.xs,
  },
  heroFigures: {
    borderTopWidth: 1,
    borderTopColor: Colors.obsidianLight,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  heroNumber: {
    ...Typography.numberDisplayLarge,
    fontSize: 44,
    lineHeight: 50,
  },
  heroLabel: {
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
    width: 96,
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
  resourceButton: {
    marginTop: Spacing.md,
  },
  actions: {
    marginTop: Spacing.sm,
  },
  actionButton: {
    marginBottom: Spacing.md,
  },
});
