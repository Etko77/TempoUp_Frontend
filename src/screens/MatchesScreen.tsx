import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, View, Text, Pressable, RefreshControl } from 'react-native';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Loading } from '@/components/Loading';
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
  const [unread, setUnread] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = useCallback(async () => {
    try {
      // Matches give us the people; conversations carry the server-computed
      // unreadCount (messages from the other party not yet read).
      const [list, conversations] = await Promise.all([
        api.matches.list(),
        api.conversations.list().catch(() => []),
      ]);
      const unreadByConversation = new Map(conversations.map((c) => [c.id, c.unreadCount > 0]));
      const nextUnread: Record<string, boolean> = {};
      for (const m of list) {
        nextUnread[m.conversationId] = unreadByConversation.get(m.conversationId) ?? false;
      }
      setMatches(list);
      setUnread(nextUnread);
    } catch {
      // keep whatever we had on the matches screen;
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchMatches();
      setLoading(false);
    })();
    const removeFocusListener = navigation.addListener('focus', fetchMatches);
    return removeFocusListener;
  }, [fetchMatches, navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  }, [fetchMatches]);

  return (
    <Screen padded={false}>
      <View style={{ padding: spacing.lg }}>
        <Text style={[typography.h2, { color: colors.primaryDeep }]}>Matches</Text>
        <Text style={{ color: colors.textSecondary }}>Tap to start chatting.</Text>
      </View>

      {loading ? (
        <Loading label="Loading matches…" />
      ) : (
      <FlatList
        data={matches}
        keyExtractor={(m) => m.matchId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: spacing.xxl }}>
            <Text style={{ color: colors.textSecondary }}>
              No matches yet. Keep swiping!
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const hasUnread = unread[item.conversationId];
          return (
          <Pressable
            onPress={() =>
              navigation.navigate('Conversation', {
                conversationId: item.conversationId,
                otherName: item.otherDisplayName,
                otherUserId: item.otherUserId,
                otherPhotoUrl: item.otherPhotoUrl,
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
              borderColor: hasUnread ? colors.primary : colors.border,
            }}
          >
            <Avatar uri={item.otherPhotoUrl} name={item.otherDisplayName} />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>{item.otherDisplayName}</Text>
              <Text style={{ color: hasUnread ? colors.primary : colors.textSecondary, fontSize: 12 }}>
                {hasUnread ? 'New message' : `Matched ${new Date(item.matchedAt).toLocaleDateString()}`}
              </Text>
            </View>
            <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
          </Pressable>
          );
        }}
      />
      )}
    </Screen>
  );
}
