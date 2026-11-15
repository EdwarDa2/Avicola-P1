import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import {
  Header,
  Input,
  Button,
  AnimatedCounter,
  Card,
  ConfirmModal,
} from '@/components';
import { useApp } from '@/application/state/AppContext';
import { AgeGroupKey, AGE_GROUPS } from '@/types';

export default function EditFamilyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { families, updateFamily, archiveFamily, restoreFamily } = useApp();

  const currentFamily = families.find((f) => f.id === id);

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [ageCounts, setAgeCounts] = useState<Record<AgeGroupKey, number>>({
    '0-3': 0,
    '4-8': 0,
    '9-13': 0,
    '14-18': 0,
    '19+': 0,
  });
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  useEffect(() => {
    if (currentFamily) {
      setName(currentFamily.name);
      setAgeCounts(currentFamily.ageCounts);
    }
  }, [currentFamily]);

  if (!currentFamily) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Editar Familia" showBack={true} />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>Familia no encontrada</Text>
          <Button
            title="Regresar a Familias"
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
        title="Editar Familia"
        subtitle={currentFamily.name}
        showBack={true}
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Tarjeta de Identificación */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Nombre de la familia</Text>
            <Input
              label="Nombre identificador"
              placeholder="Ej. Familia Morales"
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

          {/* Tarjeta de Resumen en Vivo */}
          <Card variant="obsidian" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>TOTAL DE INTEGRANTES</Text>
                <Text style={styles.summarySub}>
                  {totalMembers === 1 ? '1 persona registrada' : `${totalMembers} personas registradas`}
                </Text>
              </View>
              <View style={styles.totalBadge}>
                <Text style={styles.totalNumber}>{totalMembers}</Text>
              </View>
            </View>
          </Card>

          {/* Sección de Integrantes por Grupos de Edad */}
          <View style={styles.ageSectionHeader}>
            <Text style={styles.sectionTitle}>Composición familiar</Text>
            <Text style={styles.sectionSubtitle}>
              Actualizar la composición no altera los planes y cálculos calculados previamente (RF-02).
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

          {/* Acciones principales */}
          <View style={styles.actionsContainer}>
            <Button
              title="Guardar Cambios"
              onPress={handleSave}
              variant="primary"
              style={styles.saveButton}
            />

            {currentFamily.archived ? (
              <Button
                title="Restaurar Familia"
                onPress={handleRestore}
                variant="secondary"
                style={styles.archiveButton}
              />
            ) : (
              <Button
                title="Archivar Familia"
                onPress={() => setShowArchiveModal(true)}
                variant="danger"
                style={styles.archiveButton}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de confirmación para archivar (RF-04) */}
      <ConfirmModal
        visible={showArchiveModal}
        title="¿Archivar familia?"
        message="La familia se ocultará de la lista activa, pero todos sus planes guardados permanecerán seguros y podrás restaurarla en cualquier momento."
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
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...Typography.captionBold,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  summarySub: {
    ...Typography.body,
    color: Colors.paper,
    marginTop: 2,
  },
  totalBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalNumber: {
    ...Typography.numberDisplay,
    fontSize: 22,
    lineHeight: 28,
    color: Colors.ink,
  },
  ageSectionHeader: {
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
