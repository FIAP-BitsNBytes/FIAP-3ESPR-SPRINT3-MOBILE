import { useRef, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'lucide-react-native';
import { appStyles, colors, fontSize, radius, spacing } from '@/shared/theme';
import type { CreatePlanParams } from '../types';

function partsToIso(d: string, m: string, y: string): string | null {
  if (d.length === 2 && m.length === 2 && y.length === 4) return `${y}-${m}-${d}`;
  return null;
}

function isoToParts(iso: string) {
  if (!iso) return { d: '', m: '', y: '' };
  return { d: iso.slice(8, 10), m: iso.slice(5, 7), y: iso.slice(0, 4) };
}

function DateField({
  label, value, onChange, optional,
}: {
  label: string; value: string; onChange: (iso: string) => void; optional?: boolean;
}) {
  const parts = value ? isoToParts(value) : { d: '', m: '', y: '' };
  const [d, setD] = useState(parts.d);
  const [m, setM] = useState(parts.m);
  const [y, setY] = useState(parts.y);
  const refM = useRef<TextInput>(null);
  const refY = useRef<TextInput>(null);

  const commit = (day: string, mon: string, year: string) => {
    const iso = partsToIso(day, mon, year);
    if (iso) onChange(iso);
  };

  return (
    <View style={styles.dateWrap}>
      <View style={styles.dateLabelRow}>
        <Calendar size={13} color={colors.muted} />
        <Text style={appStyles.fieldLabel}>{label}{optional ? ' (opcional)' : ' *'}</Text>
      </View>
      <View style={styles.dateRow}>
        <View style={styles.dateSm}>
          <TextInput
            style={styles.dateInput}
            placeholder="DD" placeholderTextColor={colors.muted}
            keyboardType="numeric" maxLength={2} value={d}
            onChangeText={val => {
              const v = val.replace(/\D/g, '').slice(0, 2);
              setD(v);
              if (v.length === 2) refM.current?.focus();
              commit(v, m, y);
            }}
          />
          <Text style={styles.datePartLabel}>dia</Text>
        </View>
        <Text style={styles.dateSep}>/</Text>
        <View style={styles.dateSm}>
          <TextInput
            ref={refM}
            style={styles.dateInput}
            placeholder="MM" placeholderTextColor={colors.muted}
            keyboardType="numeric" maxLength={2} value={m}
            onChangeText={val => {
              const v = val.replace(/\D/g, '').slice(0, 2);
              setM(v);
              if (v.length === 2) refY.current?.focus();
              commit(d, v, y);
            }}
          />
          <Text style={styles.datePartLabel}>mês</Text>
        </View>
        <Text style={styles.dateSep}>/</Text>
        <View style={styles.dateLg}>
          <TextInput
            ref={refY}
            style={styles.dateInput}
            placeholder="AAAA" placeholderTextColor={colors.muted}
            keyboardType="numeric" maxLength={4} value={y}
            onChangeText={val => {
              const v = val.replace(/\D/g, '').slice(0, 4);
              setY(v);
              commit(d, m, v);
            }}
          />
          <Text style={styles.datePartLabel}>ano</Text>
        </View>
      </View>
    </View>
  );
}

interface CreatePlanModalProps {
  visible: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (params: CreatePlanParams) => void;
}

export function CreatePlanModal({ visible, isSubmitting, onClose, onSubmit }: CreatePlanModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const canSubmit = title.trim().length > 0 && startDate.length === 10 && !isSubmitting;

  const handleSubmit = () => {
    onSubmit({ title: title.trim(), startDate, endDate: endDate || null, notes: notes.trim() || null });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Novo Plano Alimentar</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Título do plano *</Text>
            <View style={appStyles.inputFrame}>
              <TextInput
                style={appStyles.input}
                placeholder="Ex: Plano Emagrecimento Fase 1"
                placeholderTextColor={colors.muted}
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>

          <DateField label="Data de início" value={startDate} onChange={setStartDate} />
          <DateField label="Data de término" value={endDate} onChange={setEndDate} optional />

          <View style={appStyles.formGroup}>
            <Text style={appStyles.fieldLabel}>Observações (opcional)</Text>
            <View style={[appStyles.inputFrame, { minHeight: 80, alignItems: 'flex-start', paddingTop: spacing.sm }]}>
              <TextInput
                style={[appStyles.input, { height: 70 }]}
                placeholder="Notas gerais sobre o plano..."
                placeholderTextColor={colors.muted}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[appStyles.primaryButton, !canSubmit && appStyles.primaryButtonDisabled]}
            disabled={!canSubmit}
            onPress={handleSubmit}
          >
            {isSubmitting
              ? <ActivityIndicator color={colors.onPrimary} />
              : <Text style={appStyles.primaryButtonText}>Criar Plano</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900' },
  closeBtn:    { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  closeText:   { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },
  content:     { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  dateWrap:      { gap: spacing.xs },
  dateLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dateSm:        { width: 60, alignItems: 'center', gap: 2 },
  dateLg:        { width: 84, alignItems: 'center', gap: 2 },
  dateInput: {
    width: '100%', backgroundColor: colors.surface, borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
    color: colors.text, borderWidth: 1, borderColor: colors.border,
    fontSize: fontSize.md, fontWeight: '700', textAlign: 'center',
  },
  datePartLabel: { color: colors.muted, fontSize: 9, fontWeight: '600', textTransform: 'uppercase' },
  dateSep:       { color: colors.muted, fontSize: fontSize.lg, fontWeight: '300', marginBottom: 14 },
});
