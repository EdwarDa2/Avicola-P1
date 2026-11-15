import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { Card } from '@/components';

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Mis Planes</Text>
        <Text style={styles.subtitle}>Historial de planes calculados y activos</Text>
        <Card style={styles.card}>
          <Text style={styles.cardText}>Módulo M05 preparado para la siguiente rama.</Text>
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
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
  },
  cardText: {
    ...Typography.body,
    color: Colors.ink,
  },
});

