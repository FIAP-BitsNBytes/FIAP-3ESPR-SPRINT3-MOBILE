import { StyleSheet, View } from 'react-native';
import { Calendar, ShieldCheck, Stethoscope, Users } from 'lucide-react-native';
import { StatCard } from '@/shared/components/ui/StatCard';
import { colors, spacing } from '@/shared/theme';
import type { UserRole } from '@/features/auth/domain/auth';

interface PermissionStatsGridProps {
  role: UserRole;
  patientCount: number;
  nutritionistCount: number;
  todayAppointments: number;
  confirmedToday: number;
  onSchedulePress: () => void;
}

export function PermissionStatsGrid({
  role,
  patientCount,
  nutritionistCount,
  todayAppointments,
  confirmedToday,
  onSchedulePress,
}: PermissionStatsGridProps) {
  if (role === 'PATIENT') {
    return (
      <View style={styles.statsRow}>
        <StatCard label="Consultas" value={todayAppointments} Icon={Calendar} color={colors.warning} onPress={onSchedulePress} />
        <StatCard label="Confirmadas" value={confirmedToday} Icon={ShieldCheck} color={colors.success} onPress={onSchedulePress} />
      </View>
    );
  }

  if (role === 'NUTRITIONIST') {
    return (
      <>
        <View style={styles.statsRow}>
          <StatCard label="Pacientes" value={patientCount} Icon={Users} color={colors.primary} />
          <StatCard label="Agenda Hoje" value={todayAppointments} Icon={Calendar} color={colors.warning} onPress={onSchedulePress} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Confirmadas" value={confirmedToday} Icon={ShieldCheck} color={colors.success} onPress={onSchedulePress} />
          <StatCard label="Equipe" value={nutritionistCount} Icon={Stethoscope} color={colors.textSecondary} />
        </View>
      </>
    );
  }

  return (
    <>
      <View style={styles.statsRow}>
        <StatCard label="Pacientes" value={patientCount} Icon={Users} color={colors.primary} />
        <StatCard label="Nutricionistas" value={nutritionistCount} Icon={Stethoscope} color={colors.success} />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Consultas Hoje" value={todayAppointments} Icon={Calendar} color={colors.warning} onPress={onSchedulePress} />
        <StatCard label="Confirmadas" value={confirmedToday} Icon={ShieldCheck} color={colors.success} onPress={onSchedulePress} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: spacing.sm },
});
