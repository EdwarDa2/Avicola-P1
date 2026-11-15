import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'obsidian' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const getContainerStyle = (pressed: boolean): ViewStyle => {
    let base: ViewStyle = {
      ...styles.base,
      opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
      ...(fullWidth ? { alignSelf: 'stretch' } : {}),
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          backgroundColor: Colors.primary,
          borderColor: Colors.primaryDark,
        };
      case 'obsidian':
        return {
          ...base,
          backgroundColor: Colors.obsidian,
          borderColor: Colors.obsidianLight,
        };
      case 'secondary':
        return {
          ...base,
          backgroundColor: Colors.paper,
          borderColor: Colors.hairline,
          borderWidth: 1.5,
        };
      case 'danger':
        return {
          ...base,
          backgroundColor: Colors.dangerLight,
          borderColor: Colors.danger,
          borderWidth: 1.5,
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      default:
        return base;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return { ...styles.text, color: Colors.ink, fontWeight: '700' };
      case 'obsidian':
        return { ...styles.text, color: Colors.paper, fontWeight: '700' };
      case 'secondary':
        return { ...styles.text, color: Colors.ink, fontWeight: '600' };
      case 'danger':
        return { ...styles.text, color: Colors.danger, fontWeight: '700' };
      case 'ghost':
        return { ...styles.text, color: Colors.ink, fontWeight: '600' };
      default:
        return styles.text;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [getContainerStyle(pressed), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'obsidian' ? Colors.paper : Colors.ink}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48, // Cumple accesibilidad táctil de 48dp
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  text: {
    ...Typography.bodyBold,
    fontSize: 16,
    textAlign: 'center',
  },
});

