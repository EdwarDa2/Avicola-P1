import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable, AccessibilityRole } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '@/constants/theme';

export type CardVariant = 'paper' | 'obsidian' | 'highlight' | 'muted';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle | ViewStyle[] | undefined;
  onPress?: () => void;
  accessible?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'paper',
  style,
  onPress,
  accessible = true,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const getContainerStyle = (pressed: boolean = false): ViewStyle => {
    let base: ViewStyle = {
      ...styles.base,
      opacity: pressed ? 0.92 : 1,
      transform: [{ scale: pressed ? 0.99 : 1 }],
    };

    switch (variant) {
      case 'paper':
        return {
          ...base,
          ...Shadows.sm,
          backgroundColor: Colors.paper,
          borderColor: Colors.hairline,
          borderWidth: 1,
        };
      case 'obsidian':
        return {
          ...base,
          ...Shadows.md,
          backgroundColor: Colors.obsidian,
          borderColor: Colors.obsidianLight,
          borderWidth: 1,
        };
      case 'highlight':
        return {
          ...base,
          ...Shadows.sm,
          backgroundColor: Colors.paper,
          borderColor: Colors.accent,
          borderWidth: 1.5,
        };
      case 'muted':
        return {
          ...base,
          backgroundColor: Colors.boneDark,
          borderColor: Colors.hairline,
          borderWidth: 1,
        };
      default:
        return base;
    }
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessible={accessible}
        accessibilityRole={accessibilityRole || 'button'}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [getContainerStyle(pressed), style as ViewStyle]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={[getContainerStyle(), style as ViewStyle]}
    >
      {children}
    </View>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon,
  badge,
  variant = 'paper',
  style,
}) => {
  const isDark = variant === 'obsidian';

  return (
    <Card variant={variant} style={[styles.metricCard, style as ViewStyle]}>
      <View style={styles.metricHeader}>
        <View style={styles.metricTitleRow}>
          {icon && <View style={styles.metricIcon}>{icon}</View>}
          <Text
            style={[
              styles.metricTitle,
              { color: isDark ? Colors.textLightMuted : Colors.textMuted },
            ]}
          >
            {title}
          </Text>
        </View>
        {badge}
      </View>

      <View style={styles.metricValueRow}>
        <Text
          style={[
            styles.metricValue,
            { color: isDark ? Colors.primary : Colors.ink },
          ]}
        >
          {value}
        </Text>
        {unit && (
          <Text
            style={[
              styles.metricUnit,
              { color: isDark ? Colors.textLightMuted : Colors.accent },
            ]}
          >
            {unit}
          </Text>
        )}
      </View>

      {subtitle && (
        <Text
          style={[
            styles.metricSubtitle,
            { color: isDark ? Colors.textLightMuted : Colors.ash },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  metricCard: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    marginRight: Spacing.sm,
  },
  metricTitle: {
    ...Typography.captionBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValue: {
    ...Typography.numberDisplay,
  },
  metricUnit: {
    ...Typography.bodyBold,
    marginLeft: Spacing.xs,
  },
  metricSubtitle: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
});

