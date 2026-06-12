import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { DailyProgressItem } from '@/features/patient/hooks/useProgressMetrics';

interface WeeklyChartProps {
  title: string;
  days: DailyProgressItem[];
  getValue: (day: DailyProgressItem) => number;
  goal: number;
  unit: string;
  todayKey: string;
}

export function WeeklyChart({ title, days, getValue, goal, unit, todayKey }: WeeklyChartProps) {
  const maxValue = Math.max(goal, ...days.map(getValue), 1);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={styles.chartMeta}>meta {goal.toLocaleString('pt-BR')} {unit}/dia</Text>
      </View>
      <View style={styles.barsRow}>
        {days.map(day => {
          const value = getValue(day);
          const height = Math.max(Math.round((value / maxValue) * 112), value > 0 ? 8 : 3);
          const ratio = goal > 0 ? value / goal : 0;
          const isToday = day.dateKey === todayKey;
          const barColor = value === 0
            ? colors.border
            : ratio >= 0.8 ? colors.success
            : ratio >= 0.5 ? colors.warning
            : colors.danger;

          return (
            <View key={day.dateKey} style={styles.barColumn}>
              <View style={[styles.barSlot, isToday && styles.barSlotToday]}>
                <View style={[styles.barFill, { height, backgroundColor: barColor }]} />
              </View>
              <Text style={[styles.barValue, value > 0 && { color: barColor }]}>
                {value > 999 ? `${Math.round(value / 1000)}k` : value > 0 ? String(value) : '—'}
              </Text>
              <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                {day.dayLabel}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.md,
    ...shadow.sm,
  },
  chartHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartTitle:     { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  chartMeta:      { color: colors.muted, fontSize: fontSize.xs },
  barsRow:        { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, height: 150 },
  barColumn:      { flex: 1, alignItems: 'center', gap: 3 },
  barSlot: {
    height: 112, width: '100%',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHigh,
    justifyContent: 'flex-end', overflow: 'hidden',
  },
  barSlotToday: {
    borderWidth: 1.5,
    borderColor: colors.primary + '66',
    backgroundColor: colors.primaryGlow,
  },
  barFill:        { width: '100%', borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  barValue:       { color: colors.muted, fontSize: 10, fontWeight: '800' },
  barLabel:       { color: colors.muted, fontSize: 10, textTransform: 'capitalize' },
  barLabelToday:  { color: colors.primary, fontWeight: '800' },
});
