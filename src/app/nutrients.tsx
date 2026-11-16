import { Card, Header, Input, ProteinBar } from '@/components';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { calculateProteinGrams } from '@/domain/calculators';
import { NUTRIENT_REFERENCES, PRODUCTS } from '@/domain/calculators/scenarios';
import { ProductCode } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRODUCT_OPTIONS: ProductCode[] = ['hen_eggs', 'chicken_meat', 'quail_eggs', 'quail_meat'];

const DEFAULT_PORTIONS: Record<ProductCode, string> = {
  hen_eggs: '2',
  quail_eggs: '5',
  chicken_meat: '100',
  quail_meat: '100',
};

export default function NutrientsScreen() {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<ProductCode>('hen_eggs');
  const [portionAmount, setPortionAmount] = useState<string>(DEFAULT_PORTIONS.hen_eggs);

  const nutrientRef = NUTRIENT_REFERENCES[selectedProduct];
  const isEggProduct = PRODUCTS[selectedProduct].purpose === 'eggs';

  const amountNum = Math.max(0, parseFloat(portionAmount) || 0);
  const proteinGrams = calculateProteinGrams(selectedProduct, amountNum);

  const handleSelectProduct = (code: ProductCode) => {
    setSelectedProduct(code);
    setPortionAmount(DEFAULT_PORTIONS[code]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Aporte de proteína"
        subtitle="Informativo, por porción"
        showBack={true}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.intro}>
          <Text style={styles.title}>¿Cuánta proteína aporta una porción?</Text>
          <Text style={styles.subtitle}>
            Es una referencia del alimento, no una meta diaria.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Alimento</Text>
        <View style={styles.optionsRow}>
          {PRODUCT_OPTIONS.map((code) => {
            const isSelected = selectedProduct === code;
            const prod = PRODUCTS[code];

            return (
              <Pressable
                key={code}
                onPress={() => handleSelectProduct(code)}
                accessible={true}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Seleccionar ${prod.name}`}
                style={({ pressed }) => [
                  styles.optionChip,
                  isSelected && styles.optionChipSelected,
                  { opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <Ionicons
                  name={prod.purpose === 'eggs' ? 'egg-outline' : 'restaurant-outline'}
                  size={16}
                  color={isSelected ? Colors.ink : Colors.ash}
                />
                <Text
                  style={[styles.optionText, isSelected && styles.optionTextSelected]}
                  numberOfLines={1}
                >
                  {prod.shortName}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Card style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Cantidad por persona</Text>
          <Text style={styles.cardSubtitle}>
            {isEggProduct
              ? 'Piezas de huevo consumidas en una ocasión.'
              : 'Gramos de carne cocida consumidos en una ocasión.'}
          </Text>

          <Input
            label={isEggProduct ? 'Porción de huevo' : 'Porción de carne'}
            value={portionAmount}
            onChangeText={setPortionAmount}
            keyboardType="numeric"
            suffix={isEggProduct ? 'piezas' : 'g cocidos'}
          />
        </Card>

        <ProteinBar
          proteinGrams={proteinGrams}
          foodName={nutrientRef.foodName}
          portionDescription={`${amountNum} ${isEggProduct ? 'unidades' : 'g'}`}
          maxScale={60}
        />

        <Card variant="obsidian" style={styles.referenceCard}>
          <Text style={styles.referenceEyebrow}>VALOR DE REFERENCIA</Text>
          <Text style={styles.referenceValue}>
            {nutrientRef.proteinPerBasis} g de proteína {nutrientRef.basisDescription}
          </Text>
          <Text style={styles.referenceSource}>Fuente: {nutrientRef.source}</Text>
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
  sectionTitle: {
    ...Typography.h3,
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  optionChip: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.hairline,
    backgroundColor: Colors.paper,
  },
  optionChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  optionText: {
    ...Typography.captionBold,
    color: Colors.ash,
    flexShrink: 1,
  },
  optionTextSelected: {
    color: Colors.ink,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.bodyBold,
    color: Colors.ink,
  },
  cardSubtitle: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  referenceCard: {
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  referenceEyebrow: {
    ...Typography.captionBold,
    color: Colors.primary,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  referenceValue: {
    ...Typography.bodyBold,
    color: Colors.paper,
    fontSize: 16,
    marginVertical: Spacing.xs,
  },
  referenceSource: {
    ...Typography.caption,
    color: Colors.textLightMuted,
    fontSize: 11,
  },
});
