import { useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { ArrowLeft, Calendar, ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { appStyles, colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { useMealPlan, NutritionistPlanItem, UpsertItemParams } from '@/features/nutritionist/hooks/useMealPlan';
import type { MealTimeType, MeasurementUnit } from '@/features/patient/hooks/useDailyPlan';

// ─── Constants ───────────────────────────────────────────────

const MEAL_TIME_LABELS: Record<MealTimeType, string> = {
  BREAKFAST:       'Café da Manhã',
  MORNING_SNACK:   'Lanche da Manhã',
  LUNCH:           'Almoço',
  AFTERNOON_SNACK: 'Lanche da Tarde',
  DINNER:          'Jantar',
  EVENING_SNACK:   'Ceia',
  ANYTIME:         'A Qualquer Hora',
};

const MEAL_TIME_ORDER: MealTimeType[] = [
  'BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'EVENING_SNACK', 'ANYTIME',
];

const MEAL_TIME_COLORS: Record<MealTimeType, string> = {
  BREAKFAST:       '#F59E0B',
  MORNING_SNACK:   '#10B981',
  LUNCH:           '#3B82F6',
  AFTERNOON_SNACK: '#8B5CF6',
  DINNER:          '#EC4899',
  EVENING_SNACK:   '#6366F1',
  ANYTIME:         '#6B7280',
};

const UNIT_LABELS: Record<MeasurementUnit, string> = {
  GRAMS:       'g',
  MILLILITERS: 'ml',
  UNITS:       'un',
  PORTIONS:    'porç.',
  CALORIES:    'kcal',
};

const UNITS: MeasurementUnit[] = ['GRAMS', 'MILLILITERS', 'UNITS', 'PORTIONS', 'CALORIES'];

// ─── Helpers ─────────────────────────────────────────────────

function isoToDisplay(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function partsToIso(d: string, m: string, y: string): string | null {
  if (d.length === 2 && m.length === 2 && y.length === 4) return `${y}-${m}-${d}`;
  return null;
}

function isoToParts(iso: string): { d: string; m: string; y: string } {
  if (!iso) return { d: '', m: '', y: '' };
  return { d: iso.slice(8, 10), m: iso.slice(5, 7), y: iso.slice(0, 4) };
}

// ─── DateField ───────────────────────────────────────────────

function DateField({
  label, value, onChange, optional,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  optional?: boolean;
}) {
  const parts = value ? isoToParts(value) : { d: '', m: '', y: '' };
  const [d, setD] = useState(parts.d);
  const [m, setM] = useState(parts.m);
  const [y, setY] = useState(parts.y);
  const refM = useRef<TextInput>(null);
  const refY = useRef<TextInput>(null);

  const commit = (day: string, mon: string, year: string) => {
    const iso = partsToIso(day, mon, year);
    if (iso) onChange(iso);
  };

  return (
    <View style={styles.dateFieldWrap}>
      <View style={styles.dateFieldLabelRow}>
        <Calendar size={13} color={colors.muted} />
        <Text style={appStyles.fieldLabel}>{label}{optional ? ' (opcional)' : ' *'}</Text>
      </View>
      <View style={styles.dateRow}>
        <View style={styles.datePartSm}>
          <TextInput
            style={styles.dateInput}
            placeholder="DD"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            maxLength={2}
            value={d}
            onChangeText={val => {
              const v = val.replace(/\D/g, '').slice(0, 2);
              setD(v);
              if (v.length === 2) refM.current?.focus();
              commit(v, m, y);
            }}
          />
          <Text style={styles.datePartLabel}>dia</Text>
        </View>
        <Text style={styles.dateSep}>/</Text>
        <View style={styles.datePartSm}>
          <TextInput
            ref={refM}
            style={styles.dateInput}
            placeholder="MM"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            maxLength={2}
            value={m}
            onChangeText={val => {
              const v = val.replace(/\D/g, '').slice(0, 2);
              setM(v);
              if (v.length === 2) refY.current?.focus();
              commit(d, v, y);
            }}
          />
          <Text style={styles.datePartLabel}>mês</Text>
        </View>
        <Text style={styles.dateSep}>/</Text>
        <View style={styles.datePartLg}>
          <TextInput
            ref={refY}
            style={styles.dateInput}
            placeholder="AAAA"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            maxLength={4}
            value={y}
            onChangeText={val => {
              const v = val.replace(/\D/g, '').slice(0, 4);
              setY(v);
              commit(d, m, v);
            }}
          />
          <Text style={styles.datePartLabel}>ano</Text>
        </View>
      </View>
    </View>
  );
}

// ─── ChipPicker ──────────────────────────────────────────────

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

// ─── MealCard ────────────────────────────────────────────────

function MealCard({
  mealTime, items, onEdit, onDelete, onAddToMeal,
}: {
  mealTime: MealTimeType;
  items: NutritionistPlanItem[];
  onEdit: (item: NutritionistPlanItem) => void;
  onDelete: (itemId: string) => void;
  onAddToMeal: (mealTime: MealTimeType) => void;
}) {
  const color = MEAL_TIME_COLORS[mealTime];
  const totalKcal = items.reduce((s, i) => s + (i.prescribedCal ?? 0), 0);
  const loggedCount = items.filter(i => i.logId).length;

  return (
    <View style={styles.mealCard}>
      {/* Card header */}
      <View style={[styles.mealCardHeader, { borderLeftColor: color }]}>
        <View style={[styles.mealDot, { backgroundColor: color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.mealCardTitle}>{MEAL_TIME_LABELS[mealTime]}</Text>
          <Text style={styles.mealCardMeta}>
            {items.length} item{items.length !== 1 ? 's' : ''}
            {totalKcal > 0 ? ` · ${totalKcal} kcal` : ''}
            {loggedCount > 0 ? ` · ${loggedCount}/${items.length} registrado${loggedCount !== 1 ? 's' : ''}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.mealAddBtn, { borderColor: color + '55', backgroundColor: color + '12' }]}
          onPress={() => onAddToMeal(mealTime)}
        >
          <Plus size={13} color={color} />
          <Text style={[styles.mealAddBtnText, { color }]}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Table header */}
      <View style={styles.tableHead}>
        <Text style={[styles.tableHeadCell, { flex: 3 }]}>Alimento</Text>
        <Text style={[styles.tableHeadCell, { flex: 2, textAlign: 'center' }]}>Qtd. / Medida</Text>
        <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>Kcal</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Rows */}
      {items.map((item, idx) => (
        <View
          key={item.itemId}
          style={[
            styles.tableRow,
            idx % 2 === 1 && styles.tableRowAlt,
            item.logId ? styles.tableRowLogged : null,
          ]}
        >
          <View style={{ flex: 3 }}>
            <Text style={styles.tableCellMain} numberOfLines={1}>{item.foodName}</Text>
            {item.purpose ? (
              <Text style={styles.tableCellSub} numberOfLines={1}>{item.purpose}</Text>
            ) : null}
          </View>
          <Text style={[styles.tableCell, { flex: 2, textAlign: 'center' }]}>
            {item.prescribedQty} {UNIT_LABELS[item.prescribedUnit]}
          </Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
            {item.prescribedCal ?? '—'}
          </Text>
          <View style={styles.tableActions}>
            <TouchableOpacity style={styles.tableActionBtn} onPress={() => onEdit(item)}>
              <Pencil size={13} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tableActionBtn, styles.tableActionDanger]}
              onPress={() =>
                Alert.alert('Remover item', `Remover "${item.foodName}" do plano?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Remover', style: 'destructive', onPress: () => onDelete(item.itemId) },
                ])
              }
            >
              <Trash2 size={13} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Adherence color bar */}
      {loggedCount > 0 && (
        <View style={styles.adherenceBar}>
          {items.map(item => {
            const c = item.logId
              ? item.adherencePct >= 80 ? colors.success
                : item.adherencePct >= 50 ? colors.warning
                : colors.danger
              : colors.border;
            return <View key={item.itemId} style={[styles.adherenceSegment, { flex: 1, backgroundColor: c }]} />;
          })}
        </View>
      )}
    </View>
  );
}

// ─── CreatePlanModal ─────────────────────────────────────────

interface CreatePlanForm {
  title: string;
  startDate: string;
  endDate: string;
  notes: string;
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
  const canSubmit = form.title.trim().length > 0 && form.startDate.length === 10 && !isSubmitting;

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

          <DateField label="Data de início" value={form.startDate} onChange={set('startDate')} />
          <DateField label="Data de término" value={form.endDate} onChange={set('endDate')} optional />

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
            style={[appStyles.primaryButton, !canSubmit && appStyles.primaryButtonDisabled]}
            disabled={!canSubmit}
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

// ─── ItemModal ───────────────────────────────────────────────

interface ItemForm {
  mealTime: MealTimeType;
  foodName: string;
  qty: string;
  unit: MeasurementUnit;
  calories: string;
  purpose: string;
}

function ItemModal({
  visible, onClose, onSubmit, isSubmitting, planId, editItem, defaultMealTime,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (params: UpsertItemParams) => void;
  isSubmitting: boolean;
  planId: string;
  editItem: NutritionistPlanItem | null;
  defaultMealTime: MealTimeType;
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
      : { mealTime: defaultMealTime, foodName: '', qty: '', unit: 'GRAMS', calories: '', purpose: '' }
  );

  const set = (field: keyof ItemForm) => (val: string) => setForm(f => ({ ...f, [field]: val }));
  const canSubmit = form.foodName.trim().length > 0 && Number(form.qty) > 0 && !isSubmitting;

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
          {/* Refeição */}
          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Refeição *</Text>
            <ChipPicker
              options={MEAL_TIME_ORDER}
              value={form.mealTime}
              onChange={v => setForm(f => ({ ...f, mealTime: v }))}
              labelMap={MEAL_TIME_LABELS}
            />
          </View>

          {/* Alimento */}
          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Alimento *</Text>
            <View style={appStyles.inputFrame}>
              <TextInput
                style={appStyles.input}
                placeholder="Ex: Arroz integral cozido"
                placeholderTextColor={colors.muted}
                value={form.foodName}
                onChangeText={set('foodName')}
                autoCapitalize="sentences"
              />
            </View>
          </View>

          {/* Quantidade + Medida */}
          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Quantidade *</Text>
            <View style={styles.qtyRow}>
              <View style={[appStyles.inputFrame, { width: 100 }]}>
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

          {/* Unidade selecionada (hint) */}
          <View style={styles.unitHintBox}>
            <Text style={styles.unitHintLabel}>Medida padrão selecionada:</Text>
            <Text style={styles.unitHintValue}>{UNIT_LABELS[form.unit]} ({form.unit})</Text>
          </View>

          {/* Calorias */}
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

          {/* Propósito */}
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
            onPress={() =>
              onSubmit({
                planId,
                mealTime: form.mealTime,
                foodName: form.foodName.trim(),
                qty: Number(form.qty),
                unit: form.unit,
                calories: form.calories ? Number(form.calories) : null,
                purpose: form.purpose.trim() || null,
                itemId: editItem?.itemId ?? null,
              })
            }
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

// ─── Main screen ─────────────────────────────────────────────

export function MealPlanEditorScreen() {
  const router = useRouter();
  const { patientId, name } = useLocalSearchParams<{ patientId: string; name: string }>();
  const today = new Date().toISOString().slice(0, 10);

  const {
    items, planId, planTitle, planStartDate, planEndDate, planNotes,
    isLoading, error, isSubmitting, createPlan, upsertItem, deleteItem,
  } = useMealPlan(patientId ?? null, today);

  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState<NutritionistPlanItem | null>(null);
  const [defaultMealTime, setDefaultMealTime] = useState<MealTimeType>('BREAKFAST');

  const groupedItems = useMemo(() => {
    const map = new Map<MealTimeType, NutritionistPlanItem[]>();
    for (const item of items) {
      const group = map.get(item.mealTime) ?? [];
      group.push(item);
      map.set(item.mealTime, group);
    }
    return map;
  }, [items]);

  const totalKcal = useMemo(() => items.reduce((s, i) => s + (i.prescribedCal ?? 0), 0), [items]);
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
    if (result.success) { setShowItemModal(false); setEditItem(null); }
  };

  const openAddItem = (mealTime: MealTimeType = 'BREAKFAST') => {
    setDefaultMealTime(mealTime);
    setEditItem(null);
    setShowItemModal(true);
  };

  const openEditItem = (item: NutritionistPlanItem) => {
    setEditItem(item);
    setShowItemModal(true);
  };

  return (
    <SafeAreaView style={appStyles.screen} edges={['top']}>
      {/* Header */}
      <View style={[appStyles.dashboardHeader, styles.header]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={appStyles.dashboardTitle} numberOfLines={1}>{patientName}</Text>
          <Text style={appStyles.dashboardSubtitle}>Plano alimentar</Text>
        </View>
        {planId && (
          <TouchableOpacity style={styles.addFab} onPress={() => openAddItem()}>
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

          {/* Plan info card */}
          <View style={styles.planInfoCard}>
            <View style={styles.planInfoTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planInfoTitle}>{planTitle}</Text>
                <View style={styles.planDatesRow}>
                  <Calendar size={12} color={colors.muted} />
                  <Text style={styles.planDatesText}>
                    {isoToDisplay(planStartDate)}
                    {planEndDate ? ` → ${isoToDisplay(planEndDate)}` : ' → sem término'}
                  </Text>
                </View>
              </View>
              {totalKcal > 0 && (
                <View style={styles.planKcalBadge}>
                  <Text style={styles.planKcalValue}>{totalKcal}</Text>
                  <Text style={styles.planKcalUnit}>kcal/dia</Text>
                </View>
              )}
            </View>

            <View style={styles.planStatRow}>
              <View style={styles.planStat}>
                <Text style={styles.planStatValue}>{items.length}</Text>
                <Text style={styles.planStatLabel}>itens</Text>
              </View>
              <View style={styles.planStatDivider} />
              <View style={styles.planStat}>
                <Text style={styles.planStatValue}>{groupedItems.size}</Text>
                <Text style={styles.planStatLabel}>refeições</Text>
              </View>
              <View style={styles.planStatDivider} />
              <View style={styles.planStat}>
                <Text style={styles.planStatValue}>{items.filter(i => i.logId).length}</Text>
                <Text style={styles.planStatLabel}>reg. hoje</Text>
              </View>
            </View>

            {planNotes ? (
              <Text style={styles.planNotes}>{planNotes}</Text>
            ) : null}
          </View>

          {/* Empty state within plan */}
          {items.length === 0 && (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyItemsText}>Nenhum alimento prescrito ainda.</Text>
              <TouchableOpacity style={[appStyles.primaryButton, { marginTop: spacing.md }]} onPress={() => openAddItem()}>
                <Plus size={18} color={colors.onPrimary} />
                <Text style={appStyles.primaryButtonText}>Adicionar alimento</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Meal cards */}
          {MEAL_TIME_ORDER.filter(mt => groupedItems.has(mt)).map(mealTime => (
            <MealCard
              key={mealTime}
              mealTime={mealTime}
              items={groupedItems.get(mealTime)!}
              onEdit={openEditItem}
              onDelete={id => { void deleteItem(id); }}
              onAddToMeal={openAddItem}
            />
          ))}
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
          defaultMealTime={defaultMealTime}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  addFab: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    ...shadow.primary,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing.xl, gap: spacing.sm,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: radius.xl,
    backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.primary + '33', marginBottom: spacing.sm,
  },
  emptyTitle:    { color: colors.text, fontSize: fontSize.lg, fontWeight: '900', textAlign: 'center' },
  emptySubtitle: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  // Plan info card
  planInfoCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md, ...shadow.sm,
  },
  planInfoTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  planInfoTitle:  { color: colors.text, fontSize: fontSize.lg, fontWeight: '900', marginBottom: 4 },
  planDatesRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  planDatesText:  { color: colors.muted, fontSize: fontSize.xs },
  planKcalBadge:  {
    alignItems: 'center', backgroundColor: colors.primaryGlow, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.primary + '33',
  },
  planKcalValue:  { color: colors.primary, fontSize: fontSize.xl, fontWeight: '900' },
  planKcalUnit:   { color: colors.primary, fontSize: 10, fontWeight: '700' },
  planStatRow:    { flexDirection: 'row', alignItems: 'center' },
  planStat:       { flex: 1, alignItems: 'center', gap: 2 },
  planStatValue:  { color: colors.text, fontSize: fontSize.md, fontWeight: '900' },
  planStatLabel:  { color: colors.muted, fontSize: 10, fontWeight: '600' },
  planStatDivider: { width: 1, height: 28, backgroundColor: colors.border },
  planNotes: {
    color: colors.muted, fontSize: fontSize.xs, fontStyle: 'italic',
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm,
  },

  // Meal card
  mealCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadow.sm,
  },
  mealCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderLeftWidth: 4, backgroundColor: colors.background,
  },
  mealDot:       { width: 10, height: 10, borderRadius: 5 },
  mealCardTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  mealCardMeta:  { color: colors.muted, fontSize: fontSize.xs, marginTop: 1 },
  mealAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.md, borderWidth: 1,
  },
  mealAddBtnText: { fontSize: 11, fontWeight: '700' },

  // Table
  tableHead: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceHigh,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  tableHeadCell: { color: colors.muted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border + '55',
  },
  tableRowAlt:    { backgroundColor: colors.background },
  tableRowLogged: { backgroundColor: colors.success + '08' },
  tableCellMain:  { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  tableCellSub:   { color: colors.muted, fontSize: 10, fontStyle: 'italic' },
  tableCell:      { color: colors.textSecondary, fontSize: fontSize.sm },
  tableActions:   { width: 60, flexDirection: 'row', gap: 4, justifyContent: 'flex-end' },
  tableActionBtn: {
    width: 26, height: 26, borderRadius: radius.sm,
    backgroundColor: colors.primaryGlow, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  tableActionDanger: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderColor: 'rgba(220,38,38,0.2)',
  },
  adherenceBar:    { flexDirection: 'row', height: 4, gap: 1 },
  adherenceSegment: { height: '100%' },

  emptyItems:     { alignItems: 'center', padding: spacing.lg },
  emptyItemsText: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center' },

  // Modal
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle:     { color: colors.text, fontSize: fontSize.lg, fontWeight: '900' },
  modalCloseBtn:  { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  modalCloseText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },
  modalContent:   { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  // DateField
  dateFieldWrap:    { gap: spacing.xs },
  dateFieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  datePartSm: { width: 60, alignItems: 'center', gap: 2 },
  datePartLg: { width: 84, alignItems: 'center', gap: 2 },
  dateInput: {
    width: '100%', backgroundColor: colors.surface, borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
    color: colors.text, borderWidth: 1, borderColor: colors.border,
    fontSize: fontSize.md, fontWeight: '700', textAlign: 'center',
  },
  datePartLabel: { color: colors.muted, fontSize: 9, fontWeight: '600', textTransform: 'uppercase' },
  dateSep:       { color: colors.muted, fontSize: fontSize.lg, fontWeight: '300', marginBottom: 14 },

  // Chips
  chipRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive:      { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:        { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700' },
  chipTextActive:  { color: colors.onPrimary },
  qtyRow:          { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unitHintBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primaryGlow, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.primary + '33',
    marginTop: -spacing.xs,
  },
  unitHintLabel: { color: colors.muted, fontSize: fontSize.xs },
  unitHintValue: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '800' },
});
