import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/theme/ThemeContext';
import { api } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { METRIC_FIELDS, METRIC_LABELS, type MetricFieldKey } from '@/utils/metrics';
import type {
  MetricType,
  ProficiencyLevel,
  SkillResponse,
  SkillSelection,
  SportResponse,
  UserSportResponse,
} from '@/types/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'SportPicker'>;

const LEVELS: ProficiencyLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const SUGGEST_METRICS: MetricType[] = ['NONE', 'STRENGTH', 'ENDURANCE_REPS', 'ENDURANCE_DISTANCE', 'SPEED'];
const MAX_STARRED = 3;

type SkillState = {
  weightKg: string;
  reps: string;
  distanceKm: string;
  durationMin: string;
  speedKmh: string;
  starred: boolean;
};

const EMPTY_STATE: SkillState = {
  weightKg: '', reps: '', distanceKm: '', durationMin: '', speedKmh: '', starred: false,
};

const numOrUndef = (s: string): number | undefined => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
};
const intOrUndef = (s: string): number | undefined => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : undefined;
};

export function SportPickerScreen({ route, navigation }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const initialSportId = route.params?.sportId;

  const [sports, setSports] = useState<SportResponse[]>([]);
  const [mine, setMine] = useState<UserSportResponse[]>([]);
  const [selectedSportId, setSelectedSportId] = useState<string | null>(initialSportId ?? null);
  const [skills, setSkills] = useState<SkillResponse[]>([]);
  const [chosen, setChosen] = useState<Record<string, SkillState>>({});
  const [level, setLevel] = useState<ProficiencyLevel>('BEGINNER');
  const [priority, setPriority] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestName, setSuggestName] = useState('');
  const [suggestMetric, setSuggestMetric] = useState<MetricType>('NONE');

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
        const map: Record<string, SkillState> = {};
        existing.skills.forEach((sk) => {
          map[sk.skillId] = {
            weightKg: sk.weightKg?.toString() ?? '',
            reps: sk.reps?.toString() ?? '',
            distanceKm: sk.distanceKm?.toString() ?? '',
            durationMin: sk.durationSeconds != null ? (sk.durationSeconds / 60).toString() : '',
            speedKmh: sk.speedKmh?.toString() ?? '',
            starred: sk.starred,
          };
        });
        setChosen(map);
        setLevel(existing.proficiencyLevel);
        setPriority(existing.priority);
      } else {
        setChosen({});
        setLevel('BEGINNER');
        setPriority(false);
      }
    })();
  }, [selectedSportId, mine]);

  const metricOf = useCallback(
    (skillId: string): MetricType => skills.find((s) => s.id === skillId)?.metricType ?? 'NONE',
    [skills],
  );

  const toggleSkill = useCallback((id: string) => {
    setChosen((curr) => {
      const next = { ...curr };
      if (next[id]) delete next[id];
      else next[id] = { ...EMPTY_STATE };
      return next;
    });
  }, []);

  const setField = useCallback((id: string, key: MetricFieldKey, value: string) => {
    setChosen((curr) => ({ ...curr, [id]: { ...curr[id], [key]: value } }));
  }, []);

  const starredElsewhere = useMemo(
    () =>
      mine
        .filter((m) => m.sportId !== selectedSportId)
        .reduce((sum, m) => sum + m.skills.filter((sk) => sk.starred).length, 0),
    [mine, selectedSportId],
  );
  const starredHere = useMemo(
    () => Object.values(chosen).filter((st) => st.starred).length,
    [chosen],
  );
  const starsLeft = MAX_STARRED - starredElsewhere - starredHere;

  const toggleStar = useCallback(
    (id: string) => {
      setChosen((curr) => {
        const st = curr[id];
        if (!st) return curr;
        if (!st.starred && starsLeft <= 0) {
          Alert.alert('Star limit', `You can star up to ${MAX_STARRED} skills across your profile.`);
          return curr;
        }
        return { ...curr, [id]: { ...st, starred: !st.starred } };
      });
    },
    [starsLeft],
  );

  const save = useCallback(async () => {
    if (!selectedSportId) return;
    setSaving(true);
    try {
      const skillsPayload: SkillSelection[] = Object.entries(chosen).map(([skillId, st]) => {
        const mt = metricOf(skillId);
        const sel: SkillSelection = { skillId, starred: st.starred };
        if (mt === 'STRENGTH') {
          sel.weightKg = numOrUndef(st.weightKg);
          sel.reps = intOrUndef(st.reps);
        } else if (mt === 'ENDURANCE_REPS') {
          sel.reps = intOrUndef(st.reps);
        } else if (mt === 'ENDURANCE_DISTANCE') {
          sel.distanceKm = numOrUndef(st.distanceKm);
          const min = numOrUndef(st.durationMin);
          sel.durationSeconds = min != null ? Math.round(min * 60) : undefined;
        } else if (mt === 'SPEED') {
          sel.speedKmh = numOrUndef(st.speedKmh);
        }
        return sel;
      });
      await api.mySports.set({
        sportId: selectedSportId,
        proficiencyLevel: level,
        priority,
        skills: skillsPayload,
      });
      navigation.goBack();
    } catch (e) {
      const msg = e instanceof ApiError ? e.body?.message ?? e.message : 'Could not save. Please try again.';
      Alert.alert('Could not save sport', msg);
    } finally {
      setSaving(false);
    }
  }, [chosen, level, metricOf, navigation, priority, selectedSportId]);

  const suggest = useCallback(async () => {
    const name = suggestName.trim();
    if (!name) return;
    try {
      await api.suggestions.create({
        type: selectedSportId ? 'SKILL' : 'SPORT',
        parentSportId: selectedSportId ?? undefined,
        name,
        metricType: selectedSportId ? suggestMetric : undefined,
      });
      setSuggestName('');
      setSuggestMetric('NONE');
      Alert.alert('Thanks!', 'Your suggestion has been sent to an admin for review.');
    } catch (e) {
      Alert.alert('Could not submit', 'Please try again later.');
    }
  }, [selectedSportId, suggestName, suggestMetric]);

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
                ⭐ Priority sport — shown first on your profile
              </Text>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{priority ? 'ON' : 'OFF'}</Text>
            </Pressable>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={[typography.h3, { color: colors.text, flex: 1 }]}>Skills you train</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {Math.max(0, starsLeft)} ★ left
              </Text>
            </View>

            {skills.map((sk) => (
              <SkillRow
                key={sk.id}
                skill={sk}
                state={chosen[sk.id]}
                onToggle={() => toggleSkill(sk.id)}
                onField={(key, value) => setField(sk.id, key, value)}
                onStar={() => toggleStar(sk.id)}
              />
            ))}

            <Text style={[typography.h3, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
              Missing a skill?
            </Text>
            <TextField
              value={suggestName}
              onChangeText={setSuggestName}
              placeholder={`Suggest a skill for ${selectedSport.name}`}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: spacing.xs }}>
              What does it measure?
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md }}>
              {SUGGEST_METRICS.map((mt) => (
                <Chip
                  key={mt}
                  label={METRIC_LABELS[mt]}
                  selected={suggestMetric === mt}
                  onPress={() => setSuggestMetric(mt)}
                />
              ))}
            </View>
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

function SkillRow({
  skill,
  state,
  onToggle,
  onField,
  onStar,
}: {
  skill: SkillResponse;
  state: SkillState | undefined;
  onToggle: () => void;
  onField: (key: MetricFieldKey, value: string) => void;
  onStar: () => void;
}) {
  const { colors, spacing, radius, typography } = useTheme();
  const selected = !!state;
  const fields = METRIC_FIELDS[skill.metricType];

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primaryMuted : colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
      }}
    >
      <Pressable onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 22, height: 22, borderRadius: 6, marginRight: spacing.md,
            borderWidth: 2, borderColor: selected ? colors.primary : colors.border,
            backgroundColor: selected ? colors.primary : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {selected ? <Text style={{ color: colors.textInverse, fontWeight: '900', fontSize: 13 }}>✓</Text> : null}
        </View>
        <Text style={[typography.bodyBold, { color: colors.text, flex: 1 }]}>{skill.name}</Text>
        {selected ? (
          <Pressable onPress={onStar} hitSlop={8} style={{ paddingHorizontal: spacing.xs }}>
            <Text style={{ fontSize: 18, color: state?.starred ? colors.warning : colors.textSecondary }}>
              {state?.starred ? '★' : '☆'}
            </Text>
          </Pressable>
        ) : null}
      </Pressable>

      {selected && fields.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          {fields.map((f) => (
            <View key={f.key} style={{ flex: 1 }}>
              <TextField
                label={f.label}
                value={state ? state[f.key] : ''}
                onChangeText={(v) => onField(f.key, v)}
                keyboardType="numeric"
                placeholder="0"
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
