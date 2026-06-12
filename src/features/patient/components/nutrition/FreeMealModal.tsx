import { useState } from 'react';
import {
  Modal, ScrollView, TextInput, View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Image,
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

  const reset = () => {
    setFoodName('');
    setQty('');
    setUnit('GRAMS');
    setCal('');
    clearAsset();
  };

  const handleSubmit = async () => {
    if (!foodName.trim()) {
      Alert.alert('Obrigatório', 'Informe o nome do alimento.');
      return;
    }
    const parsed = parseFloat(qty);
    if (!qty || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Quantidade inválida', 'Informe uma quantidade maior que zero.');
      return;
    }

    let photoPath: string | null = null;

    if (asset && user?.id) {
      const uploadResult = await uploadMealPhoto(user.id, asset.uri);
      if ('path' in uploadResult) {
        photoPath = uploadResult.path;
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
  };

  const units: MeasurementUnit[] = ['GRAMS', 'MILLILITERS', 'UNITS', 'PORTIONS', 'CALORIES'];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { reset(); onClose(); }}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Refeição livre</Text>

          <Text style={styles.fieldLabel}>Alimento</Text>
          <TextInput style={styles.input} value={foodName} onChangeText={setFoodName} placeholder="ex: Banana" placeholderTextColor={colors.muted} />

          <Text style={styles.fieldLabel}>Quantidade</Text>
          <TextInput style={styles.input} value={qty} onChangeText={setQty} keyboardType="numeric" placeholder="ex: 150" placeholderTextColor={colors.muted} />

          <Text style={styles.fieldLabel}>Unidade</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {units.map(u => (
                <TouchableOpacity key={u} style={[styles.unitChip, unit === u && styles.unitChipActive]} onPress={() => setUnit(u)}>
                  <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>{UNIT_LABELS[u]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.fieldLabel}>Calorias (opcional)</Text>
          <TextInput style={styles.input} value={cal} onChangeText={setCal} keyboardType="numeric" placeholder="ex: 89" placeholderTextColor={colors.muted} />

          <Text style={styles.fieldLabel}>Foto (opcional)</Text>
          <View style={styles.photoButtonsRow}>
            <TouchableOpacity style={styles.photoBtn} onPress={pickFromCamera} disabled={isLogging}>
              <Text style={styles.photoBtnText}>📷 Câmera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery} disabled={isLogging}>
              <Text style={styles.photoBtnText}>🖼 Galeria</Text>
            </TouchableOpacity>
          </View>

          {status === 'denied' && (
            <Text style={styles.permissionError}>Permissão negada. Use a galeria.</Text>
          )}

          {asset && (
            <Image source={{ uri: asset.uri }} style={styles.photoPreview} />
          )}

          <View style={styles.sheetBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { reset(); onClose(); }} disabled={isLogging}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleSubmit} disabled={isLogging} activeOpacity={0.8}>
              {isLogging ? <ActivityIndicator color={colors.onPrimary} size="small" /> : <Text style={styles.confirmBtnText}>Registrar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:              { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.md },
  sheetTitle:         { color: colors.text, fontSize: fontSize.xl, fontWeight: '900' },
  fieldLabel:         { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '700' },
  input:              { backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, color: colors.text, borderWidth: 1, borderColor: colors.border, fontSize: fontSize.md },
  unitChip:           { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  unitChipActive:     { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  unitChipText:       { color: colors.muted, fontSize: fontSize.xs, fontWeight: '700' },
  unitChipTextActive: { color: colors.primary },
  photoButtonsRow:    { flexDirection: 'row', gap: spacing.sm },
  photoBtn:           { flex: 1, paddingVertical: spacing.sm, borderRadius: 12, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  photoBtnText:       { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  permissionError:    { color: colors.danger, fontSize: fontSize.xs, marginTop: spacing.xs },
  photoPreview:       { width: 80, height: 80, borderRadius: 8, marginTop: spacing.sm },
  sheetBtns:          { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  cancelBtn:          { flex: 1, padding: spacing.md, borderRadius: 12, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cancelBtnText:      { color: colors.text, fontWeight: '600' },
  confirmBtn:         { flex: 1, padding: spacing.md, borderRadius: 12, alignItems: 'center', backgroundColor: colors.primary },
  confirmBtnText:     { color: colors.onPrimary, fontWeight: '700' },
});
