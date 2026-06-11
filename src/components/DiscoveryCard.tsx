import React from 'react';
import { View, Text, Image } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Chip } from '@/components/Chip';
import { useTheme } from '@/theme/ThemeContext';
import type { DiscoveryCandidate } from '@/types/api';

export function DiscoveryCardInner({
  candidate,
  selfPreview = false,
}: {
  candidate: DiscoveryCandidate;
  selfPreview?: boolean;
}) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'space-between' }}>
      <View style={{ alignItems: 'center' }}>
        {candidate.photoUrl ? (
          <Image
            source={{ uri: candidate.photoUrl }}
            style={{ width: '100%', height: 320, borderRadius: 16 }}
            resizeMode="cover"
          />
        ) : (
          <Avatar uri={candidate.photoUrl} name={candidate.displayName} size={140} />
        )}
        <Text style={[typography.h2, { color: colors.text, marginTop: spacing.lg }]}>
          {candidate.displayName}
        </Text>
        {candidate.city ? (
          <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
            {candidate.city}{candidate.distanceKm != null ? ` · ${candidate.distanceKm.toFixed(1)} km away` : ''}
          </Text>
        ) : null}
      </View>

      {candidate.bio ? (
        <Text style={[typography.body, { color: colors.text, marginVertical: spacing.lg, textAlign: 'center' }]} numberOfLines={4}>
          {candidate.bio}
        </Text>
      ) : null}

      {candidate.sharedSportNames.length > 0 ? (
        <View style={{ marginBottom: spacing.md }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: spacing.sm }}>
            {selfPreview ? 'My sports' : 'Sports in common'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {candidate.sharedSportNames.map((n) => (
              <Chip key={n} label={n} selected />
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <Stat label={selfPreview ? 'Sports' : 'Shared sports'} value={candidate.sharedSports} />
        <Stat label={selfPreview ? 'Skills' : 'Shared skills'} value={candidate.sharedSkills} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const { colors, typography } = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[typography.h3, { color: colors.primary }]}>{value}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Text>
    </View>
  );
}
