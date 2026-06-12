import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { AppointmentItem } from '../../hooks/useAppointments';
import { toDateKey, WEEK_DAYS } from '../../utils/scheduleDate';

interface MonthlyScheduleViewProps {
  calendarDays: (Date | null)[];
  appointmentsByDate: Record<string, AppointmentItem[]>;
  selectedDateKey: string;
  todayKey: string;
  onSelectDate: (date: Date) => void;
}

export function MonthlyScheduleView({ calendarDays, appointmentsByDate, selectedDateKey, todayKey, onSelectDate }: MonthlyScheduleViewProps) {
  return (
    <View style={styles.calendarCard}>
      <View style={styles.weekRow}>
        {WEEK_DAYS.map(day => (
          <Text key={day} style={styles.weekDay}>{day}</Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {calendarDays.map((date, index) => {
          const key = date ? toDateKey(date) : `empty-${index}`;
          const dayAppointments = date ? appointmentsByDate[key] ?? [] : [];
          const isSelected = key === selectedDateKey;
          const isToday = key === todayKey;

          return (
            <Pressable
              key={key}
              disabled={!date}
              onPress={() => date && onSelectDate(date)}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                isToday && !isSelected && styles.dayCellToday,
                !date && styles.dayCellEmpty,
              ]}
              accessibilityRole={date ? 'button' : undefined}
            >
              {date ? (
                <>
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {date.getDate()}
                  </Text>
                  {dayAppointments.length > 0 ? (
                    <View style={[styles.dayDot, isSelected && styles.dayDotSelected]} />
                  ) : null}
                </>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadow.sm,
  },
  weekRow: { flexDirection: 'row' },
  weekDay: { flex: 1, color: colors.muted, fontSize: fontSize.xs, fontWeight: '700', textAlign: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    gap: 3,
  },
  dayCellSelected: { backgroundColor: colors.primary },
  dayCellToday: { borderWidth: 1, borderColor: colors.primary },
  dayCellEmpty: { opacity: 0 },
  dayText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '700' },
  dayTextSelected: { color: colors.onPrimary },
  dayDot: { width: 5, height: 5, borderRadius: radius.full, backgroundColor: colors.primary },
  dayDotSelected: { backgroundColor: colors.onPrimary },
});
