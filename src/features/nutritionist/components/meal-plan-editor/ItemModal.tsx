import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appStyles, colors, fontSize, radius, spacing } from '@/shared/theme';
import { AppModal } from '@/shared/components/ui/AppModal';
import { MEAL_TIME_ORDER, MEAL_TIME_LABELS, UNIT_LABELS, UNIT_OPTIONS } from '@/features/nutrition';
import type { MealTimeType, MeasurementUnit } from '@/features/nutrition';
import type { NutritionistPlanItem, UpsertItemParams } from '../../hooks/useMealPlan';
import { ChipPicker } from './ChipPicker';
import { modalChrome } from './modalChrome';

export interface ItemForm {
  mealTime: MealTimeType;
  foodName: string;
  qty: string;
  unit: MeasurementUnit;
  calories: string;
  purpose: string;
}

interface ItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (params: UpsertItemParams) => void;
  isSubmitting: boolean;
  planId: string;
  editItem: NutritionistPlanItem | null;
  defaultMealTime: MealTimeType;
}

/**
 * Sheet modal for adding or editing a prescribed meal-plan item.
 */
export function ItemModal({
  visible, onClose, onSubmit, isSubmitting, planId, editItem, defaultMealTime,
}: ItemModalProps) {
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
    <AppModal visible={visible} onClose={onClose} variant="sheet" avoidKeyboard>
      <SafeAreaView style={modalChrome.modalSafe} edges={['top', 'bottom']}>
        <View style={modalChrome.modalHeader}>
          <Text style={modalChrome.modalTitle}>{editItem ? 'Editar Alimento' : 'Adicionar Alimento'}</Text>
          <TouchableOpacity onPress={onClose} style={modalChrome.modalCloseBtn}>
            <Text style={modalChrome.modalCloseText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={modalChrome.modalContent}>
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
                options={UNIT_OPTIONS}
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
    </AppModal>
  );
}

const styles = StyleSheet.create({
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
