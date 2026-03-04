import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchActiveGoals, fetchGoalDetails, submitDailyCheckin } from '../api/client';
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

  const [goals, setGoals] = useState([]);
  const [activeGoal, setActiveGoal] = useState(null);

  const [nextTask, setNextTask] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingNextTask, setLoadingNextTask] = useState(false);
  const [error, setError] = useState('');

  const [energy, setEnergy] = useState('steady');
  const [checkinSending, setCheckinSending] = useState(false);
  const [checkinError, setCheckinError] = useState('');

  const momentum = useMemo(() => deriveMomentum(goals), [goals]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setCheckinError('');

    const response = await fetchActiveGoals();
    if (!response.success) {
      setError(response.error || 'Unable to load your goals right now.');
      setLoading(false);
      return;
    }

    const list = response.data?.data || [];
    setGoals(list);

    const firstGoal = list[0] || null;
    setActiveGoal(firstGoal);
    setLoading(false);
  }, []);

  const loadNextTask = useCallback(
    async (goal) => {
      if (!goal?.plan_id) {
        setNextTask(null);
        return;
      }

      setLoadingNextTask(true);
      const details = await fetchGoalDetails(goal.plan_id);
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
      loadNextTask(activeGoal);
    }, [activeGoal, loadNextTask])
  );

  const handleQuickCheckin = async (workedToday) => {
    if (!activeGoal?.plan_id || checkinSending) return;
    setCheckinSending(true);
    setCheckinError('');

    const response = await submitDailyCheckin(activeGoal.plan_id, {
      worked_today: workedToday,
      energy_level: energy,
      notes: workedToday ? 'Checked in from Today screen.' : '',
      blockers: workedToday ? '' : 'Need help getting unstuck.',
    });

    setCheckinSending(false);
    if (!response.success) {
      setCheckinError(response.error || 'Failed to submit check-in.');
    }
  };

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
          <ScreenHeader title="Today" subtitle="Tiny wins. Big momentum." compact />
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {goals.map((g) => {
                const selected = activeGoal?.plan_id === g.plan_id;
                return (
                  <Chip
                    key={`goal-${g.plan_id}`}
                    label={g.goal_summary || 'Untitled'}
                    selected={selected}
                    onPress={() => setActiveGoal(g)}
                  />
                );
              })}
            </View>
          </ScrollView>
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
                  onPress={() => navigation.navigate('Goals', { screen: 'GoalDetail', params: { planId: activeGoal.plan_id } })}
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
                onPress={() => navigation.navigate('Goals', { screen: 'GoalDetail', params: { planId: activeGoal?.plan_id } })}
              />
            </View>
          )}
        </Card>

        <Card variant="outlined" style={{ marginTop: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.h3, { color: colors.text }]}>Quick check-in</Text>
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
              Fast signal → smarter coaching.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {[
              { id: 'low', label: 'Low' },
              { id: 'steady', label: 'Steady' },
              { id: 'high', label: 'High' },
            ].map((item) => (
              <Chip key={item.id} label={item.label} selected={energy === item.id} onPress={() => setEnergy(item.id)} />
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md }}>
            <TouchableOpacity
              onPress={() => handleQuickCheckin(true)}
              style={[
                styles.checkinBtn,
                {
                  backgroundColor: colors.accent,
                  borderRadius: radius.pill,
                  opacity: checkinSending ? 0.6 : 1,
                },
              ]}
              disabled={checkinSending}
            >
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
              <Text style={[typography.label, { color: '#ffffff', marginLeft: 8 }]}>I worked today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickCheckin(false)}
              style={[
                styles.checkinBtn,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: checkinSending ? 0.6 : 1,
                },
              ]}
              disabled={checkinSending}
            >
              <Ionicons name="help-circle" size={18} color={colors.accent} />
              <Text style={[typography.label, { color: colors.text, marginLeft: 8 }]}>I’m stuck</Text>
            </TouchableOpacity>
          </View>

          {checkinError ? (
            <Text style={[typography.bodySmall, { color: colors.danger, marginTop: spacing.sm }]}>
              {checkinError}
            </Text>
          ) : null}
        </Card>

        <Card variant="outlined" style={{ marginTop: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.h3, { color: colors.text }]}>Fast Allison prompts</Text>
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
              Tap one. Don’t overthink it.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
            {[
              { icon: 'git-branch-outline', label: 'Break down', to: 'Allison' },
              { icon: 'calendar-outline', label: 'Plan today', to: 'Allison' },
              { icon: 'flash-outline', label: 'Boost me', to: 'Allison' },
              { icon: 'trophy-outline', label: 'Review week', to: 'Insights' },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => navigation.navigate(item.to)}
                style={[
                  styles.promptCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.lg,
                    ...elevation.low,
                  },
                ]}
              >
                <Ionicons name={item.icon} size={18} color={colors.accent} />
                <Text style={[typography.label, { color: colors.text, marginTop: 10 }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
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
