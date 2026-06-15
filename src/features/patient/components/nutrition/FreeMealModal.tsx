import { useState } from 'react';
import {
  Modal, ScrollView, TextInput, View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, Pressable,
} from 'react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { useImagePicker } from '@/shared/hooks/useImagePicker';
import { uploadMealPhoto } from '@/shared/infrastructure/supabase/storage';
import type { LogFreeMealParams } from '../../hooks/useLogMeal';
import type { MeasurementUnit } from '../../hooks/useDailyPlan';

const UNIT_LABELS: Record<MeasurementUnit, string> = {
  GRAMS: 'g', MILLILITERS: 'ml', UNITS: 'un', PORTIONS: 'porç.', CALORIES: 'kcal',
};

const UNIT_NAMES: Record<MeasurementUnit, string> = {
  GRAMS: 'gramas', MILLILITERS: 'mililitros', UNITS: 'unidade(s)', PORTIONS: 'porção(ões)', CALORIES: 'kcal',
};

interface FreeMealModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (p: LogFreeMealParams) => Promise<void>;
  isLogging: boolean;
}

export function FreeMealModal({ visible, onClose, onSubmit, isLogging }: FreeMealModalProps) {
  const { user } = useAuthContext();
  const { asset, status, pickFromCamera, pickFromGallery, clearAsset } = useImagePicker();

  const [foodName, setFoodName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState<MeasurementUnit>('GRAMS');
  const [cal, setCal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Feedback inline: Alert.alert é no-op no React Native Web.
  const [error, setError] = useState<string | null>(null);

  // Cobre upload da foto + RPC. isLogging só cobre a RPC do pai.
  const busy = submitting || isLogging;

  const reset = () => {
    setFoodName('');
    setQty('');
    setUnit('GRAMS');
    setCal('');
    setError(null);
    clearAsset();
  };

  const handleSubmit = async () => {
    setError(null);
    if (!foodName.trim()) {
      setError('Informe o nome do alimento.');
      return;
    }
    const parsed = parseFloat(qty.replace(',', '.'));
    if (!qty.trim() || isNaN(parsed) || parsed <= 0) {
      setError('Informe uma quantidade válida (somente números, maior que zero).');
      return;
    }

    setSubmitting(true);
    try {
      let photoPath: string | null = null;

      if (asset && user?.id) {
        const uploadResult = await uploadMealPhoto(user.id, asset.uri);
        if ('path' in uploadResult) {
          photoPath = uploadResult.path;
        } else {
          setError(`Foto não enviada: ${uploadResult.error}. Tente outra foto ou registre sem foto.`);
          setSubmitting(false);
          return;
        }
      }

      await onSubmit({
        foodName: foodName.trim(),
        qty: parsed,
        unit,
        calories: cal ? parseInt(cal, 10) : null,
        photoPath,
      });
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível registrar a refeição.');
    } finally {
      setSubmitting(false);
    }
  };

  const units: MeasurementUnit[] = ['GRAMS', 'MILLILITERS', 'UNITS', 'PORTIONS', 'CALORIES'];

  // Resumo legível: "1 unidade(s) de tubarão".
  const qtyPreview =
    qty.trim() && foodName.trim()
      ? `${qty.trim()} ${UNIT_NAMES[unit]} de ${foodName.trim()}`
      : '';

  const dismiss = () => {
    if (busy) return; // não fecha durante upload/registro
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={dismiss}>
      {/* Toque no overlay (área escura) fecha o modal. */}
      <Pressable style={styles.overlay} onPress={dismiss}>
        {/* Sheet engole o toque para não propagar ao overlay.
            No RN Web o clique borbulha por padrão — stopPropagation evita
            que clicar dentro (inclusive em "Registrar") feche o modal. */}
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>Refeição livre</Text>

          <Text style={styles.fieldLabel}>Alimento</Text>
          <TextInput style={styles.input} value={foodName} onChangeText={setFoodName} placeholder="ex: Banana" placeholderTextColor={colors.muted} />

          <Text style={styles.fieldLabel}>Quantidade</Text>
          <View style={styles.qtyRow}>
            <TextInput
              style={[styles.input, styles.qtyInput]}
              value={qty}
              onChangeText={setQty}
              keyboardType="numeric"
              placeholder="ex: 150"
              placeholderTextColor={colors.muted}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitRow}>
              {units.map(u => (
                <TouchableOpacity key={u} style={[styles.unitChip, unit === u && styles.unitChipActive]} onPress={() => setUnit(u)}>
                  <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>{UNIT_LABELS[u]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {qtyPreview && <Text style={styles.previewText}>{qtyPreview}</Text>}

          <Text style={styles.fieldLabel}>Calorias (opcional)</Text>
          <TextInput style={styles.input} value={cal} onChangeText={setCal} keyboardType="numeric" placeholder="ex: 89" placeholderTextColor={colors.muted} />

          <Text style={styles.fieldLabel}>Foto (opcional)</Text>
          <View style={styles.photoButtonsRow}>
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

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.sheetBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { reset(); onClose(); }} disabled={busy}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, busy && styles.confirmBtnDisabled]} onPress={handleSubmit} disabled={busy} activeOpacity={0.8}>
              {busy ? <ActivityIndicator color={colors.onPrimary} size="small" /> : <Text style={styles.confirmBtnText}>Registrar</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:              { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.md },
  sheetTitle:         { color: colors.text, fontSize: fontSize.xl, fontWeight: '900' },
  fieldLabel:         { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '700' },
  input:              { backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, color: colors.text, borderWidth: 1, borderColor: colors.border, fontSize: fontSize.md },
  qtyRow:             { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyInput:           { width: 90 },
  unitRow:            { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  previewText:        { color: colors.textSecondary, fontSize: fontSize.xs, fontStyle: 'italic', marginTop: spacing.xs },
  unitChip:           { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  unitChipActive:     { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  unitChipText:       { color: colors.muted, fontSize: fontSize.xs, fontWeight: '700' },
  unitChipTextActive: { color: colors.primary },
  photoButtonsRow:    { flexDirection: 'row', gap: spacing.sm },
  photoBtn:           { flex: 1, paddingVertical: spacing.sm, borderRadius: 12, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  photoBtnText:       { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  permissionError:    { color: colors.danger, fontSize: fontSize.xs, marginTop: spacing.xs },
  photoPreview:       { width: 80, height: 80, borderRadius: 8 },
  previewRow:         { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  removePhotoBtn:     { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  removePhotoText:    { color: colors.danger, fontSize: fontSize.sm, fontWeight: '700' },
  errorBox:           { backgroundColor: colors.danger + '12', borderWidth: 1, borderColor: colors.danger + '40', borderRadius: radius.md, padding: spacing.sm },
  errorText:          { color: colors.danger, fontSize: fontSize.sm, fontWeight: '600' },
  sheetBtns:          { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  cancelBtn:          { flex: 1, padding: spacing.md, borderRadius: 12, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cancelBtnText:      { color: colors.text, fontWeight: '600' },
  confirmBtn:         { flex: 1, padding: spacing.md, borderRadius: 12, alignItems: 'center', backgroundColor: colors.primary },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText:     { color: colors.onPrimary, fontWeight: '700' },
});
