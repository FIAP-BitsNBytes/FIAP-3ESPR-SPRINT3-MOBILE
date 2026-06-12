import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';

interface ChipPickerProps<T extends string> {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labelMap: Record<T, string>;
}

/**
 * Horizontal scrollable chip selector used for enum-like fields
 * (meal time, measurement unit, etc.).
 */
export function ChipPicker<T extends string>({ options, value, onChange, labelMap }: ChipPickerProps<T>) {
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

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:       { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700' },
  chipTextActive: { color: colors.onPrimary },
});
