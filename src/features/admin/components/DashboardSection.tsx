import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';

interface DashboardSectionProps {
  title: string;
  subtitle?: string;
  count?: number;
  children: React.ReactNode;
}

export function DashboardSection({ title, subtitle, count, children }: DashboardSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {typeof count === 'number' ? <Text style={styles.count}>{count}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: fontSize.xs, lineHeight: 18 },
  count: {
    minWidth: 30,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.primaryGlow,
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '800',
    textAlign: 'center',
  },
});
