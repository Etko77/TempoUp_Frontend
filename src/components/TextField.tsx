import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function TextField({ label, error, containerStyle, style, ...input }: Props) {
  const { colors, radius, spacing, typography } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ marginBottom: spacing.md }, containerStyle]}>
      {label
        ? <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}>{label}</Text>
        : null}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        {...input}
        onFocus={(e) => { setFocused(true); input.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); input.onBlur?.(e); }}
        style={[
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : (focused ? colors.primary : colors.border),
            borderWidth: 1.5,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            color: colors.text,
            fontSize: 15,
          },
          style,
        ]}
      />
      {error
        ? <Text style={[typography.small, { color: colors.danger, marginTop: spacing.xs }]}>{error}</Text>
        : null}
    </View>
  );
}
