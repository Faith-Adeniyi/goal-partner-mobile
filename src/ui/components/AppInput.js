import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

export default function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  icon,
  errorText,
  returnKeyType,
  onSubmitEditing,
}) {
  const { colors, radius, spacing, typography } = useAppTheme();

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: errorText ? colors.danger : colors.border,
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
          },
        ]}
      >
        {icon ? <Ionicons name={icon} size={20} color={colors.textMuted} style={{ marginRight: spacing.xs }} /> : null}
        <TextInput
          style={[styles.input, typography.body, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
      </View>
      {errorText ? (
        <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>{errorText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  inputContainer: {
    minHeight: 52,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    minHeight: 52,
  },
});
