# Spec: Sistema de Convites Hierárquicos (NutriApp)

## 1. Objetivo
Implementar um sistema de convites seguro via Supabase Edge Functions para permitir que Administradores convidem Nutricionistas e Nutricionistas convidem Pacientes, garantindo a integridade dos vínculos (clínica e médico responsável).

## 2. Arquitetura: Edge Function `invite-user`

### Entrada (JSON)
- `email`: string (obrigatório)
- `name`: string (obrigatório)
- `role`: 'NUTRITIONIST' | 'PATIENT' (obrigatório)
- `crm_crn`: string (obrigatório apenas para NUTRITIONIST)

### Lógica de Segurança e Vínculo
1. **Validação de Hierarquia**:
   - Se `caller.role === 'ADMIN'`, só pode convidar `NUTRITIONIST`.
   - Se `caller.role === 'NUTRITIONIST'`, só pode convidar `PATIENT`.
2. **Obtenção de Contexto**:
   - Captura `clinic_id` do chamador.
3. **Ações no Auth (Admin Privileges)**:
   - `admin.inviteUserByEmail(email)`: Cria usuário no Supabase Auth e envia e-mail de "Set Password".
4. **Ações no Banco de Dados (Public Schema)**:
   - Inserção em `profiles`: `id`, `name`, `role`, `clinic_id`.
   - Se Nutricionista: Inserção em `nutritionist_details` (`status: PENDING`).
   - Se Paciente: Inserção em `patient_details` (`nutritionist_id: caller.id`).

## 3. Componentes UI

### Admin: Tela de Nutricionistas
- Adicionar botão FAB (Floating Action Button).
- Modal `InviteNutritionistModal`: campos Nome, E-mail, CRM/CRN.
- Integração com `useNutritionistManagement`.

### Nutricionista: Tela de Pacientes
- Adicionar botão FAB.
- Modal `InvitePatientModal`: campos Nome, E-mail.
- Integração com `usePatientManagement`.

## 4. Segurança (RLS)
- As políticas de RLS existentes já protegem os dados, mas a Edge Function usará a chave `service_role` para realizar operações administrativas de forma controlada.

## 5. Casos de Borda
- **E-mail já cadastrado**: Retornar erro amigável "Usuário já possui conta".
- **Falha no e-mail**: Logar erro e garantir que registros no DB não sejam criados (transação ou rollback manual).
