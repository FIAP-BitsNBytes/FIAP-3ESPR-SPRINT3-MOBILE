# accept-invite

Rota publica de aceite de convite.

## Responsabilidade

- Renderiza `AcceptInviteScreen`.
- Deve ser permitida pelo `AuthGate` mesmo sem usuario autenticado.
- Recebe o redirect dos e-mails de convite do Supabase Auth.
