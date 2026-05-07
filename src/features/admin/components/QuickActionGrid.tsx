import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';

export interface QuickActionItem {
  label: string;
  description: string;
  Icon: LucideIcon;
  color: string;
  onPress: () => void;
}

interface QuickActionGridProps {
  actions: QuickActionItem[];
}

export function QuickActionGrid({ actions }: QuickActionGridProps) {
  return (
    <View style={styles.grid}>
      {actions.map(action => (
        <Pressable
          key={action.label}
          onPress={action.onPress}
          style={styles.card}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <View style={[styles.icon, { backgroundColor: action.color + '22' }]}>
            <action.Icon size={20} color={action.color} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{action.label}</Text>
            <Text style={styles.description}>{action.description}</Text>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  description: { color: colors.muted, fontSize: fontSize.xs },
});
