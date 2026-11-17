import { useApp } from '@/application/state/AppContext';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

interface ProteinGaugeProps {
  proteinGrams: number;
  foodName?: string;
  portionDescription?: string;
  maxScale?: number; // Valor tope de referencia visual (ej. 60g)
}

// Geometría del medidor semicircular
const SIZE = 200;
const STROKE_WIDTH = 18;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CENTER = SIZE / 2;
const HEIGHT = CENTER + STROKE_WIDTH / 2 + 4;
const ARC_PATH = `M ${STROKE_WIDTH / 2} ${CENTER} A ${RADIUS} ${RADIUS} 0 0 1 ${
  SIZE - STROKE_WIDTH / 2
} ${CENTER}`;
const ARC_LENGTH = Math.PI * RADIUS;

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const ProteinGauge: React.FC<ProteinGaugeProps> = ({
  proteinGrams,
  foodName,
  portionDescription,
  maxScale = 60,
}) => {
  const { reduceMotion } = useApp();
  const progress = useSharedValue(0);

  // Proporción respecto a la escala máxima visual
  const targetPercent = Math.min(Math.max(proteinGrams / maxScale, 0), 1);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = targetPercent;
      return;
    }
    progress.value = withTiming(targetPercent, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetPercent, reduceMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: ARC_LENGTH * (1 - progress.value),
  }));

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={`Aporte de proteína estimado: ${proteinGrams.toFixed(1)} gramos de proteína.`}
    >
      <View style={styles.headerRow}>
        <Text style={styles.label}>PROTEÍNA ESTIMADA APORTADA</Text>
        {foodName && (
          <Text style={styles.foodText}>
            {foodName} {portionDescription ? `(${portionDescription})` : ''}
          </Text>
        )}
      </View>

      <View style={styles.gaugeWrap}>
        <Svg width={SIZE} height={HEIGHT} viewBox={`0 0 ${SIZE} ${HEIGHT}`}>
          <Path
            d={ARC_PATH}
            stroke={Colors.boneDark}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
          />
          <AnimatedPath
            d={ARC_PATH}
            stroke={Colors.primary}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={ARC_LENGTH}
            animatedProps={animatedProps}
          />
        </Svg>

        <View style={styles.valueCenter} pointerEvents="none">
          <View style={styles.valueRow}>
            <Text style={styles.valueNumber}>{proteinGrams.toFixed(1)}</Text>
            <Text style={styles.valueUnit}>g</Text>
          </View>
        </View>
      </View>

      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>0 g</Text>
        <Text style={styles.scaleText}>{maxScale} g+</Text>
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
    marginBottom: Spacing.md,
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
  gaugeWrap: {
    width: SIZE,
    height: HEIGHT,
    alignSelf: 'center',
  },
  valueCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    alignItems: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueNumber: {
    ...Typography.numberDisplay,
    fontSize: 36,
    lineHeight: 40,
    color: Colors.ink,
  },
  valueUnit: {
    ...Typography.bodyBold,
    color: Colors.ash,
    fontSize: 16,
    marginLeft: 3,
  },
  scaleRow: {
    width: SIZE,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  scaleText: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.ash,
  },
});
