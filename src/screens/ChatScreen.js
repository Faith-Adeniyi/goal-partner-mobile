import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getActiveBaseUrl, pingApi, sendChatMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppButton, AppInput, AppScreen, Card, ScreenHeader } from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });

const STARTER_PROMPTS = [
  'Start a fitness goal',
  'Plan a new project',
  'Improve my finances',
];

const INITIAL_MESSAGE = {
  id: 'initial-assistant',
  sender: 'ai',
  text: "Tell me your goal in one sentence. I'll help you break it down into milestones and a daily plan.",
};

export default function ChatScreen() {
  const { colors, spacing, typography, radius, elevation } = useAppTheme();
  const { isAuthenticated, token, user } = useAuth();

  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('assistant');
  const [lastSendPayload, setLastSendPayload] = useState(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [pingResult, setPingResult] = useState('');
  const [lastHttpMeta, setLastHttpMeta] = useState(null);

  const modeChips = useMemo(
    () => [
      { id: 'assistant', label: 'Assistant' },
      { id: 'plan_builder', label: 'Plan Builder' },
    ],
    []
  );

  const handleSend = async (overrideText = null) => {
    const rawText = typeof overrideText === 'string' ? overrideText : inputText;
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
    setLastHttpMeta(null);

    const response = await sendChatMessage({
      message: outgoingText,
      goalId: 'general',
      mode,
      history,
    });

    setLastHttpMeta({ status: response?.status ?? null, raw: response?.raw ?? response?.data ?? null });
    setLoading(false);

    if (response.success) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateUUID(),
          text: response.data?.reply || 'I am here. What is your next step?',
          sender: 'ai',
        },
      ]);
      return;
    }

    setError(response.error || 'Unable to send your message.');
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';

    return (
      <View style={{ marginBottom: spacing.sm, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <View
          style={[
            styles.messageBubble,
            {
              maxWidth: '86%',
              borderRadius: radius.xl,
              borderTopLeftRadius: isUser ? radius.xl : 6,
              borderTopRightRadius: isUser ? 6 : radius.xl,
              backgroundColor: isUser ? colors.accent : colors.surface,
              borderColor: isUser ? colors.accent : colors.surfaceHigh,
              ...(!isUser ? elevation.low : {}),
            },
          ]}
        >
          <Text style={[typography.body, { color: isUser ? '#ffffff' : colors.text }]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <AppScreen padded={false} keyboardAware keyboardOffset={76}>
      <View style={{ flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <ScreenHeader title="Allison" subtitle="AI Coach Chat" compact />
          </View>
          <TouchableOpacity onPress={() => setDebugOpen((prev) => !prev)} style={styles.debugButton} hitSlop={8}>
            <Ionicons name="bug-outline" size={18} color={colors.textSubtle} />
          </TouchableOpacity>
        </View>

        {debugOpen ? (
          <Card variant="outlined" style={{ marginBottom: spacing.md }}>
            <View style={{ gap: 6 }}>
              <Text style={[typography.bodySmall, { color: colors.textSubtle }]}>API: {String(getActiveBaseUrl())}</Text>
              <Text style={[typography.bodySmall, { color: colors.textSubtle }]}>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
              <Text style={[typography.bodySmall, { color: colors.textSubtle }]}>User: {user?.email || '-'}</Text>
              <Text style={[typography.bodySmall, { color: colors.textSubtle }]}>
                Token: {token ? `${String(token).slice(0, 18)}...` : '-'}
              </Text>

              <AppButton
                label="Ping Backend"
                variant="ghost"
                minHeight={42}
                onPress={async () => {
                  setPingResult('Pinging...');
                  const res = await pingApi();
                  if (res.success) {
                    setPingResult(`OK: ${res.data?.status || 'online'}`);
                  } else {
                    setPingResult(`FAILED: ${res.error}`);
                    setLastHttpMeta({ status: res.status ?? null, raw: res.raw ?? null });
                  }
                }}
              />

              {pingResult ? <Text style={[typography.bodySmall, { color: colors.textSubtle }]}>{pingResult}</Text> : null}
              {lastHttpMeta ? (
                <Text style={[typography.bodySmall, { color: colors.textSubtle }]}>
                  HTTP {String(lastHttpMeta.status ?? '-')}: {typeof lastHttpMeta.raw === 'string' ? lastHttpMeta.raw : JSON.stringify(lastHttpMeta.raw)}
                </Text>
              ) : null}
            </View>
          </Card>
        ) : null}

        <Card variant="glass" style={{ marginBottom: spacing.md }}>
          <Text style={[typography.label, { color: colors.textSubtle, textTransform: 'uppercase' }]}>Mode</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginTop: spacing.xs }}
          >
            {modeChips.map((chip) => (
              <TouchableOpacity
                key={chip.id}
                onPress={() => setMode(chip.id)}
                style={[
                  styles.modePill,
                  {
                    borderRadius: radius.pill,
                    backgroundColor: mode === chip.id ? colors.accent : colors.surface,
                    borderColor: mode === chip.id ? colors.accent : colors.surfaceHigh,
                  },
                ]}
              >
                <Text style={[typography.bodySmall, { color: mode === chip.id ? '#ffffff' : colors.textMuted }]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>

        <View style={{ flex: 1 }}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.sm }}
          />

          {messages.length <= 1 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm }}>
              {STARTER_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  onPress={() => {
                    setInputText(prompt);
                    handleSend(prompt);
                  }}
                  style={[
                    styles.starterPill,
                    {
                      borderRadius: radius.lg,
                      backgroundColor: colors.surface,
                      borderColor: colors.surfaceHigh,
                    },
                  ]}
                >
                  <Text style={[typography.bodySmall, { color: colors.textMuted }]}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        <Card variant="outlined" style={{ marginBottom: spacing.md }}>
          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <AppInput
                value={inputText}
                onChangeText={setInputText}
                placeholder={mode === 'plan_builder' ? 'Type your goal here...' : 'Message Allison...'}
                autoCapitalize="sentences"
                returnKeyType="default"
                multiline
                numberOfLines={2}
                minHeight={50}
                maxHeight={96}
                blurOnSubmit={false}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.iconSendBtn,
                {
                  backgroundColor: colors.accent,
                  borderRadius: radius.lg,
                  marginLeft: spacing.sm,
                },
              ]}
              onPress={() => handleSend()}
              disabled={loading}
            >
              <Ionicons name="send" size={17} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={[typography.bodySmall, { color: colors.danger, marginBottom: spacing.xs }]}>
                {error}
                {lastHttpMeta?.status ? ` (HTTP ${lastHttpMeta.status})` : ''}
              </Text>
              <AppButton
                label="Try again"
                variant="ghost"
                minHeight={42}
                onPress={() => handleSend(lastSendPayload?.text || '')}
              />
            </View>
          ) : null}

          {loading ? <AppButton label="Sending..." loading disabled style={{ marginTop: spacing.sm }} /> : null}
        </Card>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  debugButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  messageBubble: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  modePill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  starterPill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  iconSendBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
});
