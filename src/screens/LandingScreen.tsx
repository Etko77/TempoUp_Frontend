import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme/ThemeContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Landing'>;

const FEATURES: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; title: string; body: string }[] = [
  { icon: 'arm-flex', title: 'Find your tempo', body: 'Match with people who train the sports and skills you do.' },
  { icon: 'map-marker-radius', title: 'Partners nearby', body: 'Discover athletes around you, ranked by what you share.' },
  { icon: 'chat-processing', title: 'Match & chat', body: 'Like each other to unlock real-time messaging.' },
];

export function LandingScreen({ navigation }: Props) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.xl }}>
        <View style={{ alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: radius.xl,
              backgroundColor: colors.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <MaterialCommunityIcons name="arm-flex" size={52} color={colors.primary} />
          </View>
          <Text style={[typography.h1, { color: colors.primaryDeep }]}>TempoUp</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }]}>
            Find your sport partner.
          </Text>
        </View>

        <View style={{ flex: 1, gap: spacing.md }}>
          {FEATURES.map((f) => (
            <View
              key={f.title}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.lg,
              }}
            >
              <MaterialCommunityIcons name={f.icon} size={26} color={colors.primary} />
              <View style={{ marginLeft: spacing.md, flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.text }]}>{f.title}</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 2 }}>{f.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          <Button title="Create an account" onPress={() => navigation.navigate('Register')} />
          <Button title="Sign in" variant="outline" onPress={() => navigation.navigate('Login')} />
        </View>
      </ScrollView>
    </Screen>
  );
}
