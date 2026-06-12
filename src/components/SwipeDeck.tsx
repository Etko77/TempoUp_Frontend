import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, View, Text, Dimensions, StyleSheet, Pressable } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { DiscoveryCardInner } from '@/components/DiscoveryCard';
import { MatchModal, MatchInfo } from '@/components/MatchModal';
import { useTheme } from '@/theme/ThemeContext';
import { api } from '@/api/endpoints';
import type { DiscoveryCandidate, SwipeDirection } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.25;

interface Props {
  title: string;
  subtitle: string;
  fetchFeed: () => Promise<DiscoveryCandidate[]>;
  showHeader?: boolean;
}

export function SwipeDeck({ title, subtitle, fetchFeed, showHeader = true }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [feed, setFeed] = useState<DiscoveryCandidate[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matched, setMatched] = useState<MatchInfo | null>(null);
  const position = useRef(new Animated.ValueXY()).current;

  const fetchRef = useRef(fetchFeed);
  fetchRef.current = fetchFeed;

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchRef.current();
      setFeed(res);
      setIndex(0);
    } catch {
      // surface gracefully; in production we'd toast/banner
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const current = feed[index];
  const next = feed[index + 1];

  const recordSwipe = useCallback(async (direction: SwipeDirection) => {
    if (!current) return;
    try {
      const result = await api.swipes.swipe({ targetUserId: current.userId, direction });
      if (result.matched && result.conversationId) {
        setMatched({
          otherUserId: current.userId,
          otherName: current.displayName,
          otherPhotoUrl: current.photoUrl,
          conversationId: result.conversationId,
        });
      }
    } catch {
      /* ignore; the card already advanced */
    }
  }, [current]);

  const advance = useCallback((direction: SwipeDirection) => {
    recordSwipe(direction);
    position.setValue({ x: 0, y: 0 });
    setIndex((i) => i + 1);
  }, [position, recordSwipe]);

  const swipeOut = useCallback((direction: SwipeDirection) => {
    const toX = direction === 'LIKE' ? SCREEN_W * 1.4 : -SCREEN_W * 1.4;
    Animated.timing(position, {
      toValue: { x: toX, y: 0 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => advance(direction));
  }, [advance, position]);

  const swipeOutRef = useRef(swipeOut);
  swipeOutRef.current = swipeOut;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6,
      onPanResponderMove: (_e, g) => position.setValue({ x: g.dx, y: g.dy }),
      onPanResponderRelease: (_e, g) => {
        if (g.dx > SWIPE_THRESHOLD)       swipeOutRef.current('LIKE');
        else if (g.dx < -SWIPE_THRESHOLD) swipeOutRef.current('PASS');
        else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      },
    }),
  ).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_W / 2, 0, SCREEN_W / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
  });
  const likeOpacity = position.x.interpolate({ inputRange: [0, SCREEN_W / 4], outputRange: [0, 1] });
  const passOpacity = position.x.interpolate({ inputRange: [-SCREEN_W / 4, 0], outputRange: [1, 0] });

  const matchModal = (
    <MatchModal
      match={matched}
      onDismiss={() => setMatched(null)}
      onSendMessage={(m) => {
        setMatched(null);
        navigation.navigate('Conversation', {
          conversationId: m.conversationId,
          otherName: m.otherName,
          otherUserId: m.otherUserId,
          otherPhotoUrl: m.otherPhotoUrl,
        });
      }}
    />
  );

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}><Text style={{ color: colors.textSecondary }}>Loading…</Text></View>
      </Screen>
    );
  }
  if (!current) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.sm }]}>
            No one new right now
          </Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg }}>
            Try widening your radius or check back later.
          </Text>
          <Button title="Refresh" onPress={loadFeed} />
        </View>
        {matchModal}
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      {showHeader ? (
        <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
          <Text style={[typography.h2, { color: colors.primaryDeep }]}>{title}</Text>
          <Text style={{ color: colors.textSecondary }}>{subtitle}</Text>
        </View>
      ) : null}

      <View style={styles.deck}>
        {next ? <Card candidate={next} scale={0.95} muted /> : null}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.xl,
              shadowColor: '#000',
              transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
            },
          ]}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('ProfileDetail', { userId: current.userId, displayName: current.displayName })}
          >
            <DiscoveryCardInner candidate={current} bottomInset={64} />
          </Pressable>
          <Animated.View style={[styles.badge, styles.likeBadge, { opacity: likeOpacity, borderColor: colors.like }]}>
            <Text style={[styles.badgeText, { color: colors.like }]}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.badge, styles.passBadge, { opacity: passOpacity, borderColor: colors.pass }]}>
            <Text style={[styles.badgeText, { color: colors.pass }]}>PASS</Text>
          </Animated.View>

          {/* Action buttons float over the bottom of the card. */}
          <View style={styles.actions} pointerEvents="box-none">
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => swipeOut('PASS')}
            >
              <Text style={[styles.actionGlyph, { color: colors.pass }]}>✕</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => swipeOut('LIKE')}
            >
              <MaterialCommunityIcons name="arm-flex" size={28} color={colors.textInverse} />
            </Pressable>
          </View>
        </Animated.View>
      </View>

      {matchModal}
    </Screen>
  );
}

function Card({ candidate, scale = 1, muted }: { candidate: DiscoveryCandidate; scale?: number; muted?: boolean }) {
  const { colors, radius } = useTheme();
  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        transform: [{ scale }],
        opacity: muted ? 0.85 : 1,
      },
    ]}>
      <DiscoveryCardInner candidate={candidate} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  deck: { flex: 1, padding: 16, justifyContent: 'center' },
  card: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: 16,
    marginVertical: 16,
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  badge: {
    position: 'absolute',
    top: 32,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 3,
    borderRadius: 8,
  },
  likeBadge: { right: 24, transform: [{ rotate: '-20deg' }] },
  passBadge: { left: 24, transform: [{ rotate: '20deg' }] },
  badgeText: { fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  actions: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  actionBtn: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    elevation: 4,
    shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  actionGlyph: { fontSize: 28, fontWeight: '700' },
});
