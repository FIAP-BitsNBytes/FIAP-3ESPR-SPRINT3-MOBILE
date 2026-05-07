# useNutritionists

Hook administrativo para listar nutricionistas da clinica do usuario atual.

## Detalhes

- Consulta `profiles` filtrando `role = NUTRITIONIST` e `clinic_id`.
- Lê `nutritionist_details` como objeto ou array para tolerar formatos diferentes de relacionamento 1-1 do Supabase.
- Retorna `crmCrn` e `status` para a tela de equipe.
