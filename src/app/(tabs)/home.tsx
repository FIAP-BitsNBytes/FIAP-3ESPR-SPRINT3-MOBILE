import { useAuthContext } from '@/features/auth';
import { PatientHomeScreen } from '@/features/patient';
import { NutritionistHomeScreen } from '@/features/nutritionist';
import { AdminDashboardScreen } from '@/features/admin';

export default function HomeRoute() {
  const { user } = useAuthContext();
  if (user?.role === 'NUTRITIONIST') return <NutritionistHomeScreen />;
  if (user?.role === 'ADMIN') return <AdminDashboardScreen />;
  return <PatientHomeScreen />;
}
