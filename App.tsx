import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Polyfill global TextEncoder/TextDecoder — React Native's Hermes engine does not
// provide TextDecoder, which @stomp/stompjs constructs in its frame parser. Without
// this, the STOMP connection throws on WebSocket open and chat sends fail silently.
import 'text-encoding';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeContext';
import { AuthProvider } from '@/auth/AuthContext';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
