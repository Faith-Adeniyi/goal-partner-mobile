import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { fetchActiveGoals, submitWeeklyReview } from '../api/client';
import { AppButton, AppScreen, Card, Chip, EmptyState, ErrorState, ProgressBar, ScreenHeader } from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

const deriveMomentum = (goals = []) => {
  if (!goals.length) return 0;
  const sum = goals.reduce((acc, g) => acc + Number(g?.progress || 0), 0);
  return Math.max(0, Math.min(100, Math.round(sum / goals.length)));
};

export default function InsightsScreen() {
  const { colors, spacing, typography, radius, elevation } = useAppTheme();

  const [goals, setGoals] = useState([]);
  const [activeGoal, setActiveGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [energy, setEnergy] = useState('steady');
  const [wins, setWins] = useState('');
  const [blockers, setBlockers] = useState('');
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const momentum = useMemo(() => deriveMomentum(goals), [goals]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const response = await fetchActiveGoals();
    setLoading(false);

    if (!response.success) {
      setError(response.error || 'Unable to load insights.');
      return;
    }

    const list = response.data?.data || [];
    setGoals(list);
    setActiveGoal((prev) => prev || list[0] || null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSubmit = async () => {
    if (!activeGoal?.plan_id || sending) return;

    setSending(true);
    setSubmitError('');
    setSubmitSuccess('');

    const response = await submitWeeklyReview(activeGoal.plan_id, {
      energy_level: energy,
      wins,
      blockers,
    });

    setSending(false);

    if (!response.success) {
      setSubmitError(response.error || 'Failed to submit weekly review.');
      return;
    }

    setSubmitSuccess('Weekly review sent. Allison updated your coaching memory.');
    setWins('');
    setBlockers('');
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
        <EmptyState title="No insights yet" message="Create a goal first, then your progress shows up here." />
      </AppScreen>
    );
  }

  return (
    <AppScreen padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxxl }}
      >
        <ScreenHeader title="Clock-Rails Map" subtitle="Architectural overview of your active goals." compact />

        <Card
          variant="elevated"
          style={{
            marginTop: spacing.md,
            borderRadius: radius.xl,
            borderColor: colors.border,
            ...elevation.medium,
          }}
        >
          <Text style={[typography.label, { color: colors.textSubtle, textTransform: 'uppercase' }]}>Project Integrity</Text>
          <View style={styles.heroRow}>
            <View style={{ flex: 1, marginRight: spacing.md }}>
              <Text style={[typography.h2, { color: colors.text }]}>
                {activeGoal?.goal_summary || 'Active Goal'}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 6 }]}>
                Visualize your execution health and focus on next dependencies.
              </Text>
            </View>
            <View
              style={[
                styles.integrityCircle,
                {
                  borderRadius: radius.pill,
                  borderColor: colors.accentSoft,
                  backgroundColor: colors.surfaceMuted,
                },
              ]}
            >
              <Text style={[typography.h2, { color: colors.accent }]}>{momentum}%</Text>
              <Text style={[typography.caption, { color: colors.textSubtle }]}>INTEGRITY</Text>
            </View>
          </View>
          <ProgressBar value={momentum} color={colors.accent} style={{ marginTop: spacing.sm }} />
        </Card>

        <Card variant="outlined" style={{ marginTop: spacing.md }}>
          <Text style={[typography.label, { color: colors.textSubtle, textTransform: 'uppercase' }]}>Select Goal</Text>
          <View style={{ marginTop: spacing.sm, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {goals.map((g) => (
              <Chip
                key={`goal-${g.plan_id}`}
                label={g.goal_summary || 'Untitled'}
                selected={activeGoal?.plan_id === g.plan_id}
                onPress={() => setActiveGoal(g)}
              />
            ))}
          </View>
        </Card>

        <Card
          variant="outlined"
          style={{
            marginTop: spacing.md,
            borderRadius: radius.xl,
          }}
        >
          <Text style={[typography.h3, { color: colors.text }]}>Weekly Review</Text>
          <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 4 }]}>
            Reflect quickly. Allison uses this to calibrate next week&apos;s support.
          </Text>

          <Text style={[typography.label, { color: colors.textSubtle, marginTop: spacing.md, textTransform: 'uppercase' }]}>
            Energy Level
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.xs }}>
            {[
              { id: 'low', label: 'Low' },
              { id: 'steady', label: 'Steady' },
              { id: 'high', label: 'High' },
            ].map((item) => (
              <Chip key={item.id} label={item.label} selected={energy === item.id} onPress={() => setEnergy(item.id)} />
            ))}
          </View>

          <Text style={[typography.label, { color: colors.textSubtle, marginTop: spacing.md, textTransform: 'uppercase' }]}>
            Wins
          </Text>
          <TextInput
            value={wins}
            onChangeText={setWins}
            placeholder="What moved forward this week?"
            placeholderTextColor={colors.textSubtle}
            style={[
              styles.textArea,
              typography.body,
              {
                borderColor: colors.surfaceHigh,
                borderRadius: radius.lg,
                backgroundColor: colors.surfaceMuted,
                color: colors.text,
              },
            ]}
            multiline
          />

          <Text style={[typography.label, { color: colors.textSubtle, marginTop: spacing.md, textTransform: 'uppercase' }]}>
            Blockers
          </Text>
          <TextInput
            value={blockers}
            onChangeText={setBlockers}
            placeholder="What blocked momentum?"
            placeholderTextColor={colors.textSubtle}
            style={[
              styles.textArea,
              typography.body,
              {
                borderColor: colors.surfaceHigh,
                borderRadius: radius.lg,
                backgroundColor: colors.surfaceMuted,
                color: colors.text,
              },
            ]}
            multiline
          />

          {submitError ? <Text style={[typography.bodySmall, { color: colors.danger, marginTop: 10 }]}>{submitError}</Text> : null}

          {submitSuccess ? (
            <View
              style={[
                styles.successRow,
                {
                  borderRadius: radius.lg,
                  backgroundColor: colors.accentSoft,
                },
              ]}
            >
              <Ionicons name="sparkles" size={18} color={colors.accent} />
              <Text style={[typography.bodySmall, { color: colors.text, marginLeft: 8, flex: 1 }]}>{submitSuccess}</Text>
            </View>
          ) : null}

          <AppButton label="Send Weekly Review" style={{ marginTop: spacing.md }} onPress={handleSubmit} loading={sending} />
        </Card>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  integrityCircle: {
    width: 108,
    height: 108,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 88,
    marginTop: 8,
    textAlignVertical: 'top',
  },
  successRow: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
