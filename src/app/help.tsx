import { Badge, Card, Header } from '@/components';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HelpScreen() {
  const router = useRouter();

  const formulas = [
    {
      id: 'F01',
      title: 'Demanda semanal de huevos',
      formula: 'E_sem = Σ(N_i · H_i · F_i · D_i)',
      description: 'Suma del consumo de personas por ocasión, frecuencia diaria y días por semana.',
    },
    {
      id: 'F02',
      title: 'Aves ponedoras requeridas',
      formula: 'G = ceil( E_sem · (1 + S) / (7 · P · U) )',
      description: 'Ponderación con margen de seguridad (S), postura diaria (P) y aprovechamiento (U).',
    },
    {
      id: 'F03 & F04',
      title: 'Demanda anual de carne',
      formula: 'M_sem = Σ(...) / 1000 kg ; M_año = M_sem · 52',
      description: 'Multiplicación por 52 semanas del año calendario (Decisión D-01).',
    },
    {
      id: 'F05 & F06',
      title: 'Aves para sacrificio e inicio',
      formula: 'A_slaughter = ceil(M_año · (1+S) / Y) ; A_initial = ceil(A_slaughter / (1-m))',
      description: 'Considera rendimiento comestible por canal (Y) y tasa de mortalidad (m).',
    },
    {
      id: 'F07',
      title: 'Reproducción de codornices',
      formula: 'H = ceil( R / (f · h · s · p_female) )',
      description: 'Huevos a incubar para reemplazo considerando fertilidad, incubabilidad y supervivencia.',
    },
    {
      id: 'F08',
      title: 'Distribución exacta en lotes',
      formula: 'base = floor(A / L) ; remainder = A mod L',
      description: 'Garantiza que la suma de lotes sea exactamente igual al total de aves sin sobrantes.',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Ayuda y Fórmulas"
        subtitle="MÓDULO M10 · Trazabilidad y fuentes"
        showBack={true}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <Card variant="obsidian" style={styles.heroCard}>
          <Text style={styles.heroBadge}>BASE CIENTÍFICA Y MATEMÁTICA</Text>
          <Text style={styles.heroTitle}>Modelos de Traspatio V1.0</Text>
          <Text style={styles.heroText}>
            Todos los cálculos corresponden con exactitud a los modelos matemáticos
            didácticos oficiales para autoconsumo familiar (SRC-F1, SRC-F2, SRC-F3).
          </Text>
        </Card>

        <Text style={styles.sectionHeader}>Fórmulas Matemáticas</Text>

        {formulas.map((item) => (
          <Card key={item.id} style={styles.formulaCard}>
            <View style={styles.formulaTop}>
              <Badge label={item.id} variant="primary" size="sm" />
              <Text style={styles.formulaTitle}>{item.title}</Text>
            </View>
            <View style={styles.formulaBox}>
              <Text style={styles.formulaCode}>{item.formula}</Text>
            </View>
            <Text style={styles.formulaDesc}>{item.description}</Text>
          </Card>
        ))}

        <Card style={styles.policyCard}>
          <Text style={styles.policyTitle}>Privacidad y Funcionamiento Offline</Text>
          <Text style={styles.policyText}>
            Esta aplicación opera 100% de forma local en tu dispositivo móvil.
            No requiere conexión a internet, no transmite información a servidores en la nube
            y minimiza la recolección de datos personales (RNF-01, RNF-04, MASVS).
          </Text>
        </Card>
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
  heroCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  heroBadge: {
    ...Typography.captionBold,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  heroTitle: {
    ...Typography.h2,
    color: Colors.paper,
    marginTop: 4,
    marginBottom: Spacing.xs,
  },
  heroText: {
    ...Typography.body,
    color: Colors.textLightMuted,
    lineHeight: 20,
  },
  sectionHeader: {
    ...Typography.h3,
    color: Colors.ink,
    marginBottom: Spacing.md,
  },
  formulaCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  formulaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  formulaTitle: {
    ...Typography.bodyBold,
    color: Colors.ink,
    flex: 1,
  },
  formulaBox: {
    backgroundColor: Colors.boneDark,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  formulaCode: {
    ...Typography.bodyBold,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.ink,
    fontSize: 13,
  },
  formulaDesc: {
    ...Typography.caption,
    color: Colors.ash,
    lineHeight: 18,
  },
  policyCard: {
    marginTop: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.boneDark,
    borderWidth: 0,
  },
  policyTitle: {
    ...Typography.bodyBold,
    color: Colors.ink,
    marginBottom: 4,
  },
  policyText: {
    ...Typography.caption,
    color: Colors.ash,
    lineHeight: 18,
  },
});
