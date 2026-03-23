import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

const mapVariant = (colors, variant, selected) => {
  if (selected) {
    return { backgroundColor: colors.accent, borderColor: colors.accent, textColor: '#ffffff' };
  }

  if (variant === 'success') {
    return { backgroundColor: colors.mintSoft, borderColor: colors.mintSoft, textColor: colors.success };
  }

  if (variant === 'accent') {
    return { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft, textColor: colors.accent };
  }

  return { backgroundColor: colors.surface, borderColor: colors.surfaceHigh, textColor: colors.textMuted };
};

export default function Chip({ label, onPress, selected = false, variant = 'neutral', style, textStyle, fullWidth = false }) {
  const { colors, radius, spacing, typography } = useAppTheme();
  const scheme = mapVariant(colors, variant, selected);

  const content = (
    <View
      style={[
        styles.chip,
        fullWidth && styles.chipFullWidth,
        {
          backgroundColor: scheme.backgroundColor,
          borderColor: scheme.borderColor,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.xs + 1,
        },
        style,
      ]}
    >
      <Text
        style={[typography.caption, { color: scheme.textColor, flexShrink: 1 }, textStyle]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
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
  chipFullWidth: {
    alignSelf: 'stretch',
  },
});
