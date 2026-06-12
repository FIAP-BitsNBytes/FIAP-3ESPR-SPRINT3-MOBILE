import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Droplets } from 'lucide-react-native';
import { appStyles, colors, fontSize, radius, spacing } from '@/shared/theme';
import { WaterBar } from './WaterBar';

const WATER_GOAL_ML = 2500;
const WATER_INCREMENTS_ML = [250, 500, 750, 1000];

interface WaterSectionProps {
  waterMl: number;
  isLogging: boolean;
  onLogWater: (ml: number) => void;
  /** When true, shows a compact "via SmartBottle (IoT)" indicator below the water total. */
  hasIotEntries?: boolean;
}

export function WaterSection({ waterMl, isLogging, onLogWater, hasIotEntries = false }: WaterSectionProps) {
  return (
    <View style={appStyles.dashboardCard}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.waterAccent + '22' }]}>
          <Droplets size={18} color={colors.waterAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>Água</Text>
            {hasIotEntries && (
              <View style={styles.iotBadge}>
                <Text style={styles.iotBadgeText}>IoT</Text>
              </View>
            )}
          </View>
          <Text style={styles.sectionSub}>
            {waterMl}ml / {WATER_GOAL_ML}ml · {Math.round(Math.min((waterMl / WATER_GOAL_ML) * 100, 100))}%
          </Text>
          {hasIotEntries && (
            <Text style={styles.iotSub}>via SmartBottle (IoT)</Text>
          )}
        </View>
      </View>
      <WaterBar waterMl={waterMl} />
      <View style={styles.waterBtns}>
        {WATER_INCREMENTS_ML.map(ml => (
          <TouchableOpacity
            key={ml}
            style={[styles.waterBtn, isLogging && styles.btnDisabled]}
            onPress={() => onLogWater(ml)}
            disabled={isLogging}
            activeOpacity={0.7}
          >
            {isLogging
              ? <ActivityIndicator size="small" color={colors.waterAccent} />
              : <Text style={styles.waterBtnText}>+{ml}ml</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  sectionIcon:   { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sectionTitle:  { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  sectionSub:    { color: colors.muted, fontSize: fontSize.xs },
  iotBadge:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.waterAccent + '22', borderWidth: 1, borderColor: colors.waterAccent + '55' },
  iotBadgeText:  { color: colors.waterAccent, fontSize: 10, fontWeight: '700', lineHeight: 14 },
  iotSub:        { color: colors.waterAccent, fontSize: 10, marginTop: 1 },
  waterBtns:     { flexDirection: 'row', gap: spacing.xs },
  waterBtn:      { flex: 1, paddingVertical: spacing.xs, borderRadius: 12, backgroundColor: colors.waterAccent + '18', borderWidth: 1, borderColor: colors.waterAccent + '44', alignItems: 'center' },
  waterBtnText:  { color: colors.waterAccent, fontSize: fontSize.xs, fontWeight: '700' },
  btnDisabled:   { opacity: 0.5 },
});
