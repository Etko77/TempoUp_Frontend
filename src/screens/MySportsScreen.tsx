import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { useTheme } from '@/theme/ThemeContext';
import { api } from '@/api/endpoints';
import type { UserSportResponse } from '@/types/api';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';

export function MySportsScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const navigation = useNavigation<NativeStackScreenProps<MainStackParamList>['navigation']>();
  const [mine, setMine] = useState<UserSportResponse[]>([]);

  const load = useCallback(async () => {
    setMine(await api.mySports.list());
  }, []);

  useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [load, navigation]);

  const remove = useCallback((sportId: string, name: string) => {
    Alert.alert('Remove sport?', `Remove ${name} from your profile?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await api.mySports.remove(sportId);
          load();
        },
      },
    ]);
  }, [load]);

  return (
    <Screen padded={false}>
      <View style={{ padding: spacing.lg }}>
        <Text style={[typography.h2, { color: colors.primaryDeep }]}>My sports</Text>
        <Text style={{ color: colors.textSecondary }}>
          The matching engine uses these to find partners.
        </Text>
      </View>

      <FlatList
        data={mine}
        keyExtractor={(it) => it.sportId}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: spacing.xxl }}>
            <Text style={{ color: colors.textSecondary }}>You haven't added any sports yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: colors.surface,
            padding: spacing.md,
            borderRadius: radius.lg,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.text }]}>
                  {item.sportName}
                  {item.priority ? <Text style={{ color: colors.primary }}>  ★ Priority</Text> : null}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {item.proficiencyLevel.toLowerCase()}
                </Text>
              </View>
              <Pressable onPress={() => navigation.navigate('SportPicker', { sportId: item.sportId })}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => remove(item.sportId, item.sportName)} style={{ marginLeft: spacing.md }}>
                <Text style={{ color: colors.danger, fontWeight: '600' }}>Remove</Text>
              </Pressable>
            </View>

            {item.skills.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm }}>
                {item.skills.map((sk) => (
                  <Chip key={sk.id} label={sk.name} />
                ))}
              </View>
            ) : null}
          </View>
        )}
      />

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button title="Add a sport" onPress={() => navigation.navigate('SportPicker', {})} />
      </View>
    </Screen>
  );
}
