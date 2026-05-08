import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { CheckCircle2, Pencil, Trash2, X } from 'lucide-react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';
import { usePlanPermissions } from '../hooks/usePlanPermissions';
import { UNIT_LABELS } from '../types';
import type { PlanItem } from '../types';

interface MealItemRowProps {
  item: PlanItem;
  isAlt?: boolean;
  onEdit?: (item: PlanItem) => void;
  onDelete?: (itemId: string) => void;
  onLog?: (item: PlanItem) => void;
}

export function MealItemRow({ item, isAlt, onEdit, onDelete, onLog }: MealItemRowProps) {
  const { canEdit, canLog } = usePlanPermissions();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isLogged = item.logId !== null;
  const isPending = item.logId === 'pending';

  if (canEdit) {
    if (confirmDelete) {
      return (
        <View style={[styles.editorRow, styles.rowConfirm, isAlt && styles.rowAlt]}>
          <Text style={styles.confirmText} numberOfLines={1}>
            Remover <Text style={{ fontWeight: '900' }}>"{item.foodName}"</Text>?
          </Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionDanger]}
              onPress={() => { setConfirmDelete(false); onDelete?.(item.itemId); }}
            >
              <Trash2 size={13} color={colors.danger} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setConfirmDelete(false)}
            >
              <X size={13} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.editorRow, isAlt && styles.rowAlt, isLogged && styles.rowLogged]}>
        <View style={{ flex: 3 }}>
          <Text style={styles.foodName} numberOfLines={1}>{item.foodName}</Text>
          {item.purpose ? <Text style={styles.purpose} numberOfLines={1}>{item.purpose}</Text> : null}
        </View>
        <Text style={[styles.cell, { flex: 2, textAlign: 'center' }]}>
          {item.prescribedQty} {UNIT_LABELS[item.prescribedUnit]}
        </Text>
        <Text style={[styles.cell, { flex: 1, textAlign: 'center' }]}>
          {item.prescribedCal ?? '—'}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit?.(item)}>
            <Pencil size={13} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionDanger]}
            onPress={() => setConfirmDelete(true)}
          >
            <Trash2 size={13} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (canLog) {
    return (
      <View style={[styles.patientCard, isLogged && !isPending && styles.patientCardLogged]}>
        <View style={styles.patientLeft}>
          <Text style={styles.foodName} numberOfLines={1}>{item.foodName}</Text>
          <Text style={styles.patientMeta}>
            {item.prescribedQty}{UNIT_LABELS[item.prescribedUnit]}
            {item.prescribedCal ? ` · ${item.prescribedCal} kcal` : ''}
            {item.purpose ? ` · ${item.purpose}` : ''}
          </Text>
          {isLogged && !isPending && item.actualQty != null && (
            <Text style={styles.patientActual}>
              Consumido: {item.actualQty}{item.actualUnit ? UNIT_LABELS[item.actualUnit] : ''}
              {item.xpEarned > 0 ? ` · +${item.xpEarned} XP` : ''}
            </Text>
          )}
        </View>

        {isPending ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : isLogged ? (
          <CheckCircle2 size={24} color={colors.success} />
        ) : (
          <TouchableOpacity style={styles.logBtn} onPress={() => onLog?.(item)} activeOpacity={0.7}>
            <Text style={styles.logBtnText}>Registrar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  // Confirm-delete state
  rowConfirm: { backgroundColor: 'rgba(220,38,38,0.06)', justifyContent: 'space-between' },
  confirmText: { flex: 1, color: colors.danger, fontSize: fontSize.xs },
  confirmActions: { flexDirection: 'row', gap: 4 },

  // Editor (nutritionist) row styles
  editorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border + '55',
  },
  rowAlt:    { backgroundColor: colors.background },
  rowLogged: { backgroundColor: colors.success + '08' },
  foodName:  { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  purpose:   { color: colors.muted, fontSize: 10, fontStyle: 'italic' },
  cell:      { color: colors.textSecondary, fontSize: fontSize.sm },
  actions:   { width: 60, flexDirection: 'row', gap: 4, justifyContent: 'flex-end' },
  actionBtn: {
    width: 26, height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  actionDanger: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderColor: 'rgba(220,38,38,0.2)',
  },

  // Patient card styles
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  patientCardLogged: {
    borderColor: colors.success + '44',
    backgroundColor: colors.success + '08',
  },
  patientLeft:   { flex: 1, gap: 2 },
  patientMeta:   { color: colors.muted, fontSize: fontSize.xs },
  patientActual: { color: colors.success, fontSize: fontSize.xs, fontWeight: '700', marginTop: 2 },
  logBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  logBtnText: { color: 'white', fontSize: fontSize.xs, fontWeight: '700' },
});
