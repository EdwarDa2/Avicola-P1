import { Button, Card, Header, Input, ProteinBar } from '@/components';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { calculateProteinGrams } from '@/domain/calculators';
import { NUTRIENT_REFERENCES, PRODUCTS } from '@/domain/calculators/scenarios';
import { ProductCode } from '@/types';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NutrientsScreen() {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<ProductCode>('hen_eggs');
  const [portionAmount, setPortionAmount] = useState<string>('2'); // 2 huevos por defecto

  const currentProduct = PRODUCTS[selectedProduct];
  const nutrientRef = NUTRIENT_REFERENCES[selectedProduct];

  const amountNum = Math.max(0, parseFloat(portionAmount) || 0);
  const proteinGrams = calculateProteinGrams(selectedProduct, amountNum);

  const productOptions: ProductCode[] = ['hen_eggs', 'chicken_meat', 'quail_eggs', 'quail_meat'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Aporte Nutricional"
        subtitle="MÓDULO M08 · Informativo (D-07)"
        showBack={true}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Selector de Alimento */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Seleccionar alimento</Text>
          <View style={styles.optionsGrid}>
            {productOptions.map((code) => {
              const isSelected = selectedProduct === code;
              const prod = PRODUCTS[code];
              return (
                <Button
                  key={code}
                  title={prod.shortName}
                  onPress={() => {
                    setSelectedProduct(code);
                    if (code === 'hen_eggs') setPortionAmount('2');
                    else if (code === 'quail_eggs') setPortionAmount('5');
                    else setPortionAmount('100'); // 100g para carne
                  }}
                  variant={isSelected ? 'primary' : 'secondary'}
                  style={styles.optionButton}
                />
              );
            })}
          </View>
        </Card>

        {/* Captura de Porción */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Cantidad por persona</Text>
          <Text style={styles.sectionSubtitle}>
            {selectedProduct === 'hen_eggs' || selectedProduct === 'quail_eggs'
              ? 'Introduce el número de piezas de huevo consumidas en una ocasión.'
              : 'Introduce los gramos de carne cocida comestible consumidos en una ocasión.'}
          </Text>

          <Input
            label="Porción en la ocasión"
            value={portionAmount}
            onChangeText={setPortionAmount}
            keyboardType="numeric"
            suffix={selectedProduct === 'hen_eggs' || selectedProduct === 'quail_eggs' ? 'piezas' : 'g cocidos'}
          />
        </Card>

        {/* Barra de Proteína Animada (RF-51 & D-07) */}
        <ProteinBar
          proteinGrams={proteinGrams}
          foodName={nutrientRef.foodName}
          portionDescription={`${amountNum} ${selectedProduct === 'hen_eggs' || selectedProduct === 'quail_eggs' ? 'unidades' : 'g'}`}
          maxScale={60}
        />

        {/* Tarjeta de Trazabilidad Nutricional */}
        <Card variant="obsidian" style={styles.refCard}>
          <Text style={styles.refTitle}>VALOR DE REFERENCIA DE COMPOSICIÓN</Text>
          <Text style={styles.refValue}>
            {nutrientRef.proteinPerBasis} g de proteína {nutrientRef.basisDescription}
          </Text>
          <Text style={styles.refSource}>Fuente documentada: {nutrientRef.source}</Text>
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    minHeight: 44,
  },
  refCard: {
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  refTitle: {
    ...Typography.captionBold,
    color: Colors.primary,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  refValue: {
    ...Typography.bodyBold,
    color: Colors.paper,
    fontSize: 16,
    marginVertical: 4,
  },
  refSource: {
    ...Typography.caption,
    color: Colors.textLightMuted,
    fontSize: 12,
  },
});
