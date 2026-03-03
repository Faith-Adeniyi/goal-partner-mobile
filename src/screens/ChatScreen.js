import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { sendChatMessage } from '../api/client';
import {
  AppButton,
  AppInput,
  AppScreen,
  Card,
  EmptyState,
  ScreenHeader,
} from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });

export default function ChatScreen() {
  const { colors, spacing, typography, radius } = useAppTheme();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeGoalId, setActiveGoalId] = useState('general');
  const [lastSendPayload, setLastSendPayload] = useState(null);

  const quickPrompts = [
    { id: 'breakdown', label: 'Break into steps', text: 'Break this into the smallest next steps.' },
    { id: 'today', label: 'Plan today', text: 'Help me pick the best next task for today.' },
    { id: 'blockers', label: 'Unblock me', text: "I'm stuck. Ask me 3 questions then suggest 1 next action." },
    { id: 'review', label: 'Weekly review', text: 'Give me a short weekly review and the next 3 priorities.' },
  ];

  const handleSend = async (overrideText = null) => {
    const outgoingText = (overrideText ?? inputText).trim();
    if (!outgoingText || loading) return;

    const userMessage = { id: generateUUID(), text: outgoingText, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setError('');

    setLastSendPayload({ text: outgoingText, goalId: activeGoalId });

    const response = await sendChatMessage(outgoingText, activeGoalId);
    setLoading(false);

    if (response.success) {
      setMessages((prev) => [
        ...prev,
        { id: generateUUID(), text: response.data?.reply || 'I am here. What is your next step?', sender: 'ai' },
      ]);
      return;
    }

    setError(response.error || 'Unable to send your message.');
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View
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
        <Text style={[typography.body, { color: isUser ? '#ffffff' : colors.text }]}>{item.text}</Text>
      </View>
    );
  };

  return (
    <AppScreen padded={false} keyboardAware>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
        <ScreenHeader title="Coach chat" subtitle="Ask for help with your next step..." compact />
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing.xl }}>
        <Card variant="outlined" style={{ marginTop: spacing.md, marginBottom: spacing.md }}>
          <View style={styles.goalRow}>
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>Chat context</Text>
            <View style={styles.goalPills}>
              <TouchableOpacity
                onPress={() => setActiveGoalId('general')}
                style={[
                  styles.goalPill,
                  {
                    borderColor: activeGoalId === 'general' ? colors.accent : colors.border,
                    backgroundColor: activeGoalId === 'general' ? colors.accentSoft : colors.surface,
                    borderRadius: radius.pill,
                  },
                ]}
              >
                <Text style={[typography.bodySmall, { color: activeGoalId === 'general' ? colors.accent : colors.text }]}>
                  General
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveGoalId('demo')}
                style={[
                  styles.goalPill,
                  {
                    borderColor: activeGoalId === 'demo' ? colors.accent : colors.border,
                    backgroundColor: activeGoalId === 'demo' ? colors.accentSoft : colors.surface,
                    borderRadius: radius.pill,
                  },
                ]}
              >
                <Text style={[typography.bodySmall, { color: activeGoalId === 'demo' ? colors.accent : colors.text }]}>
                  Demo goal
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.quickPromptRow}>
            {quickPrompts.map((prompt) => (
              <TouchableOpacity
                key={prompt.id}
                onPress={() => handleSend(prompt.text)}
                disabled={loading}
                style={[
                  styles.quickPromptChip,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    borderRadius: radius.pill,
                    opacity: loading ? 0.6 : 1,
                  },
                ]}
              >
                <Text style={[typography.bodySmall, { color: colors.text }]}>{prompt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {messages.length === 0 ? (
          <EmptyState
            title="Start your coaching chat"
            message="Share what you want to do today and Allison will help break it down."
          />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingBottom: spacing.md }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <Card variant="outlined" style={{ margin: spacing.xl, marginTop: spacing.sm }}>
        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <AppInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask for help with your next step..."
              autoCapitalize="sentences"
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.iconSendBtn,
              { backgroundColor: colors.accent, borderRadius: radius.pill, marginLeft: spacing.sm },
            ]}
            onPress={handleSend}
            disabled={loading}
          >
            <Ionicons name="send" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
        {error ? (
          <View style={{ marginTop: spacing.sm }}>
            <Text style={[typography.bodySmall, { color: colors.danger, marginBottom: spacing.xs }]}>
              {error}
            </Text>
            <AppButton
              label="Try again"
              variant="ghost"
              minHeight={44}
              onPress={() => handleSend(lastSendPayload?.text)}
            />
          </View>
        ) : null}
        {loading ? <AppButton label="Sending..." loading disabled style={{ marginTop: spacing.sm }} /> : null}
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  messageBubble: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 10,
    maxWidth: '86%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  iconSendBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  goalPills: {
    flexDirection: 'row',
    gap: 8,
  },
  goalPill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickPromptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  quickPromptChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
