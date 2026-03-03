import { StyleSheet, Text, View } from 'react-native';
import Card from './Card';
import { useAppTheme } from '../hooks/useAppTheme';

export default function ListItemRow({ icon, title, subtitle, trailing, style }) {
  const { colors, spacing, typography, radius } = useAppTheme();

  return (
    <Card variant="outlined" style={[styles.card, { borderRadius: radius.lg }, style]}>
      <View style={styles.row}>
        <View style={styles.left}>
          {icon ? (
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: colors.surfaceMuted,
                  marginRight: spacing.md,
                  borderRadius: radius.md,
                },
              ]}
            >
              {icon}
            </View>
          ) : null}
          <View style={styles.textWrap}>
            <Text style={[typography.label, { color: colors.text }]}>{title}</Text>
            {subtitle ? (
              <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 2 }]}>{subtitle}</Text>
            ) : null}
          </View>
        </View>
        <View>{trailing}</View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textWrap: {
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
