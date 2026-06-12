import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appStyles, colors, spacing } from '@/shared/theme';
import { AppModal } from '@/shared/components/ui/AppModal';
import { DateField } from './DateField';
import { modalChrome } from './modalChrome';

export interface CreatePlanForm {
  title: string;
  startDate: string;
  endDate: string;
  notes: string;
}

interface CreatePlanModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: CreatePlanForm) => void;
  isSubmitting: boolean;
}

/**
 * Sheet modal for creating a new meal plan (title, start/end dates, notes).
 */
export function CreatePlanModal({ visible, onClose, onSubmit, isSubmitting }: CreatePlanModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<CreatePlanForm>({ title: '', startDate: today, endDate: '', notes: '' });
  const set = (field: keyof CreatePlanForm) => (val: string) => setForm(f => ({ ...f, [field]: val }));
  const canSubmit = form.title.trim().length > 0 && form.startDate.length === 10 && !isSubmitting;

  return (
    <AppModal visible={visible} onClose={onClose} variant="sheet" avoidKeyboard>
      <SafeAreaView style={modalChrome.modalSafe} edges={['top', 'bottom']}>
        <View style={modalChrome.modalHeader}>
          <Text style={modalChrome.modalTitle}>Novo Plano Alimentar</Text>
          <TouchableOpacity onPress={onClose} style={modalChrome.modalCloseBtn}>
            <Text style={modalChrome.modalCloseText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={modalChrome.modalContent}>
          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Título do plano *</Text>
            <View style={appStyles.inputFrame}>
              <TextInput
                style={appStyles.input}
                placeholder="Ex: Plano Emagrecimento Fase 1"
                placeholderTextColor={colors.muted}
                value={form.title}
                onChangeText={set('title')}
              />
            </View>
          </View>

          <DateField label="Data de início" value={form.startDate} onChange={set('startDate')} />
          <DateField label="Data de término" value={form.endDate} onChange={set('endDate')} optional />

          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Observações (opcional)</Text>
            <View style={[appStyles.inputFrame, { minHeight: 80, alignItems: 'flex-start', paddingTop: spacing.sm }]}>
              <TextInput
                style={[appStyles.input, { height: 70 }]}
                placeholder="Notas gerais sobre o plano..."
                placeholderTextColor={colors.muted}
                value={form.notes}
                onChangeText={set('notes')}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[appStyles.primaryButton, !canSubmit && appStyles.primaryButtonDisabled]}
            disabled={!canSubmit}
            onPress={() => onSubmit(form)}
          >
            {isSubmitting
              ? <ActivityIndicator color={colors.onPrimary} />
              : <Text style={appStyles.primaryButtonText}>Criar Plano</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </AppModal>
  );
}
