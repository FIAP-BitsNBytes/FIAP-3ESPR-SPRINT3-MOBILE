import React, { useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Clock, Plus, UserPlus, Stethoscope, ChevronRight } from 'lucide-react-native';
import { useRouter, type Href } from 'expo-router';
import { appStyles, colors, spacing, radius, fontSize, shadow } from '@/shared/theme';
import type { NutritionistRequest } from '../domain/admin';
import { useNutritionists } from '../hooks/useNutritionists';
import { useInviteUser } from '@/shared/hooks/useInviteUser';
import { InlineStatus } from '@/shared/components/ui/InlineStatus';

const STATUS_CONFIG = {
  APPROVED: { color: colors.success, Icon: CheckCircle, label: 'Aprovado' },
  PENDING: { color: colors.warning, Icon: Clock, label: 'Pendente' },
  REJECTED: { color: colors.danger, Icon: XCircle, label: 'Rejeitado' },
} as const;

function NutritionistRow({ item, onPress }: { item: NutritionistRequest; onPress: () => void }) {
  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
  const { color, Icon, label } = status;
  return (
    <TouchableOpacity style={appStyles.dashboardCard} onPress={onPress} activeOpacity={0.7}>
      <View style={appStyles.row}>
        <View style={styles.avatarIcon}>
          <Stethoscope size={18} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.crm}>{item.crmCrn}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: color + '22' }]}>
          <Icon size={13} color={color} />
          <Text style={[styles.badgeText, { color }]}>{label}</Text>
        </View>
        <ChevronRight size={16} color={colors.muted} style={{ marginLeft: spacing.xs }} />
      </View>
    </TouchableOpacity>
  );
}

export function AdminNutritionistsScreen() {
  const router = useRouter();
  const { nutritionists, isLoading, refresh } = useNutritionists();
  const { inviteUser, isInviting } = useInviteUser();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState({ name: '', email: '', crm: '' });

  const openInviteModal = () => {
    setFeedback(null);
    setIsModalVisible(true);
  };

  const handleInvite = async () => {
    if (!form.name || !form.email || !form.crm) {
      setFeedback({ type: 'error', message: 'Preencha nome, e-mail e CRM/CRN antes de enviar.' });
      return;
    }
    const result = await inviteUser({ name: form.name, email: form.email, role: 'NUTRITIONIST', crm_crn: form.crm });
    if (result.success) {
      setFeedback(null);
      setForm({ name: '', email: '', crm: '' });
      setIsModalVisible(false);
      refresh();
    } else {
      setFeedback({ type: 'error', message: result.error });
    }
  };

  const handleOpenPatients = (item: NutritionistRequest) => {
    router.push({ pathname: '/nutritionist-patients', params: { id: item.id, name: item.name } } as Href);
  };

  const approved = nutritionists.filter(n => n.status === 'APPROVED').length;

  return (
    <SafeAreaView style={appStyles.screen} edges={['top']}>
      <FlatList
        data={nutritionists}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={refresh}
        ListHeaderComponent={
          <>
            <View style={styles.pageHeader}>
              <Text style={appStyles.eyebrow}>Gestão</Text>
              <Text style={appStyles.title}>Nutricionistas</Text>
              <Text style={appStyles.subtitle}>Gerencie os profissionais da sua clínica</Text>
            </View>

            <View style={[appStyles.statusCard, styles.summaryCard]}>
              <View style={appStyles.statusIconContainer}>
                <Stethoscope size={24} color={colors.onPrimary} />
              </View>
              <View style={appStyles.statusContent}>
                <Text style={appStyles.statusLabel}>Profissionais Ativos</Text>
                <Text style={appStyles.statusValue}>
                  {isLoading ? '...' : `${approved} aprovado${approved !== 1 ? 's' : ''}`}
                </Text>
              </View>
              {!isLoading && nutritionists.length > 0 && (
                <View style={appStyles.activeBadge}>
                  <View style={appStyles.pulseDot} />
                  <Text style={appStyles.activeBadgeText}>{nutritionists.length} total</Text>
                </View>
              )}
            </View>

            {nutritionists.length > 0 && (
              <Text style={appStyles.sectionTitle}>Lista de Nutricionistas</Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <NutritionistRow item={item} onPress={() => handleOpenPatients(item)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Stethoscope size={40} color={colors.muted} />
              <Text style={styles.emptyTitle}>Nenhum nutricionista</Text>
              <Text style={styles.emptySubtitle}>Convide profissionais para sua clínica.</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={openInviteModal}
        activeOpacity={0.8}
      >
        <Plus color="white" size={24} />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <UserPlus color={colors.primary} size={24} />
              <Text style={styles.modalTitle}>Convidar Nutricionista</Text>
            </View>

            {feedback ? <InlineStatus variant={feedback.type} message={feedback.message} /> : null}
            
            <TextInput 
              style={styles.input} 
              placeholder="Nome Completo" 
              placeholderTextColor={colors.muted}
              value={form.name}
              onChangeText={text => setForm(f => ({ ...f, name: text }))}
            />
            <TextInput 
              style={styles.input} 
              placeholder="E-mail" 
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={text => setForm(f => ({ ...f, email: text }))}
            />
            <TextInput 
              style={styles.input} 
              placeholder="CRM ou CRN" 
              placeholderTextColor={colors.muted}
              value={form.crm}
              onChangeText={text => setForm(f => ({ ...f, crm: text }))}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setIsModalVisible(false)}
                disabled={isInviting}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.inviteButton]} 
                onPress={handleInvite}
                disabled={isInviting}
              >
                {isInviting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.inviteButtonText}>Enviar Convite</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: 100, gap: spacing.sm },
  pageHeader: { gap: spacing.xs, marginBottom: spacing.md },
  summaryCard: { marginBottom: spacing.md },
  avatarIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  crm: { color: colors.muted, fontSize: fontSize.sm, marginTop: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  button: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  inviteButton: { backgroundColor: colors.primary },
  cancelButtonText: { color: colors.text, fontWeight: '600' },
  inviteButtonText: { color: 'white', fontWeight: '600' },
  empty: { paddingTop: spacing.xxl, alignItems: 'center', gap: spacing.md },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  emptySubtitle: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center' },
});
