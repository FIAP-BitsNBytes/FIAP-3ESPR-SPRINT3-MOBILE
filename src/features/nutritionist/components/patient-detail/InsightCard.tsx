import { StyleSheet, Text, View } from 'react-native';
import { Target } from 'lucide-react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';

interface InsightCardProps {
  insightText: string;
  insightMeta: string;
}

export function InsightCard({ insightText, insightMeta }: InsightCardProps) {
  return (
    <View style={styles.insightCard}>
      <View style={styles.insightIcon}>
        <Target size={20} color={colors.primary} />
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>Análise do nutricionista</Text>
        <Text style={styles.insightText}>{insightText}</Text>
        {insightMeta ? <Text style={styles.insightMeta}>{insightMeta}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  insightCard: {
    backgroundColor: colors.primaryGlow,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.primary + '33',
    padding: spacing.md,
    flexDirection: 'row', gap: spacing.md,
  },
  insightIcon: {
    width: 40, height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary + '22',
    alignItems: 'center', justifyContent: 'center',
  },
  insightContent: { flex: 1, gap: spacing.xs },
  insightTitle:   { color: colors.text, fontSize: fontSize.md, fontWeight: '900' },
  insightText:    { color: colors.textSecondary, fontSize: fontSize.sm },
  insightMeta:    { color: colors.muted, fontSize: fontSize.xs },
});
