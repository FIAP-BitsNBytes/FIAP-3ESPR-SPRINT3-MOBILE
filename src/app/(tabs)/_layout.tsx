import { Tabs, Redirect } from 'expo-router';
import {
  Building2,
  Calendar,
  Home,
  Stethoscope,
  Trophy,
  TrendingUp,
  User,
  Users,
  UtensilsCrossed,
} from 'lucide-react-native';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '@/features/auth';
import { colors, radius, spacing } from '@/shared/theme';
import {
  getHiddenTabRoutes,
  getTabMenuForRole,
  TabIconKey,
  TabMenuItem,
  TabRoute,
} from '@/shared/navigation/tabs';

const ICON_SIZE = 22;
const HIDDEN = { href: null } as const;

const ICON_BY_KEY = {
  home: Home,
  nutrition: UtensilsCrossed,
  progress: TrendingUp,
  schedule: Calendar,
  profile: User,
  patients: Users,
  ranking: Trophy,
  nutritionists: Stethoscope,
  clinic: Building2,
} satisfies Record<TabIconKey, typeof Home>;

function TabIcon({ iconKey, color, focused }: { iconKey: TabIconKey; color: string; focused: boolean }) {
  const Icon = ICON_BY_KEY[iconKey];

  return (
    <View style={styles.iconShell}>
      <Icon size={ICON_SIZE} color={color} strokeWidth={focused ? 2.6 : 2.1} />
      <View style={[styles.activeDot, focused && styles.activeDotVisible]} />
    </View>
  );
}

function useTabScreenOptions() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarHideOnKeyboard: true,
    tabBarStyle: {
      height: 76 + bottomPad,
      paddingTop: 10,
      paddingBottom: bottomPad,
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
    tabBarItemStyle: {
      minHeight: 56,
      borderRadius: radius.md,
      paddingVertical: 4,
      marginHorizontal: 1,
    },
    tabBarActiveBackgroundColor: colors.surface,
    tabBarInactiveBackgroundColor: colors.background,
    tabBarLabelStyle: {
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '800' as const,
      marginTop: Platform.OS === 'ios' ? 2 : 1,
      paddingBottom: 0,
      letterSpacing: 0,
      includeFontPadding: false,
    },
  };
}

function buildScreenOptions(item: TabMenuItem) {
  return {
    title: item.title,
    tabBarAccessibilityLabel: item.accessibilityLabel,
    tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
      <TabIcon iconKey={item.icon} color={color} focused={focused} />
    ),
  };
}

function RoleTabs({ patientId }: { patientId?: string }) {
  const { user } = useAuthContext();
  const role = user?.role ?? 'PATIENT';
  const screenOptions = useTabScreenOptions();
  const visibleTabs = getTabMenuForRole(role);
  const hiddenTabs = getHiddenTabRoutes(role);

  return (
    <Tabs screenOptions={screenOptions}>
      {visibleTabs.map(item => (
        <Tabs.Screen
          key={item.route}
          name={item.route}
          initialParams={item.route === 'progress' && patientId ? { patientId } : undefined}
          options={buildScreenOptions(item)}
        />
      ))}
      {hiddenTabs.map(route => (
        <Tabs.Screen key={route} name={route satisfies TabRoute} options={HIDDEN} />
      ))}
    </Tabs>
  );
}

export default function TabLayout() {
  const { user, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;
  return <RoleTabs patientId={user.role === 'PATIENT' ? user.id : undefined} />;
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  iconShell: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: 'transparent',
  },
  activeDotVisible: {
    backgroundColor: colors.primary,
  },
});
