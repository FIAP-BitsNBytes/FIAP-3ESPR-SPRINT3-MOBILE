import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

interface XPProgressBarProps {
  currentXP: number;
  maxXP: number;
  level: number;
}

export function XPProgressBar({ currentXP, maxXP, level }: XPProgressBarProps) {
  const progress = Math.min(currentXP / maxXP, 1);

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={styles.levelText}>Nível {level}</Text>
        <Text style={styles.xpText}>{currentXP}/{maxXP} XP</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` as `${number}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  levelText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  xpText: { color: colors.muted, fontSize: fontSize.xs },
  track: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
});
