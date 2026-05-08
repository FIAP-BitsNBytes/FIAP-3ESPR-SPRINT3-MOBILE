import { useMemo, useState } from 'react';
import {
  Modal, ScrollView, TextInput, View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Droplets, Plus, Utensils, Zap } from 'lucide-react-native';
import { appStyles, colors, fontSize, radius, spacing } from '@/shared/theme';
import { useLogWater } from '../hooks/useLogWater';
import { useTodayLogs } from '../hooks/useTodayLogs';
import { useLogMeal, type LogFreeMealParams } from '../hooks/useLogMeal';
import type { MeasurementUnit } from '../hooks/useDailyPlan';

import { usePlanDetail } from '@/features/nutrition/hooks/usePlanDetail';
import { PlanDetailContext } from '@/features/nutrition/context/PlanDetailContext';
import { PlanHeader } from '@/features/nutrition/components/PlanHeader';
import { PlanEmptyState } from '@/features/nutrition/components/PlanEmptyState';
import { MealSection } from '@/features/nutrition/components/MealSection';
import { LogItemModal } from '@/features/nutrition/components/LogItemModal';
import { MEAL_TIME_ORDER } from '@/features/nutrition/types';
import type { MealTimeType, PlanItem, LogItemParams } from '@/features/nutrition/types';

const WATER_GOAL_ML = 2500;

const UNIT_LABELS: Record<MeasurementUnit, string> = {
  GRAMS: 'g', MILLILITERS: 'ml', UNITS: 'un', PORTIONS: 'porç.', CALORIES: 'kcal',
};

// ─── Water bar ───────────────────────────────────────────────

function WaterBar({ waterMl }: { waterMl: number }) {
  const pct = Math.min((waterMl / WATER_GOAL_ML) * 100, 100);
  const c = waterMl >= WATER_GOAL_ML ? colors.success : '#38BDF8';
  return (
    <View style={styles.waterTrack}>
      <View style={[styles.waterFill, { width: `${pct}%` as `${number}%`, backgroundColor: c }]} />
    </View>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────

type Tab = 'plan' | 'extras';

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <View style={styles.tabBar}>
      {(['plan', 'extras'] as Tab[]).map(tab => (
        <TouchableOpacity
          key={tab}
          style={[styles.tabItem, active === tab && styles.tabItemActive]}
          onPress={() => onChange(tab)}
          activeOpacity={0.8}
        >
          {tab === 'plan'
            ? <Utensils size={14} color={active === tab ? colors.primary : colors.muted} />
            : <Droplets size={14} color={active === tab ? colors.primary : colors.muted} />}
          <Text style={[styles.tabText, active === tab && styles.tabTextActive]}>
            {tab === 'plan' ? 'Meu Plano' : 'Água & Extra'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Free meal modal ─────────────────────────────────────────

function FreeMealModal({
  visible, onClose, onSubmit, isLogging,
}: {
  visible: boolean; onClose: () => void;
  onSubmit: (p: LogFreeMealParams) => Promise<void>; isLogging: boolean;
}) {
  const [foodName, setFoodName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState<MeasurementUnit>('GRAMS');
  const [cal, setCal] = useState('');

  const reset = () => { setFoodName(''); setQty(''); setUnit('GRAMS'); setCal(''); };

  const handleSubmit = async () => {
    if (!foodName.trim()) { Alert.alert('Obrigatório', 'Informe o nome do alimento.'); return; }
    const parsed = parseFloat(qty);
    if (!qty || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Quantidade inválida', 'Informe uma quantidade maior que zero.'); return;
    }
    await onSubmit({ foodName: foodName.trim(), qty: parsed, unit, calories: cal ? parseInt(cal, 10) : null });
    reset();
  };

  const units: MeasurementUnit[] = ['GRAMS', 'MILLILITERS', 'UNITS', 'PORTIONS', 'CALORIES'];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { reset(); onClose(); }}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Refeição livre</Text>

          <Text style={styles.fieldLabel}>Alimento</Text>
          <TextInput style={styles.input} value={foodName} onChangeText={setFoodName} placeholder="ex: Banana" placeholderTextColor={colors.muted} />

          <Text style={styles.fieldLabel}>Quantidade</Text>
          <TextInput style={styles.input} value={qty} onChangeText={setQty} keyboardType="numeric" placeholder="ex: 150" placeholderTextColor={colors.muted} />

          <Text style={styles.fieldLabel}>Unidade</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {units.map(u => (
                <TouchableOpacity key={u} style={[styles.unitChip, unit === u && styles.unitChipActive]} onPress={() => setUnit(u)}>
                  <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>{UNIT_LABELS[u]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.fieldLabel}>Calorias (opcional)</Text>
          <TextInput style={styles.input} value={cal} onChangeText={setCal} keyboardType="numeric" placeholder="ex: 89" placeholderTextColor={colors.muted} />

          <View style={styles.sheetBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { reset(); onClose(); }} disabled={isLogging}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleSubmit} disabled={isLogging} activeOpacity={0.8}>
              {isLogging ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.confirmBtnText}>Registrar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────

export function PatientNutritionScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const planDetail = usePlanDetail(undefined, today);
  const { waterMl, meals } = useTodayLogs();
  const { logWater, isLogging: isWaterLogging } = useLogWater();
  const { logFreeMeal, isLogging: isMealLogging } = useLogMeal();

  const [selectedItem, setSelectedItem] = useState<PlanItem | null>(null);
  const [showFreeMeal, setShowFreeMeal] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('plan');

  const { items, plan, isLoading, error } = planDetail;
  const freeMeals = useMemo(() => meals.filter(m => m.category === 'MEAL'), [meals]);
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
            <View style={[styles.chip, { backgroundColor: '#38BDF8' + '22' }]}>
              <Droplets size={14} color="#38BDF8" />
              <Text style={[styles.chipText, { color: '#38BDF8' }]}>{(waterMl / 1000).toFixed(1)}L</Text>
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

          <TabBar active={activeTab} onChange={setActiveTab} />
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
            <View style={appStyles.dashboardCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#38BDF8' + '22' }]}>
                  <Droplets size={18} color="#38BDF8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Água</Text>
                  <Text style={styles.sectionSub}>
                    {waterMl}ml / {WATER_GOAL_ML}ml · {Math.round(Math.min((waterMl / WATER_GOAL_ML) * 100, 100))}%
                  </Text>
                </View>
              </View>
              <WaterBar waterMl={waterMl} />
              <View style={styles.waterBtns}>
                {[250, 500, 750, 1000].map(ml => (
                  <TouchableOpacity
                    key={ml}
                    style={[styles.waterBtn, isWaterLogging && styles.btnDisabled]}
                    onPress={() => handleWater(ml)}
                    disabled={isWaterLogging}
                    activeOpacity={0.7}
                  >
                    {isWaterLogging
                      ? <ActivityIndicator size="small" color="#38BDF8" />
                      : <Text style={styles.waterBtnText}>+{ml}ml</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

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
                  <Text style={styles.freeMealName}>{m.foodName}</Text>
                  <Text style={styles.freeMealMeta}>
                    {m.quantity}{UNIT_LABELS[m.unit as MeasurementUnit] ?? m.unit}
                    {m.calories ? ` · ${m.calories} kcal` : ''}
                  </Text>
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
  tabBar:       { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  tabItem:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabItemActive:{ backgroundColor: colors.primaryGlow, borderColor: colors.primary + '55' },
  tabText:      { fontSize: fontSize.xs, fontWeight: '700', color: colors.muted },
  tabTextActive:{ color: colors.primary },

  progressCard:  { gap: spacing.sm },
  progressTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  progressCount: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '900' },
  progressTrack: { height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceHigh, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: radius.full, backgroundColor: colors.primary },
  completeText:  { color: colors.success, fontSize: fontSize.xs, fontWeight: '700', textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  sectionIcon:   { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:  { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  sectionSub:    { color: colors.muted, fontSize: fontSize.xs },

  waterTrack:   { height: 10, borderRadius: radius.full, backgroundColor: colors.surfaceHigh, overflow: 'hidden', marginBottom: spacing.sm },
  waterFill:    { height: '100%', borderRadius: radius.full },
  waterBtns:    { flexDirection: 'row', gap: spacing.xs },
  waterBtn:     { flex: 1, paddingVertical: spacing.xs, borderRadius: 12, backgroundColor: '#38BDF8' + '18', borderWidth: 1, borderColor: '#38BDF8' + '44', alignItems: 'center' },
  waterBtnText: { color: '#38BDF8', fontSize: fontSize.xs, fontWeight: '700' },
  btnDisabled:  { opacity: 0.5 },

  freeMealHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addFreeBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 12, borderWidth: 1, borderColor: colors.primary + '55', backgroundColor: colors.primaryGlow },
  addFreeBtnText:  { color: colors.primary, fontSize: fontSize.xs, fontWeight: '700' },
  freeMealCard:    { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, gap: 2 },
  freeMealName:    { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  freeMealMeta:    { color: colors.muted, fontSize: fontSize.xs },
  emptySub:        { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center' },
  errorText:       { color: colors.danger, fontSize: fontSize.sm, textAlign: 'center' },

  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.md },
  sheetTitle:   { color: colors.text, fontSize: fontSize.xl, fontWeight: '900' },
  fieldLabel:   { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '700' },
  input:        { backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, color: colors.text, borderWidth: 1, borderColor: colors.border, fontSize: fontSize.md },
  unitChip:         { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  unitChipActive:   { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  unitChipText:     { color: colors.muted, fontSize: fontSize.xs, fontWeight: '700' },
  unitChipTextActive: { color: colors.primary },
  sheetBtns:    { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  cancelBtn:    { flex: 1, padding: spacing.md, borderRadius: 12, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cancelBtnText:{ color: colors.text, fontWeight: '600' },
  confirmBtn:   { flex: 1, padding: spacing.md, borderRadius: 12, alignItems: 'center', backgroundColor: colors.primary },
  confirmBtnText: { color: 'white', fontWeight: '700' },
});
