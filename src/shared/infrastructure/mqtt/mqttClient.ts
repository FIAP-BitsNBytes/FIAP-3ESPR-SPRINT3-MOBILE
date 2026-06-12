/**
 * mqttClient.ts
 *
 * Purpose:
 *   Factory function for MQTT client instances used in NutriApp IoT integration.
 *   Each call to createMqttClient produces an independent, isolated handle —
 *   no shared singleton state between components or hooks.
 *
 * Usage:
 *   const handle = createMqttClient({ brokerUrl, clientId, onStatusChange, onMessage });
 *   handle.subscribe('nutriapp/v1/<userId>/water');
 *   // on unmount:
 *   handle.disconnect();
 */

import * as Paho from 'paho-mqtt';

export type MqttStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MqttMessage {
  topic: string;
  payloadString: string;
}

export interface MqttClientOptions {
  brokerUrl: string;
  clientId: string;
  onStatusChange: (status: MqttStatus) => void;
  onMessage: (msg: MqttMessage) => void;
}

export interface MqttClientHandle {
  subscribe: (topic: string) => void;
  disconnect: () => void;
}

export function createMqttClient(options: MqttClientOptions): MqttClientHandle {
  const { brokerUrl, clientId, onStatusChange, onMessage } = options;

  // Parse wss://broker.emqx.io:8084/mqtt → host, port, path
  // paho-mqtt Client constructor: (host, port, path, clientId)
  const url = new URL(brokerUrl);
  const host = url.hostname;
  const port = parseInt(url.port, 10);
  const path = url.pathname || '/mqtt';

  const client = new Paho.Client(host, port, path, clientId);

  client.onConnectionLost = () => {
    options.onStatusChange('disconnected');
  };

  client.onMessageArrived = (message) => {
    options.onMessage({
      topic: message.destinationName,
      payloadString: message.payloadString,
    });
  };

  options.onStatusChange('connecting');

  client.connect({
    useSSL: url.protocol === 'wss:',
    onSuccess: () => options.onStatusChange('connected'),
    onFailure: () => options.onStatusChange('error'),
  });

  return {
    subscribe: (topic: string) => {
      client.subscribe(topic, { qos: 0 });
    },
    disconnect: () => {
      try {
        client.disconnect();
      } catch {
        // already disconnected — safe to ignore
      }
      options.onStatusChange('disconnected');
    },
  };
}
