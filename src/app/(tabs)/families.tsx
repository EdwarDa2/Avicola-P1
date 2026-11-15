import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import {
  Card,
  Button,
  Badge,
  EmptyState,
  ConfirmModal,
  AnimatedMemberFigures,
} from '@/components';
import { useApp } from '@/application/state/AppContext';
import { Family } from '@/types';

export default function FamiliesScreen() {
  const router = useRouter();
  const {
    families,
    activeFamilyId,
    selectFamily,
    archiveFamily,
    restoreFamily,
  } = useApp();

  const [filterTab, setFilterTab] = useState<'active' | 'archived'>('active');
  const [familyToArchive, setFamilyToArchive] = useState<Family | null>(null);

  const activeFamilies = families.filter((f) => !f.archived);
  const archivedFamilies = families.filter((f) => f.archived);

  const displayedFamilies = filterTab === 'active' ? activeFamilies : archivedFamilies;

  const handleArchiveConfirm = () => {
    if (familyToArchive) {
      archiveFamily(familyToArchive.id);
      setFamilyToArchive(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Cabecera Agritech */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerSubtitle}>MÓDULO M01</Text>
            <Text style={styles.headerTitle}>Perfiles Familiares</Text>
          </View>
          <Button
            title="+ Nueva Familia"
            onPress={() => router.push('/family/new' as any)}
            variant="primary"
            style={styles.addButton}
          />
        </View>

        {/* Pestañas de filtrado: Activas vs Archivadas */}
        <View style={styles.tabsRow}>
          <Pressable
            onPress={() => setFilterTab('active')}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{ selected: filterTab === 'active' }}
            accessibilityLabel={`Familias activas, ${activeFamilies.length} disponibles`}
            style={[styles.tabButton, filterTab === 'active' && styles.tabButtonActive]}
          >
            <Text
              style={[
                styles.tabButtonText,
                filterTab === 'active' && styles.tabButtonTextActive,
              ]}
            >
              Activas ({activeFamilies.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilterTab('archived')}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{ selected: filterTab === 'archived' }}
            accessibilityLabel={`Familias archivadas, ${archivedFamilies.length} archivadas`}
            style={[styles.tabButton, filterTab === 'archived' && styles.tabButtonActive]}
          >
            <Text
              style={[
                styles.tabButtonText,
                filterTab === 'archived' && styles.tabButtonTextActive,
              ]}
            >
              Archivadas ({archivedFamilies.length})
            </Text>
          </Pressable>
        </View>

        {/* Listado de familias */}
        {displayedFamilies.length === 0 ? (
          <EmptyState
            iconName={filterTab === 'active' ? 'people-outline' : 'archive-outline'}
            title={
              filterTab === 'active'
                ? 'Sin familias activas'
                : 'No hay familias archivadas'
            }
            description={
              filterTab === 'active'
                ? 'Registra tu primera familia para comenzar a planificar producción de huevo y carne.'
                : 'Las familias que archives se mostrarán aquí para que puedas restaurarlas cuando lo desees.'
            }
            actionTitle={filterTab === 'active' ? 'Crear Primera Familia' : undefined}
            onAction={filterTab === 'active' ? () => router.push('/family/new' as any) : undefined}
          />
        ) : (
          displayedFamilies.map((family) => {
            const isActive = family.id === activeFamilyId && !family.archived;
            const totalMembers = Object.values(family.ageCounts).reduce(
              (acc, curr) => acc + curr,
              0
            );

            return (
              <Card
                key={family.id}
                variant={isActive ? 'highlight' : 'paper'}
                style={styles.familyCard}
              >
                {/* Cabecera de la tarjeta */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleCol}>
                    <View style={styles.badgeRow}>
                      {isActive && (
                        <Badge
                          label="ACTIVA"
                          variant="primary"
                          style={styles.activeBadge}
                        />
                      )}
                      {family.archived && (
                        <Badge
                          label="ARCHIVADA"
                          variant="muted"
                          style={styles.activeBadge}
                        />
                      )}
                    </View>
                    <Text style={styles.familyName}>{family.name}</Text>
                  </View>

                  {!family.archived && !isActive && (
                    <Button
                      title="Seleccionar"
                      onPress={() => selectFamily(family.id)}
                      variant="secondary"
                      style={styles.selectButton}
                    />
                  )}
                </View>

                {/* Métricas e Figuras Animadas de la Familia (CP-23) */}
                <View style={styles.metricsContainer}>
                  <View style={styles.totalBlock}>
                    <Text style={styles.totalNumber}>{totalMembers}</Text>
                    <Text style={styles.totalLabel}>
                      {totalMembers === 1 ? 'PERSONA' : 'PERSONAS'}
                    </Text>
                  </View>

                  <View style={styles.figuresWrapper}>
                    <AnimatedMemberFigures
                      ageCounts={family.ageCounts}
                      variant="compact"
                    />
                  </View>
                </View>

                {/* Barra de Acciones */}
                <View style={styles.cardActions}>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/family/[id]',
                        params: { id: family.id },
                      } as any)
                    }
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar datos de ${family.name}`}
                    style={({ pressed }) => [
                      styles.actionIconButton,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Ionicons name="create-outline" size={18} color={Colors.ink} />
                    <Text style={styles.actionText}>Editar perfil</Text>
                  </Pressable>

                  {family.archived ? (
                    <Pressable
                      onPress={() => restoreFamily(family.id)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Restaurar ${family.name}`}
                      style={({ pressed }) => [
                        styles.actionIconButton,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Ionicons name="refresh-outline" size={18} color={Colors.success} />
                      <Text style={[styles.actionText, { color: Colors.success }]}>
                        Restaurar
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => setFamilyToArchive(family)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Archivar ${family.name}`}
                      style={({ pressed }) => [
                        styles.actionIconButton,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Ionicons name="archive-outline" size={18} color={Colors.danger} />
                      <Text style={[styles.actionText, { color: Colors.danger }]}>
                        Archivar
                      </Text>
                    </Pressable>
                  )}
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Modal de confirmación para archivar */}
      <ConfirmModal
        visible={familyToArchive !== null}
        title="¿Archivar familia?"
        message={`¿Deseas archivar "${familyToArchive?.name}"? Sus planes seguirán guardados y podrás restaurarla en cualquier momento.`}
        confirmText="Archivar"
        cancelText="Cancelar"
        destructive={true}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setFamilyToArchive(null)}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTextCol: {
    flex: 1,
  },
  headerSubtitle: {
    ...Typography.captionBold,
    color: Colors.ash,
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.ink,
    fontSize: 24,
    marginTop: 2,
  },
  addButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.boneDark,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: Colors.paper,
    ...Shadows.sm,
  },
  tabButtonText: {
    ...Typography.captionBold,
    color: Colors.ash,
  },
  tabButtonTextActive: {
    color: Colors.ink,
  },
  familyCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardTitleCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  activeBadge: {
    marginRight: Spacing.xs,
  },
  familyName: {
    ...Typography.h3,
    color: Colors.ink,
    fontSize: 18,
  },
  selectButton: {
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
  },
  metricsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.bone,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  totalBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: Colors.hairline,
    minWidth: 72,
  },
  totalNumber: {
    ...Typography.numberDisplay,
    fontSize: 26,
    lineHeight: 30,
    color: Colors.ink,
  },
  totalLabel: {
    ...Typography.captionBold,
    fontSize: 9,
    color: Colors.ash,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  figuresWrapper: {
    flex: 1,
    paddingLeft: Spacing.md,
    justifyContent: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: Spacing.sm,
    gap: Spacing.lg,
  },
  actionIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  actionText: {
    ...Typography.captionBold,
    marginLeft: 4,
    color: Colors.ink,
  },
});
