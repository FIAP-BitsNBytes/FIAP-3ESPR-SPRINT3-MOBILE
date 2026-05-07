# Spec: Sistema de Auditoria para Administradores

## 1. Objetivo
Disponibilizar uma interface de auditoria segura para Administradores, permitindo o rastreamento de alterações de dados (quem, quando, o quê) dentro do escopo de sua clínica.

## 2. Segurança: Reforço de RLS (Schema `audit`)
Atualmente, as tabelas de auditoria estão expostas. Aplicaremos:
1. `ALTER TABLE audit.unified_logs ENABLE ROW LEVEL SECURITY;`
2. Política: `Admins view clinic logs`
   - Regra: `(actor_role = 'ADMIN' OR actor_role = 'NUTRITIONIST') AND clinic_id = get_user_clinic()`
   - Acesso: Apenas `SELECT`.

## 3. Componentes Técnicos

### Hook `useAuditLogs`
- Busca dados de `audit.unified_logs`.
- Filtra por `clinic_id`.
- Ordena por `executed_at DESC`.
- Paginação básica (limit 50).

### Tela `AuditLogsScreen`
- **Lista**: Timeline com ícones por tipo de ação (Insert: Verde, Update: Azul, Delete: Vermelho).
- **Filtros**: Por tabela (profiles, appointments, etc).
- **Detalhe**: Modal que formata o `old_data` e `new_data` para leitura humana.

## 4. Navegação
- Adição de botão "Ver Logs de Auditoria" na `ClinicSettingsScreen`.
- Nova rota no Expo Router: `src/app/(tabs)/clinic-audit.tsx` (ou similar via Stack).

Aprova o design?
