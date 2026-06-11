import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textColor?: string;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style, textColor }: Props) {
  const { colors, radius, spacing, typography } = useTheme();

  const bg =
    variant === 'primary' ? colors.primary
    : variant === 'secondary' ? colors.primaryMuted
    : variant === 'danger' ? colors.danger
    : 'transparent';

  const fg = textColor ?? (
    variant === 'primary' ? colors.textInverse
    : variant === 'secondary' ? colors.primary
    : variant === 'danger' ? '#FFFFFF'
    : colors.primary);

  const borderColor = variant === 'outline' ? colors.primary : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          opacity: (disabled || loading) ? 0.6 : (pressed ? 0.85 : 1),
        },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={fg} />
        : <Text style={[typography.bodyBold, { color: fg, textAlign: 'center' }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
});
