import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getActiveBaseUrl, pingApi, sendChatMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
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
  const { isAuthenticated, token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('assistant');
  const [lastSendPayload, setLastSendPayload] = useState(null);
  const [showModeHelp, setShowModeHelp] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [pingResult, setPingResult] = useState(null);
  const [lastHttpMeta, setLastHttpMeta] = useState(null);

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

    // Default: clear HTTP meta for this attempt; we will set it after we know what happened.
    setLastHttpMeta(null);

    const response = await sendChatMessage({
      message: outgoingText,
      goalId: 'general',
      mode,
      history,
    });

    // Always capture status/raw (even on success) so we can debug “fallback replies” that come with HTTP 200.
    setLastHttpMeta({ status: response?.status ?? null, raw: response?.raw ?? response?.data ?? null });

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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <ScreenHeader title="Allison" subtitle="Your AI Assistant for Planning and Execution." compact />
          <TouchableOpacity onPress={() => setDebugOpen((prev) => !prev)} hitSlop={10}>
            <Ionicons name="bug-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        {debugOpen ? (
          <Card variant="outlined" style={{ marginTop: spacing.sm, borderRadius: radius.lg }}>
            <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 8 }}>
              <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                API: {String(getActiveBaseUrl())}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                Authenticated: {isAuthenticated ? 'YES' : 'NO'}  (device)
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                User: {user?.email || '—'}  (device)
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                Token: {token ? `${String(token).slice(0, 18)}…` : '—'}  (device)
              </Text>

              <AppButton
                label="Ping backend (device)"
                variant="ghost"
                minHeight={44}
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

              {pingResult ? (
                <Text style={[typography.bodySmall, { color: colors.textMuted }]}>{pingResult}</Text>
              ) : null}

              {lastHttpMeta ? (
                <View style={{ gap: 4 }}>
                  <Text style={[typography.bodySmall, { color: colors.danger }]}>
                    Last HTTP status: {String(lastHttpMeta.status ?? '—')}
                  </Text>
                  <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                    Last response: {typeof lastHttpMeta.raw === 'string' ? lastHttpMeta.raw : JSON.stringify(lastHttpMeta.raw)}
                  </Text>
                </View>
              ) : null}
            </View>
          </Card>
        ) : null}
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
              {lastHttpMeta?.status ? ` (HTTP ${lastHttpMeta.status})` : ''}
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
