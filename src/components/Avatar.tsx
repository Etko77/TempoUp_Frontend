import React from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  uri?: string | null;
  name: string;
  size?: number;
}

export function Avatar({ uri, name, size = 48 }: Props) {
  const { colors } = useTheme();
  const initials = name
    .split(/\s+/)
    .map((s) => s.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: size * 0.4 }}>{initials}</Text>
    </View>
  );
}
