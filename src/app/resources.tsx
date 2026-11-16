import { useApp } from '@/application/state/AppContext';
import { Badge, Card, EmptyState, Header } from '@/components';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { ProductCode } from '@/types';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FeedReference {
  amount: string;
  source: string;
}

const FEED_REFERENCES: Partial<Record<ProductCode, FeedReference>> = {
  hen_eggs: {
    amount: '≈ 115 g por ave al día',
    source: 'Referencia Hy-Line para traspatio',
  },
  quail_eggs: {
    amount: '≈ 25 g por ave al día',
    source: 'Referencia de codorniz en postura',
  },
};

export default function ResourcesScreen() {
  const router = useRouter();
  const { activeFamily, basketItems } = useApp();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Recursos"
        subtitle="Alimento aplicable a tus planes activos"
        showBack={true}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.intro}>
          <Text style={styles.title}>Recursos de producción</Text>
          <Text style={styles.subtitle}>
            El alimento se estima solo cuando existe una referencia aplicable.
          </Text>
        </View>

        <Card variant="obsidian" style={styles.scopeCard}>
          <Text style={styles.scopeEyebrow}>ALCANCE DE ESTA VERSIÓN</Text>
          <Text style={styles.scopeText}>
            El alimento se estima cuando hay una referencia técnica documentada por
            especie y etapa. El agua, el espacio de alojamiento y el equipamiento se
            incorporan en la siguiente versión.
          </Text>
          <Text style={styles.scopeFootnote}>Decisión D-06 · Requisitos RF-33 a RF-40</Text>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Aves en producción</Text>
          <Text style={styles.sectionSubtitle}>
            Familia activa: {activeFamily ? activeFamily.name : 'Ninguna'}
          </Text>
        </View>

        {basketItems.length === 0 ? (
          <EmptyState
            iconName="leaf-outline"
            title="Sin planes activos"
            description="Cuando actives un plan de producción verás aquí el alimento estimado para tus aves."
            actionTitle="Crear un plan"
            onAction={() => router.push('/plan/new' as any)}
          />
        ) : (
          basketItems.map((item) => {
            const reference = FEED_REFERENCES[item.productCode];

            return (
              <Card key={item.planId} style={styles.resourceCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeading}>
                    <Text style={styles.productName}>{item.productName}</Text>
                    <Text style={styles.planName} numberOfLines={1}>
                      {item.planName}
                    </Text>
                  </View>
                  <Badge label="Activo" variant="primary" size="sm" />
                </View>

                <View style={styles.metricsBox}>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Aves calculadas</Text>
                    <Text style={styles.metricValue}>{item.birdsSummaryText}</Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Alimento estimado</Text>
                    {reference ? (
                      <>
                        <Text style={styles.metricValue}>{reference.amount}</Text>
                        <Text style={styles.metricSource}>{reference.source}</Text>
                      </>
                    ) : (
                      <Text style={styles.metricUnavailable}>
                        Requiere tabla de consumo por edad y etapa (siguiente versión)
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            );
          })
        )}
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
  intro: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.ash,
    marginTop: Spacing.xs,
  },
  scopeCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  scopeEyebrow: {
    ...Typography.captionBold,
    color: Colors.primary,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  scopeText: {
    ...Typography.body,
    color: Colors.paper,
    marginTop: Spacing.xs,
    lineHeight: 21,
  },
  scopeFootnote: {
    ...Typography.caption,
    color: Colors.textLightMuted,
    fontSize: 11,
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.ink,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: 2,
  },
  resourceCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cardHeading: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  productName: {
    ...Typography.bodyBold,
    color: Colors.ink,
  },
  planName: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: 2,
  },
  metricsBox: {
    backgroundColor: Colors.bone,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  metricRow: {
    paddingVertical: Spacing.xs,
  },
  metricDivider: {
    height: 1,
    backgroundColor: Colors.hairline,
    marginVertical: Spacing.xs,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.ash,
  },
  metricValue: {
    ...Typography.bodyBold,
    color: Colors.ink,
    marginTop: 2,
  },
  metricSource: {
    ...Typography.caption,
    color: Colors.ash,
    fontSize: 11,
    marginTop: 2,
  },
  metricUnavailable: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: 2,
  },
});
