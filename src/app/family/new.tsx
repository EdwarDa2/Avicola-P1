import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import {
  Header,
  Input,
  Button,
  AnimatedCounter,
  AnimatedMemberFigures,
  Card,
} from '@/components';
import { useApp } from '@/application/state/AppContext';
import { AgeGroupKey, AGE_GROUPS } from '@/types';

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
        title="Nueva Familia"
        subtitle="Registrar perfil familiar"
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
            <Text style={styles.sectionTitle}>Identificación del perfil</Text>
            <Text style={styles.sectionSubtitle}>
              Asigna un nombre reconocible para este grupo familiar o unidad de traspatio.
            </Text>

            <Input
              label="Nombre de la familia o unidad"
              placeholder="Ej. Familia Morales, Granja El Roble..."
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError('');
              }}
              error={nameError}
              required={true}
              autoFocus={true}
              maxLength={40}
            />
          </Card>

          {/* Tarjeta de Resumen en Vivo de Integrantes */}
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

          {/* FIGURAS ANIMADAS DE INTEGRANTES (RF-51 & CP-23) */}
          <AnimatedMemberFigures ageCounts={ageCounts} variant="detailed" />

          {/* Sección de Integrantes por Grupos de Edad */}
          <View style={styles.ageSectionHeader}>
            <Text style={styles.sectionTitle}>Composición por grupos de edad</Text>
            <Text style={styles.sectionSubtitle}>
              Los consumos y necesidades nutricionales varían según la etapa de vida (D-03).
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

          {/* Nota de Trazabilidad y Privacidad (D-03, RNF-04) */}
          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.ash} />
            <Text style={styles.privacyText}>
              Minimización de datos (RNF-04): No se solicitan nombres individuales ni datos
              personales. Toda la información permanece exclusivamente en este dispositivo offline.
            </Text>
          </View>

          {/* Botón de Guardado */}
          <Button
            title="Guardar y Seleccionar Familia"
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
