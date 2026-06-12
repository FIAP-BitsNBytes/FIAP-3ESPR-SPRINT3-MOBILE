# useTodayLogs

Hook de consulta dos registros alimentares do dia do paciente.

## Purpose

Busca todos os `meal_logs` do paciente para o dia atual via `useSupabaseQuery` (com realtime automático). Agrega:

- `meals` — lista completa de itens (para a aba de extras e logs livres)
- `totalCalories` — soma das calorias de refeições (categoria != `WATER`)
- `waterMl` — soma de `quantity` onde `category = 'WATER'`

Aceita `patientId` opcional para nutricionistas visualizarem dados de pacientes; quando omitido, usa o `user.id` do contexto de auth.

## State / Props

```ts
useTodayLogs(patientId?: string | null): TodayLogsState
```

| Retorno | Tipo | Descrição |
|---|---|---|
| `meals` | `MealLogItem[]` | Todos os logs do dia, incluindo `source` (MANUAL/IOT) |
| `totalCalories` | `number` | Soma de calorias das refeições (não-água) |
| `waterMl` | `number` | Total de água em ml |
| `isLoading` | `boolean` | Flag de carregamento |
| `error` | `string \| null` | Erro em português para exibição na UI |

### MealLogItem

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | UUID do log |
| `foodName` | `string` | Nome do alimento |
| `calories` | `number \| null` | Calorias (null = não informado) |
| `quantity` | `number` | Quantidade |
| `unit` | `string` | Unidade de medida |
| `category` | `LogType` | Categoria (WATER, MEAL, etc.) |
| `loggedAt` | `string` | Timestamp ISO do registro |
| `source` | `string \| undefined` | Origem: `'MANUAL'` ou `'IOT'` (Sprint 4) |

## Dependencies

- `useSupabaseQuery` — wrapper com realtime Supabase; re-fetch automático via canal `meal_logs:{patientId}`
- `useAuthContext` — obtém `user.id` quando `patientId` não fornecido
- `supabase` — cliente Supabase tipado
- `todayIso` — retorna a data atual no formato `YYYY-MM-DD`

## Edge Cases

1. **`patientId === null`** — retorna dados vazios (`EMPTY_DATA`) sem consulta; usado por nutricionistas antes de selecionar paciente
2. **`patientId` omitido** — usa `user.id` do auth context (modo paciente)
3. **Ausência de calorias** — linhas com `calories = null` não são somadas (não afetam `totalCalories`)
4. **Registros IoT** — `source: 'IOT'` propagado; `WaterSection` e `MealItemRow` podem exibir badge "[IoT]"
5. **Realtime** — inserts do `useSmartBottle` são automaticamente refletidos via subscription existente do `useSupabaseQuery`
