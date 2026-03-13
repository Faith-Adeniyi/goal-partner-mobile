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
  multiline = false,
  numberOfLines,
  blurOnSubmit,
  containerStyle,
  inputStyle,
  minHeight,
  maxHeight,
}) {
  const { colors, radius, spacing, typography } = useAppTheme();

  const resolvedMinHeight = multiline ? minHeight || 104 : minHeight || 52;
  const resolvedMaxHeight = multiline ? maxHeight || 180 : undefined;
  const resolvedBlurOnSubmit = typeof blurOnSubmit === 'boolean' ? blurOnSubmit : !multiline;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[typography.label, { color: colors.text, marginBottom: spacing.xs }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputContainer,
          multiline && styles.inputContainerMultiline,
          {
            borderColor: errorText ? colors.danger : colors.border,
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
            minHeight: resolvedMinHeight,
            paddingHorizontal: spacing.md,
          },
          containerStyle,
        ]}
      >
        {icon ? <Ionicons name={icon} size={Math.round(typography.body.fontSize * 1.25)} color={colors.textMuted} style={{ marginRight: spacing.xs }} /> : null}
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            typography.body,
            {
              color: colors.text,
              minHeight: resolvedMinHeight,
              maxHeight: resolvedMaxHeight,
            },
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines || 4 : 1}
          blurOnSubmit={resolvedBlurOnSubmit}
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
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainerMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  input: {
    flex: 1,
  },
  inputMultiline: {
    textAlignVertical: 'top',
  },
});
