import React, { ReactNode } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  keyboard?: boolean;
  surface?: boolean;
  padded?: boolean;
  /** Apply the top safe-area inset. Disable on screens that already sit under a native header. */
  topInset?: boolean;
}

export function Screen({ children, style, keyboard, surface, padded = true, topInset = true }: Props) {
  const { colors, spacing, themeName } = useTheme();
  const bg = surface ? colors.surface : colors.background;
  const edges: Edge[] = topInset ? ['top', 'left', 'right'] : ['left', 'right'];

  const content = (
    <View style={[styles.flex, { backgroundColor: bg, padding: padded ? spacing.lg : 0 }, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: bg }]} edges={edges}>
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
