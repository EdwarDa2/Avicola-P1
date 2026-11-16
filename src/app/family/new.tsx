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
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { AGE_GROUPS, AgeGroupKey } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

export default function NewFamilyScreen() {
  const router = useRouter();
  const { createFamily } = useApp();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [ageCounts, setAgeCounts] = useState<Record<AgeGroupKey, number>>({
    '0-3': 0,
    '4-8': 0,
    '9-13': 0,
    '14-18': 0,
    '19+': 1, // Por defecto al menos 1 adulto
  });

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
    if (trimmed.length < 2) {
      setNameError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (totalMembers <= 0) {
      Alert.alert(
        'Integrantes requeridos',
        'La familia debe contar con al menos un integrante para planificar producción.'
      );
      return;
    }

    createFamily(trimmed, ageCounts);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Nueva familia"
        subtitle="Perfil para tus planes"
        showBack={true}
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
              onChange={(count) => handleCounterChange(group.key, count)}
              isSpecialChildGroup={group.isSpecialChildGroup}
            />
          ))}

          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed-outline" size={16} color={Colors.accent} />
            <Text style={styles.privacyText}>
              No pedimos datos personales. El perfil se guarda en este dispositivo.
            </Text>
          </View>

          <Button
            title="Guardar y seleccionar familia"
            onPress={handleSave}
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
