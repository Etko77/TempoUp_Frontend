import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useTheme } from '@/theme/ThemeContext';
import { api } from '@/api/endpoints';
import { connectChat, ChatConnection } from '@/chat/stompClient';
import { useAuth } from '@/auth/AuthContext';
import type { MessageResponse } from '@/types/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Conversation'>;

export function ConversationScreen({ route, navigation }: Props) {
  const { conversationId, otherName } = route.params;
  const { colors, spacing, radius, typography } = useTheme();
  const headerHeight = Platform.OS == "ios" ?  useHeaderHeight() + 20 : useHeaderHeight();
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [draft, setDraft] = useState('');
  const connRef = useRef<ChatConnection | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: otherName });
  }, [navigation, otherName]);

  // Load history (newest first) and reverse for display oldest-first
  const loadHistory = useCallback(async () => {
    const page = await api.conversations.messages(conversationId, 0, 50);
    setMessages([...page.content].reverse());
  }, [conversationId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Open the STOMP connection
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const conn = await connectChat({
        onMessage: (msg) => {
          if (msg.conversationId !== conversationId) return;
          setMessages((curr) => {
            if (curr.some((m) => m.id === msg.id)) return curr;
            return [...curr, msg];
          });
        },
        onError: (err) => console.warn('[chat] connection error:', err.message),
      });
      if (cancelled) conn.disconnect();
      else connRef.current = conn;
    })();
    return () => {
      cancelled = true;
      connRef.current?.disconnect();
      connRef.current = null;
    };
  }, [conversationId]);

  const send = useCallback(() => {
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    if (connRef.current) {
      connRef.current.send(conversationId, content);
    } else {
      // Fallback to REST if the WS isn't connected yet
      api.conversations.send(conversationId, { content }).then(
        (m) => setMessages((curr) => [...curr, m]),
        () => setDraft(content), // restore on failure
      );
    }
  }, [conversationId, draft]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={headerHeight}
      >
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.md }}
          renderItem={({ item }) => {
            const mine = item.senderId === user?.userId;
            return (
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: mine ? colors.primary : colors.surface,
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    borderColor: colors.border,
                    borderWidth: mine ? 0 : 1,
                    borderRadius: radius.lg,
                    marginBottom: spacing.sm,
                    padding: spacing.md,
                  },
                ]}
              >
                <Text style={{ color: mine ? colors.textInverse : colors.text, fontSize: 15 }}>
                  {item.content}
                </Text>
              </View>
            );
          }}
        />

        <View style={[
          styles.composer,
          { borderColor: colors.border, backgroundColor: colors.background, padding: spacing.md },
        ]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message…"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              { backgroundColor: colors.surface, color: colors.text, borderRadius: radius.pill, borderColor: colors.border },
            ]}
            multiline
          />
          <Pressable
            onPress={send}
            style={[styles.send, { backgroundColor: colors.primary, borderRadius: radius.pill }]}
          >
            <Text style={{ color: colors.textInverse, fontWeight: '700' }}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '80%' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  input: {
    flex: 1, minHeight: 40, maxHeight: 120,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, fontSize: 15,
  },
  send: { paddingHorizontal: 18, paddingVertical: 10, alignSelf: 'flex-end' },
});
