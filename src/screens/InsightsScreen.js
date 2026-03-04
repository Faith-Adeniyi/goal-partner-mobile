import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { fetchActiveGoals, submitWeeklyReview } from '../api/client';
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

    setSubmitSuccess('Weekly review sent. Proud of you.');
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
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl }}
      >
        <View style={{ paddingTop: spacing.sm }}>
          <ScreenHeader title="Insights" subtitle="Your progress, but make it fun." compact />
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
              <Text style={[typography.h2, { color: colors.text }]}>This week’s vibe</Text>
              <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 6 }]}>
                Keep it honest. We optimize from reality.
              </Text>
            </View>

            <View style={[styles.badge, { borderRadius: radius.lg, backgroundColor: colors.accentSoft }]}>
              <Ionicons name="trophy" size={18} color={colors.accent} />
              <Text style={[typography.label, { color: colors.accent, marginLeft: 8 }]}>{momentum}%</Text>
            </View>
          </View>

          <View style={{ marginTop: spacing.md }}>
            <ProgressBar value={momentum} color={colors.accent} />
          </View>
        </View>

        <Card variant="outlined" style={{ marginTop: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.h3, { color: colors.text }]}>Choose a goal</Text>
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>Your review is goal-specific.</Text>
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
            <Text style={[typography.h3, { color: colors.text }]}>Weekly review</Text>
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
              Quick reflection → sharper next week.
            </Text>
          </View>

          <View style={{ paddingHorizontal: 14, paddingBottom: 14, marginTop: 10 }}>
            <Text style={[typography.label, { color: colors.textMuted }]}>Energy</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {[
                { id: 'low', label: 'Low' },
                { id: 'steady', label: 'Steady' },
                { id: 'high', label: 'High' },
              ].map((item) => (
                <Chip key={item.id} label={item.label} selected={energy === item.id} onPress={() => setEnergy(item.id)} />
              ))}
            </View>

            <Text style={[typography.label, { color: colors.textMuted, marginTop: 14 }]}>Wins</Text>
            <TextInput
              value={wins}
              onChangeText={setWins}
              placeholder="What went well?"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.textArea,
                typography.body,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  borderRadius: radius.lg,
                  color: colors.text,
                },
              ]}
              multiline
            />

            <Text style={[typography.label, { color: colors.textMuted, marginTop: 14 }]}>Blockers</Text>
            <TextInput
              value={blockers}
              onChangeText={setBlockers}
              placeholder="What got in the way?"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.textArea,
                typography.body,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  borderRadius: radius.lg,
                  color: colors.text,
                },
              ]}
              multiline
            />

            {submitError ? (
              <Text style={[typography.bodySmall, { color: colors.danger, marginTop: 10 }]}>{submitError}</Text>
            ) : null}

            {submitSuccess ? (
              <View style={[styles.successRow, { backgroundColor: colors.accentSoft, borderRadius: radius.lg }]}>
                <Ionicons name="sparkles" size={18} color={colors.accent} />
                <Text style={[typography.bodySmall, { color: colors.text, marginLeft: 8 }]}>{submitSuccess}</Text>
              </View>
            ) : null}

            <AppButton label="Send weekly review" style={{ marginTop: 14 }} onPress={handleSubmit} loading={sending} />
            <TouchableOpacity
              onPress={() => {
                setWins('');
                setBlockers('');
                setSubmitError('');
                setSubmitSuccess('');
              }}
              style={{ alignSelf: 'flex-start', marginTop: 10 }}
            >
              <Text style={[typography.bodySmall, { color: colors.accent }]}>Reset</Text>
            </TouchableOpacity>
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionHeader: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  textArea: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 92,
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
