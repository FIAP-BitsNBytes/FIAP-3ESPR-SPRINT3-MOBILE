import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ClipboardList, Plus } from 'lucide-react-native';
import { appStyles, colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { usePlanPermissions } from '../hooks/usePlanPermissions';

interface PlanEmptyStateProps {
  patientName?: string;
  onCreatePlan?: () => void;
}

export function PlanEmptyState({ patientName, onCreatePlan }: PlanEmptyStateProps) {
  const { canEdit } = usePlanPermissions();

  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <ClipboardList size={40} color={colors.primary} />
      </View>

      {canEdit ? (
        <>
          <Text style={styles.title}>Nenhum plano ativo</Text>
          <Text style={styles.sub}>
            Crie um plano alimentar personalizado{patientName ? ` para ${patientName}` : ''}.
          </Text>
          {onCreatePlan && (
            <TouchableOpacity
              style={[appStyles.primaryButton, styles.btn]}
              onPress={onCreatePlan}
            >
              <Plus size={18} color={colors.onPrimary} />
              <Text style={appStyles.primaryButtonText}>Criar Plano Alimentar</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          <Text style={styles.title}>Sem plano ativo</Text>
          <Text style={styles.sub}>
            Seu nutricionista ainda não criou um plano para hoje.
          </Text>
        </>
      )}
    </View>
  );
}

interface PlanItemsEmptyProps {
  onAddItem?: () => void;
}

export function PlanItemsEmpty({ onAddItem }: PlanItemsEmptyProps) {
  const { canEdit } = usePlanPermissions();

  if (!canEdit) {
    return (
      <View style={styles.itemsEmptyWrap}>
        <Text style={styles.itemsEmptyText}>Nenhum alimento prescrito ainda.</Text>
      </View>
    );
  }

  return (
    <View style={styles.itemsEmptyWrap}>
      <Text style={styles.itemsEmptyText}>Nenhum alimento prescrito ainda.</Text>
      {onAddItem && (
        <TouchableOpacity style={[appStyles.primaryButton, { marginTop: spacing.md }]} onPress={onAddItem}>
          <Plus size={18} color={colors.onPrimary} />
          <Text style={appStyles.primaryButtonText}>Adicionar alimento</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  icon: {
    width: 80, height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.primary + '33',
    marginBottom: spacing.sm,
  },
  title:  { color: colors.text, fontSize: fontSize.lg, fontWeight: '900', textAlign: 'center' },
  sub:    { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },
  btn:    { marginTop: spacing.lg },
  itemsEmptyWrap: { alignItems: 'center', padding: spacing.lg },
  itemsEmptyText: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center' },
});
