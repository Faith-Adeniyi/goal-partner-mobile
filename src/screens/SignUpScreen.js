import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AppButton, AppInput, AppScreen, ScreenHeader } from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

export default function SignUpScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();
  const { signUpUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState('');

  const errors = useMemo(() => {
    const mismatch = submitted && password && confirmPassword && password !== confirmPassword;

    return {
      firstName: submitted && !firstName.trim() ? 'First name is required.' : '',
      lastName: submitted && !lastName.trim() ? 'Last name is required.' : '',
      email: submitted && !email.trim() ? 'Email is required.' : '',
      password: submitted && !password.trim() ? 'Password is required.' : '',
      confirmPassword: mismatch ? 'Passwords do not match.' : '',
    };
  }, [submitted, firstName, lastName, email, password, confirmPassword]);

  const handleSignUp = async () => {
    setSubmitted(true);
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || password !== confirmPassword) return;

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
      <Ionicons name="arrow-back" size={24} color={colors.text} />
    </TouchableOpacity>
  );

  return (
    <AppScreen padded keyboardAware>
      <ScreenHeader
        title="Create your account"
        subtitle="Set up your coaching workspace."
        leftAction={backButton}
      />

      <View style={{ gap: spacing.md }}>
        <AppInput
          label="First name"
          icon="person-outline"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Your first name"
          autoCapitalize="words"
          errorText={errors.firstName}
        />
        <AppInput
          label="Last name"
          icon="person-outline"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Your last name"
          autoCapitalize="words"
          errorText={errors.lastName}
        />
        <AppInput
          label="Email"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
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
          label="Confirm password"
          icon="shield-checkmark-outline"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repeat your password"
          secureTextEntry
          errorText={errors.confirmPassword}
          returnKeyType="go"
          onSubmitEditing={handleSignUp}
        />
      </View>

      {authError ? (
        <Text style={[typography.bodySmall, { color: colors.danger, marginTop: spacing.sm }]}>
          {authError}
        </Text>
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        <AppButton label="Create account" onPress={handleSignUp} loading={loading} />
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
