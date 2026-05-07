# Arquitetura do Banco de Dados - Referência Técnica

**Versão:** 2.0  
**Tecnologia:** PostgreSQL + Supabase  
**Padrão:** DDD + Multi-tenancy Estrito

## 1. Modelo de Dados (Entidades Principais)

### A. Núcleo de Identidade
- `profiles`: Extensão de `auth.users`. Contém `name`, `role` e o vínculo obrigatório com `clinic_id`.
- `clinics`: Entidade raiz do Multi-tenancy. Define a fronteira de isolamento de dados.

### B. Domínio Clínico
- `patient_details`: Dados biométricos e objetivos. Inclui `prescribed_meals_per_day` para controle de gamificação.
- `meal_logs`: Registros de consumo. Utiliza o Enum `measurement_unit` e possui trigger de proteção contra excesso de registros.
- `evolution_logs`: Histórico de bioimpedância e observações do nutricionista.

### C. Engajamento e Gestão
- `gamification_stats`: XP, Pontos, Nível e Streaks.
- `appointments`: Gestão de agenda com RLS para médico e paciente.

## 2. Dicionário de Tipos (Enums)
Eliminação de strings mágicas para garantir integridade:
- `measurement_unit`: `GRAMS`, `MILLILITERS`, `UNITS`, `PORTIONS`, `CALORIES`.
- `log_type`: `MEAL`, `WATER`, `SUPPLEMENT`, `EXERCISE`.
- `user_role`: `PATIENT`, `NUTRITIONIST`, `ADMIN`.

## 3. Regras de Negócio Implementadas no Banco (Database Logic)
| Regra | Implementação |
|---|---|
| **Limite de Refeições** | Trigger `trg_check_meal_limit` impede > (Prescrito + 2) registros/dia. |
| **Soft Delete** | Coluna `deleted_at` em tabelas clínicas; RLS oculta registros deletados. |
| **Auditoria** | Trigger `audit_trigger` em todas as tabelas grava histórico em `audit.unified_logs`. |
| **Integridade de Ator** | Trigger `trg_protect_audit` impede alteração de quem criou o registro original. |

## 4. Otimizações de Performance
- **Índices GIST (Fuzzy):** Busca por nome de paciente otimizada para similaridade.
- **Materialized Views:** `mv_gamification_ranking` para queries de ranking instantâneas.
- **Partitioning:** Auditoria particionada mensalmente para escalabilidade infinita.

## 5. Guia de Integração para Desenvolvedores
1. **Sempre use `auth.uid()`:** Nunca passe o ID do usuário manualmente no `WHERE` se puder usar a política de RLS.
2. **Tratamento de Erros:** O app deve capturar o erro `P0001` (Daily Limit Exceeded) para exibir o modal de gamificação.
3. **Busca:** Utilize a função RPC `search_patients(term, clinic_id)` para tirar proveito do índice de similaridade.
4. **Soft Delete:** Para deletar um log, faça um `UPDATE` definindo `deleted_at = NOW()`.
