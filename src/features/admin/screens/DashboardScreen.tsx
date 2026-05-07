import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Clock,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Stethoscope,
  User,
  Users,
  Zap,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StatCard } from '@/shared/components/ui/StatCard';
import { colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { AppointmentItem, useAppointments } from '@/features/calendar/hooks/useAppointments';
import { useDashboardStats } from '../hooks/useDashboardStats';

const APPOINTMENT_DURATION_MINUTES = 60;

const formatTime = (date: Date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const isAppointmentHappeningNow = (appointment: AppointmentItem, now: Date) => {
  if (appointment.status === 'CANCELLED') return false;

  const start = new Date(appointment.scheduledAt);
  const end = new Date(start.getTime() + APPOINTMENT_DURATION_MINUTES * 60 * 1000);
  return now >= start && now <= end;
};

const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

export function AdminDashboardScreen() {
  const router = useRouter();
  const {
    patientCount,
    nutritionistCount,
    todayAppointments,
    pendingNutritionists,
    isLoading,
    error,
  } = useDashboardStats();
  const { appointments, isLoading: isAppointmentsLoading } = useAppointments('ADMIN');

  const currentAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(appointment => isAppointmentHappeningNow(appointment, now))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [appointments]);

  const nextAppointment = useMemo(() => {
    const now = new Date();
    return appointments.find(appointment =>
      appointment.status !== 'CANCELLED' && new Date(appointment.scheduledAt) > now
    );
  }, [appointments]);

  const confirmedToday = useMemo(() => (
    appointments.filter(appointment =>
      appointment.status === 'CONFIRMED' && isToday(new Date(appointment.scheduledAt))
    ).length
  ), [appointments]);

  const quickActions = [
    {
      label: 'Agenda',
      description: 'Diário, semanal e mensal',
      Icon: Calendar,
      color: colors.warning,
      onPress: () => router.push('/(tabs)/schedule'),
    },
    {
      label: 'Nutricionistas',
      description: 'Aprovações e equipe',
      Icon: Stethoscope,
      color: colors.success,
      onPress: () => router.push('/(tabs)/nutritionists'),
    },
    {
      label: 'Clínica',
      description: 'Dados e limites',
      Icon: Settings,
      color: colors.primary,
      onPress: () => router.push('/(tabs)/clinic-settings'),
    },
    {
      label: 'Perfil',
      description: 'Conta admin',
      Icon: User,
      color: colors.textSecondary,
      onPress: () => router.push('/(tabs)/profile'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Painel Admin</Text>
              <Text style={styles.subtitle}>Visão geral da operação da clínica</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/clinic-settings')}
              style={styles.settingsBtn}
              accessibilityRole="button"
            >
              <Settings size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.statsRow}>
              <StatCard label="Pacientes" value={patientCount} Icon={Users} color={colors.primary} />
              <StatCard label="Nutricionistas" value={nutritionistCount} Icon={Stethoscope} color={colors.success} />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                label="Consultas Hoje"
                value={todayAppointments}
                Icon={Calendar}
                color={colors.warning}
                onPress={() => router.push('/(tabs)/schedule')}
              />
              <StatCard
                label="Confirmadas"
                value={confirmedToday}
                Icon={ShieldCheck}
                color={colors.success}
                onPress={() => router.push('/(tabs)/schedule')}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Consulta atual</Text>
                <Text style={styles.sectionCount}>{currentAppointments.length}</Text>
              </View>

              {isAppointmentsLoading ? (
                <ActivityIndicator color={colors.primary} style={styles.inlineLoader} />
              ) : currentAppointments.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Clock size={18} color={colors.muted} />
                  <Text style={styles.emptyText}>Nenhum médico em consulta agora</Text>
                </View>
              ) : (
                currentAppointments.slice(0, 2).map(appointment => (
                  <Pressable
                    key={appointment.id}
                    onPress={() => router.push('/(tabs)/schedule')}
                    style={styles.currentCard}
                    accessibilityRole="button"
                  >
                    <View style={styles.currentTimeBadge}>
                      <Clock size={14} color={colors.warning} />
                      <Text style={styles.currentTimeText}>{formatTime(new Date(appointment.scheduledAt))}</Text>
                    </View>
                    <View style={styles.currentInfo}>
                      <View style={styles.personRow}>
                        <Stethoscope size={15} color={colors.primary} />
                        <Text style={styles.personText}>{appointment.nutritionistName ?? 'Médico não informado'}</Text>
                      </View>
                      <View style={styles.personRow}>
                        <User size={15} color={colors.success} />
                        <Text style={styles.personText}>{appointment.patientName ?? 'Paciente não informado'}</Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color={colors.muted} />
                  </Pressable>
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ações rápidas</Text>
              <View style={styles.quickGrid}>
                {quickActions.map(action => (
                  <Pressable
                    key={action.label}
                    onPress={action.onPress}
                    style={styles.quickCard}
                    accessibilityRole="button"
                  >
                    <View style={[styles.quickIcon, { backgroundColor: action.color + '22' }]}>
                      <action.Icon size={20} color={action.color} />
                    </View>
                    <View style={styles.quickTextWrap}>
                      <Text style={styles.quickTitle}>{action.label}</Text>
                      <Text style={styles.quickDescription}>{action.description}</Text>
                    </View>
                    <ChevronRight size={18} color={colors.muted} />
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resumo operacional</Text>
              <View style={styles.opsCard}>
                <View style={styles.opsItem}>
                  <LayoutDashboard size={18} color={colors.primary} />
                  <View style={styles.opsTextWrap}>
                    <Text style={styles.opsLabel}>Agenda integrada</Text>
                    <Text style={styles.opsValue}>Visualização diária, semanal e mensal ativa</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.opsItem}>
                  <Zap size={18} color={colors.warning} />
                  <View style={styles.opsTextWrap}>
                    <Text style={styles.opsLabel}>Próxima consulta</Text>
                    <Text style={styles.opsValue}>
                      {nextAppointment
                        ? `${formatTime(new Date(nextAppointment.scheduledAt))} · ${nextAppointment.nutritionistName ?? 'Médico'}`
                        : 'Nenhuma próxima consulta encontrada'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {pendingNutritionists > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ações pendentes</Text>
                <Pressable
                  style={styles.pendingCard}
                  onPress={() => router.push('/(tabs)/nutritionists')}
                  accessibilityRole="button"
                >
                  <View style={styles.pendingLeft}>
                    <AlertCircle size={24} color={colors.warning} />
                    <View style={styles.pendingTextWrap}>
                      <Text style={styles.pendingNum}>{pendingNutritionists}</Text>
                      <Text style={styles.pendingLabel}>
                        nutricionista{pendingNutritionists > 1 ? 's' : ''} aguardando aprovação
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={colors.muted} />
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: 2 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: fontSize.sm },
  loader: { marginTop: spacing.xl },
  inlineLoader: { paddingVertical: spacing.lg },
  errorText: { color: colors.danger, fontSize: fontSize.sm, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
  sectionCount: {
    minWidth: 30,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.primaryGlow,
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '800',
    textAlign: 'center',
  },
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
  quickGrid: { gap: spacing.sm },
  quickCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTextWrap: { flex: 1 },
  quickTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  quickDescription: { color: colors.muted, fontSize: fontSize.xs },
  opsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  opsItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  opsTextWrap: { flex: 1, gap: 2 },
  opsLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: '800' },
  opsValue: { color: colors.muted, fontSize: fontSize.xs },
  divider: { height: 1, backgroundColor: colors.border },
  pendingCard: {
    backgroundColor: colors.warning + '14',
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.warning + '44',
    ...shadow.sm,
  },
  pendingLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  pendingTextWrap: { flex: 1 },
  pendingNum: { color: colors.warning, fontSize: fontSize.xxl, fontWeight: '900', lineHeight: 36 },
  pendingLabel: { color: colors.text, fontSize: fontSize.sm, flex: 1 },
});
