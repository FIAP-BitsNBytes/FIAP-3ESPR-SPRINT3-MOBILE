import { StyleSheet } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';

/** Estilos compartilhados entre DailyScheduleView e CurrentAppointmentsSection. */
export const sharedScheduleStyles = StyleSheet.create({
  currentTimeBadge: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.warning + '20',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  currentTimeText: { color: colors.warning, fontSize: fontSize.sm, fontWeight: '800' },
});
