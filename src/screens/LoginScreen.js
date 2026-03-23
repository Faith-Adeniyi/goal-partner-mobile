import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AppButton, AppInput, AppScreen, Card, ScreenHeader } from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

export default function LoginScreen({ navigation }) {
  const { colors, spacing, typography, radius } = useAppTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState('');

  const errors = useMemo(
    () => ({
      email: submitted && !email.trim() ? 'Email is required.' : '',
      password: submitted && !password.trim() ? 'Password is required.' : '',
    }),
    [submitted, email, password]
  );

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
      <Ionicons name="arrow-back" size={22} color={colors.accent} />
    </TouchableOpacity>
  );

  return (
    <AppScreen padded={false} keyboardAware>
      <View style={{ flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl }}>
        <ScreenHeader title="Welcome Back" subtitle="Continue your journey to disciplined success." leftAction={backButton} compact />

        <Card variant="elevated" style={{ borderRadius: radius.xl, marginTop: spacing.md }}>
          <View style={{ gap: spacing.md }}>
            <AppInput
              label="Email Address"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
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
            {authError ? (
              <Text style={[typography.bodySmall, { color: colors.danger }]}>{authError}</Text>
            ) : null}
            <AppButton label="Login" onPress={handleAuth} loading={loading} />
          </View>

          <View style={[styles.dividerRow, { marginTop: spacing.lg }]}>
            <View style={[styles.divider, { backgroundColor: colors.surfaceHigh }]} />
            <Text style={[typography.caption, { color: colors.textSubtle, marginHorizontal: spacing.sm }]}>OR</Text>
            <View style={[styles.divider, { backgroundColor: colors.surfaceHigh }]} />
          </View>

          <AppButton
            label="Continue with Google"
            variant="secondary"
            minHeight={48}
            style={{ marginTop: spacing.md }}
            icon={<Ionicons name="logo-google" size={16} color={colors.text} />}
            onPress={() => {}}
          />
        </Card>

        <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
          <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
            Don&apos;t have an account?{' '}
            <Text style={{ color: colors.accent, fontWeight: '700' }} onPress={() => navigation.navigate('SignUp')}>
              Sign up
            </Text>
          </Text>
        </View>
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    flex: 1,
    height: 1,
  },
});
