import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

export default function SegmentedControl({ options, value, onChange, style }) {
  const { colors, radius, spacing, typography } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.surfaceHigh,
          borderRadius: radius.lg,
          padding: spacing.xxs,
          backgroundColor: colors.surfaceMuted,
        },
        style,
      ]}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.item,
              {
                borderRadius: radius.md,
                backgroundColor: isActive ? colors.surface : 'transparent',
              },
            ]}
            activeOpacity={0.85}
          >
            <Text style={[typography.label, { color: isActive ? colors.accent : colors.textMuted }]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
  },
  item: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
