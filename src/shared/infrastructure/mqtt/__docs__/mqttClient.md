# mqttClient.ts

## Purpose

Provides a **factory function** `createMqttClient` for creating independent MQTT client handles
used in NutriApp IoT integration. Each call returns an isolated handle — no shared singleton state.

## Architecture

### Function: createMqttClient

**Factory pattern** — each component or hook that needs MQTT creates its own handle and is
responsible for calling `disconnect()` on cleanup.

```typescript
const handle = createMqttClient({
  brokerUrl: 'wss://broker.emqx.io:8084/mqtt',
  clientId: 'nutriapp-abc12345-1718000000000',
  onStatusChange: (status) => { /* 'connecting' | 'connected' | 'disconnected' | 'error' */ },
  onMessage: ({ topic, payloadString }) => { /* handle message */ },
});

handle.subscribe('nutriapp/v1/<userId>/water');

// cleanup:
handle.disconnect();
```

## Exported Types

| Type | Description |
|------|-------------|
| `MqttStatus` | `'disconnected' \| 'connecting' \| 'connected' \| 'error'` |
| `MqttMessage` | `{ topic: string; payloadString: string }` |
| `MqttClientOptions` | Options passed to `createMqttClient` |
| `MqttClientHandle` | Return value: `{ subscribe, disconnect }` |

## MqttClientOptions

| Field | Type | Description |
|-------|------|-------------|
| `brokerUrl` | `string` | Full WSS URL, e.g. `wss://broker.emqx.io:8084/mqtt` |
| `clientId` | `string` | Unique ID for this connection |
| `onStatusChange` | `(status: MqttStatus) => void` | Called on every state transition |
| `onMessage` | `(msg: MqttMessage) => void` | Called for every received message |

## MqttClientHandle

| Method | Description |
|--------|-------------|
| `subscribe(topic: string)` | Subscribe to a topic (QoS 0). Call after `onStatusChange` fires `'connected'`. |
| `disconnect()` | Gracefully disconnect. Safe to call even if already disconnected. |

## URL Parsing

The factory parses `brokerUrl` using `new URL(...)` to extract:
- `hostname` → Paho host
- `port` → Paho port (numeric)
- `pathname` → Paho path (default `/mqtt`)
- `protocol` → `wss:` sets `useSSL: true`

## Status Lifecycle

```
(initial) → 'connecting' → 'connected' → 'disconnected'
                         ↘ 'error'
```

`onStatusChange('connecting')` is called synchronously inside `createMqttClient` before
the Paho `connect()` call returns.

## Usage in useSmartBottle

```typescript
const handle = createMqttClient({
  brokerUrl: 'wss://broker.emqx.io:8084/mqtt',
  clientId: `nutriapp-${user.id.slice(0, 8)}-${Date.now()}`,
  onStatusChange: (s) => {
    setStatus(s);
    if (s === 'connected') handle.subscribe(`nutriapp/v1/${user.id}/water`);
    if (s === 'error') setError('Falha na conexão com o broker MQTT');
  },
  onMessage: (msg) => { void handleMessage(msg); },
});
clientRef.current = handle;
```

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `paho-mqtt` | MQTT client library (imported as `* as Paho`) |

## Edge Cases

### Already Disconnected

`handle.disconnect()` wraps the Paho call in a try/catch and swallows the error silently,
so it is safe to call from cleanup effects even if the connection was never established.

### SSL

If `brokerUrl` starts with `wss:`, `useSSL: true` is passed to Paho automatically.
For plain `ws:` connections, `useSSL: false`.

## Testing

Mock `createMqttClient` in Jest:

```typescript
jest.mock('@/shared/infrastructure/mqtt/mqttClient', () => ({
  createMqttClient: jest.fn((opts) => {
    opts.onStatusChange('connected');
    return {
      subscribe: jest.fn(),
      disconnect: jest.fn(),
    };
  }),
}));
```
