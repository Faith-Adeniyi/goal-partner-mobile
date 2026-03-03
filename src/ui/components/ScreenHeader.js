import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

export default function ScreenHeader({
  title,
  subtitle,
  leftAction,
  rightAction,
  compact = false,
  style,
}) {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <View
      style={[
        styles.wrapper,
        {
          marginBottom: compact ? spacing.md : spacing.lg,
        },
        style,
      ]}
    >
      <View style={styles.actionsRow}>
        <View style={styles.actionSlot}>{leftAction || <View />}</View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, typography.h2, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, typography.bodySmall, { color: colors.textMuted }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={[styles.actionSlot, styles.rightSlot]}>{rightAction || <View />}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionSlot: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightSlot: {
    alignItems: 'flex-end',
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    lineHeight: 20,
  },
});
