import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';
import { AppointmentItem } from '../../hooks/useAppointments';
import { formatShortDay, formatTime, toDateKey, WEEK_DAYS } from '../../utils/scheduleDate';

interface WeeklyScheduleViewProps {
  weekDays: Date[];
  appointmentsByDate: Record<string, AppointmentItem[]>;
  selectedDateKey: string;
  todayKey: string;
  onSelectDate: (date: Date) => void;
}

export function WeeklyScheduleView({ weekDays, appointmentsByDate, selectedDateKey, todayKey, onSelectDate }: WeeklyScheduleViewProps) {
  return (
    <View style={styles.weekList}>
      {weekDays.map(day => {
        const key = toDateKey(day);
        const dayAppointments = [...(appointmentsByDate[key] ?? [])].sort(
          (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        );
        const isSelected = key === selectedDateKey;
        const isToday = key === todayKey;

        return (
          <Pressable
            key={key}
            onPress={() => onSelectDate(day)}
            style={[styles.weekDayCard, isSelected && styles.weekDayCardSelected]}
            accessibilityRole="button"
          >
            <View style={styles.weekDayHeader}>
              <View>
                <Text style={[styles.weekDayName, isSelected && styles.selectedDarkText]}>
                  {WEEK_DAYS[day.getDay()]}
                </Text>
                <Text style={[styles.weekDayDate, isSelected && styles.selectedDarkText]}>
                  {formatShortDay(day)}
                </Text>
              </View>
              <Text style={[styles.weekCount, isSelected && styles.weekCountSelected]}>
                {dayAppointments.length}
              </Text>
            </View>
            {isToday ? <Text style={[styles.todayLabel, isSelected && styles.selectedDarkText]}>Hoje</Text> : null}
            {dayAppointments.slice(0, 2).map(appointment => (
              <Text key={appointment.id} style={[styles.weekAppointmentText, isSelected && styles.selectedDarkText]}>
                {formatTime(new Date(appointment.scheduledAt))} · {appointment.patientName ?? appointment.nutritionistName ?? 'Consulta'}
              </Text>
            ))}
            {dayAppointments.length > 2 ? (
              <Text style={[styles.moreText, isSelected && styles.selectedDarkText]}>
                +{dayAppointments.length - 2} consulta{dayAppointments.length - 2 > 1 ? 's' : ''}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  weekList: { gap: spacing.sm },
  weekDayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  weekDayCardSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  weekDayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekDayName: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  weekDayDate: { color: colors.muted, fontSize: fontSize.xs, textTransform: 'capitalize' },
  selectedDarkText: { color: colors.onPrimary },
  weekCount: {
    minWidth: 28,
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.primaryGlow,
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 2,
  },
  weekCountSelected: { backgroundColor: colors.onPrimary, color: colors.primary },
  todayLabel: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900' },
  weekAppointmentText: { color: colors.textSecondary, fontSize: fontSize.sm },
  moreText: { color: colors.muted, fontSize: fontSize.xs, fontWeight: '700' },
});
