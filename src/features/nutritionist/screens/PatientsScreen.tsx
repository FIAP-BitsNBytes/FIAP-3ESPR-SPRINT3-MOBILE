import React, { useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, ChevronRight, Flame, Plus, UserPlus, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { appStyles, colors, spacing, radius, fontSize, shadow } from '@/shared/theme';
import { useClinicPatients, type ClinicPatient } from '../hooks/useClinicPatients';
import { useInviteUser } from '@/shared/hooks/useInviteUser';
import { InlineStatus } from '@/shared/components/ui/InlineStatus';

function levelColor(level: number): string {
  if (level >= 10) return '#A78BFA';
  if (level >= 5) return colors.primary;
  return colors.success;
}

function PatientRow({ item, onPress }: { item: ClinicPatient; onPress: () => void }) {
  return (
    <TouchableOpacity style={appStyles.dashboardCard} onPress={onPress} activeOpacity={0.7}>
      <View style={appStyles.row}>
        <View style={styles.avatarIcon}>
          <Users size={18} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.chips}>
            <View style={[styles.chip, { backgroundColor: colors.warning + '22' }]}>
              <Flame size={10} color={colors.warning} />
              <Text style={[styles.chipText, { color: colors.warning }]}>{item.streakDays}d</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.primaryGlow }]}>
              <Text style={[styles.chipText, { color: colors.primary }]}>{item.points} pts</Text>
            </View>
          </View>
        </View>
        <View style={[styles.levelBadge, { backgroundColor: levelColor(item.level) + '22' }]}>
          <Text style={[styles.levelText, { color: levelColor(item.level) }]}>Lv {item.level}</Text>
        </View>
        <ChevronRight size={16} color={colors.muted} style={{ marginLeft: spacing.xs }} />
      </View>
    </TouchableOpacity>
  );
}

export function NutritionistPatientsScreen() {
  const router = useRouter();
  const { patients, lowEngagement, isLoading, refresh } = useClinicPatients();
  const { inviteUser, isInviting } = useInviteUser();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState({ name: '', email: '' });

  const openInviteModal = () => {
    setFeedback(null);
    setIsModalVisible(true);
  };

  const handleInvite = async () => {
    if (!form.name || !form.email) {
      setFeedback({ type: 'error', message: 'Preencha nome e e-mail antes de enviar.' });
      return;
    }
    const result = await inviteUser({ name: form.name, email: form.email, role: 'PATIENT' });
    if (result.success) {
      setFeedback(null);
      setForm({ name: '', email: '' });
      setIsModalVisible(false);
      refresh();
    } else {
      setFeedback({ type: 'error', message: result.error });
    }
  };

  const handleOpenPatient = (item: ClinicPatient) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push({ pathname: '/patient-progress' as any, params: { patientId: item.id, name: item.name } });
  };

  return (
    <SafeAreaView style={appStyles.screen} edges={['top']}>
      <FlatList
        data={patients}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={refresh}
        ListHeaderComponent={
          <>
            <View style={styles.pageHeader}>
              <Text style={appStyles.eyebrow}>Acompanhamento</Text>
              <Text style={appStyles.title}>Meus Pacientes</Text>
              <Text style={appStyles.subtitle}>Monitore a evolução e engajamento</Text>
            </View>

            <View style={[appStyles.statusCard, styles.summaryCard]}>
              <View style={appStyles.statusIconContainer}>
                <Users size={24} color={colors.onPrimary} />
              </View>
              <View style={appStyles.statusContent}>
                <Text style={appStyles.statusLabel}>Pacientes Ativos</Text>
                <Text style={appStyles.statusValue}>
                  {isLoading ? '...' : `${patients.length} cadastrado${patients.length !== 1 ? 's' : ''}`}
                </Text>
              </View>
              {!isLoading && lowEngagement.length > 0 && (
                <View style={[appStyles.activeBadge, styles.alertBadge]}>
                  <AlertTriangle size={12} color={colors.warning} />
                  <Text style={[appStyles.activeBadgeText, { color: colors.warning }]}>
                    {lowEngagement.length} alerta{lowEngagement.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>

            {patients.length > 0 && (
              <Text style={appStyles.sectionTitle}>Lista de Pacientes</Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <PatientRow item={item} onPress={() => handleOpenPatient(item)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Users size={40} color={colors.muted} />
              <Text style={styles.emptyTitle}>Nenhum paciente</Text>
              <Text style={styles.emptySubtitle}>Convide pacientes para acompanhar sua evolução.</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openInviteModal} activeOpacity={0.8}>
        <Plus color="white" size={24} />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <UserPlus color={colors.primary} size={24} />
              <Text style={styles.modalTitle}>Convidar Paciente</Text>
            </View>

            {feedback ? <InlineStatus variant={feedback.type} message={feedback.message} /> : null}

            <TextInput
              style={styles.input}
              placeholder="Nome do Paciente"
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
  alertBadge: { borderColor: colors.warning + '44', backgroundColor: colors.warning + '15' },
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
  info: { flex: 1, gap: 4 },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  chips: { flexDirection: 'row', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  chipText: { fontSize: 10, fontWeight: '700' },
  levelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  levelText: { fontSize: fontSize.xs, fontWeight: '800' },
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
