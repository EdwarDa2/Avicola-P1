import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { Header, Card, Badge } from '@/components';
import { useApp } from '@/application/state/AppContext';

export default function ResourcesScreen() {
  const router = useRouter();
  const { activeFamily, basketItems } = useApp();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Recursos de Producción"
        subtitle="MÓDULO M07 · Condicional V1 (D-06)"
        showBack={true}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Aviso de Decisión D-06 */}
        <Card variant="obsidian" style={styles.bannerCard}>
          <Text style={styles.bannerTitle}>ALCANCE DE RECURSOS V1 (D-06)</Text>
          <Text style={styles.bannerText}>
            En la versión 1.0, las estimaciones de alimento solo se muestran cuando existe
            una referencia técnica documentada por especie y etapa. Agua, espacio de alojamiento y
            equipamiento completo se incorporan formalmente en V2.0.
          </Text>
        </Card>

        {/* Resumen de Planes Activos en Canasta */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Aves en producción planificada</Text>
          <Text style={styles.sectionSubtitle}>
            Familia activa: {activeFamily ? activeFamily.name : 'Ninguna'}
          </Text>
        </View>

        {basketItems.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No hay planes activos en la canasta para estimar requerimientos de alimento.
            </Text>
          </Card>
        ) : (
          basketItems.map((item) => (
            <Card key={item.planId} style={styles.resourceCard}>
              <View style={styles.cardHeader}>
                <Badge label={item.productName} variant="primary" size="sm" />
                <Text style={styles.planName}>{item.planName}</Text>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricBlock}>
                  <Text style={styles.metricLabel}>AVES CALCULADAS</Text>
                  <Text style={styles.metricValue}>{item.birdsSummaryText}</Text>
                </View>

                <View style={styles.metricBlock}>
                  <Text style={styles.metricLabel}>ESTIMACIÓN DE ALIMENTO</Text>
                  {item.productCode === 'hen_eggs' ? (
                    <Text style={styles.feedText}>
                      ~115 g / ave / día (referencia Hy-Line traspatio)
                    </Text>
                  ) : item.productCode === 'quail_eggs' ? (
                    <Text style={styles.feedText}>
                      ~25 g / ave / día (referencia codorniz postura)
                    </Text>
                  ) : (
                    <Text style={styles.feedTextUnavailable}>
                      Estimación por edad disponible en V2 (D-06)
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          ))
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
  bannerCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  bannerTitle: {
    ...Typography.captionBold,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  bannerText: {
    ...Typography.body,
    color: Colors.paper,
    marginTop: 4,
    lineHeight: 20,
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
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.ash,
    textAlign: 'center',
  },
  resourceCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  planName: {
    ...Typography.bodyBold,
    color: Colors.ink,
  },
  metricsRow: {
    backgroundColor: Colors.bone,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  metricBlock: {
    marginBottom: 4,
  },
  metricLabel: {
    ...Typography.captionBold,
    fontSize: 10,
    color: Colors.ash,
    letterSpacing: 0.5,
  },
  metricValue: {
    ...Typography.bodyBold,
    color: Colors.ink,
    fontSize: 15,
    marginTop: 2,
  },
  feedText: {
    ...Typography.body,
    color: Colors.success,
    fontWeight: '600',
    fontSize: 13,
    marginTop: 2,
  },
  feedTextUnavailable: {
    ...Typography.caption,
    color: Colors.ash,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
