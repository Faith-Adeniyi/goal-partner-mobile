import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

const mapVariant = (colors, variant, selected) => {
  if (selected) {
    return { backgroundColor: colors.accent, borderColor: colors.accent, textColor: '#ffffff' };
  }

  if (variant === 'success') {
    return { backgroundColor: colors.surface, borderColor: colors.success, textColor: colors.success };
  }

  if (variant === 'accent') {
    return { backgroundColor: colors.accentMuted, borderColor: colors.accentMuted, textColor: colors.accent };
  }

  return { backgroundColor: colors.surface, borderColor: colors.border, textColor: colors.text };
};

export default function Chip({ label, onPress, selected = false, variant = 'neutral', style, textStyle }) {
  const { colors, radius, spacing, typography } = useAppTheme();
  const scheme = mapVariant(colors, variant, selected);

  const content = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: scheme.backgroundColor,
          borderColor: scheme.borderColor,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
        },
        style,
      ]}
    >
      <Text style={[typography.caption, { color: scheme.textColor }, textStyle]}>{label}</Text>
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
