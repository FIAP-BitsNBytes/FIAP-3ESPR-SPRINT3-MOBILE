import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ClipboardList, Plus, Trash2, ChevronRight } from 'lucide-react-native';
import { appStyles, colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { useMealPlan, NutritionistPlanItem, UpsertItemParams } from '@/features/nutritionist/hooks/useMealPlan';
import type { MealTimeType, MeasurementUnit } from '@/features/patient/hooks/useDailyPlan';

const MEAL_TIME_LABELS: Record<MealTimeType, string> = {
  BREAKFAST: 'Café da Manhã',
  MORNING_SNACK: 'Lanche da Manhã',
  LUNCH: 'Almoço',
  AFTERNOON_SNACK: 'Lanche da Tarde',
  DINNER: 'Jantar',
  EVENING_SNACK: 'Ceia',
  ANYTIME: 'A Qualquer Hora',
};

const MEAL_TIME_ORDER: MealTimeType[] = [
  'BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'EVENING_SNACK', 'ANYTIME',
];

const UNIT_LABELS: Record<MeasurementUnit, string> = {
  GRAMS: 'g',
  MILLILITERS: 'ml',
  UNITS: 'un',
  PORTIONS: 'porç.',
  CALORIES: 'kcal',
};

const UNITS: MeasurementUnit[] = ['GRAMS', 'MILLILITERS', 'UNITS', 'PORTIONS', 'CALORIES'];

interface CreatePlanForm {
  title: string;
  startDate: string;
  endDate: string;
  notes: string;
}

interface ItemForm {
  mealTime: MealTimeType;
  foodName: string;
  qty: string;
  unit: MeasurementUnit;
  calories: string;
  purpose: string;
}

const defaultItemForm = (): ItemForm => ({
  mealTime: 'BREAKFAST',
  foodName: '',
  qty: '',
  unit: 'GRAMS',
  calories: '',
  purpose: '',
});

function ChipPicker<T extends string>({
  options, value, onChange, labelMap,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labelMap: Record<T, string>;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[styles.chip, value === opt && styles.chipActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>
            {labelMap[opt]}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function PlanItemCard({
  item, onEdit, onDelete,
}: {
  item: NutritionistPlanItem;
  onEdit: (item: NutritionistPlanItem) => void;
  onDelete: (itemId: string) => void;
}) {
  const hasLog = item.logId !== null;
  const adherenceColor =
    item.adherencePct >= 80 ? colors.success :
    item.adherencePct >= 50 ? colors.warning :
    colors.danger;

  return (
    <View style={styles.planItemCard}>
      <View style={styles.planItemTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.planItemName}>{item.foodName}</Text>
          <Text style={styles.planItemPrescribed}>
            {item.prescribedQty} {UNIT_LABELS[item.prescribedUnit]}
            {item.prescribedCal ? ` · ${item.prescribedCal} kcal` : ''}
          </Text>
          {item.purpose ? <Text style={styles.planItemPurpose}>{item.purpose}</Text> : null}
        </View>
        <View style={styles.planItemActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)}>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => onDelete(item.itemId)}>
            <Trash2 size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {hasLog && (
        <View style={styles.adherenceRow}>
          <View style={[styles.adherencePill, { backgroundColor: adherenceColor + '18' }]}>
            <Text style={[styles.adherenceText, { color: adherenceColor }]}>
              Aderência: {item.adherencePct}%
            </Text>
          </View>
          <Text style={styles.actualLog}>
            Consumido: {item.actualQty} {item.actualUnit ? UNIT_LABELS[item.actualUnit] : ''}
            {item.actualCal ? ` · ${item.actualCal} kcal` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

function CreatePlanModal({
  visible, onClose, onSubmit, isSubmitting,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: CreatePlanForm) => void;
  isSubmitting: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<CreatePlanForm>({ title: '', startDate: today, endDate: '', notes: '' });
  const set = (field: keyof CreatePlanForm) => (val: string) => setForm(f => ({ ...f, [field]: val }));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Novo Plano Alimentar</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Título do plano *</Text>
            <View style={appStyles.inputFrame}>
              <TextInput
                style={appStyles.input}
                placeholder="Ex: Plano Emagrecimento Fase 1"
                placeholderTextColor={colors.muted}
                value={form.title}
                onChangeText={set('title')}
              />
            </View>
          </View>

          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Data de início *</Text>
            <View style={appStyles.inputFrame}>
              <TextInput
                style={appStyles.input}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={colors.muted}
                value={form.startDate}
                onChangeText={set('startDate')}
              />
            </View>
          </View>

          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Data de término (opcional)</Text>
            <View style={appStyles.inputFrame}>
              <TextInput
                style={appStyles.input}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={colors.muted}
                value={form.endDate}
                onChangeText={set('endDate')}
              />
            </View>
          </View>

          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Observações (opcional)</Text>
            <View style={[appStyles.inputFrame, { minHeight: 80, alignItems: 'flex-start', paddingTop: spacing.sm }]}>
              <TextInput
                style={[appStyles.input, { height: 70 }]}
                placeholder="Notas gerais sobre o plano..."
                placeholderTextColor={colors.muted}
                value={form.notes}
                onChangeText={set('notes')}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[appStyles.primaryButton, (!form.title.trim() || isSubmitting) && appStyles.primaryButtonDisabled]}
            disabled={!form.title.trim() || isSubmitting}
            onPress={() => onSubmit(form)}
          >
            {isSubmitting
              ? <ActivityIndicator color={colors.onPrimary} />
              : <Text style={appStyles.primaryButtonText}>Criar Plano</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ItemModal({
  visible, onClose, onSubmit, isSubmitting, planId, editItem,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (params: UpsertItemParams) => void;
  isSubmitting: boolean;
  planId: string;
  editItem: NutritionistPlanItem | null;
}) {
  const [form, setForm] = useState<ItemForm>(
    editItem
      ? {
          mealTime: editItem.mealTime,
          foodName: editItem.foodName,
          qty: String(editItem.prescribedQty),
          unit: editItem.prescribedUnit,
          calories: editItem.prescribedCal != null ? String(editItem.prescribedCal) : '',
          purpose: editItem.purpose ?? '',
        }
      : defaultItemForm()
  );

  const set = (field: keyof ItemForm) => (val: string) => setForm(f => ({ ...f, [field]: val }));
  const canSubmit = form.foodName.trim() && Number(form.qty) > 0 && !isSubmitting;

  const handleSubmit = () => {
    onSubmit({
      planId,
      mealTime: form.mealTime,
      foodName: form.foodName.trim(),
      qty: Number(form.qty),
      unit: form.unit,
      calories: form.calories ? Number(form.calories) : null,
      purpose: form.purpose.trim() || null,
      itemId: editItem?.itemId ?? null,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{editItem ? 'Editar Alimento' : 'Adicionar Alimento'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Refeição</Text>
            <ChipPicker
              options={MEAL_TIME_ORDER}
              value={form.mealTime}
              onChange={v => setForm(f => ({ ...f, mealTime: v }))}
              labelMap={MEAL_TIME_LABELS}
            />
          </View>

          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Alimento *</Text>
            <View style={appStyles.inputFrame}>
              <TextInput
                style={appStyles.input}
                placeholder="Ex: Arroz integral"
                placeholderTextColor={colors.muted}
                value={form.foodName}
                onChangeText={set('foodName')}
              />
            </View>
          </View>

          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Quantidade *</Text>
            <View style={styles.qtyRow}>
              <View style={[appStyles.inputFrame, { flex: 1 }]}>
                <TextInput
                  style={appStyles.input}
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  value={form.qty}
                  onChangeText={set('qty')}
                  keyboardType="numeric"
                />
              </View>
              <ChipPicker
                options={UNITS}
                value={form.unit}
                onChange={v => setForm(f => ({ ...f, unit: v }))}
                labelMap={UNIT_LABELS}
              />
            </View>
          </View>

          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Calorias estimadas (opcional)</Text>
            <View style={appStyles.inputFrame}>
              <TextInput
                style={appStyles.input}
                placeholder="0"
                placeholderTextColor={colors.muted}
                value={form.calories}
                onChangeText={set('calories')}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Propósito / orientação (opcional)</Text>
            <View style={[appStyles.inputFrame, { minHeight: 72, alignItems: 'flex-start', paddingTop: spacing.sm }]}>
              <TextInput
                style={[appStyles.input, { height: 60 }]}
                placeholder="Ex: Fonte de proteína para recuperação muscular"
                placeholderTextColor={colors.muted}
                value={form.purpose}
                onChangeText={set('purpose')}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[appStyles.primaryButton, !canSubmit && appStyles.primaryButtonDisabled]}
            disabled={!canSubmit}
            onPress={handleSubmit}
          >
            {isSubmitting
              ? <ActivityIndicator color={colors.onPrimary} />
              : <Text style={appStyles.primaryButtonText}>{editItem ? 'Salvar alterações' : 'Adicionar alimento'}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export function MealPlanEditorScreen() {
  const router = useRouter();
  const { patientId, name } = useLocalSearchParams<{ patientId: string; name: string }>();
  const today = new Date().toISOString().slice(0, 10);

  const { items, planId, planTitle, isLoading, error, isSubmitting, createPlan, upsertItem, deleteItem } =
    useMealPlan(patientId ?? null, today);

  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState<NutritionistPlanItem | null>(null);

  const groupedItems = useMemo(() => {
    const map = new Map<MealTimeType, NutritionistPlanItem[]>();
    for (const item of items) {
      const group = map.get(item.mealTime) ?? [];
      group.push(item);
      map.set(item.mealTime, group);
    }
    return map;
  }, [items]);

  const patientName = name ?? 'Paciente';

  const handleCreatePlan = async (form: CreatePlanForm) => {
    const result = await createPlan({
      title: form.title,
      startDate: form.startDate,
      endDate: form.endDate || null,
      notes: form.notes || null,
    });
    if (result.success) setShowCreatePlan(false);
  };

  const handleUpsertItem = async (params: UpsertItemParams) => {
    const result = await upsertItem(params);
    if (result.success) {
      setShowItemModal(false);
      setEditItem(null);
    }
  };

  const openAddItem = () => {
    setEditItem(null);
    setShowItemModal(true);
  };

  const openEditItem = (item: NutritionistPlanItem) => {
    setEditItem(item);
    setShowItemModal(true);
  };

  return (
    <SafeAreaView style={appStyles.screen} edges={['top']}>
      <View style={[appStyles.dashboardHeader, styles.header]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={appStyles.dashboardTitle} numberOfLines={1}>{patientName}</Text>
          <Text style={appStyles.dashboardSubtitle}>Plano alimentar</Text>
        </View>
        {planId && (
          <TouchableOpacity style={styles.addFab} onPress={openAddItem}>
            <Plus size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}

      {!isLoading && error && (
        <View style={styles.centered}>
          <Text style={appStyles.errorText}>{error}</Text>
        </View>
      )}

      {!isLoading && !error && !planId && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <ClipboardList size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Nenhum plano ativo</Text>
          <Text style={styles.emptySubtitle}>
            Crie um plano alimentar personalizado para {patientName}.
          </Text>
          <TouchableOpacity
            style={[appStyles.primaryButton, { marginTop: spacing.lg }]}
            onPress={() => setShowCreatePlan(true)}
          >
            <Plus size={18} color={colors.onPrimary} />
            <Text style={appStyles.primaryButtonText}>Criar Plano Alimentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !error && planId && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>{planTitle}</Text>
            <Text style={styles.planMeta}>Hoje: {today}</Text>
          </View>

          {items.length === 0 && (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyItemsText}>Nenhum alimento prescrito ainda.</Text>
              <TouchableOpacity style={[appStyles.primaryButton, { marginTop: spacing.md }]} onPress={openAddItem}>
                <Plus size={18} color={colors.onPrimary} />
                <Text style={appStyles.primaryButtonText}>Adicionar alimento</Text>
              </TouchableOpacity>
            </View>
          )}

          {MEAL_TIME_ORDER.filter(mt => groupedItems.has(mt)).map(mealTime => (
            <View key={mealTime} style={styles.section}>
              <Text style={appStyles.sectionTitle}>{MEAL_TIME_LABELS[mealTime]}</Text>
              {(groupedItems.get(mealTime) ?? []).map(item => (
                <PlanItemCard
                  key={item.itemId}
                  item={item}
                  onEdit={openEditItem}
                  onDelete={id => { void deleteItem(id); }}
                />
              ))}
            </View>
          ))}

          {items.length > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Resumo do dia</Text>
              <Text style={styles.summaryValue}>
                {items.filter(i => i.logId).length} / {items.length} refeições registradas
              </Text>
              {items.some(i => i.xpEarned > 0) && (
                <Text style={styles.summaryXp}>
                  +{items.reduce((s, i) => s + i.xpEarned, 0)} XP ganhos hoje
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      )}

      <CreatePlanModal
        visible={showCreatePlan}
        onClose={() => setShowCreatePlan(false)}
        onSubmit={handleCreatePlan}
        isSubmitting={isSubmitting}
      />

      {planId && (
        <ItemModal
          visible={showItemModal}
          onClose={() => { setShowItemModal(false); setEditItem(null); }}
          onSubmit={handleUpsertItem}
          isSubmitting={isSubmitting}
          planId={planId}
          editItem={editItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  addFab: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.primary,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '33',
    marginBottom: spacing.sm,
  },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900', textAlign: 'center' },
  emptySubtitle: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  planHeader: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  planTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900' },
  planMeta: { color: colors.muted, fontSize: fontSize.xs, marginTop: 2 },
  section: { gap: spacing.sm },
  planItemCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.sm,
  },
  planItemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  planItemName: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  planItemPrescribed: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  planItemPurpose: { color: colors.muted, fontSize: fontSize.xs, marginTop: 2, fontStyle: 'italic' },
  planItemActions: { flexDirection: 'row', gap: spacing.xs },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnDanger: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderColor: 'rgba(220,38,38,0.2)',
  },
  adherenceRow: { gap: spacing.xs },
  adherencePill: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  adherenceText: { fontSize: fontSize.xs, fontWeight: '800' },
  actualLog: { color: colors.muted, fontSize: fontSize.xs },
  emptyItems: { alignItems: 'center', padding: spacing.lg },
  emptyItemsText: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center' },
  summaryCard: {
    backgroundColor: colors.primaryGlow,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '33',
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryLabel: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase' },
  summaryValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '800' },
  summaryXp: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '900', marginTop: spacing.xs },
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900' },
  modalCloseBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  modalCloseText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },
  modalContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  chipRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700' },
  chipTextActive: { color: colors.onPrimary },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
