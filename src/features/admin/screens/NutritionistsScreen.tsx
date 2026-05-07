import React, { useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Clock, Plus, UserPlus } from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';
import type { NutritionistStatus, NutritionistRequest } from '../domain/admin';
import { useNutritionists } from '../hooks/useNutritionists';
import { useInviteUser } from '@/shared/hooks/useInviteUser';
import { InlineStatus } from '@/shared/components/ui/InlineStatus';

const STATUS_CONFIG = {
  APPROVED: { color: colors.success, Icon: CheckCircle, label: 'Aprovado' },
  PENDING: { color: colors.warning, Icon: Clock, label: 'Pendente' },
  REJECTED: { color: colors.danger, Icon: XCircle, label: 'Rejeitado' },
} as const;

function NutritionistRow({ item }: { item: NutritionistRequest }) {
  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
  const { color, Icon, label } = status;
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

    const result = await inviteUser({
      name: form.name,
      email: form.email,
      role: 'NUTRITIONIST',
      crm_crn: form.crm
    });

    if (result.success) {
      setFeedback(null);
      setForm({ name: '', email: '', crm: '' });
      setIsModalVisible(false);
      refresh();
    } else {
      setFeedback({ type: 'error', message: result.error });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={nutritionists}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Nutricionistas</Text>}
        renderItem={({ item }) => <NutritionistRow item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshing={isLoading}
        onRefresh={refresh}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhum nutricionista cadastrado.</Text>
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
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: 100 },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800', marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inviteButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  inviteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  empty: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: fontSize.md,
  },
});
