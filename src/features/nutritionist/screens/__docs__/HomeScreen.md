# NutritionistHomeScreen

## Propósito
Dashboard inicial do nutricionista. Consolida visão da carteira de pacientes,
agenda do dia, ações rápidas, top do ranking e pacientes com baixo engajamento —
todos os blocos navegáveis.

## Estado / Dados
Sem estado local relevante (apenas derivações via `useMemo`). Fontes:
- `useClinicPatients()` → `totalCount`, `lowEngagement`, `isLoading`, `error`
- `useGamificationRanking(3)` → `ranking` (top 3 da clínica)
- `useAppointments('NUTRITIONIST')` → `appointments` (deriva `todayCount` e `nextAppointment`)

Derivações:
- `todayCount`: consultas com `status !== 'CANCELLED'` agendadas para hoje (`toDateKey`).
- `nextAppointment`: primeira consulta futura ativa (lista já vem ordenada ascendente).

## Navegação
- StatCards e ações rápidas → `/(tabs)/patients`, `/(tabs)/schedule`, `/(tabs)/ranking`, `/(tabs)/nutrition`
- Card "Próxima consulta" → `/(tabs)/schedule`
- Linhas do ranking e cards de baixo engajamento → `/patient-progress` (params `patientId`, `name`)

## Dependências
- `StatCard`, `PatientCard`, `QuickActionGrid` (reutilizado de `@/features/admin/components`)
- `toDateKey` (`@/shared/utils/date`), tema (`@/shared/theme`)
- `useRouter`/`Href` (expo-router)

## Edge Cases
- Sem pacientes: stats zerados; seções de ranking/baixo engajamento ocultas quando vazias.
- Sem próxima consulta: card "Próxima consulta" não é renderizado.
- `ranking.length === 0`: bloco "Top Engajamento" oculto.
- Realtime: `useClinicPatients`/`useGamificationRanking`/`useAppointments` mantêm os
  números sincronizados via subscriptions Supabase.

## Correção de Bug
As linhas de "Engajamento Baixo" usavam `PatientCard` **sem** `onPress` (o chevron
sugeria clique, mas nada acontecia). Agora navegam para o progresso do paciente —
mesma rota usada por `PatientsScreen`.
