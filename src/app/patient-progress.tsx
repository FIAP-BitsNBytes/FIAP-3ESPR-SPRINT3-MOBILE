import { View } from 'react-native';
import { NutritionistPatientDetailScreen } from '@/features/nutritionist/screens/PatientDetailScreen';
import { PersistentTabBar } from '@/shared/components/PersistentTabBar';

export default function PatientProgressRoute() {
  return (
    <View style={{ flex: 1 }}>
      <NutritionistPatientDetailScreen />
      <PersistentTabBar activeTab="patients" />
    </View>
  );
}
