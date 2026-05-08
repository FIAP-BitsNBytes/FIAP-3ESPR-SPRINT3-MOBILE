import { View } from 'react-native';
import { NutritionistPatientsScreen } from '@/features/admin/screens/NutritionistPatientsScreen';
import { PersistentTabBar } from '@/shared/components/PersistentTabBar';

export default function NutritionistPatientsRoute() {
  return (
    <View style={{ flex: 1 }}>
      <NutritionistPatientsScreen />
      <PersistentTabBar activeTab="patients" />
    </View>
  );
}
