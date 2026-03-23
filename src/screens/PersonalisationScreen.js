import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppScreen, Card, ListItemRow, ScreenHeader } from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

const swatches = {
  ocean: '#014390',
  forest: '#005111',
  ember: '#8E2A2A',
  amethyst: '#5A3FA8',
};

export default function PersonalisationScreen({ navigation }) {
  const { colors, spacing, typography, radius, accentKey, setAccentKey } = useAppTheme();

  const themeOptions = [
    { key: 'ocean', label: 'Ocean (Default)', subtitle: 'Deep focused blue' },
    { key: 'forest', label: 'Forest', subtitle: 'Calm growth green' },
    { key: 'ember', label: 'Ember', subtitle: 'Warm disciplined red' },
    { key: 'amethyst', label: 'Amethyst', subtitle: 'Creative strategy violet' },
  ];

  const backAction = (
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
      <Ionicons name="arrow-back" size={22} color={colors.accent} />
    </TouchableOpacity>
  );

  return (
    <AppScreen padded={false}>
      <View style={{ flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
        <ScreenHeader title="Personalisation" subtitle="Design System Accent" leftAction={backAction} compact />

        <Card variant="glass" style={{ marginTop: spacing.md, borderRadius: radius.xl }}>
          <Text style={[typography.h3, { color: colors.text }]}>Choose Your Vibe</Text>
          <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 4 }]}>
            Theme accents update across navigation, cards, charts, and coaching surfaces.
          </Text>

          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            {themeOptions.map((opt) => {
              const selected = accentKey === opt.key;
              return (
                <ListItemRow
                  key={`accent-${opt.key}`}
                  title={opt.label}
                  subtitle={opt.subtitle}
                  icon={
                    <View style={[styles.swatch, { backgroundColor: swatches[opt.key], borderRadius: radius.pill }]} />
                  }
                  onPress={async () => {
                    await setAccentKey(opt.key);
                  }}
                  trailing={
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={selected ? colors.accent : colors.textSubtle}
                    />
                  }
                />
              );
            })}
          </View>
        </Card>
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
  swatch: {
    width: 16,
    height: 16,
  },
});
