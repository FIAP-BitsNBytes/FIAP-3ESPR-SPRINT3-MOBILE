import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { appStyles, colors, spacing } from '@/shared/theme';
import { PersistentTabBar } from '@/shared/components/PersistentTabBar';

import { usePlanDetail } from '../hooks/usePlanDetail';
import { usePlanPermissions } from '../hooks/usePlanPermissions';
import { PlanDetailContext } from '../context/PlanDetailContext';
import { PlanHeader } from '../components/PlanHeader';
import { PlanEmptyState, PlanItemsEmpty } from '../components/PlanEmptyState';
import { MealSection } from '../components/MealSection';
import { AddItemFAB } from '../components/AddItemFAB';
import { CreatePlanModal } from '../components/CreatePlanModal';
import { UpsertItemModal } from '../components/UpsertItemModal';
import { MEAL_TIME_ORDER } from '../types';
import type { MealTimeType, PlanItem, CreatePlanParams, UpsertItemParams } from '../types';

interface PlanDetailScreenProps {
  patientId: string;
  patientName?: string;
}

export function PlanDetailScreen({ patientId, patientName = 'Paciente' }: PlanDetailScreenProps) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const planDetail = usePlanDetail(patientId, today);
  const { canEdit } = usePlanPermissions();
  const scrollRef = useRef<ScrollView>(null);

  const { items, plan, isLoading, error, isSubmitting, createPlan, upsertItem, deleteItem } = planDetail;

  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState<PlanItem | null>(null);
  const [defaultMealTime, setDefaultMealTime] = useState<MealTimeType>('BREAKFAST');

  const grouped = useMemo(() => {
    const map = new Map<MealTimeType, PlanItem[]>();
    for (const item of items) {
      map.set(item.mealTime, [...(map.get(item.mealTime) ?? []), item]);
    }
    return map;
  }, [items]);

  const handleCreatePlan = async (params: CreatePlanParams) => {
    const result = await createPlan(params);
    if (result.success) {
      setShowCreatePlan(false);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 300);
    } else {
      Alert.alert('Erro', result.error);
    }
  };

  const handleUpsertItem = async (params: UpsertItemParams) => {
    const result = await upsertItem(params);
    if (result.success) {
      setShowItemModal(false);
      setEditItem(null);
    } else {
      Alert.alert('Erro', result.error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const result = await deleteItem(itemId);
    if (!result.success) Alert.alert('Erro', result.error);
  };

  const openAdd = (mealTime: MealTimeType = 'BREAKFAST') => {
    setDefaultMealTime(mealTime);
    setEditItem(null);
    setShowItemModal(true);
  };

  const openEdit = (item: PlanItem) => {
    setEditItem(item);
    setShowItemModal(true);
  };

  return (
    <PlanDetailContext.Provider value={planDetail}>
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
        </View>

        {/* Body */}
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

        {!isLoading && !error && !plan && (
          <PlanEmptyState patientName={patientName} onCreatePlan={() => setShowCreatePlan(true)} />
        )}

        {!isLoading && !error && plan && (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <PlanHeader />

            {items.length === 0 ? (
              <PlanItemsEmpty onAddItem={() => openAdd()} />
            ) : (
              MEAL_TIME_ORDER.filter(mt => grouped.has(mt)).map(mealTime => (
                <MealSection
                  key={mealTime}
                  mealTime={mealTime}
                  items={grouped.get(mealTime)!}
                  onEdit={openEdit}
                  onDelete={handleDeleteItem}
                  onAddToMeal={openAdd}
                />
              ))
            )}
          </ScrollView>
        )}

        {/* FAB — only shown when plan exists */}
        {!isLoading && plan && (
          <AddItemFAB onPress={() => openAdd()} />
        )}

        <PersistentTabBar activeTab="patients" />

        {/* Modals */}
        <CreatePlanModal
          visible={showCreatePlan}
          isSubmitting={isSubmitting}
          onClose={() => setShowCreatePlan(false)}
          onSubmit={handleCreatePlan}
        />

        {plan && showItemModal && (
          <UpsertItemModal
            key={editItem?.itemId ?? `new-${defaultMealTime}`}
            visible
            isSubmitting={isSubmitting}
            planId={plan.id}
            editItem={editItem}
            defaultMealTime={defaultMealTime}
            onClose={() => { setShowItemModal(false); setEditItem(null); }}
            onSubmit={handleUpsertItem}
          />
        )}
      </SafeAreaView>
    </PlanDetailContext.Provider>
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
    width: 36, height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content:  { padding: spacing.md, gap: spacing.md, paddingBottom: 200 },
});
