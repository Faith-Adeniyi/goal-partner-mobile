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
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
    textColor: colors.text,
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
  minHeight = 50,
}) {
  const { colors, radius, typography } = useAppTheme();
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
          minHeight,
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
    paddingHorizontal: 18,
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
