import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

export default function ProgressBar({ value = 0, max = 100, color, height = 8, style }) {
  const { colors, radius } = useAppTheme();
  const boundedValue = Math.max(0, Math.min(value, max));
  const widthPercentage = `${max > 0 ? (boundedValue / max) * 100 : 0}%`;
  const fillColor = color || colors.accent;

  return (
    <View style={[styles.track, { height, borderRadius: radius.pill, backgroundColor: colors.surfaceHighest }, style]}>
      <View style={[styles.fill, { width: widthPercentage, borderRadius: radius.pill, backgroundColor: fillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
