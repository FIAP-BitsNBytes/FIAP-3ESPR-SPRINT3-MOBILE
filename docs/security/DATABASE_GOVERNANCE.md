# Governança de Dados e Auditoria Bancária (NutriApp)

**Versão:** 2.0 (Banking Grade)  
**Data:** 2026-05-06  
**Status:** Operacional

## 1. Visão Geral da Governança
O NutriApp utiliza uma arquitetura de dados baseada em **Privacidade por Design** e **Imutabilidade de Auditoria**. O sistema foi projetado para suportar auditorias de conformidade médica e financeira, garantindo que cada bit de informação tenha um rastro de origem e modificação.

## 2. Sistema de Auditoria Particionado (Schema `audit`)
Diferente de logs simples, nossa auditoria é particionada temporalmente para garantir performance de busca em escala logística.

### A. Estrutura da Tabela `unified_logs`
| Campo | Descrição |
|---|---|
| `executed_at` | Data/Hora exata da ação (Chave de Partição). |
| `clinic_id` | Identificador único da clínica (Multi-tenancy). |
| `actor_id` | UUID do usuário (`auth.uid()`) que gerou a ação. |
| `actor_role` | Papel do usuário no momento (PATIENT, NUTRITIONIST, ADMIN, SYSTEM). |
| `action` | Tipo de transação (INSERT, UPDATE, DELETE). |
| `old_data` | Snapshot JSONB do registro antes da alteração. |
| `new_data` | Snapshot JSONB do registro após a alteração. |

### B. Imutabilidade Bancária
- **Anti-Tampering:** Triggers de banco bloqueiam qualquer tentativa de `UPDATE` ou `DELETE` na tabela de logs.
- **WORM Prep:** O sistema está pronto para exportação para armazenamento frio imutável (Write Once, Read Many).

### C. Particionamento Automático
- Os logs são divididos em tabelas mensais (ex: `unified_logs_2026_05`).
- Um sistema de **auto-provisionamento** garante que as partições futuras sejam criadas sem intervenção humana, evitando perda de dados.

## 3. Multi-tenancy e Isolamento RLS
O isolamento de dados é forçado na camada de infraestrutura (PostgreSQL RLS), não no código do App.

- **Filtro Mandatário:** Toda query é automaticamente filtrada pelo `clinic_id` vinculado ao UUID do usuário.
- **Zero-Access Admin:** Administradores de sistema têm acesso de gestão, mas são tecnicamente bloqueados via RLS de visualizar dados sensíveis (refeições, evolução clínica).

## 4. Ciclo de Vida do Dado (Archiving)
Para manter o sistema ágil, implementamos uma política de retenção ativa:
- **Hot Data:** Dados dos últimos 2 anos permanecem nas tabelas principais para acesso instantâneo.
- **Cold Storage (Archive):** Dados clínicos com > 2 anos são movidos para o schema `archive`, liberando memória e processamento para o dia a dia.

## 5. Performance de Alta Disponibilidade
- **Fuzzy Search:** Busca inteligente que tolera erros de digitação e acentuação via `pg_trgm`.
- **Materialized Views:** Dashboards de gamificação e rankings são pré-calculados em background, reduzindo a latência da UI para milissegundos.
- **Extended Statistics:** O Postgres possui estatísticas customizadas para entender a distribuição de dados por clínica, otimizando o plano de execução de queries complexas.

## 6. Procedimento de Auditoria para Conformidade
Para realizar uma auditoria de um registro específico:
1. Localize o `record_id` na tabela original.
2. Filtre `audit.unified_logs` pelo `record_id`.
3. Compare `old_data` e `new_data` para entender a evolução do dado.
4. Identifique o `actor_id` para confirmar a autoria da transação.

---
*Este documento é parte integrante da estratégia de governança do NutriApp e deve ser revisado em caso de mudanças no esquema de dados.*
