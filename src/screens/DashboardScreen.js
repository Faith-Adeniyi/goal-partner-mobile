import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchActiveGoals } from '../api/client';
import {
  AppScreen,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressBar,
  ScreenHeader,
} from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

export default function DashboardScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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

  const renderGoalCard = ({ item }) => {
    const progress = Number(item?.progress || 0);
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('GoalDetail', { planId: item.plan_id })}
        activeOpacity={0.86}
      >
        <Card variant="outlined" style={{ marginBottom: spacing.md }}>
          <View style={styles.cardHeader}>
            <Chip label={item?.category || 'General'} variant="accent" />
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>{progress}%</Text>
          </View>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]} numberOfLines={2}>
            {item?.goal_summary || 'Untitled goal'}
          </Text>
          <ProgressBar value={progress} color={progress === 100 ? colors.success : colors.accent} />
        </Card>
      </TouchableOpacity>
    );
  };

  const content = (() => {
    if (loading && goals.length === 0) {
      return <LoadingState label="Loading your goals..." />;
    }

    if (error && goals.length === 0) {
      return <ErrorState message={error} onAction={() => loadGoals()} />;
    }

    if (!loading && goals.length === 0) {
      return (
        <EmptyState
          title="No goals yet"
          message="Create your first goal to start building momentum."
        />
      );
    }

    return (
      <FlatList
        data={goals}
        keyExtractor={(item) => String(item.plan_id)}
        renderItem={renderGoalCard}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => loadGoals({ isRefresh: true })}
      />
    );
  })();

  return (
    <AppScreen padded={false}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
        <ScreenHeader
          title="Today's goals"
          subtitle="Keep moving one task at a time."
          compact
        />
      </View>
      {content}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
});
