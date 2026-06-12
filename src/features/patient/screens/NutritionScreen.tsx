import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Droplets, Plus, Utensils, Zap } from 'lucide-react-native';
import { appStyles, colors, fontSize, radius, spacing } from '@/shared/theme';
import { MealPhotoThumb } from '@/shared/components/MealPhotoThumb';
import { useLogWater } from '../hooks/useLogWater';
import { useTodayLogs } from '../hooks/useTodayLogs';
import { useLogMeal, type LogFreeMealParams } from '../hooks/useLogMeal';
import type { MeasurementUnit } from '../hooks/useDailyPlan';
import { NutritionTabBar, type Tab, WaterSection, FreeMealModal, SmartBottleCard } from '../components/nutrition';
import { useSmartBottle } from '../hooks/useSmartBottle';

import { usePlanDetail } from '@/features/nutrition/hooks/usePlanDetail';
import { PlanDetailContext } from '@/features/nutrition/context/PlanDetailContext';
import { PlanHeader } from '@/features/nutrition/components/PlanHeader';
import { PlanEmptyState } from '@/features/nutrition/components/PlanEmptyState';
import { MealSection } from '@/features/nutrition/components/MealSection';
import { LogItemModal } from '@/features/nutrition/components/LogItemModal';
import { MEAL_TIME_ORDER } from '@/features/nutrition/types';
import type { MealTimeType, PlanItem, LogItemParams } from '@/features/nutrition/types';

const UNIT_LABELS: Record<MeasurementUnit, string> = {
  GRAMS: 'g', MILLILITERS: 'ml', UNITS: 'un', PORTIONS: 'porç.', CALORIES: 'kcal',
};

export function PatientNutritionScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const planDetail = usePlanDetail(undefined, today);
  const { waterMl, meals, isLoading: isTodayLogsLoading } = useTodayLogs();
  const { logWater, isLogging: isWaterLogging } = useLogWater();
  const { status: bottleStatus, lastReading: bottleReading, connect: bottleConnect, disconnect: bottleDisconnect, error: bottleError } = useSmartBottle();
  const { logFreeMeal, isLogging: isMealLogging } = useLogMeal();

  const [selectedItem, setSelectedItem] = useState<PlanItem | null>(null);
  const [showFreeMeal, setShowFreeMeal] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('plan');

  const { items, plan, isLoading, error } = planDetail;
  const freeMeals = useMemo(() => meals.filter(m => m.category === 'MEAL'), [meals]);
  const hasIotWater = useMemo(
    () => meals.some(m => m.category === 'WATER' && m.source?.toUpperCase() === 'IOT'),
    [meals],
  );
  const loggedCount = useMemo(() => items.filter(i => i.logId && i.logId !== 'pending').length, [items]);
  const totalXpToday = useMemo(() => items.reduce((s, i) => s + i.xpEarned, 0), [items]);

  const grouped = useMemo(() => {
    const map = new Map<MealTimeType, PlanItem[]>();
    for (const item of items) {
      map.set(item.mealTime, [...(map.get(item.mealTime) ?? []), item]);
    }
    return map;
  }, [items]);

  const handleWater = async (ml: number) => {
    const result = await logWater(ml);
    if (!result.success) Alert.alert('Erro', result.error);
  };

  const handleLogItem = async (params: LogItemParams) => {
    const result = await planDetail.logItem(params);
    setSelectedItem(null);
    if (!result.success) Alert.alert('Erro', result.error);
  };

  const handleFreeMeal = async (params: LogFreeMealParams) => {
    const result = await logFreeMeal(params);
    setShowFreeMeal(false);
    if (!result.success) Alert.alert('Erro', result.error);
  };

  return (
    <PlanDetailContext.Provider value={planDetail}>
      <SafeAreaView style={appStyles.screen} edges={['top']}>

        {/* Fixed header */}
        <View style={styles.header}>
          <View style={styles.pageHeader}>
            <Text style={appStyles.eyebrow}>Hoje</Text>
            <Text style={appStyles.title}>Nutrição</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.chip, { backgroundColor: colors.waterAccent + '22' }]}>
              <Droplets size={14} color={colors.waterAccent} />
              <Text style={[styles.chipText, { color: colors.waterAccent }]}>{(waterMl / 1000).toFixed(1)}L</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.primaryGlow }]}>
              <Utensils size={14} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.primary }]}>
                {loggedCount}/{items.length} ref.
              </Text>
            </View>
            {totalXpToday > 0 && (
              <View style={[styles.chip, { backgroundColor: colors.warning + '22' }]}>
                <Zap size={14} color={colors.warning} />
                <Text style={[styles.chipText, { color: colors.warning }]}>+{totalXpToday} XP</Text>
              </View>
            )}
          </View>

          <NutritionTabBar active={activeTab} onChange={setActiveTab} />
        </View>

        {/* Tab: Meu Plano */}
        {activeTab === 'plan' && (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : !plan ? (
              <PlanEmptyState />
            ) : (
              <>
                <PlanHeader />

                {/* Progress bar */}
                {items.length > 0 && (
                  <View style={[appStyles.dashboardCard, styles.progressCard]}>
                    <View style={styles.progressTop}>
                      <Text style={styles.progressLabel}>Progresso do dia</Text>
                      <Text style={styles.progressCount}>{loggedCount}/{items.length}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${items.length > 0 ? Math.round((loggedCount / items.length) * 100) : 0}%` as `${number}%` },
                        ]}
                      />
                    </View>
                    {loggedCount === items.length && items.length > 0 && (
                      <Text style={styles.completeText}>Plano completo! Parabéns.</Text>
                    )}
                  </View>
                )}

                {/* Meal groups */}
                {MEAL_TIME_ORDER.filter(mt => grouped.has(mt)).map(mealTime => (
                  <MealSection
                    key={mealTime}
                    mealTime={mealTime}
                    items={grouped.get(mealTime)!}
                    onLog={setSelectedItem}
                  />
                ))}
              </>
            )}
          </ScrollView>
        )}

        {/* Tab: Água & Extra */}
        {activeTab === 'extras' && (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <WaterSection waterMl={waterMl} isLogging={isWaterLogging} onLogWater={handleWater} hasIotEntries={hasIotWater} />

            <SmartBottleCard
              status={bottleStatus}
              lastReading={bottleReading}
              onConnect={bottleConnect}
              onDisconnect={bottleDisconnect}
              error={bottleError}
            />

            <View style={styles.freeMealHeader}>
              <Text style={appStyles.sectionTitle}>Registro livre</Text>
              <TouchableOpacity style={styles.addFreeBtn} onPress={() => setShowFreeMeal(true)} activeOpacity={0.7}>
                <Plus size={16} color={colors.primary} />
                <Text style={styles.addFreeBtnText}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            {freeMeals.length > 0 ? (
              freeMeals.map(m => (
                <View key={m.id} style={styles.freeMealCard}>
                  {m.photoPath && <MealPhotoThumb photoPath={m.photoPath} />}
                  <View style={styles.freeMealInfo}>
                    <Text style={styles.freeMealName}>{m.foodName}</Text>
                    <Text style={styles.freeMealMeta}>
                      {m.quantity}{UNIT_LABELS[m.unit as MeasurementUnit] ?? m.unit}
                      {m.calories ? ` · ${m.calories} kcal` : ''}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptySub}>Nenhum registro livre hoje.</Text>
            )}
          </ScrollView>
        )}

        {/* Modals */}
        <LogItemModal
          item={selectedItem}
          isSubmitting={planDetail.isSubmitting}
          onClose={() => setSelectedItem(null)}
          onSubmit={handleLogItem}
        />

        <FreeMealModal
          visible={showFreeMeal}
          onClose={() => setShowFreeMeal(false)}
          onSubmit={handleFreeMeal}
          isLogging={isMealLogging}
        />
      </SafeAreaView>
    </PlanDetailContext.Provider>
  );
}

const styles = StyleSheet.create({
  content:      { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
  header:       { padding: spacing.md, paddingBottom: 0, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  pageHeader:   { gap: 2 },
  summaryRow:   { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.full },
  chipText:     { fontSize: fontSize.xs, fontWeight: '700' },

  progressCard:  { gap: spacing.sm },
  progressTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  progressCount: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '900' },
  progressTrack: { height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceHigh, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: radius.full, backgroundColor: colors.primary },
  completeText:  { color: colors.success, fontSize: fontSize.xs, fontWeight: '700', textAlign: 'center' },

  freeMealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addFreeBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 12, borderWidth: 1, borderColor: colors.primary + '55', backgroundColor: colors.primaryGlow },
  addFreeBtnText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '700' },
  freeMealCard:   { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, gap: spacing.sm, flexDirection: 'row' },
  freeMealInfo:   { flex: 1, justifyContent: 'center', gap: 2 },
  freeMealName:   { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  freeMealMeta:   { color: colors.muted, fontSize: fontSize.xs },
  emptySub:       { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center' },
  errorText:      { color: colors.danger, fontSize: fontSize.sm, textAlign: 'center' },
});
