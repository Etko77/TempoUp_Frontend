import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/auth/AuthContext';
import { useTheme } from '@/theme/ThemeContext';
import { ApiError } from '@/api/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { colors, spacing, typography } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not sign in';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={{ marginBottom: spacing.xxl }}>
          <Text style={[typography.h1, { color: colors.primaryDeep, marginBottom: spacing.xs }]}>
            TempoUp
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Find your sport partner.
          </Text>
        </View>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="you@example.com"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          placeholder="Your password"
        />
        {error ? (
          <Text style={{ color: colors.danger, marginBottom: spacing.md }}>{error}</Text>
        ) : null}

        <Button title="Sign in" onPress={submit} loading={loading} />

        <Pressable
          onPress={() => navigation.navigate('Register')}
          style={{ marginTop: spacing.lg, alignItems: 'center' }}
        >
          <Text style={{ color: colors.primary, fontWeight: '600' }}>
            New here? Create an account
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
