import React, { useState, useMemo } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Droplets, Plus, Utensils, Zap } from 'lucide-react-native';
import { appStyles, colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { useDailyPlan, type PlanItem, type MealTimeType, type MeasurementUnit } from '../hooks/useDailyPlan';
import { useTodayLogs } from '../hooks/useTodayLogs';
import { useLogWater } from '../hooks/useLogWater';
import { useLogMeal, type LogFreeMealParams } from '../hooks/useLogMeal';

const WATER_GOAL_ML = 2500;

const MEAL_TIME_LABELS: Record<MealTimeType, string> = {
  BREAKFAST:       'Cafe da manha',
  MORNING_SNACK:   'Lanche da manha',
  LUNCH:           'Almoco',
  AFTERNOON_SNACK: 'Lanche da tarde',
  DINNER:          'Jantar',
  EVENING_SNACK:   'Ceia',
  ANYTIME:         'A qualquer hora',
};

const UNIT_LABELS: Record<MeasurementUnit, string> = {
  GRAMS:       'g',
  MILLILITERS: 'ml',
  UNITS:       'un',
  PORTIONS:    'porc',
  CALORIES:    'kcal',
};

const UNIT_OPTIONS: MeasurementUnit[] = ['GRAMS', 'MILLILITERS', 'UNITS', 'PORTIONS', 'CALORIES'];

// ─── Water bar ───────────────────────────────────────────────

function WaterBar({ waterMl }: { waterMl: number }) {
  const pct = Math.min((waterMl / WATER_GOAL_ML) * 100, 100);
  const color = waterMl >= WATER_GOAL_ML ? colors.success : '#38BDF8';
  return (
    <View style={styles.waterTrack}>
      <View style={[styles.waterFill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
    </View>
  );
}

// ─── Plan item card ──────────────────────────────────────────

function PlanItemCard({ item, onLog }: { item: PlanItem; onLog: (item: PlanItem) => void }) {
  const isLogged = item.logId !== null;
  const unitLabel = UNIT_LABELS[item.prescribedUnit];
  return (
    <View style={[styles.planCard, isLogged && styles.planCardLogged]}>
      <View style={styles.planCardLeft}>
        <Text style={styles.planFoodName} numberOfLines={1}>{item.foodName}</Text>
        <Text style={styles.planMeta}>
          {item.prescribedQty}{unitLabel}
          {item.prescribedCal ? ` · ${item.prescribedCal} kcal` : ''}
          {item.purpose ? ` · ${item.purpose}` : ''}
        </Text>
        {isLogged && (
          <Text style={styles.planActual}>
            {`Consumido: ${item.actualQty}${item.actualUnit ? UNIT_LABELS[item.actualUnit] : ''}`}
            {item.xpEarned > 0 ? ` · +${item.xpEarned} XP` : ''}
          </Text>
        )}
      </View>
      {isLogged ? (
        <CheckCircle2 size={24} color={colors.success} />
      ) : (
        <TouchableOpacity style={styles.logBtn} onPress={() => onLog(item)} activeOpacity={0.7}>
          <Text style={styles.logBtnText}>Registrar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Modal: log plan item ────────────────────────────────────

interface LogPlanModalProps {
  item: PlanItem | null;
  onClose: () => void;
  onSubmit: (actualQty: number, actualCal: number | null, notes: string | null) => Promise<void>;
  isLogging: boolean;
}

function LogPlanModal({ item, onClose, onSubmit, isLogging }: LogPlanModalProps) {
  const [qty, setQty] = useState(item ? String(item.prescribedQty) : '');
  const [cal, setCal] = useState(item?.prescribedCal ? String(item.prescribedCal) : '');
  const [notes, setNotes] = useState('');

  if (!item) return null;

  const handleSubmit = async () => {
    const parsedQty = parseFloat(qty);
    if (!qty || isNaN(parsedQty) || parsedQty <= 0) {
      Alert.alert('Quantidade invalida', 'Informe uma quantidade maior que zero.');
      return;
    }
    await onSubmit(parsedQty, cal ? parseInt(cal, 10) : null, notes.trim() || null);
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{item.foodName}</Text>
          <Text style={styles.sheetSub}>
            {`Prescrito: ${item.prescribedQty}${UNIT_LABELS[item.prescribedUnit]}`}
            {item.prescribedCal ? ` · ${item.prescribedCal} kcal` : ''}
          </Text>

          <Text style={styles.fieldLabel}>Quantidade consumida ({UNIT_LABELS[item.prescribedUnit]})</Text>
          <TextInput style={styles.input} value={qty} onChangeText={setQty} keyboardType="numeric" placeholderTextColor={colors.muted} />

          <Text style={styles.fieldLabel}>Calorias reais (opcional)</Text>
          <TextInput style={styles.input} value={cal} onChangeText={setCal} keyboardType="numeric" placeholder="ex: 320" placeholderTextColor={colors.muted} />

          <Text style={styles.fieldLabel}>Observacao (opcional)</Text>
          <TextInput style={[styles.input, styles.inputMulti]} value={notes} onChangeText={setNotes} multiline placeholder="ex: comi menos pois nao estava com fome" placeholderTextColor={colors.muted} />

          <View style={styles.sheetBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isLogging}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleSubmit} disabled={isLogging} activeOpacity={0.8}>
              {isLogging ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.confirmBtnText}>Confirmar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Modal: free meal ────────────────────────────────────────

interface FreeMealModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (params: LogFreeMealParams) => Promise<void>;
  isLogging: boolean;
}

function FreeMealModal({ visible, onClose, onSubmit, isLogging }: FreeMealModalProps) {
  const [foodName, setFoodName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState<MeasurementUnit>('GRAMS');
  const [cal, setCal] = useState('');

  const reset = () => { setFoodName(''); setQty(''); setUnit('GRAMS'); setCal(''); };

  const handleSubmit = async () => {
    if (!foodName.trim()) { Alert.alert('Obrigatorio', 'Informe o nome do alimento.'); return; }
    const parsedQty = parseFloat(qty);
    if (!qty || isNaN(parsedQty) || parsedQty <= 0) { Alert.alert('Quantidade invalida', 'Informe uma quantidade maior que zero.'); return; }
    await onSubmit({ foodName: foodName.trim(), qty: parsedQty, unit, calories: cal ? parseInt(cal, 10) : null });
    reset();
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Refeicao livre</Text>

          <Text style={styles.fieldLabel}>Alimento</Text>
          <TextInput style={styles.input} value={foodName} onChangeText={setFoodName} placeholder="ex: Banana" placeholderTextColor={colors.muted} />

          <Text style={styles.fieldLabel}>Quantidade</Text>
          <TextInput style={styles.input} value={qty} onChangeText={setQty} keyboardType="numeric" placeholder="ex: 150" placeholderTextColor={colors.muted} />

          <Text style={styles.fieldLabel}>Unidade</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {UNIT_OPTIONS.map(u => (
                <TouchableOpacity key={u} style={[styles.unitChip, unit === u && styles.unitChipActive]} onPress={() => setUnit(u)}>
                  <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>{UNIT_LABELS[u]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.fieldLabel}>Calorias (opcional)</Text>
          <TextInput style={styles.input} value={cal} onChangeText={setCal} keyboardType="numeric" placeholder="ex: 89" placeholderTextColor={colors.muted} />

          <View style={styles.sheetBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={isLogging}>
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
  const { planItems, isLoading: isPlanLoading, error: planError, refresh: refreshPlan } = useDailyPlan();
  const { waterMl, meals, isLoading: isLogsLoading } = useTodayLogs();
  const { logWater, isLogging: isWaterLogging } = useLogWater();
  const { logMealFromPlan, logFreeMeal, isLogging: isMealLogging } = useLogMeal();

  const [selectedPlanItem, setSelectedPlanItem] = useState<PlanItem | null>(null);
  const [showFreeMeal, setShowFreeMeal] = useState(false);

  const freeMeals = useMemo(() => meals.filter(m => m.category === 'MEAL'), [meals]);

  const totalXpToday = useMemo(
    () => planItems.reduce((sum, i) => sum + i.xpEarned, 0),
    [planItems]
  );

  const grouped = useMemo(() => {
    const map = new Map<MealTimeType, PlanItem[]>();
    for (const item of planItems) {
      const existing = map.get(item.mealTime) ?? [];
      map.set(item.mealTime, [...existing, item]);
    }
    return map;
  }, [planItems]);

  const isLoading = isPlanLoading || isLogsLoading;

  const handleWater = async (ml: number) => {
    const result = await logWater(ml);
    if (!result.success) Alert.alert('Erro', result.error);
  };

  const handleLogPlanItem = async (actualQty: number, actualCal: number | null, notes: string | null) => {
    if (!selectedPlanItem) return;
    const result = await logMealFromPlan({
      planItemId: selectedPlanItem.itemId,
      actualQty,
      actualUnit: selectedPlanItem.prescribedUnit,
      actualCal,
      notes,
    });
    setSelectedPlanItem(null);
    if (!result.success) Alert.alert('Erro', result.error);
    else refreshPlan();
  };

  const handleFreeMeal = async (params: LogFreeMealParams) => {
    const result = await logFreeMeal(params);
    setShowFreeMeal(false);
    if (!result.success) Alert.alert('Erro', result.error);
  };

  return (
    <SafeAreaView style={appStyles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.pageHeader}>
          <Text style={appStyles.eyebrow}>Hoje</Text>
          <Text style={appStyles.title}>Nutricao</Text>
          <Text style={appStyles.subtitle}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryChip, { backgroundColor: '#38BDF8' + '22' }]}>
            <Droplets size={14} color="#38BDF8" />
            <Text style={[styles.summaryChipText, { color: '#38BDF8' }]}>{(waterMl / 1000).toFixed(1)}L</Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: colors.primaryGlow }]}>
            <Utensils size={14} color={colors.primary} />
            <Text style={[styles.summaryChipText, { color: colors.primary }]}>
              {planItems.filter(i => i.logId).length}/{planItems.length} ref.
            </Text>
          </View>
          {totalXpToday > 0 && (
            <View style={[styles.summaryChip, { backgroundColor: colors.warning + '22' }]}>
              <Zap size={14} color={colors.warning} />
              <Text style={[styles.summaryChipText, { color: colors.warning }]}>+{totalXpToday} XP</Text>
            </View>
          )}
        </View>

        {/* Water */}
        <View style={appStyles.dashboardCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#38BDF8' + '22' }]}>
              <Droplets size={18} color="#38BDF8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Agua</Text>
              <Text style={styles.sectionSub}>{waterMl}ml / {WATER_GOAL_ML}ml · {Math.round(Math.min((waterMl / WATER_GOAL_ML) * 100, 100))}%</Text>
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
                  : <Text style={styles.waterBtnText}>+{ml}ml</Text>
                }
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Meal plan */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
        ) : planError ? (
          <Text style={styles.errorText}>{planError}</Text>
        ) : planItems.length > 0 ? (
          <>
            <Text style={appStyles.sectionTitle}>Plano de hoje</Text>
            {Array.from(grouped.entries()).map(([mealTime, items]) => (
              <View key={mealTime} style={styles.mealTimeGroup}>
                <Text style={styles.mealTimeLabel}>{MEAL_TIME_LABELS[mealTime]}</Text>
                {items.map(item => (
                  <PlanItemCard key={item.itemId} item={item} onLog={setSelectedPlanItem} />
                ))}
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyPlan}>
            <Utensils size={32} color={colors.muted} />
            <Text style={styles.emptyTitle}>Sem plano ativo</Text>
            <Text style={styles.emptySub}>Seu nutricionista ainda nao criou um plano para hoje.</Text>
          </View>
        )}

        {/* Free meals */}
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

      <LogPlanModal
        item={selectedPlanItem}
        onClose={() => setSelectedPlanItem(null)}
        onSubmit={handleLogPlanItem}
        isLogging={isMealLogging}
      />
      <FreeMealModal
        visible={showFreeMeal}
        onClose={() => setShowFreeMeal(false)}
        onSubmit={handleFreeMeal}
        isLogging={isMealLogging}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content:         { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
  pageHeader:      { gap: spacing.xs },
  summaryRow:      { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  summaryChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.full },
  summaryChipText: { fontSize: fontSize.xs, fontWeight: '700' },

  sectionHeader:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  sectionIconWrap: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:    { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  sectionSub:      { color: colors.muted, fontSize: fontSize.xs },

  waterTrack:  { height: 10, borderRadius: radius.full, backgroundColor: colors.surfaceHigh, overflow: 'hidden', marginBottom: spacing.sm },
  waterFill:   { height: '100%', borderRadius: radius.full },
  waterBtns:   { flexDirection: 'row', gap: spacing.xs },
  waterBtn:    { flex: 1, paddingVertical: spacing.xs, borderRadius: radius.md, backgroundColor: '#38BDF8' + '18', borderWidth: 1, borderColor: '#38BDF8' + '44', alignItems: 'center' },
  waterBtnText: { color: '#38BDF8', fontSize: fontSize.xs, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },

  mealTimeGroup: { gap: spacing.xs },
  mealTimeLabel: { color: colors.muted, fontSize: fontSize.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  planCard:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  planCardLogged: { borderColor: colors.success + '44', backgroundColor: colors.success + '08' },
  planCardLeft:   { flex: 1, gap: 2 },
  planFoodName:   { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  planMeta:       { color: colors.muted, fontSize: fontSize.xs },
  planActual:     { color: colors.success, fontSize: fontSize.xs, fontWeight: '700', marginTop: 2 },
  logBtn:         { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.md },
  logBtnText:     { color: 'white', fontSize: fontSize.xs, fontWeight: '700' },

  emptyPlan:  { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  emptySub:   { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center' },
  errorText:  { color: colors.danger, fontSize: fontSize.sm, textAlign: 'center' },

  freeMealHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addFreeBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary + '55', backgroundColor: colors.primaryGlow },
  addFreeBtnText:  { color: colors.primary, fontSize: fontSize.xs, fontWeight: '700' },
  freeMealCard:    { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, gap: 2 },
  freeMealName:    { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  freeMealMeta:    { color: colors.muted, fontSize: fontSize.xs },

  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.md },
  sheetTitle:  { color: colors.text, fontSize: fontSize.xl, fontWeight: '900' },
  sheetSub:    { color: colors.muted, fontSize: fontSize.sm, marginTop: -spacing.sm },
  fieldLabel:  { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '700' },
  input:       { backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md, color: colors.text, borderWidth: 1, borderColor: colors.border, fontSize: fontSize.md },
  inputMulti:  { minHeight: 72, textAlignVertical: 'top' },
  unitChip:        { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  unitChipActive:  { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  unitChipText:    { color: colors.muted, fontSize: fontSize.xs, fontWeight: '700' },
  unitChipTextActive: { color: colors.primary },
  sheetBtns:   { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  cancelBtn:   { flex: 1, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { color: colors.text, fontWeight: '600' },
  confirmBtn:  { flex: 1, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.primary },
  confirmBtnText: { color: 'white', fontWeight: '700' },
});
