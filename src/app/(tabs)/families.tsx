import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { Card } from '@/components';

export default function FamiliesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Familias</Text>
        <Text style={styles.subtitle}>Gestión de perfiles familiares y grupos de edad</Text>
        <Card style={styles.card}>
          <Text style={styles.cardText}>Módulo M01 preparado para la siguiente rama.</Text>
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

