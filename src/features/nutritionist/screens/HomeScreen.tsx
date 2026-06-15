import { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import {
  Users,
  Calendar,
  AlertTriangle,
  Trophy,
  Apple,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import { StatCard } from '@/shared/components/ui/StatCard';
import { PatientCard } from '@/shared/components/ui/PatientCard';
import { QuickActionGrid, type QuickActionItem } from '@/features/admin/components/QuickActionGrid';
import { colors, spacing, radius, fontSize, shadow } from '@/shared/theme';
import { toDateKey } from '@/shared/utils/date';
import { useAuthContext } from '@/features/auth';
import { useClinicPatients } from '../hooks/useClinicPatients';
import { useGamificationRanking } from '../hooks/useGamificationRanking';
import { useAppointments } from '@/features/calendar/hooks/useAppointments';

const MEDALS = ['🥇', '🥈', '🥉'];

const formatTime = (date: Date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const formatDayLabel = (date: Date): string => {
  const todayKey = toDateKey();
  if (toDateKey(date) === todayKey) return 'Hoje';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

export function NutritionistHomeScreen() {
  const { user } = useAuthContext();
  const router = useRouter();
  const { totalCount, lowEngagement, isLoading, error } = useClinicPatients();
  const { ranking } = useGamificationRanking(3);
  const { appointments } = useAppointments('NUTRITIONIST');

  const openPatient = (patientId: string, name: string) => {
    router.push({ pathname: '/patient-progress', params: { patientId, name } } as Href);
  };

  const { todayCount, nextAppointment } = useMemo(() => {
    const now = Date.now();
    const todayKey = toDateKey();
    const active = appointments.filter(a => a.status !== 'CANCELLED');
    return {
      todayCount: active.filter(a => toDateKey(new Date(a.scheduledAt)) === todayKey).length,
      nextAppointment: active.find(a => new Date(a.scheduledAt).getTime() >= now) ?? null,
    };
  }, [appointments]);

  const quickActions: QuickActionItem[] = [
    {
      label: 'Meus Pacientes',
      description: 'Carteira e progresso',
      Icon: Users,
      color: colors.primary,
      onPress: () => router.push('/(tabs)/patients'),
    },
    {
      label: 'Agenda',
      description: 'Consultas e horários',
      Icon: Calendar,
      color: colors.success,
      onPress: () => router.push('/(tabs)/schedule'),
    },
    {
      label: 'Ranking',
      description: 'Engajamento da clínica',
      Icon: Trophy,
      color: colors.warning,
      onPress: () => router.push('/(tabs)/ranking'),
    },
    {
      label: 'Nutrição',
      description: 'Planos alimentares',
      Icon: Apple,
      color: colors.danger,
      onPress: () => router.push('/(tabs)/nutrition'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, {user?.name.split(' ')[0]}</Text>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Acompanhe seus pacientes em tempo real</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="Pacientes"
            value={totalCount}
            Icon={Users}
            color={colors.primary}
            onPress={() => router.push('/(tabs)/patients')}
          />
          <StatCard
            label="Hoje"
            value={todayCount}
            Icon={Calendar}
            color={colors.success}
            onPress={() => router.push('/(tabs)/schedule')}
          />
          <StatCard
            label="Alertas"
            value={lowEngagement.length}
            Icon={AlertTriangle}
            color={colors.warning}
            onPress={() => router.push('/(tabs)/patients')}
          />
        </View>

        {nextAppointment && (
          <Pressable
            style={styles.nextCard}
            onPress={() => router.push('/(tabs)/schedule')}
            accessibilityRole="button"
            accessibilityLabel="Ver próxima consulta na agenda"
          >
            <View style={[styles.nextIcon, { backgroundColor: colors.success + '22' }]}>
              <Clock size={20} color={colors.success} />
            </View>
            <View style={styles.nextInfo}>
              <Text style={styles.nextLabel}>Próxima consulta</Text>
              <Text style={styles.nextValue} numberOfLines={1}>
                {formatDayLabel(new Date(nextAppointment.scheduledAt))} ·{' '}
                {formatTime(new Date(nextAppointment.scheduledAt))}
                {nextAppointment.patientName ? ` · ${nextAppointment.patientName}` : ''}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.muted} />
          </Pressable>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <QuickActionGrid actions={quickActions} />
        </View>

        {ranking.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Top Engajamento</Text>
                <Text style={styles.sectionSub}>Maiores pontuações da clínica</Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/ranking')} accessibilityRole="button">
                <Text style={styles.link}>Ver tudo</Text>
              </Pressable>
            </View>

            <View style={styles.listCard}>
              {ranking.map((entry, i) => (
                <View key={entry.patientId}>
                  <Pressable
                    style={styles.rankRow}
                    onPress={() => openPatient(entry.patientId, entry.patientName)}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir paciente ${entry.patientName}`}
                  >
                    <Text style={styles.medal}>{MEDALS[i] ?? `${i + 1}º`}</Text>
                    <View style={styles.rankInfo}>
                      <Text style={styles.rankName} numberOfLines={1}>{entry.patientName}</Text>
                      <Text style={styles.rankMeta}>Nv.{entry.level} · {entry.points} pts</Text>
                    </View>
                    <ChevronRight size={18} color={colors.muted} />
                  </Pressable>
                  {i < ranking.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Engajamento Baixo</Text>
              <Text style={styles.sectionSub}>Pacientes precisando de atenção</Text>
            </View>
            {lowEngagement.length > 0 && (
              <View style={styles.alertBadge}>
                <Text style={styles.alertCount}>{lowEngagement.length}</Text>
              </View>
            )}
          </View>

          {isLoading && <ActivityIndicator color={colors.primary} />}

          {error && <Text style={styles.errorText}>{error}</Text>}

          {!isLoading && !error && lowEngagement.length === 0 && (
            <Text style={styles.emptyText}>Todos os pacientes estão engajados</Text>
          )}

          {!isLoading && lowEngagement.length > 0 && (
            <View style={styles.listCard}>
              {lowEngagement.map((p, i) => (
                <View key={p.id}>
                  <PatientCard
                    name={p.name}
                    level={p.level}
                    streakDays={p.streakDays}
                    points={p.points}
                    onPress={() => openPatient(p.id, p.name)}
                  />
                  {i < lowEngagement.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: 2 },
  greeting: { color: colors.muted, fontSize: fontSize.sm },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: colors.muted, fontSize: fontSize.sm, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  sectionSub: { color: colors.muted, fontSize: fontSize.xs, marginTop: 2 },
  link: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.sm,
  },
  nextIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  nextInfo: { flex: 1, gap: 2 },
  nextLabel: { color: colors.muted, fontSize: fontSize.xs },
  nextValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  alertBadge: {
    backgroundColor: colors.warning + '22',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.warning + '44',
  },
  alertCount: { color: colors.warning, fontWeight: '800', fontSize: fontSize.sm },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  medal: { fontSize: fontSize.lg, width: 28, textAlign: 'center' },
  rankInfo: { flex: 1, gap: 2 },
  rankName: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  rankMeta: { color: colors.muted, fontSize: fontSize.xs },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  errorText: { color: colors.danger, fontSize: fontSize.sm },
  emptyText: { color: colors.muted, fontSize: fontSize.sm },
});
