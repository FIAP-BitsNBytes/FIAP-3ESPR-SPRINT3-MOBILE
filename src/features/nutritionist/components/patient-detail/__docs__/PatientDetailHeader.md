# PatientDetailHeader Component

## Resumo
Cabeçalho reutilizável para a tela de detalhes do paciente. Exibe nome do paciente, botões de navegação e badge opcional de status da garrafa.

## Propósito
- Renderizar cabeçalho padronizado em tela de detalhes do paciente (nutritionista)
- Fornecer navegação de volta e acesso rápido ao plano de refeições
- Indicar status em tempo real da garrafa inteligente do paciente

## Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-----------|-----------|
| `patientName` | `string` | Sim | Nome do paciente a exibir |
| `onBack` | `() => void` | Sim | Callback quando botão voltar é pressionado |
| `onOpenMealPlan` | `() => void` | Sim | Callback quando botão plano de refeições é pressionado |
| `isBottleOnline` | `boolean` | Não | Se true, exibe badge "💧 Garrafa online" |

## Dependências
- **React Native**: `View`, `Text`, `TouchableOpacity`, `StyleSheet`
- **Lucide React Native**: Ícones `ArrowLeft`, `ClipboardList`
- **Theme tokens**: `colors`, `spacing`, `radius`, `fontSize`

## Estrutura Visual

```
┌────────────────────────────────────┐
│ [←] Nome do Paciente  [📋]          │
│     Evolução e progresso             │
│     💧 Garrafa online (opcional)    │
└────────────────────────────────────┘
```

## Estados e Interações

### Normal (garrafa offline)
- Exibe nome e subtitle
- Botão voltar e botão plano disponíveis

### Com Garrafa Online
- Exibe badge verde abaixo do subtitle
- Indica ao nutricionista que o dispositivo está ativo

## Edge Cases
- `patientName` nulo ou vazio: texto truncado via `numberOfLines={1}`
- `isBottleOnline` undefined: badge não é renderizado
- Sem handler em `onBack` ou `onOpenMealPlan`: comportamento não-crítico (apenas UI)

## Exemplo de Uso

```typescript
import { useDeviceStatus } from '../../hooks/useDeviceStatus';
import { PatientDetailHeader } from './PatientDetailHeader';

export function PatientDetailScreen() {
  const { patientId, name } = useLocalSearchParams<{ patientId: string; name: string }>();
  const { isOnline } = useDeviceStatus(patientId ?? null);

  return (
    <>
      <PatientDetailHeader
        patientName={name ?? 'Paciente'}
        onBack={() => router.back()}
        onOpenMealPlan={handleMealPlan}
        isBottleOnline={isOnline}
      />
      {/* resto da tela */}
    </>
  );
}
```

## Ajustes de Tema
- Cor da badge: `colors.waterAccent` com 22% de opacidade
- Fonte: `fontSize.xs` (12px), peso 700
- Padding: `spacing.xs` horizontal, 2px vertical
- Border radius: `radius.sm`

## Teste Visual
- Renderizar com `isBottleOnline={true}` e `isBottleOnline={false}`
- Verificar alinhamento e spacing nos diferentes tamanhos de tela
