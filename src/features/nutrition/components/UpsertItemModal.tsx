import { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appStyles, colors, fontSize, radius, spacing } from '@/shared/theme';
import {
  MEAL_TIME_LABELS, MEAL_TIME_ORDER, UNIT_LABELS, UNIT_OPTIONS,
} from '../types';
import type { MealTimeType, MeasurementUnit, PlanItem, UpsertItemParams } from '../types';

function ChipPicker<T extends string>({
  options, value, onChange, labelMap,
}: {
  options: T[]; value: T; onChange: (v: T) => void; labelMap: Record<T, string>;
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

interface UpsertItemModalProps {
  visible: boolean;
  isSubmitting: boolean;
  planId: string;
  editItem: PlanItem | null;
  defaultMealTime: MealTimeType;
  onClose: () => void;
  onSubmit: (params: UpsertItemParams) => void;
}

export function UpsertItemModal({
  visible, isSubmitting, planId, editItem, defaultMealTime, onClose, onSubmit,
}: UpsertItemModalProps) {
  const [mealTime, setMealTime] = useState<MealTimeType>(editItem?.mealTime ?? defaultMealTime);
  const [foodName, setFoodName] = useState(editItem?.foodName ?? '');
  const [qty, setQty] = useState(editItem ? String(editItem.prescribedQty) : '');
  const [unit, setUnit] = useState<MeasurementUnit>(editItem?.prescribedUnit ?? 'GRAMS');
  const [calories, setCalories] = useState(editItem?.prescribedCal != null ? String(editItem.prescribedCal) : '');
  const [purpose, setPurpose] = useState(editItem?.purpose ?? '');

  const canSubmit = foodName.trim().length > 0 && Number(qty) > 0 && !isSubmitting;

  const handleSubmit = () => {
    onSubmit({
      planId,
      mealTime,
      foodName: foodName.trim(),
      qty: Number(qty),
      unit,
      calories: calories ? Number(calories) : null,
      purpose: purpose.trim() || null,
      itemId: editItem?.itemId ?? null,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{editItem ? 'Editar Alimento' : 'Adicionar Alimento'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Refeição *</Text>
            <ChipPicker
              options={MEAL_TIME_ORDER}
              value={mealTime}
              onChange={setMealTime}
              labelMap={MEAL_TIME_LABELS}
            />
          </View>

          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Alimento *</Text>
            <View style={appStyles.inputFrame}>
              <TextInput
                style={appStyles.input}
                placeholder="Ex: Arroz integral cozido"
                placeholderTextColor={colors.muted}
                value={foodName}
                onChangeText={setFoodName}
                autoCapitalize="sentences"
              />
            </View>
          </View>

          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Quantidade *</Text>
            <View style={styles.qtyRow}>
              <View style={[appStyles.inputFrame, { width: 100 }]}>
                <TextInput
                  style={appStyles.input}
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  value={qty}
                  onChangeText={setQty}
                  keyboardType="numeric"
                />
              </View>
              <ChipPicker
                options={UNIT_OPTIONS}
                value={unit}
                onChange={setUnit}
                labelMap={UNIT_LABELS}
              />
            </View>
          </View>

          <View style={styles.unitHint}>
            <Text style={styles.unitHintLabel}>Medida padrão selecionada:</Text>
            <Text style={styles.unitHintValue}>{UNIT_LABELS[unit]} ({unit})</Text>
          </View>

          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Calorias estimadas (opcional)</Text>
            <View style={appStyles.inputFrame}>
              <TextInput
                style={appStyles.input}
                placeholder="0"
                placeholderTextColor={colors.muted}
                value={calories}
                onChangeText={setCalories}
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
                value={purpose}
                onChangeText={setPurpose}
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
              : <Text style={appStyles.primaryButtonText}>
                  {editItem ? 'Salvar alterações' : 'Adicionar alimento'}
                </Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.background },
  header:     {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900' },
  closeBtn:    { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  closeText:   { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },
  content:     { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unitHint: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primaryGlow, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.primary + '33',
    marginTop: -spacing.xs,
  },
  unitHintLabel: { color: colors.muted, fontSize: fontSize.xs },
  unitHintValue: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '800' },

  chipRow:        { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },
  chip:           {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:       { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700' },
  chipTextActive: { color: colors.onPrimary },
});
