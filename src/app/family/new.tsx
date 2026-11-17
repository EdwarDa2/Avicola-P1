import { useApp } from '@/application/state/AppContext';
import {
  AnimatedCounter,
  AnimatedMemberFigures,
  Button,
  Card,
  Header,
  Input,
  SectionTitle,
} from '@/components';
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '@/constants/theme';
import { AGE_GROUPS, AgeGroupKey } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewFamilyScreen() {
  const router = useRouter();

  // ============================================
  // CONEXIÓN CON APPCONTEXT Y SQLITE
  // ============================================

  const {
    createFamilySaved,
    familiesLoading,
    familyStorageError,
  } = useApp();

  // ============================================
  // ESTADOS DEL FORMULARIO
  // ============================================

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  // Evita que dos pulsaciones rápidas
  // generen dos registros en SQLite.
  const savingRef = useRef(false);

  const [ageCounts, setAgeCounts] = useState<
    Record<AgeGroupKey, number>
  >({
    '0-3': 0,
    '4-8': 0,
    '9-13': 0,
    '14-18': 0,
    '19+': 1,
  });

  // ============================================
  // TOTAL DE INTEGRANTES
  // ============================================

  const totalMembers = Object.values(ageCounts).reduce(
    (acc, curr) => acc + curr,
    0
  );

  // ============================================
  // ACTUALIZAR CONTADORES
  // ============================================

  const handleCounterChange = (
    key: AgeGroupKey,
    newCount: number
  ) => {
    if (savingRef.current) return;

    setAgeCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, newCount),
    }));
  };

  // ============================================
  // GUARDAR FAMILIA EN SQLITE
  // ============================================

  const handleSave = async () => {
    // Evitar guardados duplicados
    if (savingRef.current) return;

    // Esperar la carga inicial de SQLite
    if (familiesLoading) {
      Alert.alert(
        'Cargando familias',
        'Espera a que termine de cargar la información.'
      );
      return;
    }

    // No escribir sobre un estado que no
    // pudo recuperarse correctamente.
    if (familyStorageError) {
      Alert.alert(
        'Error de almacenamiento',
        'No se pudieron cargar las familias. ' +
          'Reinicia la aplicación e inténtalo de nuevo.'
      );
      return;
    }

    // ----------------------------------------
    // VALIDAR NOMBRE
    // ----------------------------------------

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
    if (totalMembers <= 0) {
      Alert.alert(
        'Integrantes requeridos',
        'La familia debe contar con al menos un integrante para planificar producción.'
      );
      return;
    }

    // ----------------------------------------
    // INICIAR GUARDADO
    // ----------------------------------------

    savingRef.current = true;
    setIsSaving(true);

    try {
      // Esta función utiliza el servicio de
      // aplicación y confirma el INSERT en SQLite.
      const savedFamily = await createFamilySaved(
        trimmed,
        { ...ageCounts }
      );

      console.log(
        'Familia guardada en SQLite:',
        savedFamily.id
      );

      // Navegar solamente después de guardar.
      router.back();
    } catch (error) {
      console.error(
        'Error al guardar la familia:',
        error
      );

      Alert.alert(
        'No se pudo guardar',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al guardar la familia. Inténtalo nuevamente.'
      );
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  // ============================================
  // NAVEGACIÓN
  // ============================================

  const handleBack = () => {
    // Evita salir mediante el botón del
    // encabezado durante un guardado.
    if (savingRef.current) return;

    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Nueva familia"
        subtitle="Perfil para tus planes"
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
          {/* INFORMACIÓN DEL PERFIL */}
          <Card style={styles.sectionCard}>
            <SectionTitle
              icon="person-outline"
              title="Perfil familiar"
              subtitle="Ponle un nombre fácil de reconocer."
              style={styles.sectionHeading}
            />

            <Input
              label="Nombre de la familia"
              placeholder="Ej. Familia García, Granja El Roble"
              value={name}
              onChangeText={(text) => {
                if (savingRef.current) return;

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

          {/* RESUMEN DE INTEGRANTES */}
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
            <SectionTitle
              icon="people-outline"
              title="Integrantes por edad"
              subtitle="Indica cuántas personas hay en cada rango."
            />
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

          <View style={styles.privacyNote}>
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color={Colors.accent}
            />

            <Text style={styles.privacyText}>
              No pedimos datos personales. El perfil
              se guarda en este dispositivo.
            </Text>
          </View>

          <Button
            title={
              isSaving
                ? 'Guardando familia...'
                : familiesLoading
                  ? 'Cargando familias...'
                  : 'Guardar y seleccionar familia'
            }
            onPress={() => {
              void handleSave();
            }}
            variant="primary"
            style={styles.saveButton}
          />
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
  sectionHeading: {
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
    marginBottom: Spacing.md,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.boneDark,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  privacyText: {
    ...Typography.caption,
    color: Colors.ash,
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 16,
  },
  saveButton: {
    marginTop: Spacing.sm,
  },
});
