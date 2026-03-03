import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AppButton, AppInput, AppScreen, ScreenHeader } from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

export default function LoginScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState('');

  const errors = useMemo(() => {
    return {
      email: submitted && !email.trim() ? 'Email is required.' : '',
      password: submitted && !password.trim() ? 'Password is required.' : '',
    };
  }, [submitted, email, password]);

  const handleAuth = async () => {
    setSubmitted(true);
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setAuthError('');

    const response = await signIn(email.trim().toLowerCase(), password);
    if (!response.success) {
      setAuthError(response.error || 'Unable to sign in.');
    }
    setLoading(false);
  };

  const backButton = (
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
      <Ionicons name="arrow-back" size={24} color={colors.text} />
    </TouchableOpacity>
  );

  return (
    <AppScreen padded keyboardAware>
      <ScreenHeader
        title="Welcome back"
        subtitle="Sign in to continue your plan."
        leftAction={backButton}
      />

      <View style={{ gap: spacing.md }}>
        <AppInput
          label="Email"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          errorText={errors.email}
        />
        <AppInput
          label="Password"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          autoCapitalize="none"
          errorText={errors.password}
          onSubmitEditing={handleAuth}
          returnKeyType="go"
        />
      </View>

      {authError ? (
        <Text style={[typography.bodySmall, { color: colors.danger, marginTop: spacing.sm }]}>
          {authError}
        </Text>
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        <AppButton label="Sign in" onPress={handleAuth} loading={loading} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});
