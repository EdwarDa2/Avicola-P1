import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { Header, Card, Badge } from '@/components';
import { PRODUCT_LIST } from '@/domain/calculators/scenarios';
import { ProductCode } from '@/types';
import { useApp } from '@/application/state/AppContext';

export default function SelectProductScreen() {
  const router = useRouter();
  const { activeFamily } = useApp();

  const handleSelectProduct = (code: ProductCode) => {
    // En la siguiente rama se conectará con el wizard completo: consume -> scenario -> result
    router.push(`/history` as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Nuevo Plan"
        subtitle={`Familia: ${activeFamily ? activeFamily.name : 'No seleccionada'}`}
        showBack={true}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.stepIndicator}>
          <Badge label="PASO 1 DE 4" variant="primary" size="sm" />
          <Text style={styles.stepTitle}>Selecciona el producto a planificar</Text>
          <Text style={styles.stepSubtitle}>
            Cada producto tiene su propio modelo matemático oficial para autoconsumo.
          </Text>
        </View>

        {PRODUCT_LIST.map((prod) => (
          <Pressable
            key={prod.code}
            onPress={() => handleSelectProduct(prod.code)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Planificar ${prod.name}. ${prod.description}`}
            style={({ pressed }) => [styles.productCard, { opacity: pressed ? 0.92 : 1 }]}
          >
            <View style={[styles.colorStrip, { backgroundColor: prod.color }]} />
            <View style={styles.cardContent}>
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={styles.productSpecies}>{prod.species}</Text>
                  <Text style={styles.productName}>{prod.name}</Text>
                </View>
                <View style={[styles.iconCircle, { backgroundColor: Colors.bone }]}>
                  <Ionicons
                    name={prod.purpose === 'eggs' ? 'egg-outline' : 'restaurant-outline'}
                    size={24}
                    color={prod.color}
                  />
                </View>
              </View>

              <Text style={styles.productDesc}>{prod.description}</Text>

              <View style={styles.cardBottomRow}>
                <Badge
                  label={`Unidad: ${prod.unit} / ${prod.periodUnit}`}
                  variant="muted"
                  size="sm"
                />
                {prod.hasBreedingOption && (
                  <Badge label="Reproducción opcional" variant="primary" size="sm" />
                )}
                {prod.hasLotsOption && (
                  <Badge label="Lotes opcionales" variant="outline" size="sm" />
                )}
              </View>
            </View>
          </Pressable>
        ))}
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
  stepIndicator: {
    marginBottom: Spacing.lg,
  },
  stepTitle: {
    ...Typography.h2,
    color: Colors.ink,
    marginTop: Spacing.xs,
  },
  stepSubtitle: {
    ...Typography.caption,
    color: Colors.ash,
    lineHeight: 18,
    marginTop: 2,
  },
  productCard: {
    backgroundColor: Colors.paper,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.hairline,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  colorStrip: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: Spacing.lg,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  productSpecies: {
    ...Typography.captionBold,
    color: Colors.ash,
    fontSize: 11,
    fontStyle: 'italic',
  },
  productName: {
    ...Typography.h3,
    color: Colors.ink,
    fontSize: 18,
    marginTop: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDesc: {
    ...Typography.body,
    color: Colors.ash,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  cardBottomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
});
