import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

interface AppointmentCardProps {
  patientName?: string;
  nutritionistName?: string;
  scheduledAt: string;
  status: AppointmentStatus;
  type?: string;
}

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  PENDING: colors.warning,
  CONFIRMED: colors.success,
  CANCELLED: colors.danger,
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
};

export function AppointmentCard({ patientName, nutritionistName, scheduledAt, status, type }: AppointmentCardProps) {
  const date = new Date(scheduledAt);
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const statusColor = STATUS_COLOR[status];

  return (
    <View style={styles.card}>
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
      <View style={styles.content}>
        <View style={styles.row}>
          <Calendar size={16} color={colors.muted} />
          <Text style={styles.datetime}>{dateStr} às {timeStr}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{STATUS_LABEL[status]}</Text>
          </View>
        </View>
        {patientName && <Text style={styles.name}>{patientName}</Text>}
        {nutritionistName && <Text style={styles.name}>{nutritionistName}</Text>}
        {type && <Text style={styles.type}>{type}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  statusBar: { width: 4 },
  content: { flex: 1, padding: spacing.md, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  datetime: { color: colors.muted, fontSize: fontSize.sm, flex: 1 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600' },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  type: { color: colors.muted, fontSize: fontSize.sm },
});
