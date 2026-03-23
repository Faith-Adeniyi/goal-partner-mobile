import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

const variantStyles = (colors) => ({
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    textColor: '#ffffff',
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    textColor: colors.text,
  },
  tonal: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoft,
    textColor: colors.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.surfaceHigh,
    textColor: colors.textMuted,
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
    textColor: '#ffffff',
  },
});

export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  minHeight,
}) {
  const { colors, radius, typography, spacing } = useAppTheme();
  const isDisabled = disabled || loading;
  const selected = variantStyles(colors)[variant] || variantStyles(colors).primary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor: selected.backgroundColor,
          borderColor: selected.borderColor,
          borderRadius: radius.lg,
          minHeight: minHeight ?? 50,
          paddingHorizontal: spacing.xl,
          opacity: isDisabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={selected.textColor} />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={[typography.label, { color: selected.textColor }, textStyle]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
});
