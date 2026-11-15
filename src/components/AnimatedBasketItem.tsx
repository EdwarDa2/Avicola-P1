import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '@/constants/theme';
import { BasketItem } from '@/types';
import { useApp } from '@/application/state/AppContext';
import { Badge } from './Badge';

interface AnimatedBasketItemProps {
  item: BasketItem;
  onPress: () => void;
  onDeactivate?: () => void;
}

export const AnimatedBasketItem: React.FC<AnimatedBasketItemProps> = ({
  item,
  onPress,
  onDeactivate,
}) => {
  const { reduceMotion } = useApp();

  const enteringAnimation = reduceMotion ? undefined : FadeInDown.duration(350).springify();
  const exitingAnimation = reduceMotion ? undefined : FadeOutUp.duration(250);

  return (
    <Animated.View
      entering={enteringAnimation}
      exiting={exitingAnimation}
      style={styles.container}
    >
      <Pressable
        onPress={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Producto activo: ${item.productName}. Plan: ${item.planName}. Demanda: ${item.weeklyDemandText}. Aves: ${item.birdsSummaryText}.`}
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.94 : 1 }]}
      >
        {/* Barra superior de acento de color de especie */}
        <View style={[styles.accentStrip, { backgroundColor: item.accentColor }]} />

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.titleArea}>
              <Badge
                label="PLAN ACTIVO"
                variant="primary"
                size="sm"
                style={styles.badge}
              />
              <Text style={styles.productName}>{item.productName}</Text>
              <Text style={styles.planName} numberOfLines={1}>
                {item.planName} · {item.scenarioName}
              </Text>
            </View>

            {onDeactivate && (
              <Pressable
                onPress={onDeactivate}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Desactivar ${item.productName} de la canasta`}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.closeButton}
              >
                <Ionicons name="close-circle-outline" size={24} color={Colors.ash} />
              </Pressable>
            )}
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricColumn}>
              <Text style={styles.metricLabel}>DEMANDA PLANIFICADA</Text>
              <Text style={styles.metricValue}>{item.weeklyDemandText}</Text>
              {item.annualDemandText && (
                <Text style={styles.metricSecondary}>{item.annualDemandText}</Text>
              )}
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricColumn}>
              <Text style={styles.metricLabel}>AVES REQUERIDAS</Text>
              <Text style={styles.birdsValue}>{item.birdsSummaryText}</Text>
              {item.lotsSummary && (
                <Text style={styles.metricSecondary}>{item.lotsSummary}</Text>
              )}
              {item.breedingSummary && (
                <Text style={styles.metricSecondary}>{item.breedingSummary}</Text>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.paper,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  accentStrip: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  titleArea: {
    flex: 1,
  },
  badge: {
    marginBottom: Spacing.xs,
  },
  productName: {
    ...Typography.h3,
    color: Colors.ink,
    fontSize: 17,
  },
  planName: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
    marginLeft: Spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.bone,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  metricColumn: {
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.hairline,
    marginHorizontal: Spacing.md,
  },
  metricLabel: {
    ...Typography.captionBold,
    fontSize: 10,
    color: Colors.ash,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    ...Typography.bodyBold,
    color: Colors.ink,
    fontSize: 14,
  },
  birdsValue: {
    ...Typography.bodyBold,
    color: Colors.ink,
    fontSize: 14,
  },
  metricSecondary: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.ash,
    marginTop: 2,
  },
});

