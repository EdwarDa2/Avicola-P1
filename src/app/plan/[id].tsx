import { useApp } from '@/application/state/AppContext';
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  FormulaBreakdown,
  Header,
  LotGrid,
  SectionTitle
} from '@/components';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { PRODUCTS } from '@/domain/calculators/scenarios';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function PlanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    plans,
    plansLoading,
    planStorageError,
    togglePlanActiveSaved,
    duplicatePlanSaved,
    deletePlanSaved,
  } = useApp();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    'toggle' | 'duplicate' | 'delete' | null
  >(null);
  const busyRef = useRef(false);
  const planId = Array.isArray(id) ? id[0] : id;
  const plan = plans.find((item) => item.id === planId);
  if (!plan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Detalle del plan" showBack={true} onBack={() => router.back()} />
        <View style={styles.centered}>
          {plansLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.loadingText}>Cargando plan guardado...</Text>
            </View>
          ) : (
            <EmptyState
              iconName={planStorageError ? 'alert-circle-outline' : 'document-text-outline'}
              title={planStorageError ? 'No se pudieron cargar los planes' : 'Plan no encontrado'}
              description={
                planStorageError ||
                'Este plan ya no está disponible en el historial.'
              }
              actionTitle="Volver a mis planes"
              onAction={() => router.replace('/history' as any)}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }
  const product = PRODUCTS[plan.productCode];
  const result = plan.results;
  // Fuente de verdad: estado persistido del plan (no la selección temporal de React).
  const isActive = plan.status === 'active';
  const isArchived = plan.status === 'archived';
  const savedOn = new Date(plan.createdAt).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const handleToggleActive = async () => {
    if (busyRef.current || isArchived) return;
    busyRef.current = true;
    setPendingAction('toggle');
    try {
      await togglePlanActiveSaved(plan.id);
      console.log('Estado del plan actualizado desde Detalle en SQLite:', plan.id);
    } catch (error) {
      console.error('Error al activar o desactivar plan:', error);
      Alert.alert(
        'No se pudo actualizar la canasta',
        error instanceof Error ? error.message : 'Inténtalo nuevamente.'
      );
    } finally {
      busyRef.current = false;
      setPendingAction(null);
    }
  };
  const handleDuplicate = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setPendingAction('duplicate');
    try {
      const copy = await duplicatePlanSaved(plan.id);
      console.log('Plan duplicado desde Detalle en SQLite:', copy.id);
      router.replace(`/plan/${copy.id}` as any);
    } catch (error) {
      console.error('Error al duplicar plan:', error);
      Alert.alert(
        'No se pudo duplicar el plan',
        error instanceof Error ? error.message : 'Inténtalo nuevamente.'
      );
    } finally {
      busyRef.current = false;
      setPendingAction(null);
    }
  };
  const handleDeleteConfirm = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setPendingAction('delete');
    try {
      await deletePlanSaved(plan.id);
      console.log('Plan eliminado desde Detalle en SQLite:', plan.id);
      setShowDeleteModal(false);
      router.replace('/history' as any);
    } catch (error) {
      console.error('Error al eliminar plan:', error);
      setShowDeleteModal(false);
      Alert.alert(
        'No se pudo eliminar el plan',
        error instanceof Error ? error.message : 'Inténtalo nuevamente.'
      );
    } finally {
      busyRef.current = false;
      setPendingAction(null);
    }
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
          <Badge
            label={isArchived ? 'ARCHIVADO' : isActive ? 'ACTIVO EN LA CANASTA' : 'INACTIVO'}
            variant="obsidian"
            size="sm"
            icon={
              <Ionicons
                name={isActive ? 'checkmark-circle-outline' : 'ellipse-outline'}
                size={12}
                color={Colors.primary}
              />
            }
          />
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
          <SectionTitle
            icon="information-circle-outline"
            title="Qué significa"
            size="block"
          />
          <Text style={styles.blockText}>{result.explanation}</Text>
        </Card>
        <Card style={styles.blockCard}>
          <SectionTitle icon="calculator-outline" title="Cómo se calculó" size="block" />
          <View style={styles.blockSpacer} />
          <FormulaBreakdown
            formulaText={result.formulaText}
            variables={result.formulaVariables}
          />
        </Card>
        {plan.lots && (
          <Card style={styles.blockCard}>
            <SectionTitle icon="grid-outline" title="Lotes de producción" size="block" />
            <LotGrid birdsPerLot={plan.lots.birdsPerLot} totalBirds={plan.lots.totalBirds} />
          </Card>
        )}
        {plan.reproduction && (
          <Card style={styles.blockCard}>
            <SectionTitle
              icon="egg-outline"
              title="Reproducción y reemplazos"
              size="block"
            />
            <Text style={styles.blockText}>
              Para obtener {plan.reproduction.desiredFemales} hembras de reemplazo se estiman{' '}
              {plan.reproduction.eggsToIncubate} huevos fértiles a incubar.
            </Text>
            <View style={styles.blockSpacer} />
            <FormulaBreakdown
              formulaText={plan.reproduction.formulaText}
              variables={[
                {
                  symbol: 'H',
                  meaning: 'Huevos fértiles a incubar',
                  value: `${plan.reproduction.eggsToIncubate} huevos`,
                },
                {
                  symbol: 'R',
                  meaning: 'Hembras de reemplazo deseadas',
                  value: `${plan.reproduction.desiredFemales} hembras`,
                },
                {
                  symbol: 'f',
                  meaning: 'Fertilidad',
                  value: `${(plan.reproduction.fertility * 100).toFixed(0)} %`,
                },
                {
                  symbol: 'h',
                  meaning: 'Incubabilidad',
                  value: `${(plan.reproduction.hatchability * 100).toFixed(0)} %`,
                },
                {
                  symbol: 's',
                  meaning: 'Supervivencia',
                  value: `${(plan.reproduction.survival * 100).toFixed(0)} %`,
                },
                {
                  symbol: 'p_female',
                  meaning: 'Proporción de hembras',
                  value: `${(plan.reproduction.femaleRatio * 100).toFixed(0)} %`,
                },
              ]}
              caption="Cada símbolo del cálculo reproductivo:"
            />
          </Card>
        )}
        <Card style={styles.blockCard}>
          <SectionTitle icon="leaf-outline" title="Recursos vinculados" size="block" />
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
            title={isArchived ? 'Plan archivado' : pendingAction === 'toggle' ? 'Guardando...' : isActive ? 'Quitar de la canasta' : 'Activar en la canasta'}
            onPress={() => { void handleToggleActive(); }}
            variant={isActive || isArchived ? 'secondary' : 'primary'}
            disabled={pendingAction !== null || isArchived}
            style={styles.actionButton}
          />
          <Button
            title={pendingAction === 'duplicate' ? 'Duplicando...' : 'Duplicar plan'}
            onPress={() => { void handleDuplicate(); }}
            disabled={pendingAction !== null}
            variant="secondary"
            icon={<Ionicons name="copy-outline" size={18} color={Colors.ink} />}
            style={styles.actionButton}
          />
          <Button
            title="Eliminar plan"
            onPress={() => {
              if (!busyRef.current) setShowDeleteModal(true);
            }}
            disabled={pendingAction !== null}
            variant="danger"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
      <ConfirmModal
        visible={showDeleteModal}
        title="¿Eliminar este plan?"
        message="El plan se quitará del historial de la familia activa. Esta acción no afecta a otros planes ni a las demás familias."
        confirmText={pendingAction === 'delete' ? 'Eliminando...' : 'Eliminar'}
        cancelText="Cancelar"
        destructive={true}
        onConfirm={() => { void handleDeleteConfirm(); }}
        onCancel={() => {
          if (!busyRef.current) setShowDeleteModal(false);
        }}
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: Spacing.md,
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
  blockText: {
    ...Typography.body,
    color: Colors.ash,
    marginTop: Spacing.xs,
    lineHeight: 21,
  },
  blockSpacer: {
    height: Spacing.md,
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
