import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Image,
} from 'react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { useImagePicker } from '@/shared/hooks/useImagePicker';
import { uploadMealPhoto } from '@/shared/infrastructure/supabase/storage';
import { UNIT_LABELS } from '../types';
import type { PlanItem, LogItemParams, MeasurementUnit } from '../types';

const UNITS: MeasurementUnit[] = ['GRAMS', 'MILLILITERS', 'UNITS', 'PORTIONS', 'CALORIES'];

interface LogItemModalProps {
  item: PlanItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (params: LogItemParams) => void;
}

export function LogItemModal({ item, isSubmitting, onClose, onSubmit }: LogItemModalProps) {
  const { user } = useAuthContext();
  const { asset, status, pickFromCamera, pickFromGallery, clearAsset } = useImagePicker();

  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState<MeasurementUnit>('GRAMS');
  const [substitute, setSubstitute] = useState('');
  const [cal, setCal] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  // Feedback inline: Alert.alert é no-op no React Native Web.
  const [error, setError] = useState<string | null>(null);

  // Reseta os campos para os valores prescritos sempre que o item alvo muda
  // (o componente permanece montado em NutritionScreen; sem isso o estado
  // de um item anterior vazaria para o próximo).
  useEffect(() => {
    if (!item) return;
    setQty(String(item.prescribedQty));
    setUnit(item.prescribedUnit);
    setCal(item.prescribedCal ? String(item.prescribedCal) : '');
    setSubstitute('');
    setNotes('');
    setError(null);
    clearAsset();
  }, [item?.itemId]);

  const busy = isSubmitting || uploading;

  if (!item) return null;

  const handleSubmit = async () => {
    setError(null);
    const parsed = parseFloat(qty.replace(',', '.'));
    if (!qty.trim() || isNaN(parsed) || parsed <= 0) {
      setError(`Informe a quantidade consumida em ${UNIT_LABELS[unit]} (somente números).`);
      return;
    }

    let photoPath: string | null = null;
    if (asset && user?.id) {
      setUploading(true);
      try {
        const uploadResult = await uploadMealPhoto(user.id, asset.uri);
        if ('path' in uploadResult) {
          photoPath = uploadResult.path;
        } else {
          setError(`Foto não enviada: ${uploadResult.error}. Tente outra foto ou registre sem foto.`);
          setUploading(false);
          return;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Falha no upload da foto.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSubmit({
      planItemId: item.itemId,
      actualQty:  parsed,
      actualUnit: unit,
      // Fall back to prescribed calories so the chart always has data
      actualCal:  cal ? parseInt(cal, 10) : (item.prescribedCal ?? null),
      notes:      notes.trim() || null,
      photoPath,
      actualFoodName: substitute.trim() || null,
    });
    clearAsset();
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{item.foodName}</Text>
          <Text style={styles.sub}>
            Prescrito: {item.prescribedQty}{UNIT_LABELS[item.prescribedUnit]}
            {item.prescribedCal ? ` · ${item.prescribedCal} kcal` : ''}
          </Text>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Alimento consumido</Text>
          <TextInput
            style={styles.input}
            value={substitute}
            onChangeText={setSubstitute}
            placeholder={`${item.foodName} (deixe vazio se comeu o prescrito)`}
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.fieldHint}>
            Comeu outra coisa no lugar? Informe aqui (ex: maçã em vez de banana).
          </Text>

          <Text style={styles.label}>Quantidade consumida ({UNIT_LABELS[unit]})</Text>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={qty}
            onChangeText={(t) => { setQty(t); if (error) setError(null); }}
            keyboardType="numeric"
            placeholder={`ex: ${item.prescribedQty}`}
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Unidade</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitRow}>
            {UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.unitChip, unit === u && styles.unitChipActive]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>{UNIT_LABELS[u]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Calorias reais (opcional)</Text>
          <TextInput
            style={styles.input}
            value={cal}
            onChangeText={setCal}
            keyboardType="numeric"
            placeholder="ex: 320"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Observação (opcional)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="ex: comi menos pois não estava com fome"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Foto da refeição (opcional)</Text>
          <Text style={styles.photoHint}>Anexe uma foto como prova do que realmente comeu.</Text>
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.photoBtn} onPress={pickFromCamera} disabled={busy}>
              <Text style={styles.photoBtnText}>📷 Câmera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery} disabled={busy}>
              <Text style={styles.photoBtnText}>🖼 Galeria</Text>
            </TouchableOpacity>
          </View>
          {status === 'denied' && (
            <Text style={styles.permissionError}>Permissão negada. Verifique o acesso à câmera/galeria nas configurações.</Text>
          )}
          {asset && (
            <View style={styles.previewRow}>
              <Image source={{ uri: asset.uri }} style={styles.photoPreview} />
              <TouchableOpacity onPress={clearAsset} disabled={busy} style={styles.removePhotoBtn}>
                <Text style={styles.removePhotoText}>Remover foto</Text>
              </TouchableOpacity>
            </View>
          )}
          </ScrollView>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.btns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={busy}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, busy && styles.confirmBtnDisabled]} onPress={handleSubmit} disabled={busy} activeOpacity={0.8}>
              {busy
                ? <ActivityIndicator color={colors.onPrimary} size="small" />
                : <Text style={styles.confirmText}>Confirmar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:       {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.xl, gap: spacing.md,
    maxHeight: '90%',
  },
  scroll:        { flexGrow: 0 },
  scrollContent: { gap: spacing.md, paddingBottom: spacing.xs },
  title:       { color: colors.text, fontSize: fontSize.xl, fontWeight: '900' },
  sub:         { color: colors.muted, fontSize: fontSize.sm, marginTop: -spacing.sm },
  label:       { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '700' },
  fieldHint:   { color: colors.muted, fontSize: fontSize.xs, marginTop: -spacing.xs },
  unitRow:     { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  unitChip:    { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  unitChipActive:     { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  unitChipText:       { color: colors.muted, fontSize: fontSize.xs, fontWeight: '700' },
  unitChipTextActive: { color: colors.primary },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: fontSize.md,
  },
  inputMulti:  { minHeight: 72, textAlignVertical: 'top' },
  btns:        { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  cancelBtn: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    alignItems: 'center', backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
  },
  cancelText:  { color: colors.text, fontWeight: '600' },
  confirmBtn: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    alignItems: 'center', backgroundColor: colors.primary,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmText: { color: colors.onPrimary, fontWeight: '700' },
  inputError: { borderColor: colors.danger },
  errorBox: {
    backgroundColor: colors.danger + '12',
    borderWidth: 1,
    borderColor: colors.danger + '40',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  errorText: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '600' },
  photoHint:    { color: colors.muted, fontSize: fontSize.xs, marginTop: -spacing.xs },
  photoRow:     { flexDirection: 'row', gap: spacing.sm },
  photoBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md,
    alignItems: 'center', backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
  },
  photoBtnText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  permissionError: { color: colors.danger, fontSize: fontSize.xs },
  previewRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  photoPreview: { width: 80, height: 80, borderRadius: radius.md },
  removePhotoBtn:  { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  removePhotoText: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '700' },
});
