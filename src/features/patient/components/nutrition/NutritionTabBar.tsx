import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Droplets, Utensils } from 'lucide-react-native';
import { colors, fontSize, spacing } from '@/shared/theme';

export type Tab = 'plan' | 'extras';

interface NutritionTabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function NutritionTabBar({ active, onChange }: NutritionTabBarProps) {
  return (
    <View style={styles.tabBar}>
      {(['plan', 'extras'] as Tab[]).map(tab => (
        <TouchableOpacity
          key={tab}
          style={[styles.tabItem, active === tab && styles.tabItemActive]}
          onPress={() => onChange(tab)}
          activeOpacity={0.8}
        >
          {tab === 'plan'
            ? <Utensils size={14} color={active === tab ? colors.primary : colors.muted} />
            : <Droplets size={14} color={active === tab ? colors.primary : colors.muted} />}
          <Text style={[styles.tabText, active === tab && styles.tabTextActive]}>
            {tab === 'plan' ? 'Meu Plano' : 'Água & Extra'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar:        { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  tabItem:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabItemActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary + '55' },
  tabText:       { fontSize: fontSize.xs, fontWeight: '700', color: colors.muted },
  tabTextActive: { color: colors.primary },
});
