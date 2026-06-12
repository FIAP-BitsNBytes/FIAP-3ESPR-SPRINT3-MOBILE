import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { MODE_OPTIONS, ScheduleMode } from '../../utils/scheduleDate';

interface ScheduleHeaderProps {
  mode: ScheduleMode;
  hasAdvancedModes: boolean;
  onSelectMode: (mode: ScheduleMode) => void;
  periodTitle: string;
  onPrev: () => void;
  onNext: () => void;
}

export function ScheduleHeader({ mode, hasAdvancedModes, onSelectMode, periodTitle, onPrev, onNext }: ScheduleHeaderProps) {
  return (
    <>
      {hasAdvancedModes ? (
        <View style={styles.segmented}>
          {MODE_OPTIONS.map(option => {
            const selected = mode === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => onSelectMode(option.value)}
                style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
                accessibilityRole="button"
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.periodHeader}>
        <Pressable onPress={onPrev} style={styles.monthButton} accessibilityRole="button">
          <ChevronLeft size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.periodTitle}>{periodTitle}</Text>
        <Pressable onPress={onNext} style={styles.monthButton} accessibilityRole="button">
          <ChevronRight size={20} color={colors.text} />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segmentButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonSelected: { backgroundColor: colors.primary },
  segmentText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '800' },
  segmentTextSelected: { color: colors.onPrimary },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    ...shadow.sm,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  periodTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '800', textTransform: 'capitalize', flex: 1, textAlign: 'center' },
});
