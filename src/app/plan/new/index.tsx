import { useApp } from '@/application/state/AppContext';
import { Header } from '@/components';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { PRODUCT_LIST } from '@/domain/calculators/scenarios';
import { ProductCode } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SelectProductScreen() {
  const router = useRouter();
  const { activeFamily } = useApp();
  const productGroups = [
    { title: 'Huevos', products: PRODUCT_LIST.filter((product) => product.purpose === 'eggs') },
    { title: 'Carne', products: PRODUCT_LIST.filter((product) => product.purpose === 'meat') },
  ];

  const handleSelectProduct = (code: ProductCode) => {
    router.push(`/plan/create?product=${code}` as any);
  };

  const getUnitLabel = (product: (typeof PRODUCT_LIST)[number]) =>
    product.purpose === 'eggs'
      ? `Huevos por ${product.periodUnit}`
      : `kg de carne cocida por ${product.periodUnit}`;

  const getOptionLabel = (product: (typeof PRODUCT_LIST)[number]) => {
    if (product.hasBreedingOption) return 'Reproducción opcional';
    if (product.hasLotsOption) return 'Organización por lotes';
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Planificar"
        subtitle={activeFamily ? `Familia: ${activeFamily.name}` : 'Sin familia seleccionada'}
        showBack={true}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.intro}>
          <Text style={styles.title}>¿Qué quieres planificar?</Text>
          <Text style={styles.subtitle}>Elige un producto para continuar.</Text>
        </View>

        {productGroups.map((group) => (
          <View key={group.title} style={styles.productGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>

            {group.products.map((prod) => {
              const optionLabel = getOptionLabel(prod);

              return (
                <Pressable
                  key={prod.code}
                  onPress={() => handleSelectProduct(prod.code)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Planificar ${prod.name}. ${prod.description}`}
                  style={({ pressed }) => [
                    styles.productCard,
                    { opacity: pressed ? 0.72 : 1 },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.productIcon}>
                      <Ionicons
                        name={prod.purpose === 'eggs' ? 'egg-outline' : 'restaurant-outline'}
                        size={19}
                        color={Colors.ink}
                      />
                    </View>
                    <View style={styles.productHeading}>
                      <Text style={styles.productName}>{prod.name}</Text>
                      <Text style={styles.productSpecies}>{prod.species}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.ash} />
                  </View>

                  <Text style={styles.productDescription}>{prod.description}</Text>

                  <View style={styles.productDetails}>
                    <Text style={styles.productUnit}>{getUnitLabel(prod)}</Text>
                    {optionLabel && (
                      <>
                        <View style={styles.detailSeparator} />
                        <Text style={styles.productOption}>{optionLabel}</Text>
                      </>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
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
  intro: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.ash,
    marginTop: Spacing.xs,
  },
  productGroup: {
    marginBottom: Spacing.lg,
  },
  groupTitle: {
    ...Typography.h3,
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  productCard: {
    backgroundColor: Colors.paper,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productHeading: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  productName: {
    ...Typography.bodyBold,
    color: Colors.ink,
  },
  productSpecies: {
    ...Typography.caption,
    color: Colors.ash,
    fontSize: 11,
    marginTop: 1,
  },
  productDescription: {
    ...Typography.caption,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: Spacing.md,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
  },
  productUnit: {
    ...Typography.captionBold,
    color: Colors.ink,
  },
  detailSeparator: {
    width: 3,
    height: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.ash,
    marginHorizontal: Spacing.sm,
  },
  productOption: {
    ...Typography.caption,
    color: Colors.ash,
  },
});
