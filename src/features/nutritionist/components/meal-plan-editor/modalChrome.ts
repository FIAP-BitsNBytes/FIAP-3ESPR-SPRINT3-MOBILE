import { StyleSheet } from 'react-native';
import { colors, fontSize, spacing } from '@/shared/theme';

/**
 * Shared chrome styles for the meal-plan-editor sheet modals
 * (`CreatePlanModal`, `ItemModal`): safe-area container, header row
 * (title + cancel) and scroll content padding.
 */
export const modalChrome = StyleSheet.create({
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
});
