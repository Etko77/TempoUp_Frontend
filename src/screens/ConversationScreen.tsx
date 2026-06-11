import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { useTheme } from '@/theme/ThemeContext';
import { api } from '@/api/endpoints';
import { connectChat, ChatConnection } from '@/chat/stompClient';
import { useAuth } from '@/auth/AuthContext';
import type { MessageResponse } from '@/types/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

type Props = NativeStackScreenProps<MainStackParamList, 'Conversation'>;

type LocalMessage = MessageResponse & { pending?: boolean; failed?: boolean };

//Right side time width
const TIME_REVEAL_RIGHT = 50;

// How tall the composer can grow before it starts scrolling (≈30% of the screen).
const INPUT_MAX_HEIGHT = 220;

export function ConversationScreen({ route, navigation }: Props) {
  const { conversationId, otherName, otherUserId, otherPhotoUrl } = route.params;
  const { colors, spacing, radius, typography } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [draft, setDraft] = useState('');
  const connRef = useRef<ChatConnection | null>(null);
  const listRef = useRef<FlatList<LocalMessage>>(null);

  // Swipe-to-reveal timestamps: one shared value drives every row's horizontal shift.
  const dragX = useSharedValue(0);
  const rowAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dragX.value }] }));

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Pressable
          disabled={!otherUserId}
          onPress={() => otherUserId && navigation.navigate('ProfileDetail', { userId: otherUserId, displayName: otherName })}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: radius.pill,
            paddingVertical: 4,
            paddingHorizontal: 8,
          }}
        >
          <Avatar uri={otherPhotoUrl} name={otherName} size={28} />
          <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8, maxWidth: 180 }} numberOfLines={1}>
            {otherName}
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, otherName, otherUserId, otherPhotoUrl, colors, radius]);

  useEffect(() => {
    api.conversations.read(conversationId).catch(() => {});
  }, [conversationId]);

  // Load history (newest first from the API), then flip to oldest-first for display.
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
          setMessages((curr) => reconcileIncoming(curr, msg, user?.userId));
          // I'm looking at this conversation right now, so anything the other
          // person sends is read instantly — tell the server so their bubble
          // flips to "Read" immediately and the unread count clears.
          if (msg.senderId !== user?.userId) {
            api.conversations.read(conversationId).catch(() => {});
          }
        },
        onRead: (receipt) => {
          if (receipt.conversationId !== conversationId) return;
          // The other participant read the chat — mark my sent, unread messages as read.
          setMessages((curr) =>
            curr.map((m) =>
              m.senderId === user?.userId && !m.readAt
                ? { ...m, readAt: receipt.readAt }
                : m,
            ),
          );
        },
      });
      if (cancelled) conn.disconnect();
      else connRef.current = conn;
    })();
    return () => {
      cancelled = true;
      connRef.current?.disconnect();
      connRef.current = null;
    };
  }, [conversationId, user?.userId]);

  // The id of the most recent message I sent that the other person has read.
  // Only this one shows the "Read" indicator (iMessage-style).
  const lastReadId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.senderId === user?.userId && m.readAt) return m.id;
    }
    return null;
  }, [messages, user?.userId]);

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-15, 15]) 
    .failOffsetY([-12, 12])  
    .onUpdate((e) => {
      dragX.value = Math.min(0, Math.max(-TIME_REVEAL_RIGHT, e.translationX));
    })
    .onEnd(() => {
      dragX.value = withTiming(0, { duration: 220 });
    });

  const send = useCallback(() => {
    const content = draft.trim();
    if (!content) return;
    if (!user) return;

    // Optimistic message — shows immediately as "Sending…"
    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimistic: LocalMessage = {
      id: tempId,
      conversationId,
      senderId: user.userId,
      content,
      readAt: null,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((curr) => [...curr, optimistic]);
    setDraft('');
    scrollToEnd();

    if (connRef.current) {
      connRef.current.send(conversationId, content);
    } else {
      api.conversations.send(conversationId, { content }).then(
        (real) => setMessages((curr) =>
          curr.map((m) => (m.id === tempId ? { ...real, pending: false } : m))),
        () => setMessages((curr) =>
          curr.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m))),
      );
    }
  }, [conversationId, draft, user]);

  const scrollToEnd = () => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={120}
      >
        <GestureDetector gesture={swipeGesture}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{
              padding: spacing.lg,
              paddingBottom: spacing.md,
              flexGrow: 1, // messages fill from the top down
            }}
            onContentSizeChange={scrollToEnd}
            renderItem={({ item }) => {
              const mine = item.senderId === user?.userId;

              let status: string | null = null;
              let statusColor = colors.textSecondary;
              if (mine) {
                if (item.failed)              { status = 'Failed';   statusColor = colors.danger; }
                else if (item.pending)        { status = 'Sending…'; }
                else if (item.id === lastReadId) { status = 'Read';  statusColor = colors.primary; }
              }

              return (
                <Animated.View style={[rowAnimatedStyle, { marginBottom: spacing.sm }]}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: mine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <View
                      style={[
                        styles.bubble,
                        {
                          backgroundColor: mine ? colors.primary : colors.surface,
                          borderColor: colors.border,
                          borderWidth: mine ? 0 : 1,
                          borderRadius: radius.lg,
                          padding: spacing.md,
                          opacity: item.pending ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text style={{ color: mine ? colors.textInverse : colors.text, fontSize: 15 }}>
                        {item.content}
                      </Text>
                    </View>

                    {/* Timestamp parked just off the right edge; the swipe slides it into view. */}
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        right: -TIME_REVEAL_RIGHT,
                        top: 0,
                        bottom: 0,
                        width: TIME_REVEAL_RIGHT -15,
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                        {formatTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {status ? (
                    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginTop: 2, paddingHorizontal: spacing.xs }}>
                      <Text style={{ color: statusColor, fontSize: 11 }}>{status}</Text>
                    </View>
                  ) : null}
                </Animated.View>
              );
            }}
          />
        </GestureDetector>

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
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderRadius: radius.lg,
                borderColor: colors.border,
                maxHeight: INPUT_MAX_HEIGHT,
              },
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

function formatTime(iso: string): string {
  try {
    const msgDate = new Date(iso);
    return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function reconcileIncoming(
  curr: LocalMessage[],
  incoming: MessageResponse,
  myUserId: string | undefined,
): LocalMessage[] {
  const existing = curr.findIndex((m) => m.id === incoming.id);
  if (existing >= 0) {
    const next = [...curr];
    next[existing] = { ...incoming };
    return next;
  }

  if (incoming.senderId === myUserId) {
    const pendingIdx = curr.findIndex(
      (m) => m.pending && m.senderId === myUserId && m.content === incoming.content,
    );
    if (pendingIdx >= 0) {
      const next = [...curr];
      next[pendingIdx] = { ...incoming };
      return next;
    }
  }
  return [...curr, incoming];
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '80%' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  input: {
    flex: 1, minHeight: 44,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, fontSize: 16,
  },
  send: { paddingHorizontal: 18, paddingVertical: 10, alignSelf: 'flex-end' },
});