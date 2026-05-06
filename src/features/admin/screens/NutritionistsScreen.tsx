import { FlatList, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';
import type { NutritionistStatus, NutritionistRequest } from '../domain/admin';

const MOCK: NutritionistRequest[] = [
  { id: '1', name: 'Dra. Fernanda Ramos', crmCrn: 'CRN-3 12345', status: 'APPROVED' },
  { id: '2', name: 'Dr. Lucas Mendes', crmCrn: 'CRN-3 67890', status: 'PENDING' },
  { id: '3', name: 'Dra. Juliana Pires', crmCrn: 'CRN-3 11223', status: 'PENDING' },
  { id: '4', name: 'Dr. Rafael Gomes', crmCrn: 'CRN-3 44556', status: 'REJECTED' },
];

const STATUS_CONFIG = {
  APPROVED: { color: colors.success, Icon: CheckCircle, label: 'Aprovado' },
  PENDING: { color: colors.warning, Icon: Clock, label: 'Pendente' },
  REJECTED: { color: colors.danger, Icon: XCircle, label: 'Rejeitado' },
} as const;

function NutritionistRow({ item }: { item: NutritionistRequest }) {
  const { color, Icon, label } = STATUS_CONFIG[item.status];
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.crm}>{item.crmCrn}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: color + '22' }]}>
        <Icon size={14} color={color} />
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

export function AdminNutritionistsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={MOCK}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Nutricionistas</Text>}
        renderItem={({ item }) => <NutritionistRow item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800', marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  crm: { color: colors.muted, fontSize: fontSize.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600' },
});
