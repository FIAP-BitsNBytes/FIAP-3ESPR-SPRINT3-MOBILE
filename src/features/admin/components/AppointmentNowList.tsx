import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Clock, Stethoscope, User } from 'lucide-react-native';
import { colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import type { AppointmentItem } from '@/features/calendar/hooks/useAppointments';

const formatTime = (date: Date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

interface AppointmentNowListProps {
  appointments: AppointmentItem[];
  isLoading: boolean;
  onAppointmentPress: () => void;
}

export function AppointmentNowList({ appointments, isLoading, onAppointmentPress }: AppointmentNowListProps) {
  if (isLoading) {
    return <ActivityIndicator color={colors.primary} style={styles.inlineLoader} />;
  }

  if (appointments.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Clock size={18} color={colors.muted} />
        <Text style={styles.emptyText}>Nenhuma consulta em andamento agora</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {appointments.slice(0, 2).map(appointment => (
        <Pressable
          key={appointment.id}
          onPress={onAppointmentPress}
          style={styles.currentCard}
          accessibilityRole="button"
          accessibilityLabel="Abrir agenda"
        >
          <View style={styles.currentTimeBadge}>
            <Clock size={14} color={colors.warning} />
            <Text style={styles.currentTimeText}>{formatTime(new Date(appointment.scheduledAt))}</Text>
          </View>
          <View style={styles.currentInfo}>
            <View style={styles.personRow}>
              <Stethoscope size={15} color={colors.primary} />
              <Text style={styles.personText}>{appointment.nutritionistName ?? 'Nutricionista nao informado'}</Text>
            </View>
            <View style={styles.personRow}>
              <User size={15} color={colors.success} />
              <Text style={styles.personText}>{appointment.patientName ?? 'Paciente nao informado'}</Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  inlineLoader: { paddingVertical: spacing.lg },
  list: { gap: spacing.sm },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: { color: colors.muted, fontSize: fontSize.sm, flex: 1 },
  currentCard: {
    backgroundColor: colors.warning + '12',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warning + '33',
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  currentTimeBadge: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.warning + '20',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  currentTimeText: { color: colors.warning, fontSize: fontSize.sm, fontWeight: '800' },
  currentInfo: { flex: 1, gap: spacing.xs },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  personText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700', flex: 1 },
});
