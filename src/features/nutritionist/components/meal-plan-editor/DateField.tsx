import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { appStyles, colors, fontSize, radius, spacing } from '@/shared/theme';
import { isoToParts, partsToIso } from './dateParts';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  optional?: boolean;
}

/**
 * Three-input (DD / MM / AAAA) date picker that emits a full ISO
 * `YYYY-MM-DD` string via `onChange` once all three parts are valid.
 */
export function DateField({ label, value, onChange, optional }: DateFieldProps) {
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
    <View style={styles.dateFieldWrap}>
      <View style={styles.dateFieldLabelRow}>
        <Calendar size={13} color={colors.muted} />
        <Text style={appStyles.fieldLabel}>{label}{optional ? ' (opcional)' : ' *'}</Text>
      </View>
      <View style={styles.dateRow}>
        <View style={styles.datePartSm}>
          <TextInput
            style={styles.dateInput}
            placeholder="DD"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            maxLength={2}
            value={d}
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
        <View style={styles.datePartSm}>
          <TextInput
            ref={refM}
            style={styles.dateInput}
            placeholder="MM"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            maxLength={2}
            value={m}
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
        <View style={styles.datePartLg}>
          <TextInput
            ref={refY}
            style={styles.dateInput}
            placeholder="AAAA"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            maxLength={4}
            value={y}
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

const styles = StyleSheet.create({
  dateFieldWrap:    { gap: spacing.xs },
  dateFieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  datePartSm: { width: 60, alignItems: 'center', gap: 2 },
  datePartLg: { width: 84, alignItems: 'center', gap: 2 },
  dateInput: {
    width: '100%', backgroundColor: colors.surface, borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
    color: colors.text, borderWidth: 1, borderColor: colors.border,
    fontSize: fontSize.md, fontWeight: '700', textAlign: 'center',
  },
  datePartLabel: { color: colors.muted, fontSize: 9, fontWeight: '600', textTransform: 'uppercase' },
  dateSep:       { color: colors.muted, fontSize: fontSize.lg, fontWeight: '300', marginBottom: 14 },
});
