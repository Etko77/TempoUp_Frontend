import React, { ReactNode } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  keyboard?: boolean;
  surface?: boolean;
  padded?: boolean;
}

export function Screen({ children, style, keyboard, surface, padded = true }: Props) {
  const { colors, spacing, themeName } = useTheme();
  const bg = surface ? colors.surface : colors.background;

  const content = (
    <View style={[styles.flex, { backgroundColor: bg, padding: padded ? spacing.lg : 0 }, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: bg }]} edges={['top', 'left', 'right']}>
      <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
      {keyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
