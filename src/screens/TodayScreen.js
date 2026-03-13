import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchActiveGoals, fetchGoalDetails, fetchGoalStreak } from '../api/client';
import * as secureStore from '../storage/secureStore';
import {
  AppButton,
  AppScreen,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  ProgressBar,
  ScreenHeader,
} from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

const deriveMomentum = (goals = []) => {
  if (!goals.length) return 0;
  const sum = goals.reduce((acc, g) => acc + Number(g?.progress || 0), 0);
  return Math.max(0, Math.min(100, Math.round(sum / goals.length)));
};

const DEFAULT_STREAK = {
  current_streak: 0,
  longest_streak: 0,
  freeze_available: 1,
  last_active_date: null,
  freeze_week_key: null,
};
const FIRE_EMOJI = '\u{1F525}';

const toNumberOrDefault = (value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toFreezeAvailable = (value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback;
  if (value === true) return 1;
  if (value === false) return 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const coerceStreak = (candidate) => {
  if (!candidate || typeof candidate !== 'object') return null;
  const current = candidate.current_streak ?? candidate.currentStreak;
  const longest = candidate.longest_streak ?? candidate.longestStreak;
  const freeze = candidate.freeze_available ?? candidate.freezeAvailable;
  const lastActiveDate = candidate.last_active_date ?? candidate.lastActiveDate;
  const freezeWeekKey = candidate.freeze_week_key ?? candidate.freezeWeekKey;

  if (
    current === undefined &&
    longest === undefined &&
    freeze === undefined &&
    lastActiveDate === undefined &&
    freezeWeekKey === undefined
  ) {
    return null;
  }

  return {
    current_streak: toNumberOrDefault(current, DEFAULT_STREAK.current_streak),
    longest_streak: toNumberOrDefault(longest, DEFAULT_STREAK.longest_streak),
    freeze_available: toFreezeAvailable(freeze, DEFAULT_STREAK.freeze_available),
    last_active_date: lastActiveDate ?? DEFAULT_STREAK.last_active_date,
    freeze_week_key: freezeWeekKey ?? DEFAULT_STREAK.freeze_week_key,
  };
};

const normalizeStreakPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return null;
  return (
    coerceStreak(payload.streak) ||
    coerceStreak(payload.data?.streak) ||
    coerceStreak(payload.data?.data?.streak) ||
    coerceStreak(payload.data?.data) ||
    coerceStreak(payload.data) ||
    coerceStreak(payload)
  );
};

const getGoalPlanId = (goal) => {
  if (!goal || typeof goal !== 'object') return null;
  const candidate =
    goal.plan_id ??
    goal.planId ??
    goal.id ??
    goal.goal_id ??
    goal.goalId ??
    null;
  if (candidate === null || candidate === undefined || candidate === '') return null;
  return candidate;
};

const pickNextTaskFromGoalDetails = (goalDetails) => {
  const milestones = goalDetails?.milestones?.filter(Boolean) || [];
  for (const milestone of milestones) {
    const tasks = (milestone.tasks || []).filter(Boolean);
    const next = tasks.find((t) => t.is_completed !== 1);
    if (next) {
      return {
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        taskId: next.id,
        taskTitle: next.title,
      };
    }
  }
  return null;
};

export default function TodayScreen({ navigation }) {
  const { colors, spacing, typography, radius, elevation } = useAppTheme();

  const [greetingName, setGreetingName] = useState('');
  const greetings = useMemo(
    () => [
      (name) => `Hello ${name}`,
      (name) => `Hi there, ${name}`,
      (name) => `Hi ${name}. How's it going today?`,
    ],
    []
  );
  const greetingText = useMemo(() => {
    const name = (greetingName || '').trim();
    if (!name) return 'Hello';
    const pick = greetings[Math.floor(Math.random() * greetings.length)];
    return pick(name);
  }, [greetingName, greetings]);

  const [goals, setGoals] = useState([]);
  const [activeGoal, setActiveGoal] = useState(null);

  const [nextTask, setNextTask] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingNextTask, setLoadingNextTask] = useState(false);
  const [error, setError] = useState('');

  const [streak, setStreak] = useState(DEFAULT_STREAK);
  const [streakLoading, setStreakLoading] = useState(false);
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const [dailyQuote, setDailyQuote] = useState('');
  const firePulse = useRef(new Animated.Value(0)).current;
  const activeGoalId = useMemo(() => getGoalPlanId(activeGoal), [activeGoal]);
  const hasStreak = useMemo(
    () => Boolean(streak?.last_active_date) || (streak?.current_streak ?? 0) > 0,
    [streak]
  );

  const momentum = useMemo(() => deriveMomentum(goals), [goals]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(firePulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(firePulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [firePulse]);

  useEffect(() => {
    const loadGreeting = async () => {
      // Prefer locally stored profile name (set during auth success), fallback to activeGoal info later if needed.
      const profile = await secureStore.getJsonItemAsync('allison_profile');
      const firstName = String(profile?.firstName || '').trim();
      if (firstName) setGreetingName(firstName);
    };

    loadGreeting();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const response = await fetchActiveGoals();
    if (!response.success) {
      setError(response.error || 'Unable to load your goals right now.');
      setLoading(false);
      return;
    }

    const list = response.data?.data || [];
    setGoals(list);
    const firstGoal = list.find((goal) => getGoalPlanId(goal) !== null) || list[0] || null;
    setActiveGoal(firstGoal);
    setLoading(false);
  }, []);

  const loadNextTask = useCallback(
    async (goal) => {
      const planId = getGoalPlanId(goal);
      if (!planId) {
        setNextTask(null);
        return;
      }

      setLoadingNextTask(true);
      const details = await fetchGoalDetails(planId);
      setLoadingNextTask(false);

      if (details.success) {
        setNextTask(pickNextTaskFromGoalDetails(details.data?.data));
      } else {
        setNextTask(null);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useFocusEffect(
    useCallback(() => {
      if (!activeGoalId) {
        setNextTask(null);
        return;
      }

      loadNextTask(activeGoal);
    }, [activeGoal, activeGoalId, loadNextTask])
  );

  const quotes = useMemo(
    () => [
      'Small steps, big streaks.',
      'Show up today. Future-you is watching.',
      'Progress loves consistency.',
      'One win today. That’s the whole job.',
      'Keep the chain alive.',
      'Discipline beats motivation—especially on quiet days.',
      'Your streak is proof you can do hard things.',
      'Don’t break it. Build it.',
      'Consistency is a superpower.',
      'A little effort today saves a lot tomorrow.',
      'You’re closer than you think—keep going.',
      'Keep promises to yourself.',
      'Momentum is built, not found.',
      'Make it easy: just start.',
      'Action creates confidence.',
      'Do it for the version of you that won’t quit.',
      'Every day counts.',
      'Win the day, then repeat.',
      'Tiny wins stack into big results.',
      'Stay hot. Stay kind to yourself.',
    ],
    []
  );

  const quoteForToday = useCallback(() => {
    const today = new Date();
    const key = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 2147483647;
    return quotes[hash % quotes.length];
  }, [quotes]);

  const loadStreak = useCallback(
    async (goal) => {
      const planId = getGoalPlanId(goal);
      if (!planId) {
        setStreak(DEFAULT_STREAK);
        setDailyQuote(quoteForToday());
        return;
      }

      setStreakLoading(true);
      const res = await fetchGoalStreak(planId);
      setStreakLoading(false);

      const normalized = normalizeStreakPayload(res.data);
      if (res.success && normalized) {
        setStreak(normalized);
      } else {
        setStreak(DEFAULT_STREAK);
      }

      setDailyQuote(quoteForToday());
    },
    [quoteForToday]
  );

  useFocusEffect(
    useCallback(() => {
      if (!activeGoalId) {
        setStreak(DEFAULT_STREAK);
        setDailyQuote(quoteForToday());
        return;
      }

      loadStreak(activeGoal);
    }, [activeGoal, activeGoalId, loadStreak, quoteForToday])
  );

  useFocusEffect(
    useCallback(() => {
      const maybeRefreshAfterToggle = async () => {
        const flags = await secureStore.getJsonItemAsync('allison_runtime_flags');
        const lastTaskToggleAt = Number(flags?.lastTaskToggleAt || 0);
        const lastKnownStreak = flags?.lastKnownStreak;

        if (!lastTaskToggleAt && !lastKnownStreak) return;

        // If we have a cached streak snapshot, apply immediately for snappy UI.
        if (lastKnownStreak && typeof lastKnownStreak === 'object') {
          const normalized = normalizeStreakPayload(lastKnownStreak);
          if (normalized) {
            setStreak((prev) => ({ ...prev, ...normalized }));
          }
        }

        // Clear immediately to avoid repeated refresh.
        await secureStore.mergeJsonItemAsync('allison_runtime_flags', { lastTaskToggleAt: 0, lastKnownStreak: null });

        // Then refresh from API to ensure correctness.
        if (activeGoal) {
          await loadStreak(activeGoal);
          await loadNextTask(activeGoal);
        }
      };

      maybeRefreshAfterToggle();
    }, [activeGoal, loadNextTask, loadStreak])
  );


  if (loading && goals.length === 0) {
    return (
      <AppScreen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </AppScreen>
    );
  }

  if (error && goals.length === 0) {
    return (
      <AppScreen>
        <ErrorState message={error} onAction={load} />
      </AppScreen>
    );
  }

  if (!loading && goals.length === 0) {
    return (
      <AppScreen>
          <EmptyState
            title="No quests yet"
            message="Your next win starts with your first goal. Head to Allison and ask for a starter plan."
          />
      </AppScreen>
    );
  }

  return (
    <AppScreen padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl }}
      >
        <View style={{ paddingTop: spacing.sm }}>
          <ScreenHeader
            title={greetingText}
            subtitle="Tiny wins. Big momentum."
            compact
            rightAction={
              <TouchableOpacity
                onPress={() => setStreakModalVisible(true)}
                style={[styles.streakBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill }]}
                hitSlop={8}
              >
                <Animated.Text
                  style={[
                    typography.h2,
                    {
                      lineHeight: 28,
                      paddingTop: 2,
                      includeFontPadding: false,
                      textAlignVertical: 'center',
                      transform: [
                        { scale: firePulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
                        { rotate: firePulse.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] }) },
                      ],
                    },
                  ]}
                >
                  {FIRE_EMOJI}
                </Animated.Text>
                <Text style={[typography.h3, { color: colors.text, marginLeft: 8 }]}>
                  {streakLoading ? '…' : String(streak?.current_streak ?? 0)}
                </Text>
              </TouchableOpacity>
            }
          />
        </View>

        <View
          style={[
            styles.hero,
            {
              borderRadius: radius.xl,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              ...elevation.medium,
            },
          ]}
        >
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h2, { color: colors.text }]}>Let’s go.</Text>
              <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 6 }]}>
                Your momentum meter updates as you stack wins.
              </Text>
            </View>

            <View
              style={[
                styles.meter,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceMuted,
                  borderRadius: radius.lg,
                },
              ]}
            >
              <Text style={[typography.h3, { color: colors.text }]}>{momentum}%</Text>
              <Text style={[typography.bodySmall, { color: colors.textMuted }]}>Momentum</Text>
            </View>
          </View>

          <View style={{ marginTop: spacing.md }}>
            <ProgressBar value={momentum} color={colors.accent} />
          </View>
        </View>

        <Card variant="outlined" style={{ marginTop: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.h3, { color: colors.text }]}>Pick a quest</Text>
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
              Choose the goal you want to push today.
            </Text>
          </View>

          <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, gap: 10 }}>
            {goals.map((g) => {
              const goalId = getGoalPlanId(g);
              const selected = activeGoalId !== null && activeGoalId === goalId;
              return (
                <Chip
                  key={`goal-${goalId ?? g.goal_summary ?? 'unknown'}`}
                  label={g.goal_summary || 'Untitled'}
                  selected={selected}
                  onPress={() => setActiveGoal(g)}
                  style={{ alignSelf: 'flex-start' }}
                />
              );
            })}
          </View>
        </Card>

        <Card variant="outlined" style={{ marginTop: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.h3, { color: colors.text }]}>Next best step</Text>
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
              One small action that moves everything forward.
            </Text>
          </View>

          {loadingNextTask ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />
          ) : nextTask ? (
            <View style={{ marginTop: 10 }}>
              <View style={styles.questRow}>
                <View
                  style={[
                    styles.questIcon,
                    { backgroundColor: colors.accentSoft, borderRadius: radius.lg },
                  ]}
                >
                  <Ionicons name="sparkles" size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.label, { color: colors.textMuted }]}>
                    Phase {nextTask.milestoneId}: {nextTask.milestoneTitle}
                  </Text>
                  <Text style={[typography.h3, { color: colors.text, marginTop: 4 }]}>
                    {nextTask.taskTitle}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md }}>
                <AppButton
                  label="Do it now"
                  style={{ flex: 1 }}
                  onPress={() =>
                    navigation.navigate('Goals', { screen: 'GoalDetail', params: { planId: activeGoalId } })
                  }
                />
                <AppButton
                  label="Ask Allison"
                  variant="secondary"
                  style={{ flex: 1 }}
                  onPress={() => navigation.navigate('Allison')}
                />
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 10 }}>
              <Text style={[typography.body, { color: colors.textMuted }]}>
                You’re either done (nice) or we couldn’t find the next task. Jump into the goal and pick one.
              </Text>
              <AppButton
                label="Open goal"
                style={{ marginTop: spacing.md }}
                onPress={() =>
                  navigation.navigate('Goals', { screen: 'GoalDetail', params: { planId: activeGoalId } })
                }
              />
            </View>
          )}
        </Card>


      </ScrollView>
      <Modal
        visible={streakModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStreakModalVisible(false)}
      >
        <View style={[styles.streakOverlay, { backgroundColor: colors.overlay }]}>
          <TouchableOpacity style={styles.streakBackdrop} onPress={() => setStreakModalVisible(false)} />
          <View
            style={[
              styles.streakCardWrap,
              {
                paddingHorizontal: spacing.xl,
              },
            ]}
          >
            <Card
              variant="outlined"
              style={{
                borderRadius: radius.xl,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                ...elevation.high,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Animated.Text
                    style={[
                      typography.h2,
                      {
                        marginRight: 10,
                        lineHeight: 28,
                        paddingTop: 2,
                        includeFontPadding: false,
                        textAlignVertical: 'center',
                        transform: [
                          { scale: firePulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
                          { rotate: firePulse.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] }) },
                        ],
                      },
                    ]}
                  >
                    {FIRE_EMOJI}
                  </Animated.Text>
                  <Text style={[typography.h3, { color: colors.text }]}>
                    {String(streak?.current_streak ?? 0)} day streak
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setStreakModalVisible(false)} hitSlop={8}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 8 }]}>
                Best: {String(streak?.longest_streak ?? 0)} • Freeze: {streak?.freeze_available === 1 ? 'Available' : 'Used'}
              </Text>

              <View style={[styles.quoteBox, { borderColor: colors.border, backgroundColor: colors.surfaceMuted, borderRadius: radius.lg }]}>
                <Text style={[typography.body, { color: colors.text }]}>
                  {hasStreak
                    ? dailyQuote
                    : 'No streak yet. Complete a task or log a check-in today to light the fire.'}
                </Text>
              </View>

              <AppButton
                label="Keep it going"
                style={{ marginTop: spacing.md }}
                onPress={() => setStreakModalVisible(false)}
              />
            </Card>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  streakBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 72,
    flexShrink: 0,
  },
  streakOverlay: {
    flex: 1,
    justifyContent: 'center',
  },
  streakBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  streakCardWrap: {
    width: '100%',
  },
  quoteBox: {
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
  },
  hero: {
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  meter: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 108,
    alignItems: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  questRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
  },
  questIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinBtn: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  promptCard: {
    width: '48%',
    borderWidth: 1,
    padding: 14,
    minHeight: 92,
  },
});
