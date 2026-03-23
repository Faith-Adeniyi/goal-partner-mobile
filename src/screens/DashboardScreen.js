import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchActiveGoals } from '../api/client';
import { AppScreen, Chip, EmptyState, ErrorState, LoadingState, ProgressBar, ScreenHeader } from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

const readCategory = (item) => (item?.category || 'General').trim() || 'General';

export default function DashboardScreen({ navigation }) {
  const { colors, spacing, typography, radius, elevation } = useAppTheme();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const loadGoals = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    const response = await fetchActiveGoals();
    if (response.success) {
      setGoals(response.data?.data || []);
    } else {
      setError(response.error || 'Failed to load goals.');
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [loadGoals])
  );

  const categories = useMemo(() => {
    const set = new Set(goals.map((goal) => readCategory(goal)));
    return ['All', ...Array.from(set)];
  }, [goals]);

  const filteredGoals = useMemo(() => {
    if (activeFilter === 'All') return goals;
    return goals.filter((goal) => readCategory(goal) === activeFilter);
  }, [goals, activeFilter]);

  if (loading && goals.length === 0) {
    return (
      <AppScreen>
        <LoadingState label="Loading your goals..." />
      </AppScreen>
    );
  }

  if (error && goals.length === 0) {
    return (
      <AppScreen>
        <ErrorState message={error} onAction={() => loadGoals()} />
      </AppScreen>
    );
  }

  if (!loading && goals.length === 0) {
    return (
      <AppScreen>
        <EmptyState title="No goals yet" message="Create your first goal to start building momentum." />
      </AppScreen>
    );
  }

  return (
    <AppScreen padded={false}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadGoals({ isRefresh: true })} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxxl }}
      >
        <ScreenHeader title="Goals" subtitle="Track active milestones across your focus areas." compact />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm }}>
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              selected={activeFilter === category}
              onPress={() => setActiveFilter(category)}
            />
          ))}
        </View>

        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          {filteredGoals.map((item) => {
            const progress = Number(item?.progress || 0);
            const dueText = item?.target_date ? `Target ${item.target_date}` : 'No target date';
            const onTrack = progress >= 50;
            const statusBg = onTrack ? colors.mintSoft : colors.amberSoft;
            const statusText = onTrack ? colors.success : colors.warning;

            return (
              <TouchableOpacity
                key={String(item.plan_id)}
                onPress={() => navigation.navigate('GoalDetail', { planId: item.plan_id })}
                activeOpacity={0.9}
                style={[
                  styles.goalCard,
                  {
                    borderRadius: radius.xl,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    ...elevation.medium,
                  },
                ]}
              >
                <View style={styles.goalHeader}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <View
                      style={[
                        styles.categoryPill,
                        {
                          backgroundColor: colors.surfaceMuted,
                          borderRadius: radius.pill,
                        },
                      ]}
                    >
                      <Text style={[typography.caption, { color: colors.textMuted }]}>{readCategory(item)}</Text>
                    </View>
                    <Text style={[typography.h3, { color: colors.text, marginTop: spacing.xs }]} numberOfLines={2}>
                      {item?.goal_summary || 'Untitled goal'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: statusBg,
                        borderRadius: radius.pill,
                      },
                    ]}
                  >
                    <Text style={[typography.caption, { color: statusText }]}>{onTrack ? 'On Track' : 'Attention'}</Text>
                  </View>
                </View>

                <View style={{ marginTop: spacing.md }}>
                  <View style={styles.progressRow}>
                    <Text style={[typography.display, { color: colors.accent, fontSize: 32, lineHeight: 36 }]}>{progress}%</Text>
                    <Text style={[typography.bodySmall, { color: colors.textSubtle }]}>{dueText}</Text>
                  </View>
                  <ProgressBar value={progress} color={progress === 100 ? colors.success : colors.accent} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={() => navigation.navigate('Allison')}
        style={[
          styles.fab,
          {
            borderRadius: radius.lg,
            backgroundColor: colors.accent,
            ...elevation.high,
          },
        ]}
      >
        <Ionicons name="add" size={26} color="#ffffff" />
      </TouchableOpacity>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  goalCard: {
    borderWidth: 1,
    padding: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 92,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
