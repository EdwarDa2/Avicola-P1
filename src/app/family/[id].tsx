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
import { Colors, Spacing, Typography } from '@/constants/theme';
import { AGE_GROUPS, AgeGroupKey } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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

export default function EditFamilyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { families, updateFamily, archiveFamily, restoreFamily } = useApp();

  const currentFamily = families.find((f) => f.id === id);

  const [name, setName] = useState(currentFamily?.name ?? '');
  const [nameError, setNameError] = useState('');
  const [ageCounts, setAgeCounts] = useState<Record<AgeGroupKey, number>>(
    currentFamily?.ageCounts ?? {
      '0-3': 0,
      '4-8': 0,
      '9-13': 0,
      '14-18': 0,
      '19+': 0,
    }
  );
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  if (!currentFamily) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Editar familia" showBack={true} />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>Familia no encontrada</Text>
          <Button
            title="Volver a familias"
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>
      </SafeAreaView>
    );
  }

  const totalMembers = Object.values(ageCounts).reduce((acc, curr) => acc + curr, 0);

  const handleCounterChange = (key: AgeGroupKey, newCount: number) => {
    setAgeCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, newCount), // Validación no negatividad (CP-17)
    }));
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Por favor ingresa un nombre para identificar a la familia.');
      return;
    }
    if (totalMembers <= 0) {
      Alert.alert(
        'Integrantes requeridos',
        'La familia debe contar con al menos un integrante.'
      );
      return;
    }

    updateFamily(currentFamily.id, trimmed, ageCounts);
    router.back();
  };

  const handleArchiveConfirm = () => {
    setShowArchiveModal(false);
    archiveFamily(currentFamily.id);
    router.back();
  };

  const handleRestore = () => {
    restoreFamily(currentFamily.id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Editar familia"
        subtitle={currentFamily.name}
        showBack={true}
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Perfil familiar</Text>
            <Text style={styles.sectionSubtitle}>
              Ponle un nombre fácil de reconocer.
            </Text>

            <Input
              label="Nombre de la familia"
              placeholder="Ej. Familia García, Granja El Roble"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError('');
              }}
              error={nameError}
              required={true}
              maxLength={40}
            />
          </Card>

          <Card variant="obsidian" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Integrantes</Text>
                <View style={styles.summaryValueRow}>
                  <Text style={styles.totalNumber}>{totalMembers}</Text>
                  <Text style={styles.summaryUnit}>
                    {totalMembers === 1 ? 'persona' : 'personas'}
                  </Text>
                </View>
              </View>
              <Ionicons name="people-outline" size={24} color={Colors.primary} />
            </View>
            {totalMembers > 0 && (
              <View style={styles.memberPreview}>
                <AnimatedMemberFigures ageCounts={ageCounts} variant="compact" />
              </View>
            )}
          </Card>

          <View style={styles.ageSectionHeader}>
            <Text style={styles.sectionTitle}>Integrantes por edad</Text>
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
              onChange={(count) => handleCounterChange(group.key, count)}
              isSpecialChildGroup={group.isSpecialChildGroup}
            />
          ))}

          <View style={styles.actionsContainer}>
            <Button
              title="Guardar cambios"
              onPress={handleSave}
              variant="primary"
              style={styles.saveButton}
            />

            {currentFamily.archived ? (
              <Button
                title="Restaurar familia"
                onPress={handleRestore}
                variant="secondary"
                style={styles.archiveButton}
              />
            ) : (
              <Button
                title="Archivar familia"
                onPress={() => setShowArchiveModal(true)}
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
        confirmText="Archivar"
        cancelText="Cancelar"
        destructive={true}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setShowArchiveModal(false)}
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
  },
});
