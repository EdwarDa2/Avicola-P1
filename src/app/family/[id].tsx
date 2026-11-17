import { useApp } from '@/application/state/AppContext';
import {
  AnimatedCounter,
  AnimatedMemberFigures,
  Button,
  Card,
  ConfirmModal,
  Header,
  Input,
} from '@/components';

import {
  Colors,
  Spacing,
  Typography,
} from '@/constants/theme';

import {
  AGE_GROUPS,
  AgeGroupKey,
} from '@/types';

import { Ionicons } from '@expo/vector-icons';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import {
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

// ============================================
// VALORES INICIALES
// ============================================

const EMPTY_AGE_COUNTS: Record<AgeGroupKey, number> = {
  '0-3': 0,
  '4-8': 0,
  '9-13': 0,
  '14-18': 0,
  '19+': 0,
};

// ============================================
// PANTALLA EDITAR FAMILIA
// ============================================

export default function EditFamilyScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  // ==========================================
  // CONEXIÓN CON APPCONTEXT
  // ==========================================

  const {
    families,
    familiesLoading,
    familyStorageError,

    updateFamilySaved,
    archiveFamilySaved,
    restoreFamilySaved,
  } = useApp();

  // ==========================================
  // BUSCAR FAMILIA EN EL ESTADO
  // ==========================================

  const currentFamily = families.find(
    (family) => family.id === id
  );

  // ==========================================
  // ESTADOS DEL FORMULARIO
  // ==========================================

  const [name, setName] = useState(
    currentFamily?.name ?? ''
  );

  const [nameError, setNameError] =
    useState('');

  const [ageCounts, setAgeCounts] = useState<
    Record<AgeGroupKey, number>
  >(
    currentFamily
      ? { ...currentFamily.ageCounts }
      : { ...EMPTY_AGE_COUNTS }
  );

  const [
    showArchiveModal,
    setShowArchiveModal,
  ] = useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isArchiving, setIsArchiving] =
    useState(false);

  const [isRestoring, setIsRestoring] =
    useState(false);

  // Protección contra operaciones duplicadas
  const busyRef = useRef(false);

  const isBusy =
    isSaving || isArchiving || isRestoring;

  // ==========================================
  // SINCRONIZAR FORMULARIO CON SQLITE
  // ==========================================

  // La familia se recupera de forma asíncrona, así que el
  // formulario se reinicia cuando cambia el registro de origen
  // (id o updatedAt) durante el propio render, en lugar de
  // copiar los datos con un efecto.
  const [syncedFamilyKey, setSyncedFamilyKey] =
    useState<string | null>(null);

  const familyKey = currentFamily
    ? `${currentFamily.id}:${currentFamily.updatedAt}`
    : null;

  if (familyKey !== syncedFamilyKey) {
    setSyncedFamilyKey(familyKey);

    if (currentFamily) {
      setName(currentFamily.name);

      setAgeCounts({
        ...currentFamily.ageCounts,
      });

      setNameError('');
    }
  }

  // ==========================================
  // TOTAL DE INTEGRANTES
  // ==========================================

  const totalMembers = Object.values(
    ageCounts
  ).reduce(
    (acc, curr) => acc + curr,
    0
  );

  // ==========================================
  // ACTUALIZAR CONTADORES
  // ==========================================

  const handleCounterChange = (
    key: AgeGroupKey,
    newCount: number
  ) => {
    if (busyRef.current) return;

    setAgeCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, newCount),
    }));
  };

  // ==========================================
  // REGRESAR AL LISTADO
  // ==========================================

  const handleBack = () => {
    if (busyRef.current) return;

    router.back();
  };

  // ==========================================
  // GUARDAR CAMBIOS EN SQLITE
  // ==========================================

  const handleSave = async () => {
    if (busyRef.current) return;

    if (
      !currentFamily ||
      familiesLoading ||
      familyStorageError
    ) {
      Alert.alert(
        'Información no disponible',
        'No se pueden modificar los datos de esta familia.'
      );
      return;
    }

    const trimmed = name.trim();
 
    if (!trimmed) {
      setNameError(
        'Por favor ingresa un nombre para identificar a la familia.'
      );
      return;
    }

    if (trimmed.length < 2) {
      setNameError(
        'El nombre debe tener al menos 2 caracteres.'
      );
      return;
    }

    // Validar integrantes
    if (totalMembers <= 0) {
      Alert.alert(
        'Integrantes requeridos',
        'La familia debe contar con al menos un integrante.'
      );
      return;
    }

    busyRef.current = true;
    setIsSaving(true);

    try {
      // Guardar cambios en SQLite
      const updatedFamily =
        await updateFamilySaved(
          currentFamily.id,
          trimmed,
          { ...ageCounts }
        );

      console.log(
        'Familia actualizada en SQLite:',
        updatedFamily.id
      );

      // Navegar después del guardado exitoso
      router.back();

    } catch (error) {
      console.error(
        'Error al actualizar familia:',
        error
      );

      Alert.alert(
        'No se pudieron guardar los cambios',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al actualizar la familia.'
      );

    } finally {
      busyRef.current = false;
      setIsSaving(false);
    }
  };

  // ==========================================
  // ARCHIVAR FAMILIA EN SQLITE
  // ==========================================

  const handleArchiveConfirm = async () => {
    if (busyRef.current || !currentFamily) return;

    busyRef.current = true;
    setIsArchiving(true);

    try {
      // Guardar archived = 1
      await archiveFamilySaved(
        currentFamily.id
      );

      console.log(
        'Familia archivada en SQLite:',
        currentFamily.id
      );

      setShowArchiveModal(false);

      router.back();

    } catch (error) {
      console.error(
        'Error al archivar familia:',
        error
      );

      setShowArchiveModal(false);

      Alert.alert(
        'No se pudo archivar',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al archivar la familia.'
      );

    } finally {
      busyRef.current = false;
      setIsArchiving(false);
    }
  };

  // ==========================================
  // RESTAURAR FAMILIA EN SQLITE
  // ==========================================

  const handleRestore = async () => {
    if (busyRef.current || !currentFamily) return;

    busyRef.current = true;
    setIsRestoring(true);

    try {
      // Guardar archived = 0
      await restoreFamilySaved(
        currentFamily.id
      );

      console.log(
        'Familia restaurada en SQLite:',
        currentFamily.id
      );

      router.back();

    } catch (error) {
      console.error(
        'Error al restaurar familia:',
        error
      );

      Alert.alert(
        'No se pudo restaurar',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al restaurar la familia.'
      );

    } finally {
      busyRef.current = false;
      setIsRestoring(false);
    }
  };

  // ==========================================
  // ESTADO DE CARGA INICIAL
  // ==========================================

  if (familiesLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header
          title="Editar familia"
          showBack={true}
          onBack={handleBack}
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />

          <Text style={styles.loadingText}>
            Cargando información familiar...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // FAMILIA NO DISPONIBLE
  // ==========================================

  if (!currentFamily) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header
          title="Editar familia"
          showBack={true}
          onBack={handleBack}
        />

        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>
            {familyStorageError
              ? 'Error al cargar familias'
              : 'Familia no encontrada'}
          </Text>

          {familyStorageError && (
            <Text style={styles.loadingText}>
              {familyStorageError}
            </Text>
          )}

          <Button
            title="Volver a familias"
            onPress={handleBack}
            variant="secondary"
          />
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // INTERFAZ ORIGINAL
  // ==========================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Editar familia"
        subtitle={currentFamily.name}
        showBack={true}
        onBack={handleBack}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ==================================
              INFORMACIÓN DEL PERFIL
          ================================== */}

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              Perfil familiar
            </Text>

            <Text style={styles.sectionSubtitle}>
              Ponle un nombre fácil de reconocer.
            </Text>

            <Input
              label="Nombre de la familia"
              placeholder="Ej. Familia García, Granja El Roble"
              value={name}
              onChangeText={(text) => {
                if (busyRef.current) return;

                setName(text);

                if (nameError) {
                  setNameError('');
                }
              }}
              error={nameError}
              required={true}
              maxLength={40}
            />
          </Card>

          {/* ==================================
              RESUMEN DE INTEGRANTES
          ================================== */}

          <Card
            variant="obsidian"
            style={styles.summaryCard}
          >
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>
                  Integrantes
                </Text>

                <View style={styles.summaryValueRow}>
                  <Text style={styles.totalNumber}>
                    {totalMembers}
                  </Text>

                  <Text style={styles.summaryUnit}>
                    {totalMembers === 1
                      ? 'persona'
                      : 'personas'}
                  </Text>
                </View>
              </View>

              <Ionicons
                name="people-outline"
                size={24}
                color={Colors.primary}
              />
            </View>

            {totalMembers > 0 && (
              <View style={styles.memberPreview}>
                <AnimatedMemberFigures
                  ageCounts={ageCounts}
                  variant="compact"
                />
              </View>
            )}
          </Card>
 
          <View style={styles.ageSectionHeader}>
            <Text style={styles.sectionTitle}>
              Integrantes por edad
            </Text>

            <Text style={styles.sectionSubtitle}>
              Los cambios no modifican los planes guardados.
            </Text>
          </View>

          {AGE_GROUPS.map((group) => (
            <AnimatedCounter
              key={group.key}
              label={group.label}
              ageRange={group.ageRange}
              count={ageCounts[group.key]}
              onChange={(count) =>
                handleCounterChange(
                  group.key,
                  count
                )
              }
              isSpecialChildGroup={
                group.isSpecialChildGroup
              }
            />
          ))}
 
          <View style={styles.actionsContainer}>
            <Button
              title={
                isSaving
                  ? 'Guardando cambios...'
                  : 'Guardar cambios'
              }
              onPress={() => {
                void handleSave();
              }}
              variant="primary"
              style={styles.saveButton}
            />

            {currentFamily.archived ? (
              <Button
                title={
                  isRestoring
                    ? 'Restaurando familia...'
                    : 'Restaurar familia'
                }
                onPress={() => {
                  void handleRestore();
                }}
                variant="secondary"
                style={styles.archiveButton}
              />
            ) : (
              <Button
                title={
                  isArchiving
                    ? 'Archivando familia...'
                    : 'Archivar familia'
                }
                onPress={() => {
                  if (!isBusy) {
                    setShowArchiveModal(true);
                  }
                }}
                variant="danger"
                style={styles.archiveButton}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
  
      <ConfirmModal
        visible={showArchiveModal}
        title="¿Archivar familia?"
        message="La familia dejará de aparecer en la lista activa. Sus planes se conservarán y podrás restaurarla después."
        confirmText={
          isArchiving
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
            setShowArchiveModal(false);
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

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },

  sectionCard: {
    marginBottom: Spacing.md,
  },

  sectionTitle: {
    ...Typography.h3,
    color: Colors.ink,
    marginBottom: 4,
  },

  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.ash,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },

  summaryCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryLabel: {
    ...Typography.bodyBold,
    color: Colors.paper,
  },

  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.xs,
  },

  totalNumber: {
    ...Typography.numberDisplayLarge,
    fontSize: 34,
    lineHeight: 38,
  },

  summaryUnit: {
    ...Typography.caption,
    color: Colors.textLightMuted,
    marginLeft: Spacing.xs,
  },

  memberPreview: {
    borderTopWidth: 1,
    borderTopColor: Colors.obsidianLight,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },

  ageSectionHeader: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },

  actionsContainer: {
    marginTop: Spacing.lg,
  },

  saveButton: {
    marginBottom: Spacing.md,
  },

  archiveButton: {
    marginBottom: Spacing.md,
  },

  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },

  notFoundTitle: {
    ...Typography.h3,
    color: Colors.ink,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },

  loadingText: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
