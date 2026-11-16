import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface LotGridProps {
  birdsPerLot: number[];
  totalBirds: number;
}

export const LotGrid: React.FC<LotGridProps> = ({ birdsPerLot, totalBirds }) => {
  if (birdsPerLot.length === 0) return null;

  const largestLot = Math.max(...birdsPerLot, 1);

  return (
    <View>
      <View style={styles.grid}>
        {birdsPerLot.map((birds, index) => (
          <View key={`lot-${index}`} style={styles.tile}>
            <Text style={styles.tileIndex}>LOTE {String(index + 1).padStart(2, '0')}</Text>

            <View style={styles.tileFigure}>
              <Text style={styles.tileNumber}>{birds}</Text>
              <Text style={styles.tileUnit}>aves</Text>
            </View>

            <View style={styles.tileTrack}>
              <View
                style={[styles.tileFill, { width: `${Math.round((birds / largestLot) * 100)}%` }]}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerBadge}>
          <Ionicons name="checkmark" size={13} color={Colors.ink} />
        </View>
        <Text style={styles.footerText}>
          Suma exacta verificada: {totalBirds} aves
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  tile: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Colors.paper,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  tileIndex: {
    ...Typography.captionBold,
    fontSize: 10,
    color: Colors.ash,
    letterSpacing: 0.8,
  },
  tileFigure: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  tileNumber: {
    ...Typography.numberDisplay,
    fontSize: 26,
    lineHeight: 32,
    color: Colors.ink,
  },
  tileUnit: {
    ...Typography.caption,
    color: Colors.ash,
    marginLeft: 4,
  },
  tileTrack: {
    height: 6,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.boneDark,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  tileFill: {
    height: '100%',
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.ink,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  footerBadge: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    ...Typography.caption,
    color: Colors.ash,
  },
});
