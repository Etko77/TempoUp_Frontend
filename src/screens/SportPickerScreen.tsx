import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/theme/ThemeContext';
import { api } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import type { ProficiencyLevel, SkillResponse, SportResponse, UserSportResponse } from '@/types/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'SportPicker'>;

const LEVELS: ProficiencyLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

export function SportPickerScreen({ route, navigation }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const initialSportId = route.params?.sportId;

  const [sports, setSports] = useState<SportResponse[]>([]);
  const [mine, setMine] = useState<UserSportResponse[]>([]);
  const [selectedSportId, setSelectedSportId] = useState<string | null>(initialSportId ?? null);
  const [skills, setSkills] = useState<SkillResponse[]>([]);
  const [chosenSkills, setChosenSkills] = useState<Set<string>>(new Set());
  const [level, setLevel] = useState<ProficiencyLevel>('BEGINNER');
  const [priority, setPriority] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestName, setSuggestName] = useState('');

  // Load the public sports catalog + current user's existing selections
  useEffect(() => {
    (async () => {
      const [s, m] = await Promise.all([api.sports.list(), api.mySports.list()]);
      setSports(s);
      setMine(m);
    })();
  }, []);

  useEffect(() => {
    if (!selectedSportId) return;
    (async () => {
      const list = await api.sports.skills(selectedSportId);
      setSkills(list);
      const existing = mine.find((m) => m.sportId === selectedSportId);
      if (existing) {
        setChosenSkills(new Set(existing.skills.map((sk) => sk.id)));
        setLevel(existing.proficiencyLevel);
        setPriority(existing.priority);
      } else {
        setChosenSkills(new Set());
        setLevel('BEGINNER');
        setPriority(false);
      }
    })();
  }, [selectedSportId, mine]);

  const toggleSkill = useCallback((id: string) => {
    setChosenSkills((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const save = useCallback(async () => {
    if (!selectedSportId) return;
    setSaving(true);
    try {
      await api.mySports.set({
        sportId: selectedSportId,
        proficiencyLevel: level,
        priority,
        skillIds: Array.from(chosenSkills),
      });
      navigation.goBack();
    } catch (e) {
      const msg = e instanceof ApiError ? e.body?.message ?? e.message : 'Could not save. Please try again.';
      Alert.alert('Could not save sport', msg);
    } finally {
      setSaving(false);
    }
  }, [chosenSkills, level, navigation, priority, selectedSportId]);

  const suggest = useCallback(async () => {
    const name = suggestName.trim();
    if (!name) return;
    try {
      await api.suggestions.create({
        type: selectedSportId ? 'SKILL' : 'SPORT',
        parentSportId: selectedSportId ?? undefined,
        name,
      });
      setSuggestName('');
      Alert.alert('Thanks!', 'Your suggestion has been sent to an admin for review.');
    } catch (e) {
      Alert.alert('Could not submit', 'Please try again later.');
    }
  }, [selectedSportId, suggestName]);

  const selectedSport = useMemo(
    () => sports.find((s) => s.id === selectedSportId) ?? null,
    [selectedSportId, sports],
  );

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Text style={[typography.h2, { color: colors.primaryDeep, marginBottom: spacing.sm }]}>
          {selectedSport ? selectedSport.name : 'Choose a sport'}
        </Text>

        {!selectedSport ? (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.xl }}>
              {sports.map((s) => (
                <Chip key={s.id} label={s.name} onPress={() => setSelectedSportId(s.id)} />
              ))}
            </View>

            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>
              Sport not listed?
            </Text>
            <TextField
              value={suggestName}
              onChangeText={setSuggestName}
              placeholder="Suggest a new sport (e.g. Padel)"
            />
            <Button title="Send suggestion" variant="secondary" onPress={suggest} />
          </>
        ) : (
          <>
            <Text style={[typography.h3, { color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm }]}>
              Your level
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.lg }}>
              {LEVELS.map((lvl) => (
                <Chip key={lvl} label={lvl} selected={level === lvl} onPress={() => setLevel(lvl)} />
              ))}
            </View>

            <Pressable
              onPress={() => setPriority((p) => !p)}
              style={{
                flexDirection: 'row', alignItems: 'center',
                padding: spacing.md, marginBottom: spacing.lg,
                borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
                backgroundColor: priority ? colors.primaryMuted : colors.surface,
              }}
            >
              <Text style={{ color: colors.text, flex: 1 }}>
                ⭐ Priority sport — boost matches with this sport
              </Text>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{priority ? 'ON' : 'OFF'}</Text>
            </Pressable>

            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>
              Skills you train
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg }}>
              {skills.map((sk) => (
                <Chip
                  key={sk.id}
                  label={sk.name}
                  selected={chosenSkills.has(sk.id)}
                  onPress={() => toggleSkill(sk.id)}
                />
              ))}
            </View>

            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>
              Missing a skill?
            </Text>
            <TextField
              value={suggestName}
              onChangeText={setSuggestName}
              placeholder={`Suggest a skill for ${selectedSport.name}`}
            />
            <Button title="Send suggestion" variant="secondary" onPress={suggest} />
          </>
        )}
      </ScrollView>

      {selectedSport ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Button title="Save" onPress={save} loading={saving} />
        </View>
      ) : null}
    </Screen>
  );
}
