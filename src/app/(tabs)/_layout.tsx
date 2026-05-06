import { Tabs, Redirect } from 'expo-router';
import {
  Home, UtensilsCrossed, Calendar, User,
  Users, Trophy, LayoutDashboard, Stethoscope,
} from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';
import { useAuthContext } from '@/features/auth';
import { colors } from '@/shared/theme';

const SCREEN_OPTIONS = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 60,
    paddingBottom: 8,
  },
};

const HIDDEN = { href: null } as const;

function PatientTabs() {
  return (
    <Tabs screenOptions={SCREEN_OPTIONS}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrição', tabBarIcon: ({ color }) => <UtensilsCrossed size={22} color={color} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Agenda', tabBarIcon: ({ color }) => <Calendar size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
      <Tabs.Screen name="index" options={HIDDEN} />
      <Tabs.Screen name="patients" options={HIDDEN} />
      <Tabs.Screen name="ranking" options={HIDDEN} />
      <Tabs.Screen name="nutritionists" options={HIDDEN} />
    </Tabs>
  );
}

function NutritionistTabs() {
  return (
    <Tabs screenOptions={SCREEN_OPTIONS}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="patients" options={{ title: 'Pacientes', tabBarIcon: ({ color }) => <Users size={22} color={color} /> }} />
      <Tabs.Screen name="ranking" options={{ title: 'Ranking', tabBarIcon: ({ color }) => <Trophy size={22} color={color} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Agenda', tabBarIcon: ({ color }) => <Calendar size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
      <Tabs.Screen name="index" options={HIDDEN} />
      <Tabs.Screen name="nutrition" options={HIDDEN} />
      <Tabs.Screen name="nutritionists" options={HIDDEN} />
    </Tabs>
  );
}

function AdminTabs() {
  return (
    <Tabs screenOptions={SCREEN_OPTIONS}>
      <Tabs.Screen name="home" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} /> }} />
      <Tabs.Screen name="nutritionists" options={{ title: 'Nutricionistas', tabBarIcon: ({ color }) => <Stethoscope size={22} color={color} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Agenda', tabBarIcon: ({ color }) => <Calendar size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
      <Tabs.Screen name="index" options={HIDDEN} />
      <Tabs.Screen name="nutrition" options={HIDDEN} />
      <Tabs.Screen name="patients" options={HIDDEN} />
      <Tabs.Screen name="ranking" options={HIDDEN} />
    </Tabs>
  );
}

export default function TabLayout() {
  const { user, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role === 'NUTRITIONIST') return <NutritionistTabs />;
  if (user.role === 'ADMIN') return <AdminTabs />;
  return <PatientTabs />;
}
