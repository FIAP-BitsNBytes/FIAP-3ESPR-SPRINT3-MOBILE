# AppModal

Wrapper compartilhado para todos os modais do app. Centraliza o estilo de overlay/card duplicado entre telas e garante que o botao "voltar" do Android sempre feche o modal.

## Purpose

- Eliminar a duplicacao de `modalOverlay` / `modalContent` espalhada em `AuditLogsScreen`, `NutritionistsScreen`, `LogItemModal`, etc.
- Corrigir o bug de modais sem `onRequestClose` (back button do Android nao fechava): `onRequestClose={onClose}` e **sempre** conectado ao `Modal` nativo.
- Padronizar duas variantes de apresentacao usadas no app: card centralizado (fade) e sheet (slide).

## Props

| Prop | Tipo | Default | Descricao |
|------|------|---------|-----------|
| `visible` | `boolean` | — | Controla a visibilidade do modal nativo. |
| `onClose` | `() => void` | — | Chamado pelo back button (Android), pelo gesto de dismiss do `pageSheet` (iOS) e pelo toque no backdrop (variante `center`). |
| `variant` | `'center' \| 'sheet'` | `'center'` | Estilo de apresentacao. |
| `avoidKeyboard` | `boolean` | `false` | Envolve o conteudo em `KeyboardAvoidingView` (`behavior` = `'padding'` no iOS, `undefined` nos demais). Use em modais com `TextInput`. |
| `children` | `ReactNode` | — | Conteudo do modal. O consumidor fornece header, formularios e botoes. |
| `testID` | `string` | — | Aplicado ao `Modal`; sufixos derivados: `-backdrop`, `-card` (center) e `-sheet` (sheet). |

## Variantes

### `center` (default)

- `transparent` + `animationType="fade"`.
- Backdrop escuro (`appStyles.modalOverlay`: `rgba(0,0,0,0.5)`, centralizado, padding `spacing.lg`).
- Card (`appStyles.modalCard`: `colors.surface`, `radius.xl`, padding `spacing.xl`, `gap spacing.md`, `shadow.md`).
- Toque no backdrop chama `onClose`; toque no card chama `stopPropagation` e **nao** fecha.

### `sheet`

- `animationType="slide"`.
- iOS: `presentationStyle="pageSheet"` (sheet nativo com gesto de arrastar para fechar).
- Android/web: fallback para slide em tela cheia (`presentationStyle` e iOS-only); container com `flex: 1` e `colors.background`.
- Sem backdrop pressionavel — fechamento via back button, gesto do pageSheet ou botao do consumidor.

## Dependencies

- `react-native`: `Modal`, `Pressable`, `KeyboardAvoidingView`, `Platform`, `View`.
- `@/shared/theme/appStyles`: `modalOverlay`, `modalCard` (estilos compartilhados extraidos dos modais legados).
- `@/shared/theme`: `colors` (fundo do sheet).

## Edge Cases

- **Back button Android**: `onRequestClose` sempre conectado — corrige `AuditLogsScreen` e `NutritionistsScreen`, que usavam `<Modal>` sem essa prop.
- **`pageSheet` vs `transparent`**: o RN nao permite `presentationStyle="pageSheet"` com `transparent` — por isso a variante `sheet` nunca usa `transparent` e o `pageSheet` so e aplicado no iOS.
- **Teclado**: `avoidKeyboard` segue o padrao do `LoginScreen` (`padding` no iOS). No Android o resize nativo da janela cobre o caso; `behavior` fica `undefined` conforme spec.
- **Propagacao de toque**: o card interno usa um `Pressable` com `stopPropagation` para que toques no conteudo nao acionem o `onClose` do backdrop (funciona em nativo e web).
- **Dismiss por gesto no iOS (`sheet`)**: o usuario pode arrastar o pageSheet para baixo; o RN dispara `onRequestClose`, mantendo o estado `visible` do consumidor sincronizado.

## Exemplo

```tsx
<AppModal visible={isOpen} onClose={() => setIsOpen(false)} avoidKeyboard testID="invite-modal">
  <Text style={appStyles.title}>Convidar Nutricionista</Text>
  {/* form... */}
</AppModal>

<AppModal visible={isOpen} onClose={close} variant="sheet">
  <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
    {/* conteudo do sheet... */}
  </SafeAreaView>
</AppModal>
```
