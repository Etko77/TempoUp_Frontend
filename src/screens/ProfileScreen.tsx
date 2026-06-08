import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/auth/AuthContext';
import { api } from '@/api/endpoints';
import type { ProfileResponse } from '@/types/api';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';

export function ProfileScreen() {
  const { colors, spacing, typography } = useTheme();
  const { logout, user } = useAuth();
  const navigation = useNavigation<NativeStackScreenProps<MainStackParamList>['navigation']>();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const p = await api.profile.me();
    setProfile(p);
    setDisplayName(p.displayName);
    setBio(p.bio ?? '');
    setCity(p.city ?? '');
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await api.profile.update({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        city: city.trim() || undefined,
      });
      setProfile(updated);
      Alert.alert('Saved', 'Your profile has been updated.');
    } finally {
      setSaving(false);
    }
  }, [bio, city, displayName]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          <Avatar uri={profile?.photoUrl} name={displayName || user?.email || '??'} size={96} />
          <Text style={[typography.h2, { color: colors.text, marginTop: spacing.md }]}>
            {displayName || '—'}
          </Text>
          <Text style={{ color: colors.textSecondary }}>{user?.email}</Text>
        </View>

        <TextField label="Display name" value={displayName} onChangeText={setDisplayName} />
        <TextField label="City" value={city} onChangeText={setCity} placeholder="e.g. Sofia" />
        <TextField
          label="Bio"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          placeholder="A few words about your training, schedule, goals…"
          style={{ minHeight: 100, textAlignVertical: 'top' }}
        />

        <Button title="Save changes" onPress={save} loading={saving} />

        <View style={{ marginTop: spacing.xl }}>
          <Button
            title="Manage my sports"
            variant="secondary"
            onPress={() => navigation.navigate('MySports')}
          />
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <Button title="Sign out" variant="outline" onPress={logout} />
        </View>
      </ScrollView>
    </Screen>
  );
}
