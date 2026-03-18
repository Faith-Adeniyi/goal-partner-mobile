import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppScreen, Card, ListItemRow, ScreenHeader } from '../ui/components';
import { useAppTheme } from '../ui/hooks/useAppTheme';

export default function PersonalisationScreen({ navigation }) {
  const { colors, spacing, typography, radius, accentKey, setAccentKey } = useAppTheme();

  const themeOptions = [
    { key: 'ocean', label: 'Ocean (Default)' },
    { key: 'forest', label: 'Forest' },
    { key: 'ember', label: 'Ember' },
    { key: 'amethyst', label: 'Amethyst' },
  ];

  const backAction = (
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
      <Ionicons name="arrow-back" size={24} color={colors.text} />
    </TouchableOpacity>
  );

  return (
    <AppScreen scroll>
      <ScreenHeader title="Personalisation" subtitle="" leftAction={backAction} />

      <Card variant="outlined" style={{ marginBottom: spacing.lg }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <Text style={[typography.h3, { color: colors.text }]}>Choose Your Vibe</Text>
          <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 4 }]}>
            
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 10 }}>
          {themeOptions.map((opt) => {
            const selected = accentKey === opt.key;
            return (
              <ListItemRow
                key={`accent-${opt.key}`}
                title={opt.label}
                subtitle={selected ? 'Selected' : 'Tap to apply'}
                icon={<Ionicons name="color-palette-outline" size={20} color={colors.accent} />}
                onPress={async () => {
                  await setAccentKey(opt.key);
                }}
                trailing={
                  <View style={styles.trailing}>
                    <View
                      style={[
                        styles.swatch,
                        {
                          backgroundColor: selected ? colors.accent : colors.border,
                          borderRadius: radius.pill,
                        },
                      ]}
                    />
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={selected ? colors.accent : colors.textMuted}
                    />
                  </View>
                }
              />
            );
          })}
        </View>
      </Card>
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
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  swatch: {
    width: 16,
    height: 16,
  },
});
