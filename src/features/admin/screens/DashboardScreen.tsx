import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Settings, Stethoscope, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '@/features/auth';
import { colors, spacing } from '@/shared/theme';
import { useAppointments } from '@/features/calendar/hooks/useAppointments';
import { AppointmentNowList } from '../components/AppointmentNowList';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardSection } from '../components/DashboardSection';
import { OperationalSummaryCard } from '../components/OperationalSummaryCard';
import { PendingApprovalsCard } from '../components/PendingApprovalsCard';
import { PermissionStatsGrid } from '../components/PermissionStatsGrid';
import { QuickActionGrid, QuickActionItem } from '../components/QuickActionGrid';
import {
  getActiveAppointments,
  getConfirmedAppointmentsForDay,
  getNextAppointment,
  getPermissionDashboardProfile,
} from '../domain/dashboard';
import { useDashboardStats } from '../hooks/useDashboardStats';

const formatTime = (date: Date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function AdminDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const role = user?.role ?? 'ADMIN';
  const dashboardProfile = getPermissionDashboardProfile(role);

  const {
    patientCount,
    nutritionistCount,
    todayAppointments,
    pendingNutritionists,
    isLoading,
    error,
  } = useDashboardStats();
  const { appointments, isLoading: isAppointmentsLoading } = useAppointments(role);

  const currentAppointments = useMemo(
    () => getActiveAppointments(appointments, new Date()),
    [appointments],
  );

  const nextAppointment = useMemo(
    () => getNextAppointment(appointments, new Date()),
    [appointments],
  );

  const confirmedToday = useMemo(
    () => getConfirmedAppointmentsForDay(appointments, new Date()),
    [appointments],
  );

  const quickActions = useMemo<QuickActionItem[]>(() => {
    const baseActions: QuickActionItem[] = [
      {
        label: 'Agenda',
        description: role === 'PATIENT' ? 'Suas consultas' : 'Diario, semanal e mensal',
        Icon: Calendar,
        color: colors.warning,
        onPress: () => router.push('/(tabs)/schedule'),
      },
      {
        label: 'Perfil',
        description: 'Dados da conta',
        Icon: User,
        color: colors.textSecondary,
        onPress: () => router.push('/(tabs)/profile'),
      },
    ];

    if (role === 'ADMIN') {
      return [
        baseActions[0],
        {
          label: 'Nutricionistas',
          description: 'Aprovacoes e equipe',
          Icon: Stethoscope,
          color: colors.success,
          onPress: () => router.push('/(tabs)/nutritionists'),
        },
        {
          label: 'Clinica',
          description: 'Dados e limites',
          Icon: Settings,
          color: colors.primary,
          onPress: () => router.push('/(tabs)/clinic-settings'),
        },
        baseActions[1],
      ];
    }

    if (role === 'NUTRITIONIST') {
      return [
        {
          label: 'Pacientes',
          description: 'Carteira e progresso',
          Icon: User,
          color: colors.primary,
          onPress: () => router.push('/(tabs)/patients'),
        },
        ...baseActions,
      ];
    }

    return baseActions;
  }, [role, router]);

  const nextAppointmentText = nextAppointment
    ? `${formatTime(new Date(nextAppointment.scheduledAt))} · ${nextAppointment.nutritionistName ?? nextAppointment.patientName ?? 'Consulta'}`
    : 'Nenhuma proxima consulta encontrada';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <DashboardHeader
          profile={dashboardProfile}
          clinicName={user?.clinicName}
          onSettingsPress={role === 'ADMIN' ? () => router.push('/(tabs)/clinic-settings') : undefined}
        />

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <PermissionStatsGrid
              role={role}
              patientCount={patientCount}
              nutritionistCount={nutritionistCount}
              todayAppointments={todayAppointments}
              confirmedToday={confirmedToday}
              onSchedulePress={() => router.push('/(tabs)/schedule')}
            />

            <DashboardSection
              title="Consulta atual"
              subtitle={role === 'ADMIN' ? 'Operacao da clinica em tempo real' : 'Agenda em andamento'}
              count={currentAppointments.length}
            >
              <AppointmentNowList
                appointments={currentAppointments}
                isLoading={isAppointmentsLoading}
                onAppointmentPress={() => router.push('/(tabs)/schedule')}
              />
            </DashboardSection>

            <DashboardSection title="Acoes rapidas">
              <QuickActionGrid actions={quickActions} />
            </DashboardSection>

            <DashboardSection title="Resumo operacional">
              <OperationalSummaryCard nextAppointmentText={nextAppointmentText} />
            </DashboardSection>

            {role === 'ADMIN' ? (
              <DashboardSection title="Acoes pendentes">
                <PendingApprovalsCard
                  count={pendingNutritionists}
                  onPress={() => router.push('/(tabs)/nutritionists')}
                />
              </DashboardSection>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  loader: { marginTop: spacing.xl },
  errorText: { color: colors.danger, textAlign: 'center' },
});
