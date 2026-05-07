# useInviteUser

Hook compartilhado para chamar a Edge Function `invite-user`.

## Contrato

- Recebe nome, e-mail, permissao de destino e, quando necessario, CRM/CRN.
- Retorna `{ success: true, error: null }` em sucesso.
- Retorna `{ success: false, error: string }` em falha para que a tela mostre a mensagem real.
- A Edge Function valida a hierarquia: admin convida apenas nutricionista; nutricionista convida apenas paciente.
- No web, envia `redirectTo` como `<origin>/accept-invite` para o usuario criar a senha.

## Observacao

No web, falhas de CORS aparecem como `Failed to fetch`; por isso as telas exibem o erro inline em vez de depender apenas de alertas nativos.
