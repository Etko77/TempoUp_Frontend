import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Chip } from '@/components/Chip';
import { Loading } from '@/components/Loading';
import { useTheme } from '@/theme/ThemeContext';
import { api } from '@/api/endpoints';
import { formatSkillData } from '@/utils/metrics';
import type { ProfileResponse, UserSportResponse } from '@/types/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'ProfileDetail'>;

export function ProfileDetailScreen({ route, navigation }: Props) {
  const { userId, displayName } = route.params;
  const { colors, spacing, radius, typography } = useTheme();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [sports, setSports] = useState<UserSportResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: displayName ?? 'Profile' });
  }, [navigation, displayName]);

  useEffect(() => {
    (async () => {
      const [p, s] = await Promise.all([
        api.profile.byUser(userId).catch(() => null),
        api.mySports.byUser(userId).catch(() => [] as UserSportResponse[]),
      ]);
      setProfile(p);
      setSports([...s].sort((a, b) => Number(b.priority) - Number(a.priority)));
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <Loading label="Loading profile…" />;

  const name = profile?.displayName ?? displayName ?? 'Athlete';

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          {profile?.photoUrl ? (
            <Image
              source={{ uri: profile.photoUrl }}
              style={{ width: '100%', height: 320, borderRadius: radius.xl }}
              resizeMode="cover"
            />
          ) : (
            <Avatar uri={null} name={name} size={140} />
          )}
          <Text style={[typography.h2, { color: colors.text, marginTop: spacing.lg }]}>{name}</Text>
          {profile?.city ? (
            <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{profile.city}</Text>
          ) : null}
          {profile?.bio ? (
            <Text style={[typography.body, { color: colors.text, textAlign: 'center', marginTop: spacing.md }]}>
              {profile.bio}
            </Text>
          ) : null}
        </View>

        <Text style={[typography.h3, { color: colors.primaryDeep, marginBottom: spacing.sm }]}>Sports</Text>

        {sports.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>No sports added yet.</Text>
        ) : (
          sports.map((sp) => (
            <View
              key={sp.sportId}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[typography.bodyBold, { color: colors.text, flex: 1 }]}>
                  {sp.sportName}
                  {sp.priority ? <Text style={{ color: colors.primary }}>   Priority</Text> : null}
                </Text>
                <Chip label={sp.proficiencyLevel.toLowerCase()} />
              </View>

              {sp.skills.length > 0 ? (
                <View style={{ marginTop: spacing.sm, gap: 6 }}>
                  {sp.skills.map((sk) => {
                    const data = formatSkillData(sk);
                    return (
                      <View key={sk.skillId} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {sk.starred ? <Text style={{ color: colors.warning, marginRight: 4 }}>★</Text> : null}
                        <Text style={{ color: colors.text, flex: 1 }}>{sk.name}</Text>
                        {data ? <Text style={{ color: colors.textSecondary }}>{data}</Text> : null}
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
