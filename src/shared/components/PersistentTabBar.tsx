import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, usePathname, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Building2, Calendar, Home, Stethoscope, Trophy, TrendingUp, User, Users, UtensilsCrossed,
} from 'lucide-react-native';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { getTabMenuForRole, type TabIconKey } from '@/shared/navigation/tabs';
import { colors, fontSize, radius, spacing } from '@/shared/theme';

const ICON_SIZE = 22;

const ICON_BY_KEY: Record<TabIconKey, React.ElementType> = {
  home:         Home,
  nutrition:    UtensilsCrossed,
  progress:     TrendingUp,
  schedule:     Calendar,
  profile:      User,
  patients:     Users,
  ranking:      Trophy,
  nutritionists: Stethoscope,
  clinic:       Building2,
};

const ROUTE_TO_PATH: Record<string, string> = {
  home:          '/(tabs)/home',
  nutrition:     '/(tabs)/nutrition',
  progress:      '/(tabs)/progress',
  schedule:      '/(tabs)/schedule',
  profile:       '/(tabs)/profile',
  patients:      '/(tabs)/patients',
  ranking:       '/(tabs)/ranking',
  nutritionists: '/(tabs)/nutritionists',
  'clinic-settings': '/(tabs)/clinic-settings',
  'clinic-audit':    '/(tabs)/clinic-audit',
};

interface PersistentTabBarProps {
  activeTab?: string;
}

export function PersistentTabBar({ activeTab }: PersistentTabBarProps) {
  const { user } = useAuthContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  if (!user) return null;

  const tabs = getTabMenuForRole(user.role);
  const bottomPad = Math.max(insets.bottom, 10);

  const isActive = (route: string) => {
    if (activeTab) return route === activeTab;
    return pathname.includes(route);
  };

  return (
    <View style={[styles.bar, {
      height: 76 + bottomPad,
      paddingBottom: bottomPad,
    }]}>
      {tabs.map(tab => {
        const Icon = ICON_BY_KEY[tab.icon];
        const active = isActive(tab.route);
        const color = active ? colors.primary : colors.muted;

        return (
          <TouchableOpacity
            key={tab.route}
            style={[styles.item, active && styles.itemActive]}
            
            onPress={() => router.navigate((ROUTE_TO_PATH[tab.route] ?? `/(tabs)/${tab.route}`) as Href)}
            activeOpacity={0.7}
            accessibilityLabel={tab.accessibilityLabel}
          >
            <View style={styles.iconWrap}>
              <Icon size={ICON_SIZE} color={color} strokeWidth={active ? 2.6 : 2.1} />
              <View style={[styles.dot, active && styles.dotVisible]} />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.title}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 10,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    paddingVertical: 4,
    marginHorizontal: 1,
    borderRadius: radius.md,
    minHeight: 56,
    backgroundColor: colors.background,
  },
  itemActive: { backgroundColor: colors.surface },
  iconWrap: {
    width: 36, height: 32,
    alignItems: 'center', justifyContent: 'center',
    gap: 2,
  },
  dot:        { width: 4, height: 4, borderRadius: radius.full, backgroundColor: 'transparent' },
  dotVisible: { backgroundColor: colors.primary },
  label:      { fontSize: 10, lineHeight: 13, fontWeight: '800', color: colors.muted, letterSpacing: 0 },
  labelActive: { color: colors.primary },
});
