/**
 * Tests for createMqttClient (mqttClient.ts).
 *
 * Strategy: mock the `paho-mqtt` module entirely.  The mock factory captures
 * each constructed Paho.Client instance in `lastInstance` (using `var` so the
 * declaration is hoisted before the factory runs).  After `createMqttClient`
 * returns, `lastInstance` holds the object on which `onConnectionLost` and
 * `onMessageArrived` were set, letting us invoke those callbacks directly.
 */

// `var` is hoisted (unlike `let`/`const`) so it is accessible inside the jest.mock
// factory even though that factory is registered before module-scope initialisation.
/* eslint-disable no-var */
var lastInstance: {
  connect: jest.Mock;
  subscribe: jest.Mock;
  disconnect: jest.Mock;
  onConnectionLost?: () => void;
  onMessageArrived?: (msg: { destinationName: string; payloadString: string }) => void;
} | undefined;
/* eslint-enable no-var */

jest.mock('paho-mqtt', () => ({
  Client: jest.fn().mockImplementation(() => {
    const instance = {
      connect: jest.fn(),
      subscribe: jest.fn(),
      disconnect: jest.fn(),
    };
    lastInstance = instance;
    return instance;
  }),
}));

import * as Paho from 'paho-mqtt';
import { createMqttClient, type MqttStatus, type MqttMessage } from '../mqttClient';

const MockedClientCtor = jest.mocked(Paho.Client);

/** Helper — returns the current lastInstance (asserts it is defined). */
function getInstance() {
  if (!lastInstance) throw new Error('Paho.Client was never constructed');
  return lastInstance;
}

/** Helper — builds a minimal valid options object. */
function makeOptions(overrides?: {
  onStatusChange?: (s: MqttStatus) => void;
  onMessage?: (m: MqttMessage) => void;
}) {
  return {
    brokerUrl: 'wss://broker.example.com:8084/mqtt',
    clientId: 'test-client-001',
    onStatusChange: overrides?.onStatusChange ?? jest.fn(),
    onMessage: overrides?.onMessage ?? jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  lastInstance = undefined;
});

// ---------------------------------------------------------------------------
// Constructor & URL parsing
// ---------------------------------------------------------------------------

describe('createMqttClient — constructor', () => {
  it('constructs Paho.Client with parsed host, port, and path', () => {
    createMqttClient(makeOptions());

    expect(MockedClientCtor).toHaveBeenCalledTimes(1);
    expect(MockedClientCtor).toHaveBeenCalledWith(
      'broker.example.com',
      8084,
      '/mqtt',
      'test-client-001',
    );
  });

  it('uses "/mqtt" as path for the default broker URL', () => {
    createMqttClient(makeOptions());
    // Third positional arg (index 2) is the path; access via mock.calls[0]
    const callArgs = MockedClientCtor.mock.calls[0] as unknown[];
    expect(callArgs[2]).toBe('/mqtt');
  });
});

// ---------------------------------------------------------------------------
// Status lifecycle
// ---------------------------------------------------------------------------

describe('createMqttClient — status callbacks', () => {
  it('calls onStatusChange("connecting") synchronously before connect resolves', () => {
    const onStatusChange = jest.fn();
    createMqttClient(makeOptions({ onStatusChange }));

    // "connecting" must be the first call, fired synchronously
    expect(onStatusChange).toHaveBeenNthCalledWith(1, 'connecting');
  });

  it('calls onStatusChange("connected") when Paho onSuccess fires', () => {
    const onStatusChange = jest.fn();
    createMqttClient(makeOptions({ onStatusChange }));

    const { calls } = getInstance().connect.mock;
    const connectOptions = calls[0][0] as {
      onSuccess: () => void;
      onFailure: () => void;
      useSSL: boolean;
    };

    connectOptions.onSuccess();

    expect(onStatusChange).toHaveBeenCalledWith('connected');
  });

  it('calls onStatusChange("error") when Paho onFailure fires', () => {
    const onStatusChange = jest.fn();
    createMqttClient(makeOptions({ onStatusChange }));

    const connectOptions = getInstance().connect.mock.calls[0][0] as {
      onSuccess: () => void;
      onFailure: () => void;
    };

    connectOptions.onFailure();

    expect(onStatusChange).toHaveBeenCalledWith('error');
  });

  it('calls onStatusChange("disconnected") when Paho onConnectionLost fires', () => {
    const onStatusChange = jest.fn();
    createMqttClient(makeOptions({ onStatusChange }));

    // Simulate the broker dropping the connection
    getInstance().onConnectionLost?.();

    expect(onStatusChange).toHaveBeenCalledWith('disconnected');
  });
});

// ---------------------------------------------------------------------------
// connect() options
// ---------------------------------------------------------------------------

describe('createMqttClient — connect call', () => {
  it('passes useSSL: true for wss:// URLs', () => {
    createMqttClient(makeOptions());

    const connectOptions = getInstance().connect.mock.calls[0][0] as { useSSL: boolean };
    expect(connectOptions.useSSL).toBe(true);
  });

  it('passes useSSL: false for ws:// URLs', () => {
    createMqttClient({
      ...makeOptions(),
      brokerUrl: 'ws://broker.example.com:1883/mqtt',
    });

    const connectOptions = getInstance().connect.mock.calls[0][0] as { useSSL: boolean };
    expect(connectOptions.useSSL).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// subscribe
// ---------------------------------------------------------------------------

describe('createMqttClient — subscribe', () => {
  it('calls client.subscribe with the given topic and qos 0', () => {
    const handle = createMqttClient(makeOptions());
    const instance = getInstance();

    handle.subscribe('nutriapp/v1/user-123/water');

    expect(instance.subscribe).toHaveBeenCalledTimes(1);
    expect(instance.subscribe).toHaveBeenCalledWith('nutriapp/v1/user-123/water', { qos: 0 });
  });
});

// ---------------------------------------------------------------------------
// message arrival
// ---------------------------------------------------------------------------

describe('createMqttClient — message callback', () => {
  it('invokes onMessage with topic and payloadString when a Paho message arrives', () => {
    const onMessage = jest.fn();
    createMqttClient(makeOptions({ onMessage }));

    const pahoMessage = {
      destinationName: 'nutriapp/v1/user-123/water',
      payloadString: JSON.stringify({ amountMl: 250, deviceId: 'dev-1' }),
    };

    getInstance().onMessageArrived?.(pahoMessage);

    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith<[MqttMessage]>({
      topic: pahoMessage.destinationName,
      payloadString: pahoMessage.payloadString,
    });
  });
});

// ---------------------------------------------------------------------------
// disconnect
// ---------------------------------------------------------------------------

describe('createMqttClient — disconnect', () => {
  it('calls client.disconnect and fires onStatusChange("disconnected")', () => {
    const onStatusChange = jest.fn();
    const handle = createMqttClient(makeOptions({ onStatusChange }));
    const instance = getInstance();

    handle.disconnect();

    expect(instance.disconnect).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenCalledWith('disconnected');
  });

  it('does not throw if client.disconnect throws (already disconnected)', () => {
    const handle = createMqttClient(makeOptions());
    getInstance().disconnect.mockImplementation(() => { throw new Error('Already disconnected'); });

    expect(() => handle.disconnect()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// returned handle shape
// ---------------------------------------------------------------------------

describe('createMqttClient — returned handle', () => {
  it('returns an object with subscribe and disconnect functions', () => {
    const handle = createMqttClient(makeOptions());

    expect(typeof handle.subscribe).toBe('function');
    expect(typeof handle.disconnect).toBe('function');
  });
});
