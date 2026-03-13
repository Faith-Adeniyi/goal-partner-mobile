import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [mode, setMode] = useState('assistant');
  const [lastSendPayload, setLastSendPayload] = useState(null);
  const [showModeHelp, setShowModeHelp] = useState(false);

  const modeChips = [
    { id: 'assistant', label: 'Assistant' },
    { id: 'plan_builder', label: 'Plan Builder' },
  ];

  const handleSend = async (overrideText = null) => {
    const rawText =
      typeof overrideText === 'string'
        ? overrideText
        : typeof overrideText?.nativeEvent?.text === 'string'
          ? overrideText.nativeEvent.text
          : inputText;
    const outgoingText = rawText.trim();
    if (!outgoingText || loading) return;

    const userMessage = { id: generateUUID(), text: outgoingText, sender: 'user' };
    const nextMessages = [...messages, userMessage];
    const history = nextMessages.slice(-14).map((item) => ({ sender: item.sender, text: item.text }));
    setMessages(nextMessages);
    setInputText('');
    setLoading(true);
    setError('');
    setLastSendPayload({ text: outgoingText, mode, history });

    const response = await sendChatMessage({
      message: outgoingText,
      goalId: 'general',
      mode,
      history,
    });
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
    <AppScreen padded={false} keyboardAware keyboardOffset={74}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
        <ScreenHeader title="Allison" subtitle="Your AI Assistant for Planning and Execution." compact />
        <Card variant="outlined" style={[styles.toolRail, { marginTop: spacing.sm, borderRadius: radius.lg }]}>
          <View style={[styles.toolRailHeader, { paddingHorizontal: spacing.md, paddingTop: spacing.sm }]}>
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>Conversation style</Text>

            <TouchableOpacity onPress={() => setShowModeHelp((prev) => !prev)} hitSlop={8}>
              <Ionicons
                name={showModeHelp ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: spacing.sm,
              paddingTop: spacing.xs,
              paddingBottom: spacing.xs,
              gap: 8,
            }}
          >
            {modeChips.map((chip) => {
              const selected = mode === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  onPress={() => setMode(chip.id)}
                  style={[
                    styles.goalPill,
                    {
                      borderColor: selected ? colors.accent : colors.border,
                      backgroundColor: selected ? colors.accentSoft : colors.surface,
                      borderRadius: radius.pill,
                    },
                  ]}
                >
                  <Text style={[typography.bodySmall, { color: selected ? colors.accent : colors.text }]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {showModeHelp ? (
            <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
              <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                Assistant for general help
                Plan Builder for structured goal plans.
              </Text>
            </View>
          ) : null}
        </Card>
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
        {messages.length === 0 ? (
          <EmptyState
            title=""
          />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingBottom: spacing.md }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

      <Card variant="outlined" style={{ marginHorizontal: spacing.xl, marginTop: spacing.sm, marginBottom: spacing.md }}>
        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <AppInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={mode === 'plan_builder' ? 'Describe your goal in one sentence...' : 'Ask Allison anything...'}
              autoCapitalize="sentences"
              returnKeyType="default"
              multiline
              numberOfLines={2}
              minHeight={50}
              maxHeight={90}
              blurOnSubmit={false}
              onSubmitEditing={() => handleSend()}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.iconSendBtn,
              { backgroundColor: colors.accent, borderRadius: radius.pill, marginLeft: spacing.sm },
            ]}
            onPress={() => handleSend()}
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
              onPress={() => handleSend(lastSendPayload?.text || '')}
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
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  toolRail: {
    marginBottom: 2,
  },
  toolRailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalPill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
