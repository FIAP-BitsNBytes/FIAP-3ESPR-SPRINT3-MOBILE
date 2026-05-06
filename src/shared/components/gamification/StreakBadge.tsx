import { View, Text, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

interface StreakBadgeProps {
  days: number;
}

export function StreakBadge({ days }: StreakBadgeProps) {
  const flameColor = days >= 7 ? colors.success : days > 0 ? colors.primary : colors.muted;

  return (
    <View style={styles.container}>
      <Flame size={20} color={flameColor} />
      <Text style={[styles.days, { color: flameColor }]}>{days}</Text>
      <Text style={styles.label}>dias</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  days: { fontSize: fontSize.md, fontWeight: '700' },
  label: { fontSize: fontSize.sm, color: colors.muted },
});
