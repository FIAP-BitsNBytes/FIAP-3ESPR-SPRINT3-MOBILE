# NutriApp Layout Mobile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar navegação mobile role-aware (PATIENT / NUTRITIONIST / ADMIN) com design system gamificado e telas base para cada role.

**Architecture:** Bottom tab navigation condicional por role via `useAuthContext`. Design tokens centralizados em `src/shared/theme`. Cada role tem sua feature folder em `src/features/<role>/screens/`. Telas compartilhadas (schedule, profile) ficam em `src/features/shared/screens/`.

**Tech Stack:** Expo Router 6, React Native, TypeScript, lucide-react-native (ícones), @supabase/supabase-js (dados), design tokens próprios.

**Spec:** `docs/superpowers/specs/2026-05-06-nutriapp-layout-design.md`

---

## File Map

### Criar
| Arquivo | Responsabilidade |
|---|---|
| `src/shared/theme/index.ts` | Design tokens: cores, tipografia, espaçamento |
| `src/shared/components/gamification/XPProgressBar.tsx` | Barra de XP com label de nível |
| `src/shared/components/gamification/StreakBadge.tsx` | Badge de streak com ícone de chama |
| `src/shared/components/gamification/LevelCard.tsx` | Card de nível + título + barra de XP |
| `src/shared/components/ui/StatCard.tsx` | Card numérico para dashboards |
| `src/shared/components/ui/AppointmentCard.tsx` | Card de consulta com status colorido |
| `src/shared/components/ui/PatientCard.tsx` | Card de paciente com streak e nível |
| `src/features/patient/screens/HomeScreen.tsx` | Dashboard gamificado do paciente |
| `src/features/patient/screens/NutritionScreen.tsx` | Tabela de nutrição diária |
| `src/features/nutritionist/screens/HomeScreen.tsx` | Dashboard do nutricionista |
| `src/features/nutritionist/screens/PatientsScreen.tsx` | Lista de pacientes vinculados |
| `src/features/nutritionist/screens/RankingScreen.tsx` | Ranking gamificado de pacientes |
| `src/features/admin/screens/DashboardScreen.tsx` | Métricas globais do admin |
| `src/features/admin/screens/NutritionistsScreen.tsx` | Gestão de nutricionistas |
| `src/features/shared/screens/ScheduleScreen.tsx` | Agenda filtrada por role |
| `src/features/shared/screens/ProfileScreen.tsx` | Perfil do usuário |
| `src/app/(tabs)/home.tsx` | Rota home (renderiza por role) |
| `src/app/(tabs)/nutrition.tsx` | Rota nutrição (patient) |
| `src/app/(tabs)/patients.tsx` | Rota pacientes (nutritionist) |
| `src/app/(tabs)/ranking.tsx` | Rota ranking (nutritionist) |
| `src/app/(tabs)/nutritionists.tsx` | Rota nutricionistas (admin) |
| `src/app/(tabs)/schedule.tsx` | Rota agenda (shared) |
| `src/app/(tabs)/profile.tsx` | Rota perfil (shared) |

### Modificar
| Arquivo | Mudança |
|---|---|
| `src/app/(tabs)/_layout.tsx` | Substituir por tab bar role-aware |
| `src/app/(tabs)/index.tsx` | Redirecionar para `/(tabs)/home` |

### Remover
| Arquivo | Motivo |
|---|---|
| `src/app/(tabs)/two.tsx` | Placeholder de template não utilizado |

---

## Task 1: Instalar dependências e criar design tokens

**Files:**
- Modify: `package.json`
- Create: `src/shared/theme/index.ts`

- [ ] **Step 1: Instalar lucide-react-native**

```bash
npx expo install lucide-react-native
```

Expected: pacote adicionado sem erros.

- [ ] **Step 2: Criar tokens de design**

Criar `src/shared/theme/index.ts`:

```typescript
export const colors = {
  primary: '#F97316',
  secondary: '#FB923C',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#FBBF24',
  background: '#1F2937',
  surface: '#374151',
  surfaceHigh: '#4B5563',
  text: '#F8FAFC',
  muted: '#9CA3AF',
  border: '#4B5563',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/shared/theme/index.ts package.json package-lock.json
git commit -m "feat: add design tokens and install lucide-react-native"
```

---

## Task 2: Componentes de Gamificação

**Files:**
- Create: `src/shared/components/gamification/XPProgressBar.tsx`
- Create: `src/shared/components/gamification/StreakBadge.tsx`
- Create: `src/shared/components/gamification/LevelCard.tsx`

- [ ] **Step 1: Criar XPProgressBar**

Criar `src/shared/components/gamification/XPProgressBar.tsx`:

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

interface XPProgressBarProps {
  currentXP: number;
  maxXP: number;
  level: number;
}

export function XPProgressBar({ currentXP, maxXP, level }: XPProgressBarProps) {
  const progress = Math.min(currentXP / maxXP, 1);

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={styles.levelText}>Nível {level}</Text>
        <Text style={styles.xpText}>{currentXP}/{maxXP} XP</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` as `${number}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  levelText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  xpText: { color: colors.muted, fontSize: fontSize.xs },
  track: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
});
```

- [ ] **Step 2: Criar StreakBadge**

Criar `src/shared/components/gamification/StreakBadge.tsx`:

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

interface StreakBadgeProps {
  days: number;
}

export function StreakBadge({ days }: StreakBadgeProps) {
  const flameColor = days >= 7 ? colors.success : days > 0 ? colors.primary : colors.muted;

  return (
    <View style={styles.container}>
      <Flame size={20} color={flameColor} />
      <Text style={[styles.days, { color: flameColor }]}>{days}</Text>
      <Text style={styles.label}>dias</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  days: { fontSize: fontSize.md, fontWeight: '700' },
  label: { fontSize: fontSize.sm, color: colors.muted },
});
```

- [ ] **Step 3: Criar LevelCard**

Criar `src/shared/components/gamification/LevelCard.tsx`:

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { XPProgressBar } from './XPProgressBar';
import { StreakBadge } from './StreakBadge';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

const LEVEL_TITLES: Record<number, string> = {
  1: 'Iniciante',
  2: 'Aprendiz',
  3: 'Praticante',
  4: 'Guerreiro Nutricional',
  5: 'Mestre da Saúde',
};

interface LevelCardProps {
  level: number;
  currentXP: number;
  maxXP: number;
  streakDays: number;
  name: string;
}

export function LevelCard({ level, currentXP, maxXP, streakDays, name }: LevelCardProps) {
  const title = LEVEL_TITLES[level] ?? `Nível ${level}`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {name.split(' ')[0]}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.levelBadge}>
          <Star size={16} color={colors.primary} />
          <Text style={styles.levelNum}>{level}</Text>
        </View>
      </View>
      <XPProgressBar currentXP={currentXP} maxXP={maxXP} level={level} />
      <View style={styles.streak}>
        <StreakBadge days={streakDays} />
        <Text style={styles.streakLabel}>sequência atual</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: colors.muted, fontSize: fontSize.sm },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  levelBadge: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.full,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  levelNum: { color: colors.primary, fontWeight: '700', fontSize: fontSize.md },
  streak: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  streakLabel: { color: colors.muted, fontSize: fontSize.sm },
});
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/gamification/
git commit -m "feat: add gamification components (XPProgressBar, StreakBadge, LevelCard)"
```

---

## Task 3: Componentes UI Compartilhados

**Files:**
- Create: `src/shared/components/ui/StatCard.tsx`
- Create: `src/shared/components/ui/AppointmentCard.tsx`
- Create: `src/shared/components/ui/PatientCard.tsx`

- [ ] **Step 1: Criar StatCard**

Criar `src/shared/components/ui/StatCard.tsx`:

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  color?: string;
}

export function StatCard({ label, value, Icon, color = colors.primary }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  label: { color: colors.muted, fontSize: fontSize.xs },
});
```

- [ ] **Step 2: Criar AppointmentCard**

Criar `src/shared/components/ui/AppointmentCard.tsx`:

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

interface AppointmentCardProps {
  patientName?: string;
  nutritionistName?: string;
  scheduledAt: string;
  status: AppointmentStatus;
  type?: string;
}

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  PENDING: colors.warning,
  CONFIRMED: colors.success,
  CANCELLED: colors.danger,
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
};

export function AppointmentCard({ patientName, nutritionistName, scheduledAt, status, type }: AppointmentCardProps) {
  const date = new Date(scheduledAt);
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const statusColor = STATUS_COLOR[status];

  return (
    <View style={styles.card}>
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
      <View style={styles.content}>
        <View style={styles.row}>
          <Calendar size={16} color={colors.muted} />
          <Text style={styles.datetime}>{dateStr} às {timeStr}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{STATUS_LABEL[status]}</Text>
          </View>
        </View>
        {patientName && <Text style={styles.name}>{patientName}</Text>}
        {nutritionistName && <Text style={styles.name}>{nutritionistName}</Text>}
        {type && <Text style={styles.type}>{type}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  statusBar: { width: 4 },
  content: { flex: 1, padding: spacing.md, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  datetime: { color: colors.muted, fontSize: fontSize.sm, flex: 1 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600' },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  type: { color: colors.muted, fontSize: fontSize.sm },
});
```

- [ ] **Step 3: Criar PatientCard**

Criar `src/shared/components/ui/PatientCard.tsx`:

```typescript
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Flame, Star, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

interface PatientCardProps {
  name: string;
  level: number;
  streakDays: number;
  points: number;
  onPress?: () => void;
}

export function PatientCard({ name, level, streakDays, points, onPress }: PatientCardProps) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.stats}>
          <Flame size={14} color={streakDays > 0 ? colors.primary : colors.muted} />
          <Text style={styles.stat}>{streakDays}d</Text>
          <Star size={14} color={colors.warning} />
          <Text style={styles.stat}>Nv.{level}</Text>
          <Text style={styles.stat}>{points}pts</Text>
        </View>
      </View>
      <ChevronRight size={20} color={colors.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: { color: colors.primary, fontWeight: '700', fontSize: fontSize.md },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  stats: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  stat: { color: colors.muted, fontSize: fontSize.xs },
});
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/ui/
git commit -m "feat: add shared UI components (StatCard, AppointmentCard, PatientCard)"
```

---

## Task 4: Tab Navigation Role-Aware

**Files:**
- Modify: `src/app/(tabs)/_layout.tsx`
- Modify: `src/app/(tabs)/index.tsx`

- [ ] **Step 1: Substituir `(tabs)/_layout.tsx` completamente**

Reescrever `src/app/(tabs)/_layout.tsx`:

```typescript
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
```

- [ ] **Step 2: Atualizar `index.tsx`**

Reescrever `src/app/(tabs)/index.tsx`:

```typescript
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)/home" />;
}
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/(tabs)/_layout.tsx src/app/(tabs)/index.tsx
git commit -m "feat: role-aware tab navigation for PATIENT, NUTRITIONIST, ADMIN"
```

---

## Task 5: Telas do Paciente

**Files:**
- Create: `src/features/patient/screens/HomeScreen.tsx`
- Create: `src/features/patient/screens/NutritionScreen.tsx`
- Create: `src/app/(tabs)/home.tsx`
- Create: `src/app/(tabs)/nutrition.tsx`

- [ ] **Step 1: Criar PatientHomeScreen**

Criar `src/features/patient/screens/HomeScreen.tsx`:

```typescript
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, TrendingUp } from 'lucide-react-native';
import { LevelCard } from '@/shared/components/gamification/LevelCard';
import { colors, spacing, radius, fontSize } from '@/shared/theme';
import { useAuthContext } from '@/features/auth';

export function PatientHomeScreen() {
  const { user } = useAuthContext();
  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <LevelCard name={user.name} level={1} currentXP={120} maxXP={500} streakDays={3} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meta do Dia</Text>
          <View style={styles.goalCard}>
            <Text style={styles.goalPercent}>45%</Text>
            <Text style={styles.goalLabel}>das calorias registradas</Text>
            <Text style={styles.goalSub}>900 / 2000 kcal</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} accessibilityRole="button">
            <Plus size={20} color={colors.background} />
            <Text style={styles.actionText}>Registrar Refeição</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionSecondary]} accessibilityRole="button">
            <TrendingUp size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Ver Evolução</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  goalPercent: { color: colors.primary, fontSize: 48, fontWeight: '800' },
  goalLabel: { color: colors.muted, fontSize: fontSize.sm },
  goalSub: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  actions: { gap: spacing.sm },
  actionBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  actionSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionText: { color: colors.background, fontSize: fontSize.md, fontWeight: '600' },
});
```

- [ ] **Step 2: Criar PatientNutritionScreen**

Criar `src/features/patient/screens/NutritionScreen.tsx`:

```typescript
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

const MEALS = [
  { name: 'Café da Manhã', calories: 350, protein: 20, carbs: 45, fat: 10 },
  { name: 'Almoço', calories: 550, protein: 35, carbs: 60, fat: 15 },
  { name: 'Lanche', calories: 200, protein: 8, carbs: 25, fat: 6 },
  { name: 'Jantar', calories: 0, protein: 0, carbs: 0, fat: 0 },
];

export function PatientNutritionScreen() {
  const total = MEALS.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Hoje</Text>

        <View style={styles.macroRow}>
          {[
            { label: 'Calorias', value: `${total.calories}kcal`, color: colors.primary },
            { label: 'Proteína', value: `${total.protein}g`, color: colors.success },
            { label: 'Carbs', value: `${total.carbs}g`, color: colors.warning },
            { label: 'Gordura', value: `${total.fat}g`, color: colors.secondary },
          ].map(({ label, value, color }) => (
            <View key={label} style={styles.macroCard}>
              <Text style={[styles.macroValue, { color }]}>{value}</Text>
              <Text style={styles.macroLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {MEALS.map((meal) => (
          <View key={meal.name} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealCal}>{meal.calories} kcal</Text>
            </View>
            {meal.calories === 0 ? (
              <Text style={styles.mealEmpty}>Nenhum registro</Text>
            ) : (
              <Text style={styles.mealMacros}>P: {meal.protein}g · C: {meal.carbs}g · G: {meal.fat}g</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
  macroRow: { flexDirection: 'row', gap: spacing.sm },
  macroCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  macroValue: { fontSize: fontSize.sm, fontWeight: '700' },
  macroLabel: { color: colors.muted, fontSize: fontSize.xs },
  mealCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  mealName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  mealCal: { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },
  mealEmpty: { color: colors.muted, fontSize: fontSize.sm },
  mealMacros: { color: colors.muted, fontSize: fontSize.sm },
});
```

- [ ] **Step 3: Criar rotas — `home.tsx` (renderiza por role) e `nutrition.tsx`**

Criar `src/app/(tabs)/home.tsx`:

```typescript
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
```

Criar `src/app/(tabs)/nutrition.tsx`:

```typescript
import { PatientNutritionScreen } from '@/features/patient/screens/NutritionScreen';
export default PatientNutritionScreen;
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/patient/ src/app/(tabs)/home.tsx src/app/(tabs)/nutrition.tsx
git commit -m "feat: patient home (gamified dashboard) and nutrition screens"
```

---

## Task 6: Telas do Nutricionista

**Files:**
- Create: `src/features/nutritionist/screens/HomeScreen.tsx`
- Create: `src/features/nutritionist/screens/PatientsScreen.tsx`
- Create: `src/features/nutritionist/screens/RankingScreen.tsx`
- Create: `src/app/(tabs)/patients.tsx`
- Create: `src/app/(tabs)/ranking.tsx`

- [ ] **Step 1: Criar NutritionistHomeScreen**

Criar `src/features/nutritionist/screens/HomeScreen.tsx`:

```typescript
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Calendar, AlertTriangle } from 'lucide-react-native';
import { StatCard } from '@/shared/components/ui/StatCard';
import { PatientCard } from '@/shared/components/ui/PatientCard';
import { colors, spacing, fontSize } from '@/shared/theme';
import { useAuthContext } from '@/features/auth';

const LOW_ENGAGEMENT = [
  { id: '1', name: 'Carlos Silva', level: 2, streakDays: 0, points: 80 },
  { id: '2', name: 'Ana Souza', level: 1, streakDays: 1, points: 40 },
  { id: '3', name: 'Pedro Lima', level: 3, streakDays: 0, points: 200 },
];

export function NutritionistHomeScreen() {
  const { user } = useAuthContext();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Olá, {user?.name.split(' ')[0]}</Text>
        <Text style={styles.title}>Dashboard</Text>

        <View style={styles.statsRow}>
          <StatCard label="Pacientes" value={12} Icon={Users} />
          <StatCard label="Hoje" value={3} Icon={Calendar} color={colors.success} />
          <StatCard label="Alertas" value={3} Icon={AlertTriangle} color={colors.warning} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engajamento Baixo</Text>
          <Text style={styles.sectionSub}>Pacientes sem streak ativo</Text>
          {LOW_ENGAGEMENT.map(p => <PatientCard key={p.id} {...p} />)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  greeting: { color: colors.muted, fontSize: fontSize.sm },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800', marginTop: -spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  sectionSub: { color: colors.muted, fontSize: fontSize.sm, marginTop: -spacing.sm },
});
```

- [ ] **Step 2: Criar NutritionistPatientsScreen**

Criar `src/features/nutritionist/screens/PatientsScreen.tsx`:

```typescript
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
```

- [ ] **Step 3: Criar NutritionistRankingScreen**

Criar `src/features/nutritionist/screens/RankingScreen.tsx`:

```typescript
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy } from 'lucide-react-native';
import { PatientCard } from '@/shared/components/ui/PatientCard';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

const RANKING = [
  { id: '1', name: 'Mariana Costa', level: 4, streakDays: 21, points: 1200 },
  { id: '2', name: 'Ana Souza', level: 1, streakDays: 12, points: 640 },
  { id: '3', name: 'Carlos Silva', level: 2, streakDays: 5, points: 380 },
  { id: '4', name: 'Pedro Lima', level: 3, streakDays: 0, points: 200 },
];

const PODIUM_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export function NutritionistRankingScreen() {
  const top3 = RANKING.slice(0, 3);
  const rest = RANKING.slice(3);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ranking</Text>

        <View style={styles.podium}>
          {top3.map((p, i) => (
            <View key={p.id} style={[styles.podiumItem, i === 0 && styles.podiumFirst]}>
              <Trophy size={i === 0 ? 28 : 20} color={PODIUM_COLORS[i]} />
              <Text style={[styles.podiumPos, { color: PODIUM_COLORS[i] }]}>#{i + 1}</Text>
              <Text style={styles.podiumName} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
              <Text style={styles.podiumPoints}>{p.points}pts</Text>
            </View>
          ))}
        </View>

        <View style={styles.list}>
          {rest.map((p, i) => (
            <View key={p.id} style={styles.rankRow}>
              <Text style={styles.rankNum}>#{i + 4}</Text>
              <PatientCard {...p} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
  podium: { flexDirection: 'row', gap: spacing.sm },
  podiumItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  podiumFirst: { borderWidth: 2, borderColor: '#FFD700' },
  podiumPos: { fontSize: fontSize.lg, fontWeight: '800' },
  podiumName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  podiumPoints: { color: colors.muted, fontSize: fontSize.xs },
  list: { gap: spacing.sm },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rankNum: { color: colors.muted, fontSize: fontSize.md, fontWeight: '700', width: 32 },
});
```

- [ ] **Step 4: Criar rotas de página**

Criar `src/app/(tabs)/patients.tsx`:
```typescript
import { NutritionistPatientsScreen } from '@/features/nutritionist/screens/PatientsScreen';
export default NutritionistPatientsScreen;
```

Criar `src/app/(tabs)/ranking.tsx`:
```typescript
import { NutritionistRankingScreen } from '@/features/nutritionist/screens/RankingScreen';
export default NutritionistRankingScreen;
```

- [ ] **Step 5: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/features/nutritionist/ src/app/(tabs)/patients.tsx src/app/(tabs)/ranking.tsx
git commit -m "feat: nutritionist home, patients, and ranking screens"
```

---

## Task 7: Telas do Admin

**Files:**
- Create: `src/features/admin/screens/DashboardScreen.tsx`
- Create: `src/features/admin/screens/NutritionistsScreen.tsx`
- Create: `src/app/(tabs)/nutritionists.tsx`

- [ ] **Step 1: Criar AdminDashboardScreen**

Criar `src/features/admin/screens/DashboardScreen.tsx`:

```typescript
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Stethoscope, Calendar } from 'lucide-react-native';
import { StatCard } from '@/shared/components/ui/StatCard';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

export function AdminDashboardScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Painel Admin</Text>

        <View style={styles.statsRow}>
          <StatCard label="Pacientes" value={48} Icon={Users} />
          <StatCard label="Nutricionistas" value={6} Icon={Stethoscope} color={colors.success} />
        </View>
        <StatCard label="Consultas Hoje" value={14} Icon={Calendar} color={colors.warning} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pendências</Text>
          <View style={styles.pendingCard}>
            <Text style={styles.pendingNum}>2</Text>
            <Text style={styles.pendingLabel}>nutricionistas aguardando aprovação</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  pendingCard: {
    backgroundColor: colors.warning + '22',
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '55',
  },
  pendingNum: { color: colors.warning, fontSize: 40, fontWeight: '800' },
  pendingLabel: { color: colors.text, fontSize: fontSize.md, flex: 1 },
});
```

- [ ] **Step 2: Criar AdminNutritionistsScreen**

Criar `src/features/admin/screens/NutritionistsScreen.tsx`:

```typescript
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

type NutritionistStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface NutritionistItem {
  id: string;
  name: string;
  crmCrn: string;
  status: NutritionistStatus;
}

const MOCK: NutritionistItem[] = [
  { id: '1', name: 'Dra. Fernanda Ramos', crmCrn: 'CRN-3 12345', status: 'APPROVED' },
  { id: '2', name: 'Dr. Lucas Mendes', crmCrn: 'CRN-3 67890', status: 'PENDING' },
  { id: '3', name: 'Dra. Juliana Pires', crmCrn: 'CRN-3 11223', status: 'PENDING' },
  { id: '4', name: 'Dr. Rafael Gomes', crmCrn: 'CRN-3 44556', status: 'REJECTED' },
];

const STATUS_CONFIG = {
  APPROVED: { color: colors.success, Icon: CheckCircle, label: 'Aprovado' },
  PENDING: { color: colors.warning, Icon: Clock, label: 'Pendente' },
  REJECTED: { color: colors.danger, Icon: XCircle, label: 'Rejeitado' },
} as const;

function NutritionistRow({ item }: { item: NutritionistItem }) {
  const { color, Icon, label } = STATUS_CONFIG[item.status];
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.crm}>{item.crmCrn}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: color + '22' }]}>
        <Icon size={14} color={color} />
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

export function AdminNutritionistsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={MOCK}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Nutricionistas</Text>}
        renderItem={({ item }) => <NutritionistRow item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800', marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  crm: { color: colors.muted, fontSize: fontSize.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600' },
});
```

- [ ] **Step 3: Criar rota**

Criar `src/app/(tabs)/nutritionists.tsx`:
```typescript
import { AdminNutritionistsScreen } from '@/features/admin/screens/NutritionistsScreen';
export default AdminNutritionistsScreen;
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/ src/app/(tabs)/nutritionists.tsx
git commit -m "feat: admin dashboard and nutritionists management screens"
```

---

## Task 8: Telas Compartilhadas (Agenda e Perfil)

**Files:**
- Create: `src/features/shared/screens/ScheduleScreen.tsx`
- Create: `src/features/shared/screens/ProfileScreen.tsx`
- Create: `src/app/(tabs)/schedule.tsx`
- Create: `src/app/(tabs)/profile.tsx`

- [ ] **Step 1: Criar ScheduleScreen**

Criar `src/features/shared/screens/ScheduleScreen.tsx`:

```typescript
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppointmentCard } from '@/shared/components/ui/AppointmentCard';
import { colors, spacing, fontSize } from '@/shared/theme';
import { useAuthContext } from '@/features/auth';

const NUTRITIONIST_APPOINTMENTS = [
  { id: '1', patientName: 'Ana Souza', scheduledAt: '2026-05-07T10:00:00', status: 'CONFIRMED' as const, type: 'Consulta inicial' },
  { id: '2', patientName: 'Carlos Silva', scheduledAt: '2026-05-07T14:00:00', status: 'PENDING' as const, type: 'Retorno' },
  { id: '3', patientName: 'Pedro Lima', scheduledAt: '2026-05-08T09:00:00', status: 'CONFIRMED' as const, type: 'Avaliação' },
];

const PATIENT_APPOINTMENTS = [
  { id: '1', nutritionistName: 'Dra. Fernanda Ramos', scheduledAt: '2026-05-07T10:00:00', status: 'CONFIRMED' as const, type: 'Consulta inicial' },
  { id: '2', nutritionistName: 'Dra. Fernanda Ramos', scheduledAt: '2026-05-14T10:00:00', status: 'PENDING' as const, type: 'Retorno' },
];

export function ScheduleScreen() {
  const { user } = useAuthContext();
  const appointments = user?.role === 'PATIENT' ? PATIENT_APPOINTMENTS : NUTRITIONIST_APPOINTMENTS;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Agenda</Text>
        <Text style={styles.sub}>Próximas consultas</Text>
        {appointments.map(a => <AppointmentCard key={a.id} {...a} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: fontSize.sm, marginTop: -spacing.sm },
});
```

- [ ] **Step 2: Criar ProfileScreen**

Criar `src/features/shared/screens/ProfileScreen.tsx`:

```typescript
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';
import { useAuthContext } from '@/features/auth';

const ROLE_LABEL = { PATIENT: 'Paciente', NUTRITIONIST: 'Nutricionista', ADMIN: 'Administrador' };
const ROLE_COLOR = { PATIENT: colors.primary, NUTRITIONIST: colors.success, ADMIN: colors.warning };

export function ProfileScreen() {
  const { user, logout } = useAuthContext();
  if (!user) return null;

  const roleColor = ROLE_COLOR[user.role];
  const initials = user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleColor + '22', borderColor: roleColor + '55' }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{ROLE_LABEL[user.role]}</Text>
        </View>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={logout}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
        >
          <LogOut size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, alignItems: 'center' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  initials: { color: colors.primary, fontSize: fontSize.xxl, fontWeight: '800' },
  name: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  email: { color: colors.muted, fontSize: fontSize.md, marginTop: -spacing.sm },
  roleBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  roleText: { fontSize: fontSize.sm, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, alignSelf: 'stretch' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.danger + '11',
    borderRadius: radius.lg,
    alignSelf: 'stretch',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.danger + '33',
  },
  logoutText: { color: colors.danger, fontSize: fontSize.md, fontWeight: '600' },
});
```

- [ ] **Step 3: Criar rotas**

Criar `src/app/(tabs)/schedule.tsx`:
```typescript
import { ScheduleScreen } from '@/features/shared/screens/ScheduleScreen';
export default ScheduleScreen;
```

Criar `src/app/(tabs)/profile.tsx`:
```typescript
import { ProfileScreen } from '@/features/shared/screens/ProfileScreen';
export default ProfileScreen;
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/shared/ src/app/(tabs)/schedule.tsx src/app/(tabs)/profile.tsx
git commit -m "feat: shared schedule and profile screens"
```

---

## Task 9: Limpeza de placeholders

**Files:**
- Delete: `src/app/(tabs)/two.tsx`

- [ ] **Step 1: Remover placeholder**

```bash
git rm "src/app/(tabs)/two.tsx"
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove unused tab placeholder two.tsx"
```

---

## Checklist de Entrega

- [ ] `npx tsc --noEmit` — zero erros de tipo
- [ ] Login como PATIENT → tab bar com 4 tabs, home com LevelCard + streak + metas
- [ ] Login como NUTRITIONIST → tab bar com 5 tabs, home com StatCards + pacientes baixo engajamento
- [ ] Login como ADMIN → tab bar com 4 tabs, dashboard com métricas e pendências
- [ ] Profile → botão "Sair da conta" funcional em todos os roles
- [ ] Logout → redireciona para tela de login
