import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, View, Text, Dimensions, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { MatchModal, MatchInfo } from '@/components/MatchModal';
import { useTheme } from '@/theme/ThemeContext';
import { api } from '@/api/endpoints';
import type { DiscoveryCandidate, SwipeDirection } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.25;

export function DiscoveryScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [feed, setFeed] = useState<DiscoveryCandidate[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matched, setMatched] = useState<MatchInfo | null>(null);
  const position = useRef(new Animated.ValueXY()).current;

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.discovery.feed();
      setFeed(res);
      setIndex(0);
    } catch (e) {
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
      const result = await api.swipes.swipe({
        targetUserId: current.userId,
        direction,
      });
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

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6,
      onPanResponderMove: (_e, g) => position.setValue({ x: g.dx, y: g.dy }),
      onPanResponderRelease: (_e, g) => {
        if (g.dx > SWIPE_THRESHOLD)       swipeOut('LIKE');
        else if (g.dx < -SWIPE_THRESHOLD) swipeOut('PASS');
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

  // ---------- Empty / loading states ----------
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
      </Screen>
    );
  }

  // ---------- Card stack ----------
  return (
    <Screen padded={false}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <Text style={[typography.h2, { color: colors.primaryDeep }]}>Discover</Text>
        <Text style={{ color: colors.textSecondary }}>Swipe right to match, left to pass.</Text>
      </View>

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
          <CardInner candidate={current} />
          <Animated.View style={[styles.badge, styles.likeBadge, { opacity: likeOpacity, borderColor: colors.like }]}>
            <Text style={[styles.badgeText, { color: colors.like }]}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.badge, styles.passBadge, { opacity: passOpacity, borderColor: colors.pass }]}>
            <Text style={[styles.badgeText, { color: colors.pass }]}>PASS</Text>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={[styles.actions, { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }]}>
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
          <Text style={[styles.actionGlyph, { color: colors.textInverse }]}>♥</Text>
        </Pressable>
      </View>

      <MatchModal
        match={matched}
        onDismiss={() => setMatched(null)}
        onSendMessage={(m) => {
          setMatched(null);
          navigation.navigate('Conversation', {
            conversationId: m.conversationId,
            otherName: m.otherName,
          });
        }}
      />
    </Screen>
  );
}

// ---------- Card pieces ----------
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
      <CardInner candidate={candidate} />
    </View>
  );
}

function CardInner({ candidate }: { candidate: DiscoveryCandidate }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'space-between' }}>
      <View style={{ alignItems: 'center' }}>
        <Avatar uri={candidate.photoUrl} name={candidate.displayName} size={140} />
        <Text style={[typography.h2, { color: colors.text, marginTop: spacing.lg }]}>
          {candidate.displayName}
        </Text>
        {candidate.city ? (
          <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
            {candidate.city}{candidate.distanceKm != null ? ` · ${candidate.distanceKm.toFixed(1)} km away` : ''}
          </Text>
        ) : null}
      </View>

      {candidate.bio ? (
        <Text style={[typography.body, { color: colors.text, marginVertical: spacing.lg, textAlign: 'center' }]} numberOfLines={4}>
          {candidate.bio}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <Stat label="Shared sports" value={candidate.sharedSports} />
        <Stat label="Shared skills" value={candidate.sharedSkills} />
        <Stat label="Match score" value={candidate.score} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const { colors, typography } = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[typography.h3, { color: colors.primary }]}>{value}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Text>
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
  likeBadge: { 
    right: 24, 
    transform: [{ rotate: '-20deg' }] 
  
  },
  passBadge: { 
    left: 24, 
    transform: [{ rotate: '20deg' }]
  },
  badgeText: { 
    fontSize: 22, 
    fontWeight: '900', 
    letterSpacing: 2 
  },
  actions: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    gap: 24 
  
  },
  actionBtn: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  actionGlyph: { 
    fontSize: 28, 
    fontWeight: '700' 
  },
});
