import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import AppButton from './AppButton';

export function LoadingState({ label = 'Loading...' }) {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <View style={[styles.center, { padding: spacing.xl }]}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={[typography.bodySmall, { color: colors.textSubtle, marginTop: spacing.sm }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, actionLabel, onAction }) {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <View style={[styles.center, { padding: spacing.xl }]}>
      <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{title}</Text>
      {message ? (
        <Text style={[typography.bodySmall, { color: colors.textSubtle, textAlign: 'center', marginBottom: spacing.md }]}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} style={{ minWidth: 180 }} />
      ) : null}
    </View>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again.',
  actionLabel = 'Retry',
  onAction,
}) {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <View style={[styles.center, { padding: spacing.xl }]}>
      <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>{title}</Text>
      <Text style={[typography.bodySmall, { color: colors.textSubtle, textAlign: 'center', marginBottom: spacing.lg }]}>
        {message}
      </Text>
      {onAction ? <AppButton label={actionLabel} variant="secondary" onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
