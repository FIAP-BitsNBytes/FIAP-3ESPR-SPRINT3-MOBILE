# useSmartBottle Hook

## Purpose

Manages MQTT connection lifecycle and real-time hydration tracking from IoT SmartBottles.
Exposes manual connect/disconnect controls and inserts readings into `meal_logs` with `source='IOT'`.

## Signature

```typescript
function useSmartBottle(): UseSmartBottleReturn
```

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `status` | `SmartBottleStatus` | Current MQTT connection state |
| `lastReading` | `SmartBottleReading \| null` | Most recent validated reading |
| `connect` | `() => void` | Initiate MQTT connection |
| `disconnect` | `() => void` | Terminate MQTT connection |
| `error` | `string \| null` | User-facing error message (Portuguese) |

## Types

### SmartBottleStatus

Re-export of `MqttStatus`:
```typescript
type SmartBottleStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
```

### SmartBottleReading

```typescript
interface SmartBottleReading {
  deviceId: string;   // device identifier from payload, or 'unknown'
  amountMl: number;   // hydration amount in millilitres (1–2000)
  timestamp: string;  // ISO 8601 string
}
```

## Expected MQTT Payload

```json
{
  "amountMl": 250,
  "deviceId": "bottle-abc123",
  "timestamp": "2026-06-11T14:30:00.000Z"
}
```

Fields `deviceId` and `timestamp` are optional. Payloads with `amountMl <= 0` or `amountMl > 2000`
are silently discarded. Non-JSON payloads are also discarded silently.

## Supabase Insert

On each valid reading, inserts into `meal_logs`:

| Column | Value |
|--------|-------|
| `patient_id` | `user.id` |
| `food_name` | `'Água (SmartBottle)'` |
| `quantity` | `amountMl` |
| `unit` | `'MILLILITERS'` |
| `category` | `'WATER'` |
| `source` | `'IOT'` |
| `logged_at` | payload timestamp or `new Date().toISOString()` |

## MQTT Topic

`nutriapp/v1/<userId>/water`

## Connection Lifecycle

- `connect()` creates a new client via `createMqttClient` (factory, no singleton).
- When status becomes `'connected'`, the hook subscribes to the user topic automatically.
- `disconnect()` terminates the connection and resets `clientRef`.
- On unmount, the cleanup effect calls `disconnect()` to prevent leaks.

## Dependencies

- `createMqttClient` — MQTT factory
- `supabase` — database client
- `useAuthContext` — provides `user.id`

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| `connect()` called while already connected | No-op (guard on `clientRef.current`) |
| `connect()` called without authenticated user | No-op (guard on `user`) |
| Invalid JSON payload | Silently discarded |
| `amountMl` out of range | Silently discarded |
| MQTT broker unreachable | `status → 'error'`, `error` set in Portuguese |
| Unmount while connecting | `disconnect()` called in cleanup effect |

## Testing

Mock `createMqttClient` in Jest:

```typescript
jest.mock('@/shared/infrastructure/mqtt/mqttClient', () => ({
  createMqttClient: jest.fn((opts) => {
    opts.onStatusChange('connected');
    return {
      subscribe: jest.fn((topic) => {
        // simulate a message
        setTimeout(() => {
          opts.onMessage({
            topic,
            payloadString: JSON.stringify({ amountMl: 250, deviceId: 'test' }),
          });
        }, 50);
      }),
      disconnect: jest.fn(),
    };
  }),
}));
```
