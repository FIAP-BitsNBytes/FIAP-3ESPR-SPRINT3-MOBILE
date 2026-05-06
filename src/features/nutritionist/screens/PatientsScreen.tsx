import { FlatList, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PatientCard } from '@/shared/components/ui/PatientCard';
import { colors, spacing, fontSize } from '@/shared/theme';

const MOCK_PATIENTS = [
  { id: '1', name: 'Carlos Silva', level: 2, streakDays: 5, points: 380 },
  { id: '2', name: 'Ana Souza', level: 1, streakDays: 12, points: 640 },
  { id: '3', name: 'Pedro Lima', level: 3, streakDays: 0, points: 200 },
  { id: '4', name: 'Mariana Costa', level: 4, streakDays: 21, points: 1200 },
];

export function NutritionistPatientsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={MOCK_PATIENTS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Meus Pacientes</Text>}
        renderItem={({ item }) => <PatientCard {...item} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800', marginBottom: spacing.md },
});
