import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Screen } from '@/components/Screen';
import { Loading } from '@/components/Loading';
import { useTheme } from '@/theme/ThemeContext';
import { api } from '@/api/endpoints';
import type { SportResponse } from '@/types/api';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const SPORT_ICONS: Record<string, IconName> = {
  Gym: 'dumbbell',
  Weightlifting: 'weight-lifter',
  Running: 'run-fast',
  Tennis: 'tennis',
  Climbing: 'carabiner',
  Skiing: 'ski',
  Football: 'soccer',
  Basketball: 'basketball',
  Cycling: 'bike',
  Yoga: 'yoga',
  Swimming: 'swim',
  Boxing: 'boxing-glove',
  Padel: 'racquetball',
  Hiking: 'hiking',
  Rowing: 'rowing',
  Pilates: 'meditation',
};

export function BrowseScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const navigation = useNavigation<NativeStackScreenProps<MainStackParamList>['navigation']>();
  const [sports, setSports] = useState<SportResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setSports(await api.sports.list());
    } catch {
      // keep whatever we had
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.sm }}>
        <Text style={[typography.h2, { color: colors.primaryDeep }]}>Browse by sport</Text>
        <Text style={{ color: colors.textSecondary }}>Pick a sport to meet people who train it.</Text>
      </View>

      {loading ? (
        <Loading label="Loading sports…" />
      ) : (
        <FlatList
          data={sports}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('SportDiscovery', { sportId: item.id, sportName: item.name })}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 84,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radius.lg,
                paddingHorizontal: spacing.lg,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: radius.md,
                  backgroundColor: colors.primaryMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.lg,
                }}
              >
                <MaterialCommunityIcons name={SPORT_ICONS[item.name] ?? 'run'} size={30} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.h3, { color: colors.text }]}>{item.name}</Text>
                {item.description ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <Text style={{ color: colors.primary, fontWeight: '700', marginLeft: spacing.sm }}>Explore ›</Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
