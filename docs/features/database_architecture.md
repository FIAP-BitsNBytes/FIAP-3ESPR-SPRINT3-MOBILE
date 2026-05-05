# Arquitetura do Banco de Dados e Matriz de Acesso (Auditoria)

**Data:** 2026-05-04  
**Versão:** 1.0  
**Objetivo:** Detalhar a estrutura do banco de dados e as garantias técnicas de isolamento de dados conforme as regras de sigilo médico.

## 1. Diagrama de Relacionamento (Conceitual)
- `profiles` (PK: id) -> Tabela central de identidade.
- `patient_details` (FK: nutritionist_id -> profiles.id) -> Vincula o paciente ao médico.
- `meal_logs` (FK: patient_id -> profiles.id) -> Dados de consumo.
- `evolution_logs` (FK: patient_id, nutritionist_id -> profiles.id) -> Dados clínicos.

## 2. Matriz de Auditoria e Metadados
Para conformidade total, todas as tabelas implementam as seguintes colunas de rastro:
- `created_at` / `updated_at` (TIMESTAMPTZ)
- `created_by` / `updated_by` (UUID -> profiles)

## 3. Matriz de Acesso via RLS (Row-Level Security)

| Tabela | Paciente (Dono) | Médico (Vinculado) | Admin | Justificativa de Auditoria |
|---|---|---|---|---|
| `profiles` | Leitura | Leitura | Leitura/Escrita | Gestão de identidade e permissões. |
| `patient_details` | Leitura | Leitura/Escrita | **BLOQUEADO** | Sigilo médico. Apenas o médico vinculado altera dados. |
| `meal_logs` | Leitura/Escrita | Leitura | **BLOQUEADO** | Paciente registra, médico monitora em tempo real. |
| `evolution_logs` | Leitura | Leitura/Escrita | **BLOQUEADO** | Exclusividade técnica do médico assistente. |
| `gamification_stats` | Leitura | Leitura | Leitura | Dados não sensíveis, usados para engajamento. |

## 3. Estratégia de Performance (Índices)
Para garantir a responsividade (Web-First), os seguintes índices foram planejados:
- `idx_meal_logs_patient_date`: Composto para busca rápida de histórico diário.
- `idx_evolution_patient_desc`: Para carregar o último peso/bioimpedância instantaneamente.
- `idx_patient_nutritionist`: Para o dashboard médico listar todos os seus pacientes de forma otimizada.

## 4. Verificação de Sigilo
As políticas de RLS no arquivo de migration `20260504000000_initial_schema.sql` utilizam `auth.uid()` para validar a identidade do solicitante contra o `patient_id` ou `nutritionist_id` da linha em questão, impedindo que requisições forjadas acessem dados de terceiros.
