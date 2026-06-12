import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, ClipboardList, Plus } from 'lucide-react-native';
import { appStyles, colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { MEAL_TIME_ORDER } from '@/features/nutrition';
import type { MealTimeType } from '@/features/nutrition';
import { useMealPlan, NutritionistPlanItem } from '../hooks/useMealPlan';
import { useMealPlanEditorForm } from '../hooks/useMealPlanEditorForm';
import { CreatePlanModal, ItemModal, MealCard } from '../components/meal-plan-editor';
import { isoToDisplay } from '../components/meal-plan-editor/dateParts';

export function MealPlanEditorScreen() {
  const router = useRouter();
  const { patientId, name } = useLocalSearchParams<{ patientId: string; name: string }>();
  const today = new Date().toISOString().slice(0, 10);

  const {
    items, planId, planTitle, planStartDate, planEndDate, planNotes,
    isLoading, error, isSubmitting, createPlan, upsertItem, deleteItem,
  } = useMealPlan(patientId ?? null, today);

  const {
    showCreatePlan, showItemModal, editItem, defaultMealTime,
    openCreatePlan, closeCreatePlan, openAddItem, openEditItem, closeItemModal,
    handleCreatePlan, handleUpsertItem,
  } = useMealPlanEditorForm({ createPlan, upsertItem });

  const groupedItems = useMemo(() => {
    const map = new Map<MealTimeType, NutritionistPlanItem[]>();
    for (const item of items) {
      const group = map.get(item.mealTime) ?? [];
      group.push(item);
      map.set(item.mealTime, group);
    }
    return map;
  }, [items]);

  const totalKcal = useMemo(() => items.reduce((s, i) => s + (i.prescribedCal ?? 0), 0), [items]);
  const patientName = name ?? 'Paciente';

  return (
    <SafeAreaView style={appStyles.screen} edges={['top']}>
      {/* Header */}
      <View style={[appStyles.dashboardHeader, styles.header]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={appStyles.dashboardTitle} numberOfLines={1}>{patientName}</Text>
          <Text style={appStyles.dashboardSubtitle}>Plano alimentar</Text>
        </View>
        {planId && (
          <TouchableOpacity style={styles.addFab} onPress={() => openAddItem()}>
            <Plus size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}

      {!isLoading && error && (
        <View style={styles.centered}>
          <Text style={appStyles.errorText}>{error}</Text>
        </View>
      )}

      {!isLoading && !error && !planId && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <ClipboardList size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Nenhum plano ativo</Text>
          <Text style={styles.emptySubtitle}>
            Crie um plano alimentar personalizado para {patientName}.
          </Text>
          <TouchableOpacity
            style={[appStyles.primaryButton, { marginTop: spacing.lg }]}
            onPress={openCreatePlan}
          >
            <Plus size={18} color={colors.onPrimary} />
            <Text style={appStyles.primaryButtonText}>Criar Plano Alimentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !error && planId && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Plan info card */}
          <View style={styles.planInfoCard}>
            <View style={styles.planInfoTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planInfoTitle}>{planTitle}</Text>
                <View style={styles.planDatesRow}>
                  <Calendar size={12} color={colors.muted} />
                  <Text style={styles.planDatesText}>
                    {isoToDisplay(planStartDate)}
                    {planEndDate ? ` → ${isoToDisplay(planEndDate)}` : ' → sem término'}
                  </Text>
                </View>
              </View>
              {totalKcal > 0 && (
                <View style={styles.planKcalBadge}>
                  <Text style={styles.planKcalValue}>{totalKcal}</Text>
                  <Text style={styles.planKcalUnit}>kcal/dia</Text>
                </View>
              )}
            </View>

            <View style={styles.planStatRow}>
              <View style={styles.planStat}>
                <Text style={styles.planStatValue}>{items.length}</Text>
                <Text style={styles.planStatLabel}>itens</Text>
              </View>
              <View style={styles.planStatDivider} />
              <View style={styles.planStat}>
                <Text style={styles.planStatValue}>{groupedItems.size}</Text>
                <Text style={styles.planStatLabel}>refeições</Text>
              </View>
              <View style={styles.planStatDivider} />
              <View style={styles.planStat}>
                <Text style={styles.planStatValue}>{items.filter(i => i.logId).length}</Text>
                <Text style={styles.planStatLabel}>reg. hoje</Text>
              </View>
            </View>

            {planNotes ? (
              <Text style={styles.planNotes}>{planNotes}</Text>
            ) : null}
          </View>

          {/* Empty state within plan */}
          {items.length === 0 && (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyItemsText}>Nenhum alimento prescrito ainda.</Text>
              <TouchableOpacity style={[appStyles.primaryButton, { marginTop: spacing.md }]} onPress={() => openAddItem()}>
                <Plus size={18} color={colors.onPrimary} />
                <Text style={appStyles.primaryButtonText}>Adicionar alimento</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Meal cards */}
          {MEAL_TIME_ORDER.filter(mt => groupedItems.has(mt)).map(mealTime => (
            <MealCard
              key={mealTime}
              mealTime={mealTime}
              items={groupedItems.get(mealTime)!}
              onEdit={openEditItem}
              onDelete={id => { void deleteItem(id); }}
              onAddToMeal={openAddItem}
            />
          ))}
        </ScrollView>
      )}

      <CreatePlanModal
        visible={showCreatePlan}
        onClose={closeCreatePlan}
        onSubmit={handleCreatePlan}
        isSubmitting={isSubmitting}
      />

      {planId && (
        <ItemModal
          visible={showItemModal}
          onClose={closeItemModal}
          onSubmit={handleUpsertItem}
          isSubmitting={isSubmitting}
          planId={planId}
          editItem={editItem}
          defaultMealTime={defaultMealTime}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  addFab: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    ...shadow.primary,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing.xl, gap: spacing.sm,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: radius.xl,
    backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.primary + '33', marginBottom: spacing.sm,
  },
  emptyTitle:    { color: colors.text, fontSize: fontSize.lg, fontWeight: '900', textAlign: 'center' },
  emptySubtitle: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  // Plan info card
  planInfoCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md, ...shadow.sm,
  },
  planInfoTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  planInfoTitle:  { color: colors.text, fontSize: fontSize.lg, fontWeight: '900', marginBottom: 4 },
  planDatesRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  planDatesText:  { color: colors.muted, fontSize: fontSize.xs },
  planKcalBadge:  {
    alignItems: 'center', backgroundColor: colors.primaryGlow, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.primary + '33',
  },
  planKcalValue:  { color: colors.primary, fontSize: fontSize.xl, fontWeight: '900' },
  planKcalUnit:   { color: colors.primary, fontSize: 10, fontWeight: '700' },
  planStatRow:    { flexDirection: 'row', alignItems: 'center' },
  planStat:       { flex: 1, alignItems: 'center', gap: 2 },
  planStatValue:  { color: colors.text, fontSize: fontSize.md, fontWeight: '900' },
  planStatLabel:  { color: colors.muted, fontSize: 10, fontWeight: '600' },
  planStatDivider: { width: 1, height: 28, backgroundColor: colors.border },
  planNotes: {
    color: colors.muted, fontSize: fontSize.xs, fontStyle: 'italic',
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm,
  },

  emptyItems:     { alignItems: 'center', padding: spacing.lg },
  emptyItemsText: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center' },
});
