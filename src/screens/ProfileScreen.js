import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import * as secureStore from '../storage/secureStore';
import { AppButton, AppScreen, Card, ListItemRow, ScreenHeader } from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

const PROFILE_KEY = 'allison_profile';

const initialsOf = (fullName = '') => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'AL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export default function ProfileScreen({ onSignOut, navigation }) {
  const { colors, spacing, typography, toggleTheme, isDark, radius, elevation } = useAppTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const storedProfile = await secureStore.getJsonItemAsync(PROFILE_KEY);
        if (storedProfile) {
          setProfileData(storedProfile);
        }
      } catch (error) {
        console.warn('Failed to load profile data:', error);
      }
    };

    loadProfileData();
  }, []);

  const fullName = profileData?.fullName || 'Allison User';
  const initials = useMemo(() => initialsOf(fullName), [fullName]);

  return (
    <AppScreen padded={false}>
      <View style={{ flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
        <ScreenHeader title="Account" subtitle="Profile & Subscription" compact />

        <Card
          variant="elevated"
          style={{
            marginTop: spacing.md,
            borderRadius: radius.xl,
            borderColor: colors.border,
            ...elevation.medium,
          }}
        >
          <View style={styles.profileRow}>
            <View
              style={[
                styles.avatar,
                {
                  borderRadius: radius.lg,
                  backgroundColor: colors.accentSoft,
                },
              ]}
            >
              <Text style={[typography.h2, { color: colors.accent }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.h2, { color: colors.text }]}>{fullName}</Text>
              <Text style={[typography.bodySmall, { color: colors.textSubtle, marginTop: 4 }]}>Focusing since March 2024</Text>
              <View style={styles.statsRow}>
                <View>
                  <Text style={[typography.h3, { color: colors.accent }]}>12</Text>
                  <Text style={[typography.caption, { color: colors.textSubtle }]}>Goals Met</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.surfaceHigh }]} />
                <View>
                  <Text style={[typography.h3, { color: colors.success }]}>84%</Text>
                  <Text style={[typography.caption, { color: colors.textSubtle }]}>Consistency</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>

        <Card variant="glass" style={{ marginTop: spacing.md, borderRadius: radius.xl }}>
          <View style={styles.planHeader}>
            <View>
              <Text style={[typography.caption, { color: colors.textSubtle }]}>CURRENT PLAN</Text>
              <Text style={[typography.h3, { color: colors.text, marginTop: 4 }]}>Allison Free</Text>
            </View>
            <View style={[styles.planIcon, { borderRadius: radius.lg, backgroundColor: colors.accentSoft }]}>
              <Ionicons name="sparkles-outline" size={20} color={colors.accent} />
            </View>
          </View>

          <View style={{ marginTop: spacing.sm, gap: 8 }}>
            {['Unlimited goals', 'Printable PDFs', 'Advanced AI coaching', 'Priority Support'].map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[typography.bodySmall, { color: colors.textMuted, marginLeft: 8 }]}>{feature}</Text>
              </View>
            ))}
          </View>

          <AppButton label="Upgrade to Premium" style={{ marginTop: spacing.md }} />
        </Card>

        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <ListItemRow
            title="Personalisation"
            subtitle="Theme colors"
            icon={<Ionicons name="color-palette-outline" size={19} color={colors.accent} />}
            onPress={() => navigation.navigate('Personalisation')}
            trailing={<Ionicons name="chevron-forward-outline" size={18} color={colors.textSubtle} />}
          />
          <ListItemRow
            title="Dark Mode"
            subtitle="Appearance"
            icon={<Ionicons name="moon-outline" size={19} color={colors.accent} />}
            trailing={<Switch value={isDark} onValueChange={toggleTheme} />}
          />
          <ListItemRow
            title="Notifications"
            subtitle="Reminders and updates"
            icon={<Ionicons name="notifications-outline" size={19} color={colors.accent} />}
            trailing={<Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />}
          />
        </View>

        <AppButton
          label="Sign Out"
          variant="danger"
          style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}
          onPress={() => {
            if (typeof onSignOut === 'function') onSignOut();
          }}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 14,
  },
  divider: {
    width: 1,
    height: 32,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  planIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
