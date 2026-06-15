import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CalendarClock, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, shadow } from '@/shared/theme';
import type { AppointmentItem } from '@/features/calendar/hooks/useAppointments';

interface NextAppointmentCardProps {
  /** Próxima consulta futura, ou null se não houver. */
  appointment: AppointmentItem | null;
  onPress: () => void;
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** Formata "qua, 18 jun · 14:30". */
const formatWhen = (iso: string): string => {
  const d = new Date(iso);
  const wd = WEEKDAYS[d.getDay()];
  const day = d.getDate();
  const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${wd}, ${day} ${month} · ${time}`;
};

/**
 * Card da próxima consulta agendada no dashboard do paciente.
 * Oculto pelo pai quando não há consulta futura (retorna null).
 */
export function NextAppointmentCard({ appointment, onPress }: NextAppointmentCardProps) {
  if (!appointment) return null;

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button" accessibilityLabel="Ver agenda">
      <View style={styles.iconBadge}>
        <CalendarClock size={20} color={colors.warning} />
      </View>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>Próxima consulta</Text>
        <Text style={styles.title}>{formatWhen(appointment.scheduledAt)}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {appointment.nutritionistName ? `Com ${appointment.nutritionistName}` : 'Consulta agendada'}
          {appointment.type ? ` · ${appointment.type}` : ''}
        </Text>
      </View>
      <ChevronRight size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning + '1A',
  },
  body: { flex: 1, gap: 2 },
  eyebrow: { color: colors.warning, fontSize: fontSize.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  sub: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '500' },
});
