# NutriApp IoT SmartBottle MQTT Simulator

A Node.js script that simulates a Paho MQTT client publishing hydration data from a smart water bottle.

## Purpose

This simulator allows development and testing of the NutriApp MQTT client (`mqttClient.ts`) without requiring actual hardware. It:

- Connects to an MQTT broker
- Publishes realistic hydration events (water intake) at random intervals
- Simulates battery level degradation
- Includes signal strength variations
- Supports multiple bottles via MAC address generation

## Installation

```bash
npm install
```

Or install globally (if paho-mqtt is already available):

```bash
npm link
```

## Usage

### Default (Public Test Broker)

```bash
npm start
```

Connects to `mqtt://test.mosquitto.org:8080` and publishes to `nutriapp/bottles/<mac-address>/data`.

### Local Development

```bash
npm run start:local
```

Connects to `mqtt://localhost:1883` (Mosquitto running locally).

### Custom Configuration

```bash
node simulator.js \
  --broker mqtt://your-broker.com:8883 \
  --topic nutriapp/custom \
  --patient-id 550e8400-e29b-41d4-a716-446655440000
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--broker <url>` | MQTT broker URL | `mqtt://test.mosquitto.org:8080` |
| `--topic <topic>` | Base topic path | `nutriapp/bottles` |
| `--patient-id <uuid>` | Patient UUID | Generated randomly |

## Output Example

```
=== NutriApp IoT SmartBottle Simulator ===
Client ID: nutriapp-simulator-1623456789000
[2026-06-11T12:00:00.123Z] Connecting to mqtt://test.mosquitto.org:8080...
[2026-06-11T12:00:01.456Z] ✓ Connected to broker successfully
Bottle MAC Address: a1:b2:c3:d4:e5:f6
Patient ID: 550e8400-e29b-41d4-a716-446655440000
Publishing to: nutriapp/bottles/a1-b2-c3-d4-e5-f6/data

[2026-06-11T12:00:05.789Z] Message #1 published
  Hydration: 125.43ml, Battery: 100%
[2026-06-11T12:00:11.234Z] Message #2 published
  Hydration: 187.65ml, Battery: 100%
```

## Message Format

Each published message is a JSON object:

```json
{
  "timestamp": "2026-06-11T12:00:05.789Z",
  "bottle_mac": "a1:b2:c3:d4:e5:f6",
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "hydration_ml": 125.43,
  "battery_level": 100,
  "signal_strength": -55,
  "source": "mqtt"
}
```

## Stopping the Simulator

Press `Ctrl+C` to gracefully shut down and display message count.

## Integration with NutriApp

The simulator is designed to work with `src/shared/infrastructure/mqtt/mqttClient.ts`:

1. Start the simulator in a terminal
2. Ensure your app is configured to connect to the same broker
3. Messages will be received and processed by `useSmartBottle` hook
4. Hydration logs appear in real-time on the NutritionScreen

## Troubleshooting

### Connection Refused
- Check that the MQTT broker is running and accessible
- For local testing, ensure Mosquitto is running: `mosquitto -v`
- For public brokers, verify internet connectivity

### No Messages Appearing
- Verify the broker topic subscription in `mqttClient.ts` matches the simulator topic
- Check browser console for MQTT connection errors
- Ensure MQTT client is subscribing to the correct topic pattern

### High Latency
- Public test brokers may have high latency; use a local broker for development
- Reduce `--interval` if available (currently hardcoded to 5-15 seconds)

## License

MIT
