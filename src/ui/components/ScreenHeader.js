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
          paddingTop: compact ? 0 : spacing.xs,
        },
        style,
      ]}
    >
      <View style={styles.actionsRow}>
        <View style={styles.actionSlot}>{leftAction || <View />}</View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, typography.h2, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, typography.label, { color: colors.textSubtle }]} numberOfLines={2}>
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
    alignItems: 'center',
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
    paddingHorizontal: 6,
  },
  title: {
    marginBottom: 5,
    letterSpacing: -0.45,
  },
  subtitle: {
    textTransform: 'uppercase',
  },
});
