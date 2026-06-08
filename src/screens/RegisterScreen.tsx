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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { colors, spacing, typography } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register({
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={{ marginBottom: spacing.xxl }}>
          <Text style={[typography.h1, { color: colors.primaryDeep, marginBottom: spacing.xs }]}>
            Create account
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            One quick step to start finding partners.
          </Text>
        </View>

        <TextField label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="e.g. Martin R." />
        <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />

        {error ? <Text style={{ color: colors.danger, marginBottom: spacing.md }}>{error}</Text> : null}

        <Button title="Create account" onPress={submit} loading={loading} />

        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: spacing.lg, alignItems: 'center' }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Already have an account? Sign in</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
