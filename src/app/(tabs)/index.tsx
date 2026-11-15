import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { Card, Button, Badge } from '@/components';
import { useApp } from '@/application/state/AppContext';

export default function HomeScreen() {
  const { activeFamily } = useApp();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Badge label="CANASTA ACTIVA" variant="primary" />
          <Text style={styles.title}>Planificador Avícola</Text>
          <Text style={styles.subtitle}>
            Familia: {activeFamily ? activeFamily.name : 'Ninguna seleccionada'}
          </Text>
        </View>

        <Card variant="obsidian" style={styles.dashboardCard}>
          <Text style={styles.obsidianTitle}>Bienvenido al Sistema</Text>
          <Text style={styles.obsidianText}>
            Base de diseño Violet UI Studio & Agritech implementada con tokens y contratos oficiales.
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
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    marginTop: Spacing.xs,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: 2,
  },
  dashboardCard: {
    padding: Spacing.xl,
    marginVertical: Spacing.md,
  },
  obsidianTitle: {
    ...Typography.h2,
    color: Colors.paper,
    marginBottom: Spacing.sm,
  },
  obsidianText: {
    ...Typography.body,
    color: Colors.ash,
  },
});

