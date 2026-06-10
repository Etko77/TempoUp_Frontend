import React from 'react';
import { View, ActivityIndicator, Text, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  // Optional caption under spinner. 
  label?: string;
  size?: 'small' | 'large';
  style?: ViewStyle;
}

export function Loading({ label, size = 'large', style }: Props) {
  const { colors, spacing } = useTheme();
  return (
    <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }, style]}>
      <ActivityIndicator size={size} color={colors.primary} />
      {label ? (
        <Text style={{ marginTop: spacing.md, color: colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}
