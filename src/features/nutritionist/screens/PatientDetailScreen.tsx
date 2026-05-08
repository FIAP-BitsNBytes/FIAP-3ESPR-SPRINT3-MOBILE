import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, ClipboardList, Flame, Plus, Target, TrendingUp, Trophy, Utensils } from 'lucide-react-native';
import { LevelCard } from '@/shared/components/gamification/LevelCard';
import { StatCard } from '@/shared/components/ui/StatCard';
import { appStyles, colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { useGamification } from '@/shared/hooks/useGamification';
import { useTodayLogs } from '@/features/patient/hooks/useTodayLogs';
import { DailyProgressItem, useProgressMetrics } from '@/features/patient/hooks/useProgressMetrics';
import { usePlanDetail } from '@/features/nutrition/hooks/usePlanDetail';

const CALORIE_GOAL = 2000;
const WATER_GOAL_ML = 2500;
const MEAL_GOAL = 4;
const STREAK_GOAL = 7;

const pct = (value: number, goal: number) =>
  Math.min(Math.round((value / goal) * 100), 100);

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

export function NutritionistPatientDetailScreen() {
  const router = useRouter();
  const { patientId, name } = useLocalSearchParams<{ patientId: string; name: string }>();

  const { stats, isLoading: isGamificationLoading } = useGamification(patientId ?? null);
  const { totalCalories, waterMl, meals } = useTodayLogs(patientId ?? null);
  const { days, isLoading: isProgressLoading, error } = useProgressMetrics(patientId ?? null);
  const { plan, items: planItems, isLoading: isPlanLoading } = usePlanDetail(patientId ?? null);

  const mealCount = meals.filter(m => m.category === 'MEAL').length;
  const exerciseCount = meals.filter(m => m.category === 'EXERCISE').length;
  const xpInLevel = stats.experience % 500;
  const patientName = name ?? 'Paciente';

  const weeklyAverage = useMemo(() => {
    const total = days.reduce((sum, day) => sum + day.calories, 0);
    return Math.round(total / Math.max(days.length, 1));
  }, [days]);

  const bestDay = useMemo(
    () => days.reduce<DailyProgressItem | null>(
      (best, day) => (!best || day.calories > best.calories ? day : best), null
    ),
    [days]
  );

  return (
    <SafeAreaView style={appStyles.screen} edges={['top']}>
      <View style={[appStyles.dashboardHeader, styles.header]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={appStyles.dashboardTitle} numberOfLines={1}>{patientName}</Text>
          <Text style={appStyles.dashboardSubtitle}>Evolução e progresso</Text>
        </View>
        <TouchableOpacity
          style={styles.mealPlanBtn}
          onPress={() => router.push(`/meal-plan?patientId=${patientId}&name=${encodeURIComponent(patientName)}`)}
        >
          <ClipboardList size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LevelCard
          name={patientName}
          level={isGamificationLoading ? 1 : stats.level}
          currentXP={isGamificationLoading ? 0 : xpInLevel}
          maxXP={500}
          streakDays={isGamificationLoading ? 0 : stats.streakDays}
        />

        {/* Meal plan access card */}
        <TouchableOpacity
          style={styles.planCard}
          onPress={() => router.push(`/meal-plan?patientId=${patientId}&name=${encodeURIComponent(patientName)}`)}
          activeOpacity={0.75}
        >
          <View style={styles.planCardIcon}>
            <ClipboardList size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.planCardTitle}>Plano Alimentar</Text>
            {isPlanLoading ? (
              <Text style={styles.planCardSub}>Carregando...</Text>
            ) : plan ? (
              <Text style={styles.planCardSub} numberOfLines={1}>
                {plan.title} · {planItems.length} item{planItems.length !== 1 ? 's' : ''}
              </Text>
            ) : (
              <View style={styles.planCardNoplan}>
                <Plus size={11} color={colors.primary} />
                <Text style={styles.planCardNoPlanText}>Criar plano</Text>
              </View>
            )}
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <StatCard label="Média kcal" value={weeklyAverage} Icon={TrendingUp} color={colors.primary} />
          <StatCard label="Sequência" value={`${stats.streakDays}d`} Icon={Flame} color={colors.warning} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Refeições hoje" value={mealCount} Icon={Utensils} color={colors.success} />
          <StatCard label="Exercícios hoje" value={exerciseCount} Icon={Trophy} color="#A78BFA" />
        </View>

        <View style={styles.section}>
          <Text style={appStyles.sectionTitle}>Metas de hoje</Text>
          <View style={styles.goalsCard}>
            <GoalBar label="Calorias" value={totalCalories} goal={CALORIE_GOAL} unit="kcal" color={colors.primary} />
            <GoalBar label="Água" value={waterMl} goal={WATER_GOAL_ML} unit="ml" color="#38BDF8" />
            <GoalBar label="Refeições" value={mealCount} goal={MEAL_GOAL} unit="reg." color={colors.success} />
            <GoalBar label="Sequência" value={stats.streakDays} goal={STREAK_GOAL} unit="dias" color={colors.warning} />
          </View>
        </View>

        {isProgressLoading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.section}>
          <Text style={appStyles.sectionTitle}>Gráficos semanais</Text>
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
            <Text style={styles.insightTitle}>Análise do nutricionista</Text>
            <Text style={styles.insightText}>
              {totalCalories < CALORIE_GOAL
                ? `Faltam ${(CALORIE_GOAL - totalCalories).toLocaleString('pt-BR')} kcal para bater a meta de hoje.`
                : 'Meta calórica de hoje concluída. Paciente está no caminho certo.'}
            </Text>
            {bestDay ? (
              <Text style={styles.insightMeta}>
                Melhor dia: {bestDay.dayLabel} com {bestDay.calories} kcal registradas.
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '44',
    ...shadow.sm,
  },
  planCardIcon: {
    width: 40, height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.primary + '33',
  },
  planCardTitle:      { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  planCardSub:        { color: colors.muted, fontSize: fontSize.xs, marginTop: 2 },
  planCardNoplan:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  planCardNoPlanText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '700' },

  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealPlanBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  section: { gap: spacing.sm },
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
});
