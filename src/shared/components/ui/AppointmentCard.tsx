import { StyleSheet, Pressable, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Calendar, Clock, Stethoscope, User } from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

interface AppointmentCardProps {
  patientName?: string;
  nutritionistName?: string;
  scheduledAt: string;
  status: AppointmentStatus;
  type?: string;
  onPress?: () => void;
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

export function AppointmentCard({ patientName, nutritionistName, scheduledAt, status, type, onPress }: AppointmentCardProps) {
  const date = new Date(scheduledAt);
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', weekday: 'short' });
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const statusColor = STATUS_COLOR[status];

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 80, easing: Easing.out(Easing.quad) });
  };
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 200, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.timeRow}>
              <Calendar size={14} color={colors.muted} />
              <Text style={styles.dateText}>{dateStr}</Text>
              <Clock size={14} color={colors.muted} />
              <Text style={styles.dateText}>{timeStr}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: statusColor + '22', borderColor: statusColor + '44' }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>{STATUS_LABEL[status]}</Text>
            </View>
          </View>
          {nutritionistName ? (
            <View style={styles.personRow}>
              <Stethoscope size={14} color={colors.primary} />
              <Text style={styles.name}>{nutritionistName}</Text>
            </View>
          ) : null}
          {patientName ? (
            <View style={styles.personRow}>
              <User size={14} color={colors.success} />
              <Text style={styles.name}>{patientName}</Text>
            </View>
          ) : null}
          {type ? <Text style={styles.type}>{type}</Text> : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBar: { width: 4 },
  content: { flex: 1, padding: spacing.md, gap: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dateText: { color: colors.textSecondary, fontSize: fontSize.xs },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700' },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  type: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
});
