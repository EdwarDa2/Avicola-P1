import { useApp } from '@/application/state/AppContext';
import { Badge, Card, EmptyState } from '@/components';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { PRODUCTS, PRODUCT_LIST } from '@/domain/calculators/scenarios';
import { ProductCode } from '@/types';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'inactive', label: 'Inactivos' },
];

export default function PlansScreen() {
  const router = useRouter();
  const { activeFamily, activeFamilyId, plans, getActivePlanForProduct } = useApp();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [productFilter, setProductFilter] = useState<ProductCode | 'all'>('all');

  const familyPlans = activeFamilyId
    ? plans.filter((plan) => plan.familyId === activeFamilyId)
    : [];

  const isPlanActive = (productCode: ProductCode, planId: string) =>
    getActivePlanForProduct(productCode)?.id === planId;

  const visiblePlans = familyPlans.filter((plan) => {
    const active = isPlanActive(plan.productCode, plan.id);
    const matchesStatus =
      statusFilter === 'all' || (statusFilter === 'active' ? active : !active);
    const matchesProduct =
      productFilter === 'all' || plan.productCode === productFilter;
    return matchesStatus && matchesProduct;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerSubtitle}>TUS PLANES</Text>
          <Text style={styles.headerTitle}>Mis planes</Text>
          <Text style={styles.headerDescription}>
            {activeFamily
              ? `Historial de ${activeFamily.name}.`
              : 'Selecciona una familia para ver su historial.'}
          </Text>
        </View>

        {familyPlans.length > 0 && (
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
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
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
                style={[styles.chip, productFilter === 'all' && styles.chipSelected]}
              >
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
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {product.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}

        {familyPlans.length === 0 ? (
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

            return (
              <Card
                key={plan.id}
                style={styles.planCard}
                onPress={() => router.push(`/plan/${plan.id}` as any)}
                accessibilityLabel={`Abrir plan ${plan.name}, ${product.name}`}
              >
                <View style={styles.planHeader}>
                  <View style={styles.planHeading}>
                    <Text style={styles.planName} numberOfLines={1}>
                      {plan.name}
                    </Text>
                    <Text style={styles.planMeta} numberOfLines={1}>
                      {product.name} · {plan.results.scenarioName}
                    </Text>
                  </View>
                  <Badge
                    label={active ? 'Activo' : 'Inactivo'}
                    variant={active ? 'primary' : 'muted'}
                    size="sm"
                  />
                </View>

                <View style={styles.metricsBox}>
                  <View style={styles.metricColumn}>
                    <Text style={styles.metricLabel}>DEMANDA</Text>
                    <Text style={styles.metricValue}>
                      {isEggProduct
                        ? `${plan.results.weeklyDemand} huevos / semana`
                        : `${plan.results.weeklyDemand} kg / semana`}
                    </Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricColumn}>
                    <Text style={styles.metricLabel}>
                      {plan.results.primaryBirdsLabel.toUpperCase()}
                    </Text>
                    <Text style={styles.metricValue}>{plan.results.primaryBirdsCount}</Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}
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
  },
  headerTitle: {
    ...Typography.h1,
    fontSize: 24,
    marginTop: 2,
  },
  headerDescription: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: 2,
  },
  filterRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  chip: {
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
});
