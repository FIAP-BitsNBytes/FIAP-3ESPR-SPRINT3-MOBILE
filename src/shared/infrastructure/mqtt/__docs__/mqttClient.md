# mqttClient.ts

## Purpose

Provides a singleton MQTT client manager for real-time IoT data streaming in NutriApp. Handles:

- Connection lifecycle (connect, disconnect, reconnect)
- Message subscription with topic pattern matching
- Message publishing
- Automatic reconnection on connection loss
- Error handling and logging

## Architecture

### Class: MQTTClientManager

**Singleton pattern** — ensures only one MQTT connection per app instance.

#### Key Methods

| Method | Signature | Returns | Purpose |
|--------|-----------|---------|---------|
| `connect()` | `async connect(): Promise<void>` | Promise | Establish connection to MQTT broker |
| `subscribe()` | `subscribe(topic: string, callback: Function): void` | void | Subscribe to topic with message handler |
| `unsubscribe()` | `unsubscribe(topic: string): void` | void | Unsubscribe from topic |
| `publish()` | `publish(topic: string, payload: string \| object, qos?: 0 \| 1 \| 2): void` | void | Publish message to topic |
| `disconnect()` | `disconnect(): void` | void | Gracefully disconnect |
| `isReady()` | `isReady(): boolean` | boolean | Check if connected and initialized |

#### Properties

| Property | Type | Purpose |
|----------|------|---------|
| `brokerUrl` | string | MQTT broker endpoint |
| `clientId` | string | Unique client identifier |
| `isConnected` | boolean | Current connection status |
| `subscriptions` | Map | Active subscriptions by topic |
| `reconnectAttempts` | number | Current reconnection attempt count |
| `maxReconnectAttempts` | number | Maximum retry attempts (default: 10) |
| `reconnectDelay` | number | Initial reconnect delay in ms (default: 1000) |

### Topic Pattern Matching

The client converts MQTT topic patterns to regex for callback matching:

- `+` matches one segment (single level): `nutriapp/bottles/+/data`
- `#` matches remaining segments (multi-level): `nutriapp/#`

Example:
```typescript
// Subscribes to all bottle data
client.subscribe('nutriapp/bottles/+/data', (payload, message) => {
  console.log(`Received from ${message.topic}`);
});
```

## Usage

### Basic Connection

```typescript
import { getMQTTClient } from '@shared/infrastructure/mqtt/mqttClient';

const mqttClient = getMQTTClient();
await mqttClient.connect();

if (mqttClient.isReady()) {
  console.log('MQTT ready for messaging');
}
```

### Subscribing to Topic

```typescript
mqttClient.subscribe('nutriapp/bottles/+/data', (payload, message) => {
  const data = JSON.parse(payload);
  console.log(`${data.hydration_ml}ml from ${message.topic}`);
});
```

### Publishing a Message

```typescript
const hydrationEvent = {
  timestamp: new Date().toISOString(),
  hydration_ml: 250,
  battery_level: 85,
  source: 'smartbottle'
};

mqttClient.publish('nutriapp/bottles/a1:b2:c3:d4/event', hydrationEvent, 1);
```

### Graceful Cleanup

```typescript
// In component unmount or app termination
mqttClient.disconnect();
```

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `paho-mqtt` | ^1.0.3 | MQTT client library |
| `@types/paho-mqtt` | latest | TypeScript type definitions |

## Configuration

### Broker URL

Default: `mqtt://test.mosquitto.org:8080` (public test broker)

Override:
```typescript
const client = getMQTTClient('mqtt://your-broker.com:8883');
```

### Reconnection Strategy

- **Initial delay**: 1000ms
- **Backoff multiplier**: 2^attempt
- **Max attempts**: 10

Examples:
- Attempt 1: wait 1000ms
- Attempt 2: wait 2000ms
- Attempt 3: wait 4000ms
- ...up to 10 attempts

## Error Handling

All errors are logged to console with `[MQTT]` prefix:

```
[MQTT] Connection failed: Connection refused
[MQTT] Subscription failed for nutriapp/bottles/+/data: Already subscribed
[MQTT] Error in callback for nutriapp/bottles/+/data: TypeError...
```

## Edge Cases

### Subscribing Before Connection

If `subscribe()` is called before the client is connected, it logs a warning and returns silently. Re-call `subscribe()` after connection is established.

### Publishing Before Connection

Messages published before connection is established are silently dropped with a warning. Ensure `isReady()` returns true before publishing.

### Multiple Subscriptions to Same Topic

Multiple callbacks can be registered for the same topic:

```typescript
mqttClient.subscribe('nutriapp/bottles/+/data', callback1);
mqttClient.subscribe('nutriapp/bottles/+/data', callback2);
// Both callbacks will be invoked on message arrival
```

### Connection Loss During Session

The client automatically attempts to reconnect with exponential backoff. Active subscriptions are preserved and will resume upon reconnection.

## Testing

### Mock MQTT Client

For unit tests, mock the singleton:

```typescript
jest.mock('@shared/infrastructure/mqtt/mqttClient', () => ({
  getMQTTClient: jest.fn(() => ({
    connect: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn(),
    disconnect: jest.fn(),
    isReady: jest.fn(() => true),
  })),
}));
```

### Integration Test with Simulator

Use `scripts/iot-simulator/simulator.js` to test real MQTT messaging:

```bash
# Terminal 1: Start simulator
node scripts/iot-simulator/simulator.js

# Terminal 2: Run app and observe messages in console
npm start
```

## Integration with useSmartBottle Hook

See `src/features/patient/hooks/useSmartBottle.ts` for real-world usage. The hook:

1. Initializes MQTT client on mount
2. Subscribes to bottle data topic
3. Parses and validates incoming hydration events
4. Updates local state and Supabase
5. Cleans up subscriptions on unmount

## Security

### Topics

Topics are not encrypted by default. For sensitive data, use a secure MQTT broker (TLS/SSL):

```typescript
const client = getMQTTClient('mqtt+ssl://secure-broker.com:8883');
```

### Client ID

Client ID is randomly generated to avoid conflicts. In production, consider linking to user UUID:

```typescript
// Before connecting:
const client = getMQTTClient();
// Modify clientId if needed based on auth state
```

### Message Validation

Always validate and parse incoming payloads:

```typescript
mqttClient.subscribe('nutriapp/bottles/+/data', (payload) => {
  try {
    const data = JSON.parse(payload);
    // Validate schema
    if (typeof data.hydration_ml === 'number') {
      // Safe to use
    }
  } catch (error) {
    console.error('Invalid payload:', error);
  }
});
```

## Logging

The client logs to console with `[MQTT]` prefix. For production, consider redirecting to a logging service.

Currently logged events:
- ✓ Connection successful
- ✗ Connection failed
- ✓ Subscription established
- ✗ Subscription failed
- ✓ Message published
- ✗ Publish failed
- ⚠ Connection lost
- ⚠ Reconnection attempts
- ✗ Callback errors

## Future Enhancements

- [ ] Custom logging backend
- [ ] Message queuing for offline mode
- [ ] Request/response patterns (RPC-style)
- [ ] Metrics and monitoring
- [ ] WebSocket support
- [ ] Local persistence with SQLite fallback
