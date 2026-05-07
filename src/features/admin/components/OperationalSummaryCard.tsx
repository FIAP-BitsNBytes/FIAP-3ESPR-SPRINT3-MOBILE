import { StyleSheet, Text, View } from 'react-native';
import { LayoutDashboard, Zap } from 'lucide-react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';

interface OperationalSummaryCardProps {
  nextAppointmentText: string;
}

export function OperationalSummaryCard({ nextAppointmentText }: OperationalSummaryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.item}>
        <LayoutDashboard size={18} color={colors.primary} />
        <View style={styles.textWrap}>
          <Text style={styles.label}>Agenda integrada</Text>
          <Text style={styles.value}>Visualizacao diaria, semanal e mensal ativa</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.item}>
        <Zap size={18} color={colors.warning} />
        <View style={styles.textWrap}>
          <Text style={styles.label}>Proxima consulta</Text>
          <Text style={styles.value}>{nextAppointmentText}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  textWrap: { flex: 1, gap: 2 },
  label: { color: colors.text, fontSize: fontSize.sm, fontWeight: '800' },
  value: { color: colors.muted, fontSize: fontSize.xs },
  divider: { height: 1, backgroundColor: colors.border },
});
