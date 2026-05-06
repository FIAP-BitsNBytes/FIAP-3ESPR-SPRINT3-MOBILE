import { useAuthContext } from '@/features/auth';
import { PatientHomeScreen } from '@/features/patient/screens/HomeScreen';
import { NutritionistHomeScreen } from '@/features/nutritionist/screens/HomeScreen';
import { AdminDashboardScreen } from '@/features/admin/screens/DashboardScreen';

export default function HomeRoute() {
  const { user } = useAuthContext();
  if (user?.role === 'NUTRITIONIST') return <NutritionistHomeScreen />;
  if (user?.role === 'ADMIN') return <AdminDashboardScreen />;
  return <PatientHomeScreen />;
}
