import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/application/state/AppContext';

interface ProteinBarProps {
  proteinGrams: number;
  foodName?: string;
  portionDescription?: string;
  maxScale?: number; // Valor tope de referencia visual (ej. 60g)
}

export const ProteinBar: React.FC<ProteinBarProps> = ({
  proteinGrams,
  foodName,
  portionDescription,
  maxScale = 60,
}) => {
  const { reduceMotion } = useApp();
  const widthPercent = useSharedValue(0);

  // Calcula el porcentaje respecto a la escala máxima visual
  const targetPercent = Math.min(Math.max((proteinGrams / maxScale) * 100, 0), 100);

  useEffect(() => {
    if (reduceMotion) {
      widthPercent.value = targetPercent;
      return;
    }
    widthPercent.value = withTiming(targetPercent, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetPercent, reduceMotion]);

  const animatedBarStyle = useAnimatedStyle(() => {
    return {
      width: `${widthPercent.value}%`,
    };
  });

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={`Aporte de proteína estimado: ${proteinGrams.toFixed(1)} gramos de proteína.`}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.label}>PROTEÍNA ESTIMADA APORTADA</Text>
          {foodName && (
            <Text style={styles.foodText}>
              {foodName} {portionDescription ? `(${portionDescription})` : ''}
            </Text>
          )}
        </View>

        <View style={styles.valueRow}>
          <Text style={styles.valueNumber}>{proteinGrams.toFixed(1)}</Text>
          <Text style={styles.valueUnit}>g</Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View style={styles.track}>
        <Animated.View style={[styles.bar, animatedBarStyle]} />
      </View>

      {/* Marcadores informativos de escala */}
      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>0g</Text>
        <Text style={styles.scaleText}>15g</Text>
        <Text style={styles.scaleText}>30g</Text>
        <Text style={styles.scaleText}>45g</Text>
        <Text style={styles.scaleText}>{maxScale}g+</Text>
      </View>

      {/* Nota obligatoria de trazabilidad y salud (D-07, RF-43) */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          Aporte aproximado según tablas de composición. La escala es meramente
          ilustrativa y no constituye una meta universal ni sustituye una evaluación
          nutricional individual (D-07).
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.paper,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  titleCol: {
    flex: 1,
  },
  label: {
    ...Typography.captionBold,
    fontSize: 11,
    color: Colors.ash,
    letterSpacing: 0.5,
  },
  foodText: {
    ...Typography.bodyBold,
    color: Colors.ink,
    fontSize: 15,
    marginTop: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: Spacing.md,
  },
  valueNumber: {
    ...Typography.numberDisplay,
    fontSize: 32,
    lineHeight: 36,
    color: Colors.ink,
  },
  valueUnit: {
    ...Typography.bodyBold,
    color: Colors.ash,
    fontSize: 16,
    marginLeft: 3,
  },
  track: {
    height: 14,
    backgroundColor: Colors.boneDark,
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  bar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 7,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: Spacing.md,
  },
  scaleText: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.ash,
  },
  disclaimerBox: {
    backgroundColor: Colors.bone,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  disclaimerText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.ash,
    lineHeight: 15,
  },
});

