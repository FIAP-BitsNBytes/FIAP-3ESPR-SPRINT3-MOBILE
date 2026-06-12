import { StyleSheet, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { AppointmentItem } from '../../hooks/useAppointments';
import { formatTime } from '../../utils/scheduleDate';
import { AppointmentPeople } from './AppointmentPeople';
import { sharedScheduleStyles } from './scheduleStyles';

interface DailyScheduleViewProps {
  hours: number[];
  appointments: AppointmentItem[];
}

export function DailyScheduleView({ hours, appointments }: DailyScheduleViewProps) {
  return (
    <View style={styles.timelineCard}>
      {hours.map(hour => {
        const hourAppointments = appointments.filter(appointment =>
          new Date(appointment.scheduledAt).getHours() === hour
        );

        return (
          <View key={hour} style={styles.timelineRow}>
            <Text style={styles.hourLabel}>{String(hour).padStart(2, '0')}:00</Text>
            <View style={styles.hourSlot}>
              {hourAppointments.length === 0 ? (
                <Text style={styles.freeText}>Livre</Text>
              ) : (
                hourAppointments.map(appointment => (
                  <View key={appointment.id} style={styles.slotAppointment}>
                    <View style={styles.slotTopRow}>
                      <View style={sharedScheduleStyles.currentTimeBadge}>
                        <Clock size={13} color={colors.warning} />
                        <Text style={sharedScheduleStyles.currentTimeText}>{formatTime(new Date(appointment.scheduledAt))}</Text>
                      </View>
                      <Text style={styles.slotType}>{appointment.type ?? 'Consulta'}</Text>
                    </View>
                    <AppointmentPeople appointment={appointment} />
                  </View>
                ))
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    ...shadow.sm,
  },
  timelineRow: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.md },
  hourLabel: { width: 50, color: colors.muted, fontSize: fontSize.sm, fontWeight: '800', paddingTop: spacing.sm },
  hourSlot: {
    flex: 1,
    minHeight: 50,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: spacing.md,
    gap: spacing.sm,
  },
  freeText: { color: colors.muted, fontSize: fontSize.sm, paddingTop: spacing.sm },
  slotAppointment: {
    backgroundColor: colors.primaryGlow,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + '44',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  slotTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  slotType: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700', flex: 1, textAlign: 'right' },
});
