import React from 'react';
import { View, Text, Image } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Chip } from '@/components/Chip';
import { useTheme } from '@/theme/ThemeContext';
import type { DiscoveryCandidate } from '@/types/api';

export function DiscoveryCardInner({
  candidate,
  selfPreview = false,
  bottomInset = 0,
}: {
  candidate: DiscoveryCandidate;
  selfPreview?: boolean;
  bottomInset?: number;
}) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ flex: 1, padding: spacing.xl, paddingBottom: spacing.xl + bottomInset }}>
      {/* Photo takes whatever vertical space is left so the info below always fits. */}
      <View style={{ flex: 1, minHeight: 140, marginBottom: spacing.lg }}>
        {candidate.photoUrl ? (
          <Image
            source={{ uri: candidate.photoUrl }}
            style={{ flex: 1, width: '100%', borderRadius: 16 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Avatar uri={null} name={candidate.displayName} size={140} />
          </View>
        )}
      </View>

      <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>
        {candidate.displayName}
      </Text>
      {candidate.city ? (
        <Text style={{ color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
          {candidate.city}
        </Text>
      ) : null}

      {candidate.bio ? (
        <Text style={[typography.body, { color: colors.text, marginTop: spacing.md, textAlign: 'center' }]} numberOfLines={2}>
          {candidate.bio}
        </Text>
      ) : null}

      {candidate.sharedSportNames.length > 0 ? (
        <View style={{ marginTop: spacing.md }}>
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

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.lg }}>
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
