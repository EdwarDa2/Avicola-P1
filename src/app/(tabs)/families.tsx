import { useApp } from '@/application/state/AppContext';
import {
  AnimatedMemberFigures,
  Badge,
  Button,
  Card,
  ConfirmModal,
  EmptyState,
} from '@/components';

import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

import type { Family } from '@/types';

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

export default function FamiliesScreen() {
  const router = useRouter();
 
  const {
    families,
    activeFamilyId,
    familiesLoading,
    familyStorageError,
    selectFamilySaved,
    archiveFamilySaved,
    restoreFamilySaved,
  } = useApp();

 
  const [filterTab, setFilterTab] = useState<
    'active' | 'archived'
  >('active');

  const [
    familyToArchive,
    setFamilyToArchive,
  ] = useState<Family | null>(null);

  const [
    pendingAction,
    setPendingAction,
  ] = useState<string | null>(null);

 
  const busyRef = useRef(false);
 
  const activeFamilies = families.filter(
    (family) => !family.archived
  );

  const archivedFamilies = families.filter(
    (family) => family.archived
  );

  const displayedFamilies =
    filterTab === 'active'
      ? activeFamilies
      : archivedFamilies;
 

  const handleSelectFamily = async (
    id: string
  ) => {
    if (busyRef.current || familiesLoading) return;

    busyRef.current = true;
    setPendingAction(`select-${id}`);

    try {
      await selectFamilySaved(id);

      console.log(
        'Familia seleccionada en SQLite:',
        id
      );
    } catch (error) {
      console.error(
        'Error al seleccionar familia:',
        error
      );

      Alert.alert(
        'No se pudo seleccionar',
        error instanceof Error
          ? error.message
          : 'Inténtalo nuevamente.'
      );
    } finally {
      busyRef.current = false;
      setPendingAction(null);
    }
  };
 
  const handleArchiveConfirm = async () => {
    if (
      busyRef.current ||
      !familyToArchive ||
      familiesLoading
    ) {
      return;
    }

    const id = familyToArchive.id;

    busyRef.current = true;
    setPendingAction(`archive-${id}`);

    try {
      await archiveFamilySaved(id);

      console.log(
        'Familia archivada en SQLite:',
        id
      );

      setFamilyToArchive(null);
    } catch (error) {
      console.error(
        'Error al archivar familia:',
        error
      );

      setFamilyToArchive(null);

      Alert.alert(
        'No se pudo archivar',
        error instanceof Error
          ? error.message
          : 'Inténtalo nuevamente.'
      );
    } finally {
      busyRef.current = false;
      setPendingAction(null);
    }
  };

 

  const handleRestoreFamily = async (
    id: string
  ) => {
    if (busyRef.current || familiesLoading) return;

    busyRef.current = true;
    setPendingAction(`restore-${id}`);

    try {
      await restoreFamilySaved(id);

      console.log(
        'Familia restaurada en SQLite:',
        id
      );
 
      setFilterTab('active');
    } catch (error) {
      console.error(
        'Error al restaurar familia:',
        error
      );

      Alert.alert(
        'No se pudo restaurar',
        error instanceof Error
          ? error.message
          : 'Inténtalo nuevamente.'
      );
    } finally {
      busyRef.current = false;
      setPendingAction(null);
    }
  };

 
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
      >
        {/* ENCABEZADO */}

        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerSubtitle}>
              TUS PERFILES
            </Text>

            <Text style={styles.headerTitle}>
              Mis familias
            </Text>

            <Text style={styles.headerDescription}>
              Organiza los hogares de tus planes.
            </Text>
          </View>

          <Button
            title="Nueva"
            icon={
              <Ionicons
                name="add"
                size={18}
                color={Colors.ink}
              />
            }
            onPress={() => {
              if (busyRef.current || familiesLoading) {
                return;
              }
              router.push('/family/new' as any);
            }}
            variant="primary"
            style={styles.addButton}
          />
        </View>

        {/* PESTAÑAS */}

        <View style={styles.tabsRow}>
          <Pressable
            onPress={() => setFilterTab('active')}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{
              selected: filterTab === 'active',
            }}
            accessibilityLabel={
              `Familias activas, ${activeFamilies.length} disponibles`
            }
            style={[
              styles.tabButton,
              filterTab === 'active' &&
                styles.tabButtonActive,
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                filterTab === 'active' &&
                  styles.tabButtonTextActive,
              ]}
            >
              Activas · {activeFamilies.length}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilterTab('archived')}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{
              selected: filterTab === 'archived',
            }}
            accessibilityLabel={
              `Familias archivadas, ${archivedFamilies.length} archivadas`
            }
            style={[
              styles.tabButton,
              filterTab === 'archived' &&
                styles.tabButtonActive,
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                filterTab === 'archived' &&
                  styles.tabButtonTextActive,
              ]}
            >
              Archivadas · {archivedFamilies.length}
            </Text>
          </Pressable>
        </View>

        {/* CARGA, ERRORES Y LISTADO */}

        {familiesLoading ? (
          <View style={styles.statusContainer}>
            <ActivityIndicator
              size="large"
              color={Colors.accent}
            />
            <Text style={styles.statusText}>
              Cargando familias guardadas...
            </Text>
          </View>
        ) : familyStorageError ? (
          <View style={styles.statusContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={32}
              color={Colors.danger}
            />
            <Text style={styles.statusText}>
              No se pudieron cargar las familias.
              {`\n${familyStorageError}`}
            </Text>
          </View>
        ) : displayedFamilies.length === 0 ? (
          <EmptyState
            iconName={
              filterTab === 'active'
                ? 'people-outline'
                : 'archive-outline'
            }
            title={
              filterTab === 'active'
                ? 'Sin familias activas'
                : 'No hay familias archivadas'
            }
            description={
              filterTab === 'active'
                ? 'Crea un perfil para empezar a organizar tus planes.'
                : 'Las familias archivadas aparecerán aquí y podrás restaurarlas cuando las necesites.'
            }
            actionTitle={
              filterTab === 'active'
                ? 'Crear familia'
                : undefined
            }
            onAction={
              filterTab === 'active'
                ? () => router.push('/family/new' as any)
                : undefined
            }
          />
        ) : (
          displayedFamilies.map((family) => {
            const isActive =
              family.id === activeFamilyId &&
              !family.archived;

            const totalMembers = Object.values(
              family.ageCounts
            ).reduce(
              (acc, curr) => acc + curr,
              0
            );

            const isSelecting =
              pendingAction ===
              `select-${family.id}`;

            const isRestoring =
              pendingAction ===
              `restore-${family.id}`;

            return (
              <Card
                key={family.id}
                variant={
                  isActive ? 'highlight' : 'paper'
                }
                style={styles.familyCard}
              >
 
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleCol}>
                    <View style={styles.badgeRow}>
                      {isActive && (
                        <Badge
                          label="Activa"
                          variant="primary"
                          style={styles.activeBadge}
                        />
                      )}

                      {family.archived && (
                        <Badge
                          label="Archivada"
                          variant="muted"
                          style={styles.activeBadge}
                        />
                      )}
                    </View>

                    <Text style={styles.familyName}>
                      {family.name}
                    </Text>
                  </View>

                  {!family.archived && !isActive && (
                    <Button
                      title={
                        isSelecting
                          ? 'Seleccionando...'
                          : 'Seleccionar'
                      }
                      onPress={() => {
                        void handleSelectFamily(
                          family.id
                        );
                      }}
                      variant="secondary"
                      style={styles.selectButton}
                    />
                  )}
                </View>
 

                <View style={styles.metricsContainer}>
                  <View style={styles.totalBlock}>
                    <Text style={styles.totalNumber}>
                      {totalMembers}
                    </Text>

                    <Text style={styles.totalLabel}>
                      {totalMembers === 1
                        ? 'persona'
                        : 'personas'}
                    </Text>
                  </View>

                  <View style={styles.figuresWrapper}>
                    <AnimatedMemberFigures
                      ageCounts={family.ageCounts}
                      variant="compact"
                    />
                  </View>
                </View>
 

                <View style={styles.cardActions}>
                  <Pressable
                    onPress={() => {
                      if (busyRef.current) return;

                      router.push({
                        pathname: '/family/[id]',
                        params: {
                          id: family.id,
                        },
                      } as any);
                    }}
                    disabled={pendingAction !== null}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={
                      `Editar datos de ${family.name}`
                    }
                    style={({ pressed }) => [
                      styles.actionIconButton,
                      {
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={Colors.accent}
                    />

                    <Text style={styles.actionText}>
                      Editar perfil
                    </Text>
                  </Pressable>

                  {family.archived ? (
                    <Pressable
                      onPress={() => {
                        void handleRestoreFamily(
                          family.id
                        );
                      }}
                      disabled={pendingAction !== null}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={
                        `Restaurar ${family.name}`
                      }
                      style={({ pressed }) => [
                        styles.actionIconButton,
                        {
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name="refresh-outline"
                        size={18}
                        color={Colors.success}
                      />

                      <Text
                        style={[
                          styles.actionText,
                          {
                            color: Colors.success,
                          },
                        ]}
                      >
                        {isRestoring
                          ? 'Restaurando...'
                          : 'Restaurar'}
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => {
                        if (busyRef.current) return;

                        setFamilyToArchive(family);
                      }}
                      disabled={pendingAction !== null}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={
                        `Archivar ${family.name}`
                      }
                      style={({ pressed }) => [
                        styles.actionIconButton,
                        {
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name="archive-outline"
                        size={18}
                        color={Colors.danger}
                      />

                      <Text
                        style={[
                          styles.actionText,
                          {
                            color: Colors.danger,
                          },
                        ]}
                      >
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
 

      <ConfirmModal
        visible={familyToArchive !== null}
        title="¿Archivar familia?"
        message={
          `¿Deseas archivar "${familyToArchive?.name}"? ` +
          'Sus planes seguirán guardados y podrás ' +
          'restaurarla en cualquier momento.'
        }
        confirmText={
          pendingAction?.startsWith('archive-')
            ? 'Archivando...'
            : 'Archivar'
        }
        cancelText="Cancelar"
        destructive={true}
        onConfirm={() => {
          void handleArchiveConfirm();
        }}
        onCancel={() => {
          if (!busyRef.current) {
            setFamilyToArchive(null);
          }
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
    color: Colors.accent,
    letterSpacing: 0.8,
  },

  headerTitle: {
    ...Typography.h1,
    color: Colors.ink,
    fontSize: 24,
    marginTop: 2,
  },

  headerDescription: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: 2,
  },

  addButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.sm,
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
    backgroundColor: Colors.boneDark,
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
    color: Colors.accent,
  },

  totalLabel: {
    ...Typography.captionBold,
    fontSize: 11,
    color: Colors.ash,
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

  statusContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusText: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
