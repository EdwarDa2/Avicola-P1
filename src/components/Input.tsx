import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  prefix?: string;
  suffix?: string;
  containerStyle?: ViewStyle;
  labelContainerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  prefix,
  suffix,
  containerStyle,
  labelContainerStyle,
  inputStyle,
  required = false,
  ...restProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const isDisabled = restProps.editable === false;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={[styles.labelRow, labelContainerStyle]}>
          <Text style={[styles.label, isDisabled && styles.labelDisabled]}>
            {label}
            {required && <Text style={styles.requiredAsterisk}> *</Text>}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          isDisabled && styles.inputContainerDisabled,
          isFocused && !isDisabled && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        {prefix && <Text style={styles.affix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, isDisabled && styles.inputDisabled, inputStyle]}
          placeholderTextColor={Colors.ash}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={label}
          accessibilityHint={helperText}
          {...restProps}
        />
        {suffix && <Text style={styles.affix}>{suffix}</Text>}
      </View>

      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Colors.ink,
  },
  labelDisabled: {
    color: Colors.ash,
  },
  requiredAsterisk: {
    color: Colors.danger,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.paper,
    borderWidth: 1.5,
    borderColor: Colors.hairline,
    borderRadius: BorderRadius.md,
    minHeight: 48, // Cumple accesibilidad táctil de 48dp
    paddingHorizontal: Spacing.md,
  },
  inputContainerDisabled: {
    backgroundColor: Colors.bone,
    borderColor: Colors.boneDark,
  },
  inputFocused: {
    borderColor: Colors.ink,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.ink,
    minHeight: 44,
  },
  inputDisabled: {
    color: Colors.ash,
  },
  affix: {
    ...Typography.bodyBold,
    color: Colors.ash,
    marginHorizontal: Spacing.xs,
  },
  errorText: {
    ...Typography.captionBold,
    color: Colors.danger,
    marginTop: 4,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.ash,
    marginTop: 4,
  },
});

