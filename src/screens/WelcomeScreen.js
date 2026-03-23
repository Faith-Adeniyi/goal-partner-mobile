import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppScreen, Card } from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

function FeatureCard({ icon, title, text }) {
  const { colors, spacing, typography, radius } = useAppTheme();

  return (
    <Card variant="glass" style={{ borderRadius: radius.xl }}>
      <View style={styles.featureRow}>
        <View
          style={[
            styles.featureIcon,
            {
              backgroundColor: colors.accentSoft,
              borderRadius: radius.lg,
              marginRight: spacing.md,
            },
          ]}
        >
          <Ionicons name={icon} size={18} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h3, { color: colors.text }]}>{title}</Text>
          <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 4 }]}>{text}</Text>
        </View>
      </View>
    </Card>
  );
}

export default function WelcomeScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <AppScreen padded={false}>
      <View style={[styles.container, { paddingHorizontal: spacing.xl, paddingTop: spacing.xxxl, paddingBottom: spacing.xxl }]}>
        <View>
          <Text style={[styles.brand, typography.h1, { color: colors.accent }]}>Allison</Text>
          <Text style={[styles.tag, typography.label, { color: colors.textSubtle }]}>PLAN. EXECUTE. ACHIEVE.</Text>
        </View>

        <View style={{ marginTop: spacing.xxl }}>
          <Text style={[typography.display, { color: colors.text }]}>Your AI goal coach.</Text>
          <Text style={[typography.subtitle, { color: colors.textMuted, marginTop: spacing.sm }]}>
            Build clear milestones, stay consistent, and keep momentum visible every day.
          </Text>
        </View>

        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          <FeatureCard icon="sparkles-outline" title="Guided planning" text="Convert one goal into actionable phases and tasks." />
          <FeatureCard icon="compass-outline" title="Clock-rail map" text="Track progress through an interactive milestone timeline." />
          <FeatureCard icon="flash-outline" title="Daily check-ins" text="Stack small wins with reminders and streaks." />
        </View>

        <View style={{ marginTop: 'auto', gap: spacing.sm }}>
          <AppButton label="Get Started" onPress={() => navigation.navigate('SignUp')} />
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
  },
  brand: {
    letterSpacing: -0.4,
  },
  tag: {
    marginTop: 4,
    letterSpacing: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
