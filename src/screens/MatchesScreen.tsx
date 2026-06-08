import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, View, Text, Pressable, RefreshControl } from 'react-native';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { useTheme } from '@/theme/ThemeContext';
import { api } from '@/api/endpoints';
import type { MatchResponse } from '@/types/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';
import { useNavigation } from '@react-navigation/native';

export function MatchesScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const navigation = useNavigation<NativeStackScreenProps<MainStackParamList>['navigation']>();
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setMatches(await api.matches.list());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [load, navigation]);

  return (
    <Screen padded={false}>
      <View style={{ padding: spacing.lg }}>
        <Text style={[typography.h2, { color: colors.primaryDeep }]}>Matches</Text>
        <Text style={{ color: colors.textSecondary }}>Tap to start chatting.</Text>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(m) => m.matchId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: spacing.xxl }}>
            <Text style={{ color: colors.textSecondary }}>
              No matches yet. Keep swiping!
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('Conversation', {
                conversationId: item.conversationId,
                otherName: item.otherDisplayName,
              })
            }
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              padding: spacing.md,
              borderRadius: radius.lg,
              marginBottom: spacing.sm,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Avatar uri={item.otherPhotoUrl} name={item.otherDisplayName} />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>{item.otherDisplayName}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                Matched {new Date(item.matchedAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}
