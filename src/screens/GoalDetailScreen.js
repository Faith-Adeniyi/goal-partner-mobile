import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  fetchGoalDetails,
  sendCoachMessage,
  submitDailyCheckin,
  toggleTaskStatus,
} from '../api/client';
import ClockRailMap from '../components/ClockRailMap';
import {
  AppButton,
  AppScreen,
  Card,
  Chip,
  ErrorState,
  LoadingState,
  ScreenHeader,
  SegmentedControl,
} from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

export default function GoalDetailScreen({ route, navigation }) {
  const { planId } = route.params;
  const { colors, spacing, typography, radius, elevation } = useAppTheme();

  const [goalData, setGoalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPhases, setExpandedPhases] = useState({});
  const [viewMode, setViewMode] = useState('checklist');
  const [activePhaseId, setActivePhaseId] = useState(null);

  const [isCoachModalVisible, setCoachModalVisible] = useState(false);
  const [selectedEnergy, setSelectedEnergy] = useState('steady');
  const [coachInput, setCoachInput] = useState('');
  const [coachMessages, setCoachMessages] = useState([
    { id: 'bootstrap', sender: 'ai', text: "How are you feeling today, and what's your top priority?" },
  ]);
  const [isCoachThinking, setIsCoachThinking] = useState(false);
  const [coachError, setCoachError] = useState('');
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);
  const [checkinError, setCheckinError] = useState('');

  const loadGoalData = useCallback(async () => {
    setLoading(true);
    setError('');

    const response = await fetchGoalDetails(planId);
    if (!response.success) {
      setError(response.error || 'Unable to load this goal right now.');
      setLoading(false);
      return;
    }

    const payload = response.data?.data || null;
    setGoalData(payload);
    setLoading(false);

    const milestones = payload?.milestones?.filter(Boolean) || [];
    if (milestones.length > 0) {
      const first = milestones[0];
      setExpandedPhases((prev) => (Object.keys(prev).length === 0 ? { [first.id]: true } : prev));
      setActivePhaseId((prev) => prev || first.id);
    }
  }, [planId]);

  useEffect(() => {
    loadGoalData();
  }, [loadGoalData]);

  const handleToggleTask = async (milestoneId, taskId) => {
    if (!milestoneId || !taskId) return;
    const response = await toggleTaskStatus(planId, milestoneId, taskId);
    if (response.success) {
      loadGoalData();
    }
  };

  const handleSendCoachMessage = async (prefilled = null) => {
    const messageText = (prefilled || coachInput).trim();
    if (!messageText || isCoachThinking) return;

    const userMessage = { id: `${Date.now()}-user`, sender: 'user', text: messageText };
    const nextHistory = [...coachMessages, userMessage];
    setCoachMessages(nextHistory);
    setCoachInput('');
    setCoachError('');
    setIsCoachThinking(true);

    const response = await sendCoachMessage(planId, messageText, nextHistory, selectedEnergy);
    setIsCoachThinking(false);

    if (response.success) {
      setCoachMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-ai`, sender: 'ai', text: response.data?.reply || 'Keep your momentum going.' },
      ]);
      return;
    }

    setCoachError(response.error || 'Coach is unavailable right now.');
  };

  const handleDailyCheckin = async ({ workedToday, notes = '', blockers = '' }) => {
    if (isSubmittingCheckin) return;

    setIsSubmittingCheckin(true);
    setCheckinError('');
    const response = await submitDailyCheckin(planId, {
      worked_today: workedToday,
      notes,
      blockers,
      energy_level: selectedEnergy,
    });
    if (!response.success) {
      setCheckinError(response.error || 'Failed to submit check-in.');
    }
    setIsSubmittingCheckin(false);
  };

  const milestones = useMemo(() => goalData?.milestones?.filter(Boolean) || [], [goalData]);
  const activeMilestoneData = milestones.find((m) => m.id === activePhaseId) || milestones[0] || null;

  if (loading && !goalData) {
    return (
      <AppScreen>
        <LoadingState label="Loading goal details..." />
      </AppScreen>
    );
  }

  if (error && !goalData) {
    return (
      <AppScreen>
        <ErrorState message={error} onAction={loadGoalData} />
      </AppScreen>
    );
  }

  const backAction = (
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
      <Ionicons name="arrow-back" size={24} color={colors.text} />
    </TouchableOpacity>
  );

  return (
    <AppScreen padded={false}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
        <ScreenHeader
          title={goalData?.goal_summary || 'Goal details'}
          subtitle={goalData?.target_date ? `Target date: ${goalData.target_date}` : 'Stay focused on the next action.'}
          leftAction={backAction}
        />
        <SegmentedControl
          options={[
            { label: 'Checklist', value: 'checklist' },
            { label: 'Timeline', value: 'timeline' },
          ]}
          value={viewMode}
          onChange={setViewMode}
          style={{ marginBottom: spacing.md }}
        />
      </View>

      {viewMode === 'timeline' ? (
        <View style={{ flex: 1 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.xs, paddingBottom: spacing.md }}
          >
            {milestones.map((milestone) => (
              <Chip
                key={`phase-${milestone.id}`}
                label={`Phase ${milestone.id}`}
                selected={activePhaseId === milestone.id}
                onPress={() => setActivePhaseId(milestone.id)}
              />
            ))}
          </ScrollView>
          <View style={{ flex: 1 }}>
            <ClockRailMap milestone={activeMilestoneData} onToggleTask={handleToggleTask} />
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.xxxl + 44,
          }}
          showsVerticalScrollIndicator={false}
        >
          {milestones.map((milestone) => {
            const isExpanded = !!expandedPhases[milestone.id];

            return (
              <Card key={`milestone-${milestone.id}`} variant="outlined" style={{ marginBottom: spacing.md }}>
                <TouchableOpacity
                  style={styles.milestoneHeader}
                  onPress={() =>
                    setExpandedPhases((prev) => ({
                      ...prev,
                      [milestone.id]: !prev[milestone.id],
                    }))
                  }
                >
                  <Text style={[typography.h3, { color: colors.text, flex: 1 }]}>
                    Phase {milestone.id}: {milestone.title}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                {isExpanded ? (
                  <View style={{ marginTop: spacing.sm, gap: spacing.md }}>
                    {(milestone.tasks || []).filter(Boolean).map((task) => {
                      const done = task.is_completed === 1;
                      return (
                        <TouchableOpacity
                          key={`task-${task.id}`}
                          style={styles.taskRow}
                          onPress={() => handleToggleTask(milestone.id, task.id)}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              {
                                borderColor: done ? colors.success : colors.border,
                                backgroundColor: done ? colors.success : 'transparent',
                                borderRadius: radius.sm,
                              },
                            ]}
                          >
                            {done ? <Ionicons name="checkmark" size={14} color="#ffffff" /> : null}
                          </View>
                          <Text
                            style={[
                              typography.body,
                              {
                                color: done ? colors.textMuted : colors.text,
                                textDecorationLine: done ? 'line-through' : 'none',
                              },
                            ]}
                          >
                            {task.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </Card>
            );
          })}
        </ScrollView>
      )}

      <TouchableOpacity
        onPress={() => setCoachModalVisible(true)}
        style={[
          styles.fab,
          {
            backgroundColor: colors.accent,
            borderRadius: radius.pill,
            ...elevation.high,
          },
        ]}
      >
        <Ionicons name="chatbubbles-outline" size={22} color="#ffffff" />
      </TouchableOpacity>

      <Modal
        visible={isCoachModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCoachModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.backdrop} onPress={() => setCoachModalVisible(false)} />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={[styles.dragHandle, { backgroundColor: colors.textMuted }]} />
              <Text style={[typography.h3, { color: colors.text, marginTop: spacing.sm }]}>Daily Coach</Text>
            </View>

            <Card variant="default" style={{ marginHorizontal: spacing.xl, marginBottom: spacing.md }}>
              <Text style={[typography.label, { color: colors.text, marginBottom: spacing.sm }]}>
                Energy level
              </Text>
              <View style={styles.energyRow}>
                {[
                  { id: 'low', label: 'Low energy' },
                  { id: 'steady', label: 'Steady' },
                  { id: 'high', label: 'High energy' },
                ].map((energy) => (
                  <Chip
                    key={energy.id}
                    label={energy.label}
                    selected={selectedEnergy === energy.id}
                    onPress={() => setSelectedEnergy(energy.id)}
                  />
                ))}
              </View>
              <View style={[styles.quickButtons, { marginTop: spacing.md }]}>
                <AppButton
                  label="I'm on track"
                  style={{ flex: 1 }}
                  onPress={async () => {
                    await handleDailyCheckin({
                      workedToday: true,
                      notes: 'On track today.',
                    });
                    handleSendCoachMessage("I'm on track today.");
                  }}
                />
                <AppButton
                  label="I'm stuck"
                  variant="secondary"
                  style={{ flex: 1 }}
                  onPress={async () => {
                    await handleDailyCheckin({
                      workedToday: false,
                      blockers: "I'm stuck.",
                    });
                    setCoachInput("I'm stuck because ");
                  }}
                />
              </View>
              {isSubmittingCheckin ? (
                <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.sm }} />
              ) : null}
              {checkinError ? (
                <Text style={[typography.bodySmall, { color: colors.danger, marginTop: spacing.sm }]}>
                  {checkinError}
                </Text>
              ) : null}
            </Card>

            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: spacing.xl,
                paddingBottom: spacing.md,
              }}
              showsVerticalScrollIndicator={false}
            >
              {coachMessages.map((message) => {
                const isUser = message.sender === 'user';
                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageBubble,
                      {
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        backgroundColor: isUser ? colors.accent : colors.surface,
                        borderColor: isUser ? colors.accent : colors.border,
                        borderRadius: radius.lg,
                      },
                    ]}
                  >
                    <Text style={[typography.bodySmall, { color: isUser ? '#ffffff' : colors.text }]}>
                      {message.text}
                    </Text>
                  </View>
                );
              })}
              {isCoachThinking ? (
                <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.sm }} />
              ) : null}
              {coachError ? (
                <Text style={[typography.bodySmall, { color: colors.danger, marginBottom: spacing.sm }]}>
                  {coachError}
                </Text>
              ) : null}
            </ScrollView>

            <View
              style={[
                styles.inputBar,
                {
                  borderTopColor: colors.border,
                  backgroundColor: colors.surface,
                  paddingHorizontal: spacing.md,
                  paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
                  paddingTop: spacing.sm,
                },
              ]}
            >
              <TextInput
                value={coachInput}
                onChangeText={setCoachInput}
                placeholder="Share your next step..."
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  typography.body,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    borderRadius: radius.pill,
                    backgroundColor: colors.background,
                  },
                ]}
              />
              <TouchableOpacity
                onPress={() => handleSendCoachMessage()}
                style={[
                  styles.sendBtn,
                  { backgroundColor: colors.accent, borderRadius: radius.pill },
                ]}
              >
                <Ionicons name="send" size={18} color="#ffffff" />
              </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContent: {
    height: '84%',
    borderTopWidth: 1,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 14,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  energyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  messageBubble: {
    borderWidth: 1,
    maxWidth: '88%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  inputBar: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginRight: 10,
  },
  sendBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
