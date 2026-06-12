import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/shared/theme';

const WATER_GOAL_ML = 2500;

interface WaterBarProps {
  waterMl: number;
}

export function WaterBar({ waterMl }: WaterBarProps) {
  const pct = Math.min((waterMl / WATER_GOAL_ML) * 100, 100);
  const c = waterMl >= WATER_GOAL_ML ? colors.success : colors.waterAccent;
  return (
    <View style={styles.waterTrack}>
      <View style={[styles.waterFill, { width: `${pct}%` as `${number}%`, backgroundColor: c }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  waterTrack: { height: 10, borderRadius: radius.full, backgroundColor: colors.surfaceHigh, overflow: 'hidden', marginBottom: spacing.sm },
  waterFill:  { height: '100%', borderRadius: radius.full },
});
