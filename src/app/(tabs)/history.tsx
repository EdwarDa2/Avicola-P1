import { useApp } from '@/application/state/AppContext';
import { Badge, Button, Card, EmptyState, SectionTitle } from '@/components';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { PRODUCTS, PRODUCT_LIST } from '@/domain/calculators/scenarios';
import type { Plan } from '@/types';
import { ProductCode } from '@/types';
import { formatNumber } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type StatusFilter = 'all' | 'active' | 'inactive';

type ActionName = 'toggle' | 'duplicate' | 'delete';

const STATUS_FILTERS: {
  key: StatusFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'all', label: 'Todos', icon: 'apps-outline' },
  { key: 'active', label: 'Activos', icon: 'checkmark-circle-outline' },
  { key: 'inactive', label: 'Inactivos', icon: 'pause-circle-outline' },
];

export default function PlansScreen() {
  const router = useRouter();

  const {
    activeFamily,
    activeFamilyId,
    familiesLoading,
    plans,
    plansLoading,
    planStorageError,
    getActivePlanForProduct,
    duplicatePlanSaved,
    deletePlanSaved,
    togglePlanActiveSaved,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [productFilter, setProductFilter] = useState<ProductCode | 'all'>('all');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const busyRef = useRef(false);

  const isLoading = familiesLoading || plansLoading;

  const familyPlans = activeFamilyId
    ? plans.filter((plan) => plan.familyId === activeFamilyId)
    : [];

  const isPlanActive = (productCode: ProductCode, planId: string) =>
    getActivePlanForProduct(productCode)?.id === planId;

  const visiblePlans = familyPlans.filter((plan) => {
    const active = isPlanActive(plan.productCode, plan.id);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? active : !active);
    const matchesProduct =
      productFilter === 'all' || plan.productCode === productFilter;

    return matchesStatus && matchesProduct;
  });

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Inténtalo nuevamente.';

  const runAction = async (
    action: ActionName,
    plan: Plan
  ): Promise<void> => {
    if (busyRef.current || isLoading || planStorageError) return;

    busyRef.current = true;
    setPendingAction(`${action}:${plan.id}`);

    try {
      if (action === 'toggle') {
        await togglePlanActiveSaved(plan.id);
        console.log('Estado del plan guardado en SQLite:', plan.id);
      } else if (action === 'duplicate') {
        const copy = await duplicatePlanSaved(plan.id);
        console.log('Plan duplicado en SQLite:', copy.id);
        Alert.alert('Plan duplicado', 'La copia aparece en tu historial como inactiva.');
      } else {
        await deletePlanSaved(plan.id);
        console.log('Plan eliminado de SQLite:', plan.id);
      }
    } catch (error) {
      console.error(`Error en ${action} del plan:`, error);
      Alert.alert('No se pudo completar la operación', getErrorMessage(error));
    } finally {
      busyRef.current = false;
      setPendingAction(null);
    }
  };

  const handleDelete = (plan: Plan) => {
    if (busyRef.current || isLoading) return;

    Alert.alert(
      '¿Eliminar plan?',
      `¿Deseas eliminar «${plan.name}»? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void runAction('delete', plan);
          },
        },
      ]
    );
  };

  const openPlan = (planId: string) => {
    if (busyRef.current) return;
    router.push(`/plan/${planId}` as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerSubtitle}>TUS PLANES</Text>
          <SectionTitle
            icon="layers-outline"
            title="Mis planes"
            subtitle={
              activeFamily
                ? `Historial de ${activeFamily.name}.`
                : 'Selecciona una familia para ver su historial.'
            }
            size="page"
          />
        </View>

        {!isLoading && !planStorageError && familyPlans.length > 0 && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {STATUS_FILTERS.map((filter) => {
                const selected = statusFilter === filter.key;

                return (
                  <Pressable
                    key={filter.key}
                    onPress={() => setStatusFilter(filter.key)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Filtrar por ${filter.label}`}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Ionicons
                      name={filter.icon}
                      size={14}
                      color={selected ? Colors.ink : Colors.ash}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              <Pressable
                onPress={() => setProductFilter('all')}
                accessible={true}
                accessibilityRole="button"
                accessibilityState={{ selected: productFilter === 'all' }}
                accessibilityLabel="Filtrar por todos los productos"
                style={[
                  styles.chip,
                  productFilter === 'all' && styles.chipSelected,
                ]}
              >
                <Ionicons
                  name="apps-outline"
                  size={14}
                  color={productFilter === 'all' ? Colors.ink : Colors.ash}
                />
                <Text
                  style={[
                    styles.chipText,
                    productFilter === 'all' && styles.chipTextSelected,
                  ]}
                >
                  Todos los productos
                </Text>
              </Pressable>

              {PRODUCT_LIST.map((product) => {
                const selected = productFilter === product.code;
                return (
                  <Pressable
                    key={product.code}
                    onPress={() => setProductFilter(product.code)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Filtrar por ${product.name}`}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Ionicons
                      name={
                        product.purpose === 'eggs'
                          ? 'egg-outline'
                          : 'restaurant-outline'
                      }
                      size={14}
                      color={selected ? Colors.ink : Colors.ash}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {product.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}

        {isLoading ? (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.statusText}>Recuperando planes guardados...</Text>
          </View>
        ) : planStorageError ? (
          <View style={styles.statusContainer}>
            <Ionicons name="alert-circle-outline" size={30} color={Colors.danger} />
            <Text style={styles.statusText}>
              No se pudo cargar el historial. {planStorageError}
            </Text>
          </View>
        ) : !activeFamily ? (
          <EmptyState
            iconName="people-outline"
            title="Selecciona una familia"
            description="Elige una familia activa para consultar sus planes guardados."
            actionTitle="Ir a familias"
            onAction={() => router.push('/families' as any)}
          />
        ) : familyPlans.length === 0 ? (
          <EmptyState
            iconName="layers-outline"
            title="Aún no hay planes guardados"
            description="Cuando guardes un plan de producción aparecerá aquí con sus resultados y su versión del modelo."
            actionTitle="Crear un plan"
            onAction={() => router.push('/plan/new' as any)}
          />
        ) : visiblePlans.length === 0 ? (
          <EmptyState
            iconName="funnel-outline"
            title="Sin resultados"
            description="Ningún plan coincide con los filtros seleccionados."
            actionTitle="Quitar filtros"
            onAction={() => {
              setStatusFilter('all');
              setProductFilter('all');
            }}
          />
        ) : (
          visiblePlans.map((plan) => {
            const product = PRODUCTS[plan.productCode];
            const isEggProduct = product.purpose === 'eggs';
            const active = isPlanActive(plan.productCode, plan.id);
            const archived = plan.status === 'archived';
            const busy = pendingAction !== null;
            const actionForPlan = pendingAction?.endsWith(`:${plan.id}`) ?? false;

            return (
              <Card key={plan.id} style={styles.planCard}>
                {/* El enlace al detalle está separado de las acciones para
                    evitar que un toque en Eliminar abra también el plan. */}
                <Pressable
                  onPress={() => openPlan(plan.id)}
                  disabled={busy}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir plan ${plan.name}, ${product.name}`}
                >
                  <View style={styles.planHeader}>
                    <View style={styles.planIcon}>
                      <Ionicons
                        name={isEggProduct ? 'egg-outline' : 'restaurant-outline'}
                        size={18}
                        color={Colors.ink}
                      />
                    </View>

                    <View style={styles.planHeading}>
                      <Text style={styles.planName} numberOfLines={1}>
                        {plan.name}
                      </Text>
                      <Text style={styles.planMeta} numberOfLines={1}>
                        {product.name} · {plan.results.scenarioName}
                      </Text>
                    </View>

                    <Badge
                      label={archived ? 'Archivado' : active ? 'Activo' : 'Inactivo'}
                      variant={active ? 'primary' : 'muted'}
                      size="sm"
                    />
                  </View>

                  <View style={styles.metricsBox}>
                    <View style={styles.metricColumn}>
                      <Text style={styles.metricLabel}>DEMANDA</Text>
                      <Text style={styles.metricValue}>
                        {isEggProduct
                          ? `${formatNumber(plan.results.weeklyDemand)} huevos / semana`
                          : `${formatNumber(plan.results.weeklyDemand)} kg / semana`}
                      </Text>
                    </View>

                    <View style={styles.metricDivider} />

                    <View style={styles.metricColumn}>
                      <Text style={styles.metricLabel}>
                        {plan.results.primaryBirdsLabel.toUpperCase()}
                      </Text>
                      <Text style={styles.metricValue}>
                        {plan.results.primaryBirdsCount}
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {/* Acciones persistentes de SQLite */}
                <View style={styles.actionsRow}>
                  {!archived && (
                    <Pressable
                      onPress={() => {
                        void runAction('toggle', plan);
                      }}
                      disabled={busy}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={
                        `${active ? 'Desactivar' : 'Activar'} plan ${plan.name}`
                      }
                      style={({ pressed }) => [
                        styles.actionButton,
                        { opacity: pressed || busy ? 0.6 : 1 },
                      ]}
                    >
                      <Ionicons
                        name={active ? 'pause-circle-outline' : 'checkmark-circle-outline'}
                        size={17}
                        color={Colors.accent}
                      />
                      <Text style={styles.actionText}>
                        {actionForPlan && pendingAction?.startsWith('toggle:')
                          ? 'Guardando...'
                          : active ? 'Desactivar' : 'Activar'}
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => {
                      void runAction('duplicate', plan);
                    }}
                    disabled={busy}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Duplicar plan ${plan.name}`}
                    style={({ pressed }) => [
                      styles.actionButton,
                      { opacity: pressed || busy ? 0.6 : 1 },
                    ]}
                  >
                    <Ionicons name="copy-outline" size={17} color={Colors.ink} />
                    <Text style={styles.actionText}>
                      {actionForPlan && pendingAction?.startsWith('duplicate:')
                        ? 'Duplicando...'
                        : 'Duplicar'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleDelete(plan)}
                    disabled={busy}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar plan ${plan.name}`}
                    style={({ pressed }) => [
                      styles.actionButton,
                      { opacity: pressed || busy ? 0.6 : 1 },
                    ]}
                  >
                    <Ionicons name="trash-outline" size={17} color={Colors.danger} />
                    <Text style={[styles.actionText, { color: Colors.danger }]}>
                      {actionForPlan && pendingAction?.startsWith('delete:')
                        ? 'Eliminando...'
                        : 'Eliminar'}
                    </Text>
                  </Pressable>
                </View>
              </Card>
            );
          })
        )}

        <Button
          title="+ Planificar Nuevo Producto"
          variant="primary"
          fullWidth
          onPress={() => router.push('/plan/new' as any)}
          accessibilityLabel="Crear un nuevo plan de producción"
          accessibilityHint="Abre el asistente para definir un nuevo plan"
          style={styles.createButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bone,
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  headerRow: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  headerSubtitle: {
    ...Typography.captionBold,
    color: Colors.accent,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  filterRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  createButton: {
    marginTop: Spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.paper,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  chipText: {
    ...Typography.captionBold,
    color: Colors.ash,
  },
  chipTextSelected: {
    color: Colors.ink,
  },
  planCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  planIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  planHeading: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  planName: {
    ...Typography.bodyBold,
    color: Colors.ink,
  },
  planMeta: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: 2,
  },
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bone,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  metricColumn: {
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.hairline,
    marginHorizontal: Spacing.md,
  },
  metricLabel: {
    ...Typography.captionBold,
    fontSize: 10,
    color: Colors.ash,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    ...Typography.bodyBold,
    color: Colors.ink,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: Spacing.sm,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingHorizontal: Spacing.xs,
    gap: 4,
  },
  actionText: {
    ...Typography.captionBold,
    color: Colors.ink,
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.ash,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
