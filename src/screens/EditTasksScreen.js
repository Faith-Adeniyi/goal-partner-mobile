import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';

import {
  addMilestoneTask,
  deleteMilestoneTask,
  fetchGoalDetails,
  reorderMilestoneTasks,
  updateGoalMeta,
  updateMilestoneTask,
} from '../api/client';
import { AppButton, AppScreen, Card, ErrorState, ScreenHeader } from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

const isValidIsoDate = (value) => {
  if (!value) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
};

export default function EditTasksScreen({ route, navigation }) {
  const { planId } = route.params;
  const { colors, spacing, typography, radius, elevation } = useAppTheme();

  const [goalData, setGoalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [targetDate, setTargetDate] = useState('');
  const [draftMilestones, setDraftMilestones] = useState([]);

  const [editingTask, setEditingTask] = useState(null); // { milestoneId, taskId }
  const [taskTitleDraft, setTaskTitleDraft] = useState('');
  const [taskDueDraft, setTaskDueDraft] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetchGoalDetails(planId);
    if (!res.success) {
      setError(res.error || 'Failed to load goal.');
      setLoading(false);
      return;
    }

    const payload = res.data?.data || null;
    setGoalData(payload);

    const metaTarget = payload?.meta?.target_date || payload?.target_date || '';
    setTargetDate(metaTarget);

    setDraftMilestones((payload?.milestones || []).filter(Boolean));
    setLoading(false);
  }, [planId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveTargetDate = useCallback(async () => {
    if (!isValidIsoDate(targetDate)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD (example: 2026-03-31).');
      return;
    }
    setSaving(true);
    const res = await updateGoalMeta(planId, { target_date: targetDate || null });
    setSaving(false);
    if (!res.success) {
      Alert.alert('Failed', res.error || 'Could not update target date.');
      return;
    }
    await load();
  }, [load, planId, targetDate]);

  const openEditTask = useCallback((milestoneId, task) => {
    setEditingTask({ milestoneId, taskId: task.id });
    setTaskTitleDraft(task.title || '');
    setTaskDueDraft(task.due_date || '');
  }, []);

  const closeEditTask = useCallback(() => {
    setEditingTask(null);
    setTaskTitleDraft('');
    setTaskDueDraft('');
  }, []);

  const saveTaskEdits = useCallback(async () => {
    if (!editingTask) return;

    const title = (taskTitleDraft || '').trim();
    if (!title) {
      Alert.alert('Title required', 'Task title cannot be empty.');
      return;
    }
    if (!isValidIsoDate(taskDueDraft)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD or leave blank.');
      return;
    }

    setSaving(true);
    const res = await updateMilestoneTask(planId, editingTask.milestoneId, editingTask.taskId, {
      title,
      due_date: taskDueDraft || null,
    });
    setSaving(false);

    if (!res.success) {
      Alert.alert('Failed', res.error || 'Could not update task.');
      return;
    }

    closeEditTask();
    await load();
  }, [closeEditTask, editingTask, load, planId, taskDueDraft, taskTitleDraft]);

  const handleAddTask = useCallback(
    async (milestoneId) => {
      setSaving(true);
      const res = await addMilestoneTask(planId, milestoneId, {
        title: 'New task',
        due_date: null,
      });
      setSaving(false);
      if (!res.success) {
        Alert.alert('Failed', res.error || 'Could not add task.');
        return;
      }
      await load();
    },
    [load, planId]
  );

  const handleDeleteTask = useCallback(
    async (milestoneId, taskId) => {
      Alert.alert('Delete task?', 'This will remove the task and re-number the remaining tasks.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            const res = await deleteMilestoneTask(planId, milestoneId, taskId);
            setSaving(false);
            if (!res.success) {
              Alert.alert('Failed', res.error || 'Could not delete task.');
              return;
            }
            await load();
          },
        },
      ]);
    },
    [load, planId]
  );

  const handleReorder = useCallback(
    async (milestoneId, orderedIds) => {
      setSaving(true);
      const res = await reorderMilestoneTasks(planId, milestoneId, orderedIds);
      setSaving(false);
      if (!res.success) {
        Alert.alert('Failed', res.error || 'Could not reorder tasks.');
        await load();
        return;
      }
      await load();
    },
    [load, planId]
  );

  const milestones = useMemo(() => (draftMilestones || []).filter(Boolean), [draftMilestones]);

  if (loading) {
    return (
      <AppScreen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen>
        <ErrorState message={error} onAction={load} />
      </AppScreen>
    );
  }

  const listHeader = (
    <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
      <ScreenHeader
        title="Edit tasks"
        subtitle={goalData?.goal_summary || 'Goal'}
        leftAction={
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        }
      />

      <Card variant="outlined" style={{ marginTop: spacing.md }}>
        <Text style={[typography.h3, { color: colors.text }]}>Target date</Text>
        <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 6 }]}>
          Allison will auto-generate due dates from this date. You can still edit individual tasks.
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.label, { color: colors.textMuted, marginBottom: 6 }]}>YYYY-MM-DD</Text>
            <TextInput
              value={targetDate}
              onChangeText={setTargetDate}
              placeholder="2026-03-31"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                typography.body,
                {
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
            />
          </View>
          <AppButton label={saving ? 'Saving...' : 'Save'} onPress={saveTargetDate} disabled={saving} />
        </View>
      </Card>
    </View>
  );

  return (
    <AppScreen padded={false}>
      <DraggableFlatList
        data={milestones}
        keyExtractor={(item) => `milestone-${item.id}`}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        renderItem={({ item: milestone }) => (
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
            <Card variant="outlined">
              <View style={styles.milestoneHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h3, { color: colors.text }]}>
                    Phase {milestone.id}: {milestone.title}
                  </Text>
                  {milestone.due_date ? (
                    <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 4 }]}>
                      Due: {milestone.due_date}
                    </Text>
                  ) : null}
                </View>

                <AppButton
                  label="Add task"
                  variant="secondary"
                  onPress={() => handleAddTask(milestone.id)}
                  disabled={saving}
                />
              </View>

              <View style={{ marginTop: spacing.md }}>
                <DraggableFlatList
                  data={(milestone.tasks || []).filter(Boolean)}
                  keyExtractor={(task) => `task-${milestone.id}-${task.id}`}
                  onDragEnd={({ data }) => {
                    const orderedIds = data.map((t) => t.id);
                    handleReorder(milestone.id, orderedIds);
                  }}
                  renderItem={({ item, drag, isActive }) => (
                    <ScaleDecorator>
                      <TouchableOpacity
                        onLongPress={drag}
                        disabled={isActive}
                        style={[
                          styles.taskRow,
                          {
                            borderColor: colors.border,
                            backgroundColor: isActive ? colors.surfaceMuted : colors.background,
                            borderRadius: radius.lg,
                          },
                        ]}
                      >
                        <View style={[styles.dragHandle, { backgroundColor: colors.surfaceMuted }]}>
                          <Ionicons name="reorder-three-outline" size={20} color={colors.textMuted} />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={[typography.body, { color: colors.text }]} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 4 }]}>
                            Due: {item.due_date || '—'}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => openEditTask(milestone.id, item)}
                          style={styles.rowIconBtn}
                          hitSlop={8}
                        >
                          <Ionicons name="create-outline" size={18} color={colors.accent} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeleteTask(milestone.id, item.id)}
                          style={styles.rowIconBtn}
                          hitSlop={8}
                        >
                          <Ionicons name="trash-outline" size={18} color={colors.danger} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    </ScaleDecorator>
                  )}
                />
              </View>
            </Card>
          </View>
        )}
      />

      <Modal visible={!!editingTask} transparent animationType="fade" onRequestClose={closeEditTask}>
        <KeyboardAvoidingView
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.backdrop} onPress={closeEditTask} />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
                borderRadius: radius.xl,
                borderColor: colors.border,
                ...elevation.high,
              },
            ]}
          >
            <Text style={[typography.h3, { color: colors.text }]}>Edit task</Text>

            <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing.md }]}>Title</Text>
            <TextInput
              value={taskTitleDraft}
              onChangeText={setTaskTitleDraft}
              placeholder="Task title"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                typography.body,
                {
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  backgroundColor: colors.surface,
                  color: colors.text,
                },
              ]}
            />

            <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing.md }]}>
              Due date (YYYY-MM-DD)
            </Text>
            <TextInput
              value={taskDueDraft}
              onChangeText={setTaskDueDraft}
              placeholder="2026-03-31"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                typography.body,
                {
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  backgroundColor: colors.surface,
                  color: colors.text,
                },
              ]}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.lg }}>
              <AppButton label="Cancel" variant="secondary" style={{ flex: 1 }} onPress={closeEditTask} />
              <AppButton
                label={saving ? 'Saving...' : 'Save'}
                style={{ flex: 1 }}
                onPress={saveTaskEdits}
                disabled={saving}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  taskRow: {
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  dragHandle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  rowIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    borderWidth: 1,
    padding: 18,
  },
});
