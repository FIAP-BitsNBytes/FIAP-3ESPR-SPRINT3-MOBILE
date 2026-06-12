# useDeviceStatus Hook

## Resumo
Subscreve ao status de um dispositivo SmartBottle de um paciente via broadcast Supabase. Rastreia se a garrafa está online e o último timestamp registrado.

## Propósito
- Fornecer feedback visual ao nutricionista sobre a disponibilidade do dispositivo do paciente
- Sincronizar estado do dispositivo em tempo real entre paciente e nutricionista
- Exibir badge de "garrafa online" na tela de detalhes do paciente

## Estado e Props

### Props
| Prop | Tipo | Obrigatório | Descrição |
|------|------|-----------|-----------|
| `patientId` | `string \| null` | Sim | ID único do paciente. Se nulo, o hook não faz setup. |

### Retorno
```typescript
interface DeviceStatus {
  isOnline: boolean;       // Garrafa conectada ao MQTT
  lastSeen: string | null; // ISO timestamp da última leitura bem-sucedida
}
```

## Dependências
- **Supabase client** (`@/shared/infrastructure/supabase/client`): Broadcasting em tempo real
- **React hooks**: `useState`, `useEffect`, `useRef`

## Fluxo de Dados

1. **Setup**: Quando `patientId` muda, cria canal broadcast com nome fixo `device-status:${patientId}`
2. **Listen**: Aguarda eventos `bottle-status` que contêm payload `{ isOnline, lastSeen? }`
3. **State**: Atualiza `isOnline` e `lastSeen` conforme mensagens chegam
4. **Cleanup**: Remove o canal ao desmontar ou quando `patientId` se torna nulo

## Edge Cases
- Se `patientId` for nulo, não faz setup de listener (evita canais inúteis)
- `lastSeen` fica nulo até primeiro evento com `lastSeen` preenchido
- Se a garrafa desconectar (`isOnline: false`), `lastSeen` não é alterado

## Exemplo de Uso

```typescript
import { useDeviceStatus } from '../hooks/useDeviceStatus';

export function PatientDetailScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const { isOnline, lastSeen } = useDeviceStatus(patientId ?? null);

  return (
    <View>
      {isOnline && (
        <Text>💧 Garrafa online</Text>
      )}
      {lastSeen && (
        <Text>Última leitura: {new Date(lastSeen).toLocaleTimeString()}</Text>
      )}
    </View>
  );
}
```

## Integração com useSmartBottle
- **useSmartBottle** (lado do paciente) emite eventos para o canal broadcast
- **useDeviceStatus** (lado do nutricionista) recebe esses eventos
- Ambos usam o mesmo `channelName = device-status:${user.id}`
