import { Tabs, Redirect } from 'expo-router';
import {
  Home, UtensilsCrossed, Calendar, User,
  Users, Trophy, LayoutDashboard, Stethoscope, TrendingUp, Building2
} from 'lucide-react-native';
import { ActivityIndicator, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '@/features/auth';
import { colors } from '@/shared/theme';

const ICON_SIZE = 22;

function useTabScreenOptions() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      height: 56 + bottomPad,
      paddingBottom: bottomPad,
      paddingTop: 8,
      elevation: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: '600' as const,
      marginTop: Platform.OS === 'ios' ? 0 : 2,
    },
  };
}

const HIDDEN = { href: null } as const;

function PatientTabs({ patientId }: { patientId: string }) {
  const screenOptions = useTabScreenOptions();
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrição', tabBarIcon: ({ color }) => <UtensilsCrossed size={ICON_SIZE} color={color} /> }} />
      <Tabs.Screen
        name="progress"
        initialParams={{ patientId }}
        options={{ title: 'Progresso', tabBarIcon: ({ color }) => <TrendingUp size={ICON_SIZE} color={color} /> }}
      />
      <Tabs.Screen name="schedule" options={{ title: 'Agenda', tabBarIcon: ({ color }) => <Calendar size={ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <User size={ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="index" options={HIDDEN} />
      <Tabs.Screen name="patients" options={HIDDEN} />
      <Tabs.Screen name="ranking" options={HIDDEN} />
      <Tabs.Screen name="nutritionists" options={HIDDEN} />
      <Tabs.Screen name="clinic-settings" options={HIDDEN} />
      <Tabs.Screen name="clinic-audit" options={HIDDEN} />
    </Tabs>
  );
}

function NutritionistTabs() {
  const screenOptions = useTabScreenOptions();
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="patients" options={{ title: 'Pacientes', tabBarIcon: ({ color }) => <Users size={ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="ranking" options={{ title: 'Ranking', tabBarIcon: ({ color }) => <Trophy size={ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Agenda', tabBarIcon: ({ color }) => <Calendar size={ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <User size={ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="index" options={HIDDEN} />
      <Tabs.Screen name="nutrition" options={HIDDEN} />
      <Tabs.Screen name="progress" options={HIDDEN} />
      <Tabs.Screen name="nutritionists" options={HIDDEN} />
      <Tabs.Screen name="clinic-settings" options={HIDDEN} />
      <Tabs.Screen name="clinic-audit" options={HIDDEN} />
    </Tabs>
  );
}

function AdminTabs() {
  const screenOptions = useTabScreenOptions();
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="home" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <LayoutDashboard size={ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="nutritionists" options={{ title: 'Nutricionistas', tabBarIcon: ({ color }) => <Stethoscope size={ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="clinic-settings" options={{ title: 'Clínica', tabBarIcon: ({ color }) => <Building2 size={ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Agenda', tabBarIcon: ({ color }) => <Calendar size={ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <User size={ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="index" options={HIDDEN} />
      <Tabs.Screen name="nutrition" options={HIDDEN} />
      <Tabs.Screen name="progress" options={HIDDEN} />
      <Tabs.Screen name="patients" options={HIDDEN} />
      <Tabs.Screen name="ranking" options={HIDDEN} />
      <Tabs.Screen name="clinic-audit" options={HIDDEN} />
    </Tabs>
  );
}

export default function TabLayout() {
  const { user, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role === 'NUTRITIONIST') return <NutritionistTabs />;
  if (user.role === 'ADMIN') return <AdminTabs />;
  return <PatientTabs patientId={user.id} />;
}
