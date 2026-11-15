import { useApp } from '@/application/state/AppContext';
import {
  AnimatedBasketItem,
  AnimatedMemberFigures,
  Badge,
  Button,
  Card,
  EmptyState,
} from '@/components';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const {
    families,
    activeFamily,
    activeFamilyId,
    selectFamily,
    basketItems,
    plans,
    togglePlanActive,
  } = useApp();

  const [showFamilyModal, setShowFamilyModal] = useState(false);

  const activePlansCount = basketItems.length;
  const coveragePercent = (activePlansCount / 4) * 100;

  // Planes de la familia activa
  const familyPlans = activeFamilyId
    ? plans.filter((p) => p.familyId === activeFamilyId)
    : [];

  const handleSelectFamilyFromModal = (familyId: string) => {
    selectFamily(familyId);
    setShowFamilyModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Cabecera Superior Agritech */}
        <View style={styles.topBar}>
          <View style={styles.brandingRow}>
            <View style={styles.logoBadge}>
              <Ionicons name="leaf" size={20} color={Colors.ink} />
            </View>
            <View>
              <Text style={styles.brandTitle}>Planificador Avícola</Text>
              <Text style={styles.brandSubtitle}>Autoconsumo y Granjas Familiares</Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/help' as any)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Abrir guía de ayuda y trazabilidad de fórmulas"
            style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="help-circle-outline" size={24} color={Colors.ink} />
          </Pressable>
        </View>

        {/* Hero Card Obsidian — Estado de la Granja / Familia Activa (Estilo Agrilo) */}
        <Card variant="obsidian" style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Badge label="PERFIL ACTIVO" variant="primary" size="sm" />
            <Pressable
              onPress={() => setShowFamilyModal(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cambiar de familia activa"
              style={({ pressed }) => [styles.changeFamilyBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="swap-horizontal" size={16} color={Colors.primary} />
              <Text style={styles.changeFamilyText}>Cambiar</Text>
            </Pressable>
          </View>

          <Text style={styles.heroFamilyName}>
            {activeFamily ? activeFamily.name : 'Sin familia seleccionada'}
          </Text>

          {activeFamily ? (
            <View style={styles.familyFiguresContainer}>
              <AnimatedMemberFigures
                ageCounts={activeFamily.ageCounts}
                variant="compact"
              />
            </View>
          ) : (
            <Text style={styles.noFamilyText}>
              Selecciona o crea una familia para comenzar la planificación.
            </Text>
          )}

          {/* Barra de Cobertura de la Canasta Familiar */}
          <View style={styles.coverageBox}>
            <View style={styles.coverageLabelRow}>
              <Text style={styles.coverageTitle}>COBERTURA DE LA CANASTA</Text>
              <Text style={styles.coverageValue}>
                {activePlansCount} de 4 productos
              </Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${coveragePercent}%` },
                ]}
              />
            </View>

            <Text style={styles.coverageFootnote}>
              Producción estimada para autoconsumo, no inventario físico (D-05).
            </Text>
          </View>
        </Card>

        {/* Botón Principal CTA: Nuevo Plan */}
        <Button
          title="+ Planificar Nuevo Producto"
          onPress={() => router.push('/plan/new' as any)}
          variant="primary"
          style={styles.newPlanBtn}
        />

        {/* Sección: Canasta Familiar de Producción (M06) */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Canasta Familiar</Text>
            <Text style={styles.sectionSubtitle}>
              M06 · Productos con plan activo para este hogar
            </Text>
          </View>
          <Badge
            label={`${activePlansCount} activos`}
            variant={activePlansCount > 0 ? 'success' : 'muted'}
            size="sm"
          />
        </View>

        {basketItems.length === 0 ? (
          <EmptyState
            iconName="basket-outline"
            title="Canasta sin planes activos"
            description="Actualmente no hay productos asignados a la canasta familiar. Crea tu primer plan o activa uno existente del historial."
            actionTitle="+ Planificar Primer Producto"
            onAction={() => router.push('/plan/new' as any)}
          />
        ) : (
          basketItems.map((item) => (
            <AnimatedBasketItem
              key={item.planId}
              item={item}
              onPress={() => {
                // Navega al detalle del plan
                router.push('/history' as any);
              }}
              onDeactivate={() => {
                // Desactiva el plan de la canasta transaccionalmente (D-05)
                togglePlanActive(item.planId);
              }}
            />
          ))
        )}

        <View style={styles.toolsSection}>
          <Text style={styles.sectionTitle}>Herramientas</Text>
          <View style={styles.toolsList}>
            <Pressable
              onPress={() => router.push('/nutrients' as any)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Consultar aporte de proteína por porción"
              style={({ pressed }) => [
                styles.toolRow,
                styles.toolRowDivider,
                { opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <View style={styles.toolIcon}>
                <Ionicons name="nutrition-outline" size={20} color={Colors.ink} />
              </View>
              <View style={styles.toolText}>
                <Text style={styles.toolTitle}>Aporte de proteína</Text>
                <Text style={styles.toolDescription}>
                  Gramos estimados por porción.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.ash} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/resources' as any)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Consultar alimento y recursos de los planes activos"
              style={({ pressed }) => [
                styles.toolRow,
                { opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <View style={styles.toolIcon}>
                <Ionicons name="leaf-outline" size={20} color={Colors.ink} />
              </View>
              <View style={styles.toolText}>
                <Text style={styles.toolTitle}>Alimento y recursos</Text>
                <Text style={styles.toolDescription}>
                  Consulta lo disponible para tus planes activos.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.ash} />
            </Pressable>
          </View>
        </View>

        {/* Sección: Planes Recientes de la Familia */}
        {familyPlans.length > 0 && (
          <View style={styles.recentPlansSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Planes Recientes</Text>
                <Text style={styles.sectionSubtitle}>
                  Conmuta el plan activo en la canasta en un solo toque (D-05)
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/history' as any)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.seeAllLink}>Ver todos ({familyPlans.length})</Text>
              </Pressable>
            </View>

            {familyPlans.slice(0, 3).map((plan) => {
              const isPlanActive = basketItems.some((b) => b.planId === plan.id);
              return (
                <Card key={plan.id} style={styles.recentPlanCard}>
                  <View style={styles.recentPlanLeft}>
                    <Badge
                      label={isPlanActive ? 'ACTIVO' : 'DISPONIBLE'}
                      variant={isPlanActive ? 'primary' : 'muted'}
                      size="sm"
                    />
                    <Text style={styles.recentPlanName}>{plan.name}</Text>
                    <Text style={styles.recentPlanDetail}>
                      {plan.results.primaryBirdsCount} {plan.results.primaryBirdsLabel} ·{' '}
                      {plan.results.scenarioName}
                    </Text>
                  </View>

                  <Button
                    title={isPlanActive ? 'Activo' : 'Activar'}
                    onPress={() => togglePlanActive(plan.id)}
                    variant={isPlanActive ? 'secondary' : 'primary'}
                    style={styles.toggleActiveBtn}
                  />
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal de Cambio Rápido de Familia */}
      <Modal
        visible={showFamilyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFamilyModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowFamilyModal(false)}
        >
          <Pressable style={styles.modalDialog} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Familia Activa</Text>
              <Pressable onPress={() => setShowFamilyModal(false)}>
                <Ionicons name="close" size={24} color={Colors.ink} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalList}>
              {families
                .filter((f) => !f.archived)
                .map((fam) => {
                  const isCurrent = fam.id === activeFamilyId;
                  const count = Object.values(fam.ageCounts).reduce(
                    (a, b) => a + b,
                    0
                  );
                  return (
                    <Pressable
                      key={fam.id}
                      onPress={() => handleSelectFamilyFromModal(fam.id)}
                      style={[
                        styles.familyOption,
                        isCurrent && styles.familyOptionActive,
                      ]}
                    >
                      <View>
                        <Text style={styles.famOptionName}>{fam.name}</Text>
                        <Text style={styles.famOptionCount}>
                          {count} {count === 1 ? 'integrante' : 'integrantes'}
                        </Text>
                      </View>
                      {isCurrent ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={Colors.accent}
                        />
                      ) : (
                        <Ionicons
                          name="radio-button-off"
                          size={20}
                          color={Colors.ash}
                        />
                      )}
                    </Pressable>
                  );
                })}
            </ScrollView>

            <Button
              title="+ Registrar Otra Familia"
              onPress={() => {
                setShowFamilyModal(false);
                router.push('/family/new' as any);
              }}
              variant="secondary"
              style={styles.modalAddBtn}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  brandTitle: {
    ...Typography.h3,
    color: Colors.ink,
    fontSize: 18,
  },
  brandSubtitle: {
    ...Typography.caption,
    color: Colors.ash,
    fontSize: 11,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  changeFamilyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.obsidianLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  changeFamilyText: {
    ...Typography.captionBold,
    color: Colors.primary,
    fontSize: 11,
  },
  heroFamilyName: {
    ...Typography.h2,
    color: Colors.paper,
    fontSize: 22,
    marginVertical: 4,
  },
  familyFiguresContainer: {
    marginVertical: Spacing.sm,
  },
  noFamilyText: {
    ...Typography.body,
    color: Colors.textLightMuted,
    marginVertical: Spacing.sm,
  },
  coverageBox: {
    backgroundColor: Colors.obsidianLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  coverageLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  coverageTitle: {
    ...Typography.captionBold,
    color: Colors.primary,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  coverageValue: {
    ...Typography.captionBold,
    color: Colors.paper,
    fontSize: 12,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.borderDark,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  coverageFootnote: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textLightMuted,
    marginTop: 2,
  },
  newPlanBtn: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.ink,
    fontSize: 18,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.ash,
    fontSize: 12,
  },
  seeAllLink: {
    ...Typography.captionBold,
    color: Colors.ink,
  },
  toolsSection: {
    marginVertical: Spacing.md,
  },
  toolsList: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  toolRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  toolRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  toolIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolText: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  toolTitle: {
    ...Typography.bodyBold,
    color: Colors.ink,
  },
  toolDescription: {
    ...Typography.caption,
    color: Colors.ash,
    fontSize: 12,
    marginTop: 2,
  },
  recentPlansSection: {
    marginTop: Spacing.md,
  },
  recentPlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  recentPlanLeft: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  recentPlanName: {
    ...Typography.bodyBold,
    color: Colors.ink,
    fontSize: 15,
    marginTop: 4,
  },
  recentPlanDetail: {
    ...Typography.caption,
    color: Colors.ash,
    fontSize: 12,
    marginTop: 1,
  },
  toggleActiveBtn: {
    minHeight: 36,
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 10, 8, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.paper,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.ink,
  },
  modalList: {
    maxHeight: 240,
    marginBottom: Spacing.md,
  },
  familyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  familyOptionActive: {
    backgroundColor: Colors.bone,
    borderRadius: BorderRadius.sm,
  },
  famOptionName: {
    ...Typography.bodyBold,
    color: Colors.ink,
    fontSize: 15,
  },
  famOptionCount: {
    ...Typography.caption,
    color: Colors.ash,
    fontSize: 12,
  },
  modalAddBtn: {
    marginTop: Spacing.xs,
  },
});
