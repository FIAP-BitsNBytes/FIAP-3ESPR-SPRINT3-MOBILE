import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CalendarClock, CheckCircle, Clock, User, XCircle } from 'lucide-react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';
import type { AppointmentStatus, NutritionistAppointment } from '../hooks/useNutritionistAppointments';

const STATUS_CONFIG: Record<AppointmentStatus, { color: string; Icon: typeof CheckCircle; label: string }> = {
  CONFIRMED: { color: colors.success, Icon: CheckCircle, label: 'Confirmada' },
  PENDING: { color: colors.warning, Icon: Clock, label: 'Pendente' },
  CANCELLED: { color: colors.danger, Icon: XCircle, label: 'Cancelada' },
};

const formatDateTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Data inválida';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface NutritionistSessionRowProps {
  appointment: NutritionistAppointment;
}

export function NutritionistSessionRow({ appointment }: NutritionistSessionRowProps) {
  const status = STATUS_CONFIG[appointment.status] ?? STATUS_CONFIG.PENDING;
  const { color, Icon, label } = status;

  return (
    <View style={styles.card}>
      <View style={styles.dateBadge}>
        <CalendarClock size={14} color={colors.primary} />
      </View>

      <View style={styles.info}>
        <View style={styles.patientRow}>
          <User size={13} color={colors.muted} />
          <Text style={styles.patientName} numberOfLines={1}>{appointment.patientName}</Text>
        </View>
        <Text style={styles.dateText}>{formatDateTime(appointment.scheduledAt)}</Text>
        {appointment.type ? <Text style={styles.typeText} numberOfLines={1}>{appointment.type}</Text> : null}
      </View>

      <View style={[styles.statusBadge, { backgroundColor: color + '22' }]}>
        <Icon size={12} color={color} />
        <Text style={[styles.statusText, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: { flex: 1, gap: 2 },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  patientName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700', flex: 1 },
  dateText: { color: colors.muted, fontSize: fontSize.xs, fontWeight: '500' },
  typeText: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusText: { fontSize: fontSize.xs, fontWeight: '700' },
});
