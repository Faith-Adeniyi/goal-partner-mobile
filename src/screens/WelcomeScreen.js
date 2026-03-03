import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppScreen } from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

export default function WelcomeScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <AppScreen padded>
      <View style={[styles.container, { paddingTop: spacing.xxxl }]}>
        <View>
          <Text style={[typography.display, { color: colors.text, marginBottom: spacing.sm }]}>
            Welcome to Allison
          </Text>
          <Text style={[typography.subtitle, { color: colors.textMuted }]}>
            Track goals with daily momentum.
          </Text>
        </View>

        <View style={{ gap: spacing.md }}>
          <AppButton label="Get started" onPress={() => navigation.navigate('SignUp')} />
          <AppButton
            label="I already have an account"
            variant="secondary"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
});
