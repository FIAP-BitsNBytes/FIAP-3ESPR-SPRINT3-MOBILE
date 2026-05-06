import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  color?: string;
}

export function StatCard({ label, value, Icon, color = colors.primary }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  label: { color: colors.muted, fontSize: fontSize.xs },
});
