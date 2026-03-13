import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import {
  AppButton,
  AppScreen,
  Card,
  ListItemRow,
  ScreenHeader,
} from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

export default function ProfileScreen({ onSignOut, navigation }) {
  const { colors, spacing, typography, toggleTheme, isDark, radius } = useAppTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <AppScreen scroll>
      <ScreenHeader title="Your profile" subtitle="Manage your account and coaching preferences." compact />

      <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
        <View style={styles.profileRow}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: colors.accent,
                borderRadius: radius.pill,
                marginRight: spacing.md,
              },
            ]}
          >
            <Text style={[typography.h3, { color: '#ffffff' }]}>FA</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.h3, { color: colors.text }]}>Faith Adeniyi</Text>
            <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 4 }]}>
              Momentum Builder
            </Text>
          </View>
        </View>
      </Card>

      <Card variant="outlined" style={{ marginBottom: spacing.lg }}>
        <ListItemRow
          title="Personalisation"
          subtitle="Theme colors"
          icon={<Ionicons name="color-palette-outline" size={20} color={colors.accent} />}
          onPress={() => navigation.navigate('Personalisation')}
          trailing={<Ionicons name="chevron-forward-outline" size={18} color={colors.textMuted} />}
        />
      </Card>

      <View style={{ gap: spacing.sm }}>
        <ListItemRow
          title="Dark mode"
          subtitle="Appearance"
          icon={<Ionicons name="moon-outline" size={20} color={colors.accent} />}
          trailing={<Switch value={isDark} onValueChange={toggleTheme} />}
        />
        <ListItemRow
          title="Notifications"
          subtitle="Reminders and updates"
          icon={<Ionicons name="notifications-outline" size={20} color={colors.accent} />}
          trailing={
            <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
          }
        />
      </View>

      <AppButton
        label="Log out"
        variant="danger"
        style={{ marginTop: spacing.xl }}
        onPress={() => {
          if (typeof onSignOut === 'function') onSignOut();
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
