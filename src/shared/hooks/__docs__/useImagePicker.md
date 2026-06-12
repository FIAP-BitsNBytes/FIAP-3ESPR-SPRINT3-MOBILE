# useImagePicker

## Resumo

Hook customizado que encapsula a funcionalidade de seleção de imagens (câmera ou galeria) usando `expo-image-picker`, gerenciando permissões e estado da imagem selecionada.

## Estado e Props

**Retorno:**

- `asset: ImageAsset | null` — Imagem selecionada (URI, dimensões, nome de arquivo)
- `status: PickerStatus` — Estado de permissão: `'idle'`, `'granted'`, ou `'denied'`
- `pickFromCamera(): Promise<void>` — Solicita permissão e abre câmera para captura
- `pickFromGallery(): Promise<void>` — Solicita permissão e abre galeria
- `clearAsset(): void` — Limpa a imagem selecionada e reseta status

## Dependências

- `expo-image-picker` — Acesso a câmera e galeria de mídia
- React `useState` — Gerenciamento de estado local

## Casos de Uso

- Permitir usuários fotografar refeições para registro em `FreeMealModal`
- Fallback para galeria quando câmera é negada

## Edge Cases

- Se permissão for negada, `status` muda para `'denied'` mas não lança erro
- Picker cancelado pelo usuário não altera o estado
- Qualidade da imagem fixada em `0.6` para otimização de upload
- Aspecto fixado em `4:3` para consistência visual

## Integrações

- Usado em `FreeMealModal` para seleção de fotos de refeições
- Imagens são enviadas via `uploadMealPhoto()` em `storage.ts`
