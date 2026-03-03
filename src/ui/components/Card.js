import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

export default function Card({ children, variant = 'default', style }) {
  const { colors, radius, elevation } = useAppTheme();

  const variantStyle = (() => {
    if (variant === 'elevated') {
      return {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        ...elevation.medium,
      };
    }

    if (variant === 'outlined') {
      return {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      };
    }

    return {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
    };
  })();

  return (
    <View style={[styles.card, { borderRadius: radius.lg }, variantStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 16,
  },
});
