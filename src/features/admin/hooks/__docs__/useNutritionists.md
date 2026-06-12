# useNutritionists

Hook administrativo para listar nutricionistas da clinica do usuario atual.

## Detalhes

- Consulta `profiles` filtrando `role = NUTRITIONIST` e `clinic_id`.
- Lê `nutritionist_details` como objeto ou array para tolerar formatos diferentes de relacionamento 1-1 do Supabase.
- Retorna `crmCrn` e `status` para a tela de equipe.

## Realtime e cancelamento

- Dois canais Realtime, nomeados via `uniqueChannelName` (sem colisão entre instâncias):
  - `admin-nutritionists-profiles-<clinicId>`: monitora `profiles` com `filter: clinic_id=eq.<clinicId>`.
  - `admin-nutritionists-details-<clinicId>`: monitora `nutritionist_details` com `filter: clinic_id=eq.<clinicId>`.
- O filtro `clinic_id` em ambos os canais evita vazamento de eventos entre clínicas (um admin da clínica A não recebe mais eventos de nutricionistas da clínica B).
- `fetchNutritionists` aceita um parâmetro opcional `cancelled?: () => boolean`, checado após o `await` da query e antes de cada `setState`. O efeito passa uma closure `isCancelled` que vira `true` no cleanup, prevenindo `setState` após unmount. `refresh()` (exposto sem o parâmetro) continua funcionando normalmente — função com parâmetro opcional extra é compatível com `() => Promise<void>`.

## Edge Cases

- Sem `user?.clinicId`: nenhum fetch ocorre, `isLoading` vira `false`.
- Eventos realtime disparados após o unmount não chamam `setState` (checagem `cancelled`/`isCancelled`).
