import React, { useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, UserPlus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { PatientCard } from '@/shared/components/ui/PatientCard';
import { colors, spacing, radius, fontSize } from '@/shared/theme';
import { useClinicPatients } from '../hooks/useClinicPatients';
import { useInviteUser } from '@/shared/hooks/useInviteUser';

export function NutritionistPatientsScreen() {
  const router = useRouter();
  const { patients, isLoading, refresh } = useClinicPatients();
  const { inviteUser, isInviting } = useInviteUser();
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const [form, setForm] = useState({ name: '', email: '' });

  const handleInvite = async () => {
    if (!form.name || !form.email) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const result = await inviteUser({
      name: form.name,
      email: form.email,
      role: 'PATIENT'
    });

    if (result.success) {
      Alert.alert('Sucesso', 'Paciente convidado com sucesso!');
      setIsModalVisible(false);
      setForm({ name: '', email: '' });
      refresh();
    } else {
      Alert.alert('Erro ao convidar', 'Verifique os dados ou tente novamente.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={patients}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Meus Pacientes</Text>}
        renderItem={({ item }) => (
          <PatientCard
            {...item}
            onPress={() => router.push(`/(tabs)/progress?patientId=${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshing={isLoading}
        onRefresh={refresh}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhum paciente cadastrado.</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.8}
      >
        <Plus color="white" size={24} />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <UserPlus color={colors.primary} size={24} />
              <Text style={styles.modalTitle}>Convidar Paciente</Text>
            </View>
            
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
