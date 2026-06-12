import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';

const pct = (value: number, goal: number) => Math.min(Math.round((value / goal) * 100), 100);

interface GoalBarProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
}

export function GoalBar({ label, value, goal, unit, color }: GoalBarProps) {
  const progress = pct(value, goal);
  return (
    <View style={styles.goalRow}>
      <View style={styles.goalTop}>
        <Text style={styles.goalLabel}>{label}</Text>
        <Text style={styles.goalValue}>
          {value.toLocaleString('pt-BR')} / {goal.toLocaleString('pt-BR')} {unit}
        </Text>
      </View>
      <View style={styles.goalTrack}>
        <View style={[styles.goalFill, { width: `${progress}%` as `${number}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.goalPercent, { color }]}>{progress}% concluído</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  goalRow:    { gap: spacing.xs },
  goalTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  goalLabel:  { color: colors.text, fontSize: fontSize.sm, fontWeight: '800' },
  goalValue:  { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700' },
  goalTrack:  { height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceHigh, overflow: 'hidden' },
  goalFill:   { height: '100%', borderRadius: radius.full },
  goalPercent: { fontSize: fontSize.xs, fontWeight: '800' },
});
