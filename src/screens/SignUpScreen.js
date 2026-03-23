import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AppButton, AppInput, AppScreen, Card, ScreenHeader } from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

export default function SignUpScreen({ navigation }) {
  const { colors, spacing, typography, radius } = useAppTheme();
  const { signUpUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const errors = useMemo(() => {
    const mismatch = submitted && password && confirmPassword && password !== confirmPassword;

    return {
      firstName: submitted && !firstName.trim() ? 'First name is required.' : '',
      lastName: submitted && !lastName.trim() ? 'Last name is required.' : '',
      email: submitted && !email.trim() ? 'Email is required.' : '',
      password: submitted && !password.trim() ? 'Password is required.' : '',
      confirmPassword: mismatch ? 'Passwords do not match.' : '',
      terms: submitted && !acceptedTerms ? 'You must accept the terms.' : '',
    };
  }, [submitted, firstName, lastName, email, password, confirmPassword, acceptedTerms]);

  const handleSignUp = async () => {
    setSubmitted(true);
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password.trim() ||
      password !== confirmPassword ||
      !acceptedTerms
    ) {
      return;
    }

    setLoading(true);
    setAuthError('');

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const response = await signUpUser(fullName, email.trim().toLowerCase(), password);
    if (!response.success) {
      setAuthError(response.error || 'Unable to create account.');
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
        <ScreenHeader title="Create Account" subtitle="Join Allison and start your disciplined journey." leftAction={backButton} compact />

        <Card variant="elevated" style={{ borderRadius: radius.xl, marginTop: spacing.md }}>
          <View style={{ gap: spacing.md }}>
            <AppInput
              label="First Name"
              icon="person-outline"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              autoCapitalize="words"
              errorText={errors.firstName}
            />
            <AppInput
              label="Last Name"
              icon="person-outline"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              autoCapitalize="words"
              errorText={errors.lastName}
            />
            <AppInput
              label="Email Address"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              errorText={errors.email}
            />
            <AppInput
              label="Password"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
              errorText={errors.password}
            />
            <AppInput
              label="Confirm Password"
              icon="shield-checkmark-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat your password"
              secureTextEntry
              errorText={errors.confirmPassword}
              returnKeyType="go"
              onSubmitEditing={handleSignUp}
            />

            <TouchableOpacity
              onPress={() => setAcceptedTerms((prev) => !prev)}
              style={[styles.termsRow, { marginTop: spacing.xs }]}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: acceptedTerms ? colors.accent : colors.border,
                    backgroundColor: acceptedTerms ? colors.accent : colors.surface,
                    borderRadius: 5,
                  },
                ]}
              >
                {acceptedTerms ? <Ionicons name="checkmark" size={13} color="#ffffff" /> : null}
              </View>
              <Text style={[typography.bodySmall, { color: colors.textMuted, flex: 1 }]}>
                I agree to the Terms of Service and Privacy Policy.
              </Text>
            </TouchableOpacity>
            {errors.terms ? <Text style={[typography.caption, { color: colors.danger }]}>{errors.terms}</Text> : null}

            {authError ? (
              <Text style={[typography.bodySmall, { color: colors.danger }]}>{authError}</Text>
            ) : null}
            <AppButton label="Create Account" onPress={handleSignUp} loading={loading} />
          </View>
        </Card>

        <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
          <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
            Already have an account?{' '}
            <Text style={{ color: colors.accent, fontWeight: '700' }} onPress={() => navigation.navigate('Login')}>
              Log in
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
