import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { usePlanPermissions } from '../hooks/usePlanPermissions';

interface AddItemFABProps {
  onPress: () => void;
}

// PersistentTabBar height: 76 + insets.bottom (min 10)
const TAB_BAR_HEIGHT = 76;

export function AddItemFAB({ onPress }: AddItemFABProps) {
  const { canEdit } = usePlanPermissions();
  const insets = useSafeAreaInsets();
  if (!canEdit) return null;

  const bottom = TAB_BAR_HEIGHT + Math.max(insets.bottom, 10) + 16;

  return (
    <TouchableOpacity
      style={[styles.fab, { bottom }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.inner}>
        <Plus size={20} color={colors.onPrimary} />
        <Text style={styles.label}>Nova refeição</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    ...shadow.primary,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  label: {
    color: colors.onPrimary,
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
});
