# NutritionistsScreen

Tela administrativa para listar nutricionistas e convidar novos profissionais.

## Feedback de convite

- O modal mostra mensagens inline de validacao e erro.
- A mensagem de erro vem de `useInviteUser`, preservando detalhes retornados pela Edge Function.
- Em sucesso, o modal fecha, o formulario e limpo e a lista e atualizada.
- O botao de cancelamento fica desabilitado durante o envio para evitar estado ambivalente.

## Modal de convite

- Usa `AppModal` (`variant="center"`, `avoidKeyboard`) em vez de `Modal` cru.
- `onClose` (`closeInviteModal`) fecha o modal via backdrop, botao "Cancelar" e botao de voltar do Android (`onRequestClose`, antes ausente).
- `avoidKeyboard` evita que o teclado cubra os campos de texto, seguindo o padrao do `LoginScreen`.
