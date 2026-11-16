import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '@/constants/theme';
import { BasketItem } from '@/types';
import { useApp } from '@/application/state/AppContext';

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

  const [birdsCount, ...birdsLabelParts] = item.birdsSummaryText.split(' ');
  const birdsLabel = birdsLabelParts.join(' ');

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
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleArea}>
            <Text style={styles.productName}>{item.productName}</Text>
            <Text style={styles.planMeta} numberOfLines={1}>
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
              style={({ pressed }) => [styles.closeButton, pressed && styles.cardPressed]}
            >
              <Ionicons name="close" size={18} color={Colors.textLightMuted} />
            </Pressable>
          )}
        </View>

        <View style={styles.figureRow}>
          <View style={styles.figureBlock}>
            <Text style={styles.figureNumber}>{birdsCount}</Text>
            <Text style={styles.figureLabel}>{birdsLabel}</Text>
          </View>

          <View style={styles.demandBlock}>
            <Text style={styles.demandValue}>{item.weeklyDemandText}</Text>
            {item.annualDemandText ? (
              <Text style={styles.demandSecondary}>{item.annualDemandText}</Text>
            ) : null}
          </View>
        </View>

        {(item.lotsSummary || item.breedingSummary) && (
          <View style={styles.notesRow}>
            {item.lotsSummary ? (
              <View style={styles.note}>
                <Ionicons name="grid-outline" size={14} color={Colors.primary} />
                <Text style={styles.noteText}>{item.lotsSummary}</Text>
              </View>
            ) : null}
            {item.breedingSummary ? (
              <View style={styles.note}>
                <Ionicons name="egg-outline" size={14} color={Colors.primary} />
                <Text style={styles.noteText}>{item.breedingSummary}</Text>
              </View>
            ) : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.obsidian,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.obsidianLight,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  cardPressed: {
    opacity: 0.94,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleArea: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  productName: {
    ...Typography.h3,
    color: Colors.paper,
    fontSize: 17,
  },
  planMeta: {
    ...Typography.caption,
    color: Colors.textLightMuted,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  figureRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  figureBlock: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  figureNumber: {
    ...Typography.numberDisplayLarge,
    color: Colors.primary,
    fontSize: 34,
    lineHeight: 38,
  },
  figureLabel: {
    ...Typography.caption,
    color: Colors.paper,
    marginTop: 2,
  },
  demandBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  demandValue: {
    ...Typography.bodyBold,
    color: Colors.paper,
    fontSize: 14,
  },
  demandSecondary: {
    ...Typography.caption,
    color: Colors.textLightMuted,
    fontSize: 11,
    marginTop: 2,
  },
  notesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.obsidianLight,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  noteText: {
    ...Typography.caption,
    color: Colors.textLightMuted,
    fontSize: 12,
  },
});
