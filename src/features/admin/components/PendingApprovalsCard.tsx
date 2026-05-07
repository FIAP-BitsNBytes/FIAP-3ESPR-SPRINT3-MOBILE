import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, ChevronRight } from 'lucide-react-native';
import { colors, fontSize, radius, shadow, spacing } from '@/shared/theme';

interface PendingApprovalsCardProps {
  count: number;
  onPress: () => void;
}

export function PendingApprovalsCard({ count, onPress }: PendingApprovalsCardProps) {
  if (count <= 0) return null;

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Abrir nutricionistas pendentes"
    >
      <View style={styles.left}>
        <AlertCircle size={24} color={colors.warning} />
        <View style={styles.textWrap}>
          <Text style={styles.num}>{count}</Text>
          <Text style={styles.label}>
            nutricionista{count > 1 ? 's' : ''} aguardando aprovacao
          </Text>
        </View>
      </View>
      <ChevronRight size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.warning + '14',
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.warning + '44',
    ...shadow.sm,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  textWrap: { flex: 1 },
  num: { color: colors.warning, fontSize: fontSize.xxl, fontWeight: '900', lineHeight: 36 },
  label: { color: colors.text, fontSize: fontSize.sm, flex: 1 },
});
