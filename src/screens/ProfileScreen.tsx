import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, Modal } from 'react-native';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { DiscoveryCardInner } from '@/components/DiscoveryCard';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/auth/AuthContext';
import { api } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { formatSkillData } from '@/utils/metrics';
import type { DiscoveryCandidate, ProfileResponse, UserSportResponse } from '@/types/api';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageAsync } from '@/utils/uploadImage';
import { captureAndSyncLocation } from '@/location/useLocationSync';

const AVATAR_SIZE = 132;

export function ProfileScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { logout, user } = useAuth();
  const navigation = useNavigation<NativeStackScreenProps<MainStackParamList>['navigation']>();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sports, setSports] = useState<UserSportResponse[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  const hydrate = useCallback((p: ProfileResponse) => {
    setProfile(p);
    setDisplayName(p.displayName);
    setBio(p.bio ?? '');
    setCity(p.city ?? '');
    setPhotoUrl(p.photoUrl ?? '');
  }, []);

  const load = useCallback(async () => {
    const [p, mySports] = await Promise.all([
      api.profile.me(),
      api.mySports.list().catch(() => [] as UserSportResponse[]),
    ]);
    hydrate(p);
    setSports(mySports);
  }, [hydrate]);

  useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const prioritySport = sports.find((s) => s.priority) ?? sports[0] ?? null;
  const starredSkills = sports.flatMap((s) => s.skills.filter((sk) => sk.starred));

  const myCandidate: DiscoveryCandidate = {
    userId: user?.userId ?? 'me',
    displayName: displayName || user?.email || 'You',
    bio: bio.trim() || null,
    city: city.trim() || null,
    photoUrl: photoUrl.trim() || null,
    distanceKm: null,
    sharedSports: sports.length,
    sharedSkills: sports.reduce((n, s) => n + s.skills.length, 0),
    sharedSportNames: sports.map((s) => s.sportName),
    score: 0,
  };

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await api.profile.update({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        city: city.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
      });
      hydrate(updated);
      setEditing(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      const msg = e instanceof ApiError ? e.body?.message ?? e.message : 'Could not save. Please try again.';
      Alert.alert('Could not save profile', msg);
    } finally {
      setSaving(false);
    }
  }, [bio, city, displayName, photoUrl, hydrate]);

  const cancelEdit = useCallback(() => {
    if (profile) hydrate(profile);
    setEditing(false);
  }, [profile, hydrate]);

  const updateLocation = useCallback(async () => {
    setLocating(true);
    try {
      const result = await captureAndSyncLocation();
      if (result.ok) {
        await load();
        Alert.alert('Location updated', 'Nearby partners will now rank higher and show a distance.');
      } else {
        Alert.alert('Could not update location', result.message);
      }
    } finally {
      setLocating(false);
    }
  }, [load]);

  // Shared pipeline for both camera capture and gallery selection.
  const handlePicked = useCallback(async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    try {
      setUploading(true);
      const url = await uploadImageAsync(result.assets[0].uri);
      setPhotoUrl(url); // live preview; persisted on "Save changes"
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not upload the image.';
      Alert.alert('Upload failed', msg);
    } finally {
      setUploading(false);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to take a picture.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    await handlePicked(result);
  }, [handlePicked]);

  const chooseFromGallery = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to choose a picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    await handlePicked(result);
  }, [handlePicked]);

  const uploadPic = useCallback(() => {
    Alert.alert('Upload pic', 'Choose where to get your picture from.', [
      { text: 'Take photo', onPress: takePhoto },
      { text: 'Choose from gallery', onPress: chooseFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [takePhoto, chooseFromGallery]);

  const card = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  } as const;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {/* Header card — avatar + identity */}
        <View style={[card, { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, marginBottom: spacing.lg }]}>
          <Avatar uri={photoUrl.trim() || undefined} name={displayName || user?.email || '??'} size={AVATAR_SIZE} />
          {editing ? (
            <View style={{ marginTop: spacing.md, alignSelf: 'stretch' }}>
              <Button
                title={uploading ? 'Uploading…' : 'Upload pic'}
                variant="secondary"
                onPress={uploadPic}
                loading={uploading}
              />
            </View>
          ) : null}
          <Text style={[typography.h1, { color: colors.text, marginTop: spacing.md, textAlign: 'center' }]}>
            {displayName || '—'}
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 2 }}>{user?.email}</Text>
          {!editing && city.trim() ? (
            <Text style={{ color: colors.textSecondary, marginTop: spacing.xs }}>📍 {city.trim()}</Text>
          ) : null}
        </View>

        {editing ? (
          <>
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
            <View style={{ marginTop: spacing.sm }}>
              <Button title="Cancel" variant="outline" onPress={cancelEdit} disabled={saving} />
            </View>
          </>
        ) : (
          <>
            {/* About card */}
            <View style={[card, { padding: spacing.lg, marginBottom: spacing.lg }]}>
              <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>About</Text>

              <Text style={[typography.caption, { color: colors.textSecondary }]}>City</Text>
              <Text style={[typography.body, { color: city.trim() ? colors.text : colors.textSecondary, marginTop: spacing.xs }]}>
                {city.trim() || 'Not set'}
              </Text>

              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />

              <Text style={[typography.caption, { color: colors.textSecondary }]}>Bio</Text>
              <Text style={[typography.body, { color: bio.trim() ? colors.text : colors.textSecondary, marginTop: spacing.xs, lineHeight: 21 }]}>
                {bio.trim() || 'No bio yet — tap Edit profile to add a few words about your training.'}
              </Text>

              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />

              <Text style={[typography.caption, { color: colors.textSecondary }]}>Location</Text>
              <Text style={[typography.body, { color: profile?.latitude != null ? colors.text : colors.textSecondary, marginTop: spacing.xs }]}>
                {profile?.latitude != null
                  ? 'Shared — used to rank nearby partners and show distances.'
                  : 'Not shared yet — partners can’t see how far away you are.'}
              </Text>
              <View style={{ marginTop: spacing.md }}>
                <Button
                  title={locating ? 'Updating…' : profile?.latitude != null ? 'Update my location' : 'Share my location'}
                  variant="secondary"
                  onPress={updateLocation}
                  loading={locating}
                />
              </View>
            </View>

            {/* Highlights card — what others see first */}
            <View style={[card, { padding: spacing.lg, marginBottom: spacing.lg }]}>
              <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Highlights</Text>

              <Text style={[typography.caption, { color: colors.textSecondary }]}>Priority sport</Text>
              <Text style={[typography.body, { color: prioritySport ? colors.text : colors.textSecondary, marginTop: spacing.xs }]}>
                {prioritySport
                  ? `${prioritySport.sportName} · ${prioritySport.proficiencyLevel.toLowerCase()}`
                  : 'No sports yet — add one in Manage my sports.'}
              </Text>

              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />

              <Text style={[typography.caption, { color: colors.textSecondary }]}>Best skills</Text>
              {starredSkills.length > 0 ? (
                <View style={{ marginTop: spacing.xs, gap: 4 }}>
                  {starredSkills.map((sk) => {
                    const data = formatSkillData(sk);
                    return (
                      <Text key={sk.skillId} style={{ color: colors.text }}>
                        <Text style={{ color: colors.warning }}>★ </Text>
                        {sk.name}
                        {data ? <Text style={{ color: colors.textSecondary }}>{`  ${data}`}</Text> : null}
                      </Text>
                    );
                  })}
                </View>
              ) : (
                <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                  Mark up to 3 best skills in Manage my sports to feature them.
                </Text>
              )}

              <View style={{ marginTop: spacing.md }}>
                <Button title="Preview my discovery card" variant="secondary" onPress={() => setPreviewOpen(true)} />
              </View>
            </View>

            <Button title="Edit profile" onPress={() => setEditing(true)} />
          </>
        )}

        <View style={{ marginTop: spacing.lg }}>
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

      <Modal visible={previewOpen} animationType="slide" transparent onRequestClose={() => setPreviewOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.primaryDeep + 'F2', padding: spacing.lg, justifyContent: 'center' }}>
          <Text style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '700', marginBottom: spacing.md }}>
            This is how your card looks on Discover
          </Text>
          <View style={{ height: '72%', backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden' }}>
            <DiscoveryCardInner candidate={myCandidate} selfPreview />
          </View>
          <View style={{ marginTop: spacing.lg }}>
            <Button title="Close" variant="secondary" onPress={() => setPreviewOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
