import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Droplets, Flame, Target, TrendingUp, Trophy, Utensils } from 'lucide-react-native';
import { LevelCard } from '@/shared/components/gamification/LevelCard';
import { StatCard } from '@/shared/components/ui/StatCard';
import { colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { useAuthContext } from '@/features/auth';
import { useGamification } from '@/shared/hooks/useGamification';
import { useTodayLogs } from '../hooks/useTodayLogs';
import { DailyProgressItem, useProgressMetrics } from '../hooks/useProgressMetrics';

const CALORIE_GOAL = 2000;
const WATER_GOAL_ML = 2500;
const MEAL_GOAL = 4;
const STREAK_GOAL = 7;

const pct = (value: number, goal: number) => Math.min(Math.round((value / goal) * 100), 100);

function GoalBar({ label, value, goal, unit, color }: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
}) {
  const progress = pct(value, goal);

  return (
    <View style={styles.goalRow}>
      <View style={styles.goalTop}>
        <Text style={styles.goalLabel}>{label}</Text>
        <Text style={styles.goalValue}>
          {value.toLocaleString('pt-BR')} / {goal.toLocaleString('pt-BR')} {unit}
        </Text>
      </View>
      <View style={styles.goalTrack}>
        <View style={[styles.goalFill, { width: `${progress}%` as `${number}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.goalPercent, { color }]}>{progress}% concluído</Text>
    </View>
  );
}

function WeeklyChart({ title, days, getValue, goal, color, unit }: {
  title: string;
  days: DailyProgressItem[];
  getValue: (day: DailyProgressItem) => number;
  goal: number;
  color: string;
  unit: string;
}) {
  const maxValue = Math.max(goal, ...days.map(getValue), 1);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={styles.chartMeta}>últimos 7 dias</Text>
      </View>
      <View style={styles.barsRow}>
        {days.map(day => {
          const value = getValue(day);
          const height = Math.max(Math.round((value / maxValue) * 112), value > 0 ? 12 : 4);
          return (
            <View key={day.dateKey} style={styles.barColumn}>
              <View style={styles.barSlot}>
                <View style={[styles.barFill, { height, backgroundColor: color }]} />
              </View>
              <Text style={styles.barValue}>{value > 999 ? `${Math.round(value / 1000)}k` : value}</Text>
              <Text style={styles.barLabel}>{day.dayLabel}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.chartFooter}>Meta diária: {goal.toLocaleString('pt-BR')} {unit}</Text>
    </View>
  );
}

export function PatientProgressScreen() {
  const { user } = useAuthContext();
  const params = useLocalSearchParams<{ patientId?: string }>();
  const requestedPatientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;
  const targetPatientId = requestedPatientId ?? user?.id;
  const isOwnProgress = user?.id === targetPatientId;
  const canViewProgress = Boolean(user && targetPatientId && (isOwnProgress || user.role === 'NUTRITIONIST'));
  const { stats, isLoading: isGamificationLoading } = useGamification(canViewProgress ? targetPatientId : null);
  const { totalCalories, waterMl, meals } = useTodayLogs(canViewProgress ? targetPatientId : null);
  const { days, isLoading, error } = useProgressMetrics(canViewProgress ? targetPatientId : null);

  const mealCount = meals.filter(meal => meal.category === 'MEAL').length;
  const exerciseCount = meals.filter(meal => meal.category === 'EXERCISE').length;
  const xpInLevel = stats.experience % 500;

  const weeklyAverage = useMemo(() => {
    const total = days.reduce((sum, day) => sum + day.calories, 0);
    return Math.round(total / Math.max(days.length, 1));
  }, [days]);

  const bestDay = useMemo(() => {
    return days.reduce<DailyProgressItem | null>((best, day) => (
      !best || day.calories > best.calories ? day : best
    ), null);
  }, [days]);

  if (!user) return null;

  if (!canViewProgress) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.blockedState}>
          <Text style={styles.title}>Acesso Restrito</Text>
          <Text style={styles.subtitle}>
            Você não tem permissão para visualizar o progresso deste paciente.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // The rest of the rendering when allowed
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Progresso</Text>
          <Text style={styles.subtitle}>
            {isOwnProgress ? 'Sua evolução em tempo real' : 'Evolução do paciente em tempo real'}
          </Text>
        </View>

        <LevelCard
          name={user.name}
          level={isGamificationLoading ? 1 : stats.level}
          currentXP={isGamificationLoading ? 0 : xpInLevel}
          maxXP={500}
          streakDays={isGamificationLoading ? 0 : stats.streakDays}
        />

        <View style={styles.statsRow}>
          <StatCard label="Média kcal" value={weeklyAverage} Icon={TrendingUp} color={colors.primary} />
          <StatCard label="Sequência" value={`${stats.streakDays}d`} Icon={Flame} color={colors.warning} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Refeições" value={mealCount} Icon={Utensils} color={colors.success} />
          <StatCard label="Exercícios" value={exerciseCount} Icon={Trophy} color="#A78BFA" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isOwnProgress ? 'Metas de hoje' : 'Metas do paciente'}</Text>
          <View style={styles.goalsCard}>
            <GoalBar label="Calorias" value={totalCalories} goal={CALORIE_GOAL} unit="kcal" color={colors.primary} />
            <GoalBar label="Água" value={waterMl} goal={WATER_GOAL_ML} unit="ml" color="#38BDF8" />
            <GoalBar label="Refeições" value={mealCount} goal={MEAL_GOAL} unit="reg." color={colors.success} />
            <GoalBar label="Sequência" value={stats.streakDays} goal={STREAK_GOAL} unit="dias" color={colors.warning} />
          </View>
        </View>

        {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gráficos</Text>
          <WeeklyChart
            title="Calorias"
            days={days}
            getValue={day => day.calories}
            goal={CALORIE_GOAL}
            color={colors.primary}
            unit="kcal"
          />
          <WeeklyChart
            title="Água"
            days={days}
            getValue={day => Math.round(day.waterMl / 1000)}
            goal={Math.round(WATER_GOAL_ML / 1000)}
            color="#38BDF8"
            unit="L"
          />
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Target size={20} color={colors.primary} />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Próxima melhoria</Text>
            <Text style={styles.insightText}>
              {totalCalories < CALORIE_GOAL
                ? `Faltam ${(CALORIE_GOAL - totalCalories).toLocaleString('pt-BR')} kcal para bater a meta de hoje.`
                : 'Meta calórica de hoje concluída. Mantenha a consistência nos próximos dias.'}
            </Text>
            {bestDay ? (
              <Text style={styles.insightMeta}>Melhor dia da semana: {bestDay.dayLabel} com {bestDay.calories} kcal registradas.</Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: 2 },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: fontSize.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
  goalsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.sm,
  },
  goalRow: { gap: spacing.xs },
  goalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  goalLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: '800' },
  goalValue: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700' },
  goalTrack: { height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceHigh, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: radius.full },
  goalPercent: { fontSize: fontSize.xs, fontWeight: '800' },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.sm,
  },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  chartMeta: { color: colors.muted, fontSize: fontSize.xs },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, height: 158 },
  barColumn: { flex: 1, alignItems: 'center', gap: 4 },
  barSlot: {
    height: 112,
    width: '100%',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHigh,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  barValue: { color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
  barLabel: { color: colors.muted, fontSize: 10, textTransform: 'capitalize' },
  chartFooter: { color: colors.muted, fontSize: fontSize.xs },
  insightCard: {
    backgroundColor: colors.primaryGlow,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '33',
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: { flex: 1, gap: spacing.xs },
  insightTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '900' },
  insightText: { color: colors.textSecondary, fontSize: fontSize.sm },
  insightMeta: { color: colors.muted, fontSize: fontSize.xs },
  errorText: { color: colors.danger, fontSize: fontSize.sm, textAlign: 'center' },
  blockedState: { flex: 1, padding: spacing.lg, justifyContent: 'center', gap: spacing.sm },
});
