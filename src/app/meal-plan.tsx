import { useLocalSearchParams } from 'expo-router';
import { PlanDetailScreen } from '@/features/nutrition/screens/PlanDetailScreen';

export default function MealPlanRoute() {
  const { patientId, name } = useLocalSearchParams<{ patientId: string; name: string }>();
  return <PlanDetailScreen patientId={patientId ?? ''} patientName={name} />;
}
