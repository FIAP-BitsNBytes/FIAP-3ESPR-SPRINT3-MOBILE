# AcceptInviteScreen

Tela publica para finalizar convites enviados pelo Supabase Auth.

## Fluxo

- Lida com links de convite contendo tokens no hash ou `code` na query string.
- Cria a sessao temporaria com `setSession` ou `exchangeCodeForSession`.
- Permite definir a senha com `supabase.auth.updateUser({ password })`.
- Chama `accept_current_invite` para aprovar nutricionistas convidados apos a senha ser criada.
- Depois de salvar, atualiza o usuario no contexto e redireciona para as tabs autenticadas.

## Roteamento

O convite deve apontar para `/accept-invite`, nao para rotas privadas como `/nutritionists`.
