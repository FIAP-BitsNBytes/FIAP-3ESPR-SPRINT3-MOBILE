import { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';
import { UNIT_LABELS } from '../types';
import type { PlanItem, LogItemParams } from '../types';

interface LogItemModalProps {
  item: PlanItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (params: LogItemParams) => void;
}

export function LogItemModal({ item, isSubmitting, onClose, onSubmit }: LogItemModalProps) {
  const [qty, setQty] = useState(item ? String(item.prescribedQty) : '');
  const [cal, setCal] = useState(item?.prescribedCal ? String(item.prescribedCal) : '');
  const [notes, setNotes] = useState('');

  if (!item) return null;

  const handleSubmit = () => {
    const parsed = parseFloat(qty);
    if (!qty || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Quantidade inválida', 'Informe uma quantidade maior que zero.');
      return;
    }
    onSubmit({
      planItemId: item.itemId,
      actualQty:  parsed,
      actualUnit: item.prescribedUnit,
      actualCal:  cal ? parseInt(cal, 10) : null,
      notes:      notes.trim() || null,
    });
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{item.foodName}</Text>
          <Text style={styles.sub}>
            Prescrito: {item.prescribedQty}{UNIT_LABELS[item.prescribedUnit]}
            {item.prescribedCal ? ` · ${item.prescribedCal} kcal` : ''}
          </Text>

          <Text style={styles.label}>
            Quantidade consumida ({UNIT_LABELS[item.prescribedUnit]})
          </Text>
          <TextInput
            style={styles.input}
            value={qty}
            onChangeText={setQty}
            keyboardType="numeric"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Calorias reais (opcional)</Text>
          <TextInput
            style={styles.input}
            value={cal}
            onChangeText={setCal}
            keyboardType="numeric"
            placeholder="ex: 320"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Observação (opcional)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="ex: comi menos pois não estava com fome"
            placeholderTextColor={colors.muted}
          />

          <View style={styles.btns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.8}>
              {isSubmitting
                ? <ActivityIndicator color="white" size="small" />
                : <Text style={styles.confirmText}>Confirmar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:       {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.xl, gap: spacing.md,
  },
  title:       { color: colors.text, fontSize: fontSize.xl, fontWeight: '900' },
  sub:         { color: colors.muted, fontSize: fontSize.sm, marginTop: -spacing.sm },
  label:       { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '700' },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: fontSize.md,
  },
  inputMulti:  { minHeight: 72, textAlignVertical: 'top' },
  btns:        { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  cancelBtn: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    alignItems: 'center', backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
  },
  cancelText:  { color: colors.text, fontWeight: '600' },
  confirmBtn: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    alignItems: 'center', backgroundColor: colors.primary,
  },
  confirmText: { color: 'white', fontWeight: '700' },
});
