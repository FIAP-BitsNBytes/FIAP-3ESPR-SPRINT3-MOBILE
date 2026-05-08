import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Target, TrendingUp, Trophy, Utensils } from 'lucide-react-native';
import { LevelCard } from '@/shared/components/gamification/LevelCard';
import { StatCard } from '@/shared/components/ui/StatCard';
import { appStyles, colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { useAuthContext } from '@/features/auth';
import { useGamification } from '@/shared/hooks/useGamification';
import { useTodayLogs } from '../hooks/useTodayLogs';
import { DailyProgressItem, useProgressMetrics } from '../hooks/useProgressMetrics';
import { usePlanDetail } from '@/features/nutrition/hooks/usePlanDetail';

const CALORIE_FALLBACK = 2000;
const WATER_GOAL_ML = 2500;
const MEAL_FALLBACK = 4;
const STREAK_GOAL = 7;

const pct = (value: number, goal: number) => Math.min(Math.round((value / goal) * 100), 100);

function GoalBar({ label, value, goal, unit, color }: {
  label: string; value: number; goal: number; unit: string; color: string;
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

function WeeklyChart({ title, days, getValue, goal, unit, todayKey }: {
  title: string;
  days: DailyProgressItem[];
  getValue: (day: DailyProgressItem) => number;
  goal: number;
  unit: string;
  todayKey: string;
}) {
  const maxValue = Math.max(goal, ...days.map(getValue), 1);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={styles.chartMeta}>meta {goal.toLocaleString('pt-BR')} {unit}/dia</Text>
      </View>
      <View style={styles.barsRow}>
        {days.map(day => {
          const value = getValue(day);
          const height = Math.max(Math.round((value / maxValue) * 112), value > 0 ? 8 : 3);
          const ratio = goal > 0 ? value / goal : 0;
          const isToday = day.dateKey === todayKey;
          const barColor = value === 0
            ? colors.border
            : ratio >= 0.8 ? colors.success
            : ratio >= 0.5 ? colors.warning
            : colors.danger;

          return (
            <View key={day.dateKey} style={styles.barColumn}>
              <View style={[styles.barSlot, isToday && styles.barSlotToday]}>
                <View style={[styles.barFill, { height, backgroundColor: barColor }]} />
              </View>
              <Text style={[styles.barValue, value > 0 && { color: barColor }]}>
                {value > 999 ? `${Math.round(value / 1000)}k` : value > 0 ? String(value) : '—'}
              </Text>
              <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                {day.dayLabel}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function PatientProgressScreen() {
  const { user } = useAuthContext();
  const today = new Date().toISOString().slice(0, 10);

  const { stats, isLoading: isGamificationLoading } = useGamification(user?.id ?? null);
  const { totalCalories, waterMl, meals } = useTodayLogs(user?.id ?? null);
  const { days, isLoading, error } = useProgressMetrics(user?.id ?? null);
  const { plan, items: planItems } = usePlanDetail(undefined, today);

  const mealCount = meals.filter(m => m.category === 'MEAL').length;
  const xpInLevel = stats.experience % 500;

  // Dynamic goals derived from the active meal plan
  const planCalorieGoal = planItems.reduce((s, i) => s + (i.prescribedCal ?? 0), 0);
  const calorieGoal = planCalorieGoal > 0 ? planCalorieGoal : CALORIE_FALLBACK;
  const todayLoggedCount = planItems.filter(i => i.logId && i.logId !== 'pending').length;
  const planAdherencePct = planItems.length > 0
    ? Math.round((todayLoggedCount / planItems.length) * 100)
    : null;
  const mealGoal = planItems.length > 0 ? planItems.length : MEAL_FALLBACK;

  const weeklyAverage = useMemo(() => {
    const total = days.reduce((sum, d) => sum + d.calories, 0);
    return Math.round(total / Math.max(days.length, 1));
  }, [days]);

  const weeklyCalTotal = useMemo(
    () => days.reduce((s, d) => s + d.calories, 0),
    [days],
  );

  const bestDay = useMemo(
    () => days.reduce<DailyProgressItem | null>(
      (best, d) => (!best || d.calories > best.calories ? d : best), null,
    ),
    [days],
  );

  const insightText = useMemo(() => {
    if (totalCalories >= calorieGoal)
      return `Meta calórica de hoje atingida (${totalCalories.toLocaleString('pt-BR')} kcal). Continue assim!`;
    const deficit = calorieGoal - totalCalories;
    return `Faltam ${deficit.toLocaleString('pt-BR')} kcal para sua meta de hoje (${Math.round((totalCalories / calorieGoal) * 100)}% concluído).`;
  }, [totalCalories, calorieGoal]);

  const insightMeta = useMemo(() => {
    const parts: string[] = [];
    const weeklyPct = Math.round((weeklyCalTotal / (calorieGoal * 7)) * 100);
    if (weeklyCalTotal > 0) parts.push(`Semana: ${weeklyPct}% da meta calórica.`);
    if (bestDay?.calories) parts.push(`Melhor dia: ${bestDay.dayLabel} (${bestDay.calories.toLocaleString('pt-BR')} kcal).`);
    if (planAdherencePct !== null) {
      const pending = planItems.length - todayLoggedCount;
      if (pending > 0) parts.push(`${pending} item${pending !== 1 ? 's' : ''} do plano pendente${pending !== 1 ? 's' : ''} hoje.`);
      else parts.push('Todas as refeições do plano registradas hoje!');
    }
    return parts.join(' ');
  }, [weeklyCalTotal, calorieGoal, bestDay, planAdherencePct, planItems.length, todayLoggedCount]);

  const adherenceColor = planAdherencePct == null ? colors.muted
    : planAdherencePct >= 80 ? colors.success
    : planAdherencePct >= 50 ? colors.warning
    : colors.danger;

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Meu Progresso</Text>
          <Text style={styles.subtitle}>
            {plan ? `Plano: ${plan.title}` : 'Sua evolução em tempo real'}
          </Text>
        </View>

        <LevelCard
          name={user.name}
          level={isGamificationLoading ? 1 : stats.level}
          currentXP={isGamificationLoading ? 0 : xpInLevel}
          maxXP={500}
          streakDays={isGamificationLoading ? 0 : stats.streakDays}
        />

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <StatCard label="Média semanal" value={`${weeklyAverage} kcal`} Icon={TrendingUp} color={colors.primary} />
          <StatCard label="Sequência" value={`${stats.streakDays}d`} Icon={Flame} color={colors.warning} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Refeições hoje" value={mealCount} Icon={Utensils} color={colors.success} />
          {planAdherencePct !== null
            ? <StatCard label="Adesão ao plano" value={`${planAdherencePct}%`} Icon={Target} color={adherenceColor} />
            : <StatCard label="XP total" value={stats.experience} Icon={Trophy} color="#A78BFA" />
          }
        </View>

        {/* Today's goals */}
        <View style={styles.section}>
          <Text style={appStyles.sectionTitle}>Metas de hoje</Text>
          <View style={styles.goalsCard}>
            <GoalBar
              label="Calorias"
              value={totalCalories}
              goal={calorieGoal}
              unit="kcal"
              color={colors.primary}
            />
            <GoalBar
              label="Água"
              value={waterMl}
              goal={WATER_GOAL_ML}
              unit="ml"
              color={colors.water}
            />
            <GoalBar
              label="Refeições"
              value={planItems.length > 0 ? todayLoggedCount : mealCount}
              goal={mealGoal}
              unit={planItems.length > 0 ? 'itens' : 'reg.'}
              color={colors.success}
            />
            <GoalBar
              label="Sequência"
              value={stats.streakDays}
              goal={STREAK_GOAL}
              unit="dias"
              color={colors.warning}
            />
          </View>
        </View>

        {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Weekly charts */}
        <View style={styles.section}>
          <Text style={appStyles.sectionTitle}>Evolução semanal</Text>
          <WeeklyChart
            title="Calorias"
            days={days}
            getValue={d => d.calories}
            goal={calorieGoal}
            unit="kcal"
            todayKey={today}
          />
          <WeeklyChart
            title="Água"
            days={days}
            getValue={d => Math.round(d.waterMl / 100) / 10}
            goal={Math.round(WATER_GOAL_ML / 100) / 10}
            unit="L"
            todayKey={today}
          />
        </View>

        {/* Insight */}
        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Target size={20} color={colors.primary} />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Próxima melhoria</Text>
            <Text style={styles.insightText}>{insightText}</Text>
            {insightMeta ? <Text style={styles.insightMeta}>{insightMeta}</Text> : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: colors.background },
  content:  { padding: spacing.lg, gap: spacing.lg, paddingBottom: 120 },
  header:   { gap: 2 },
  title:    { color: colors.text, fontSize: fontSize.xxl, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: fontSize.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  section:  { gap: spacing.sm },

  goalsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.md,
    ...shadow.sm,
  },
  goalRow:    { gap: spacing.xs },
  goalTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  goalLabel:  { color: colors.text, fontSize: fontSize.sm, fontWeight: '800' },
  goalValue:  { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700' },
  goalTrack:  { height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceHigh, overflow: 'hidden' },
  goalFill:   { height: '100%', borderRadius: radius.full },
  goalPercent: { fontSize: fontSize.xs, fontWeight: '800' },

  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.md,
    ...shadow.sm,
  },
  chartHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartTitle:    { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  chartMeta:     { color: colors.muted, fontSize: fontSize.xs },
  barsRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, height: 150 },
  barColumn:     { flex: 1, alignItems: 'center', gap: 3 },
  barSlot: {
    height: 112, width: '100%',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHigh,
    justifyContent: 'flex-end', overflow: 'hidden',
  },
  barSlotToday: {
    borderWidth: 1.5,
    borderColor: colors.primary + '66',
    backgroundColor: colors.primaryGlow,
  },
  barFill:       { width: '100%', borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  barValue:      { color: colors.muted, fontSize: 10, fontWeight: '800' },
  barLabel:      { color: colors.muted, fontSize: 10, textTransform: 'capitalize' },
  barLabelToday: { color: colors.primary, fontWeight: '800' },

  insightCard: {
    backgroundColor: colors.primaryGlow,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.primary + '33',
    padding: spacing.md,
    flexDirection: 'row', gap: spacing.md,
  },
  insightIcon: {
    width: 40, height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary + '22',
    alignItems: 'center', justifyContent: 'center',
  },
  insightContent: { flex: 1, gap: spacing.xs },
  insightTitle:   { color: colors.text, fontSize: fontSize.md, fontWeight: '900' },
  insightText:    { color: colors.textSecondary, fontSize: fontSize.sm },
  insightMeta:    { color: colors.muted, fontSize: fontSize.xs },
  errorText:      { color: colors.danger, fontSize: fontSize.sm, textAlign: 'center' },
});
