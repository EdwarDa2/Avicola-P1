import { useApp } from '@/application/state/AppContext';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

interface AnimatedCounterProps {
  label: string;
  ageRange: string;
  count: number;
  onChange: (newCount: number) => void;
  min?: number;
  max?: number;
  isSpecialChildGroup?: boolean;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  label,
  ageRange,
  count,
  onChange,
  min = 0,
  max = 99,
  isSpecialChildGroup = false,
}) => {
  const { reduceMotion } = useApp();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      return;
    }
    // Animación sutil de pulso al cambiar el contador
    scale.value = 1.25;
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, [count, reduceMotion]);

  const animatedNumberStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleDecrement = () => {
    if (count > min) {
      onChange(count - 1);
    }
  };

  const handleIncrement = () => {
    if (count < max) {
      onChange(count + 1);
    }
  };

  const canDecrement = count > min;
  const canIncrement = count < max;

  return (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.ageRange}>{ageRange}</Text>
        {isSpecialChildGroup && (
          <Text style={styles.specialNote}>
            La porción queda a criterio de la familia.
          </Text>
        )}
      </View>

      <View style={styles.controlsRow}>
        <Pressable
          onPress={handleDecrement}
          disabled={!canDecrement}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Disminuir ${label}`}
          accessibilityHint={`Valor actual: ${count}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.circleButton,
            !canDecrement && styles.buttonDisabled,
            pressed && canDecrement && styles.buttonPressed,
          ]}
        >
          <Ionicons
            name="remove"
            size={22}
            color={canDecrement ? Colors.ink : Colors.disabled}
          />
        </Pressable>

        <View style={styles.numberWrapper} accessible={true} accessibilityLabel={`${count} integrantes`}>
          <Animated.Text style={[styles.numberText, animatedNumberStyle]}>
            {count}
          </Animated.Text>
        </View>

        <Pressable
          onPress={handleIncrement}
          disabled={!canIncrement}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label}`}
          accessibilityHint={`Valor actual: ${count}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.circleButton,
            styles.incrementButton,
            !canIncrement && styles.buttonDisabled,
            pressed && canIncrement && styles.buttonPressed,
          ]}
        >
          <Ionicons
            name="add"
            size={22}
            color={canIncrement ? Colors.ink : Colors.disabled}
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.paper,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  infoContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  label: {
    ...Typography.bodyBold,
    color: Colors.ink,
    fontSize: 16,
  },
  ageRange: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: 2,
  },
  specialNote: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.ash,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleButton: {
    width: 44, // 44dp + hitSlop para accesibilidad táctil
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bone,
    borderWidth: 1,
    borderColor: Colors.hairline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incrementButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  buttonDisabled: {
    opacity: 0.35,
    backgroundColor: Colors.boneDark,
    borderColor: Colors.hairline,
  },
  buttonPressed: {
    transform: [{ scale: 0.92 }],
  },
  numberWrapper: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    ...Typography.numberDisplay,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.ink,
  },
});

