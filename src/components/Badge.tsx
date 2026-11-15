import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'obsidian'
  | 'muted'
  | 'warning'
  | 'danger'
  | 'outline';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'muted',
  icon,
  style,
  textStyle,
  size = 'md',
}) => {
  const isSmall = size === 'sm';

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: Colors.primary,
          borderColor: Colors.primaryDark,
        };
      case 'success':
        return {
          backgroundColor: Colors.successLight,
          borderColor: Colors.success,
        };
      case 'obsidian':
        return {
          backgroundColor: Colors.obsidian,
          borderColor: Colors.obsidianLight,
        };
      case 'warning':
        return {
          backgroundColor: Colors.warningLight,
          borderColor: Colors.warning,
        };
      case 'danger':
        return {
          backgroundColor: Colors.dangerLight,
          borderColor: Colors.danger,
        };
      case 'outline':
        return {
          backgroundColor: Colors.paper,
          borderColor: Colors.hairline,
        };
      case 'muted':
      default:
        return {
          backgroundColor: Colors.boneDark,
          borderColor: Colors.hairline,
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return { color: Colors.ink, fontWeight: '700' };
      case 'success':
        return { color: Colors.success, fontWeight: '700' };
      case 'obsidian':
        return { color: Colors.primary, fontWeight: '700' };
      case 'warning':
        return { color: Colors.warning, fontWeight: '700' };
      case 'danger':
        return { color: Colors.danger, fontWeight: '700' };
      case 'outline':
        return { color: Colors.ink, fontWeight: '600' };
      case 'muted':
      default:
        return { color: Colors.textMuted, fontWeight: '600' };
    }
  };

  return (
    <View
      style={[
        styles.base,
        isSmall ? styles.smallContainer : styles.mediumContainer,
        getContainerStyle(),
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.text,
          isSmall ? styles.smallText : styles.mediumText,
          getTextStyle(),
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  smallContainer: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
  },
  mediumContainer: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    ...Typography.captionBold,
    letterSpacing: 0.3,
  },
  smallText: {
    fontSize: 11,
    lineHeight: 14,
  },
  mediumText: {
    fontSize: 12,
    lineHeight: 16,
  },
});

