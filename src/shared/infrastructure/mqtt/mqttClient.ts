/**
 * MQTT Client for NutriApp IoT Integration
 *
 * Purpose:
 *   Manages MQTT connections to IoT brokers for real-time data streaming
 *   (hydration logs from SmartBottles, device status, etc).
 *
 * Key Features:
 *   - Single persistent connection (singleton pattern)
 *   - Automatic reconnection on connection loss
 *   - Message subscription with callback registration
 *   - Topic pattern matching (wildcards)
 *   - Graceful cleanup
 *
 * Usage:
 *   const client = getMQTTClient();
 *   client.subscribe('nutriapp/bottles/+/data', (payload) => {
 *     const data = JSON.parse(payload);
 *     console.log(`Hydration: ${data.hydration_ml}ml`);
 *   });
 */

import { Client, Message } from "paho-mqtt";

interface MQTTMessage {
  topic: string;
  payload: string;
  timestamp: number;
}

interface SubscriptionCallback {
  topic: string;
  pattern: RegExp;
  callback: (payload: string, message: MQTTMessage) => void;
}

class MQTTClientManager {
  private static instance: MQTTClientManager | null = null;
  private client: Client | null = null;
  private brokerUrl: string;
  private clientId: string;
  private isConnected = false;
  private subscriptions: Map<string, SubscriptionCallback[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private isInitialized = false;

  private constructor(brokerUrl: string = "mqtt://test.mosquitto.org:8080") {
    this.brokerUrl = brokerUrl;
    this.clientId = `nutriapp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Get singleton instance
   */
  static getInstance(brokerUrl?: string): MQTTClientManager {
    if (!MQTTClientManager.instance) {
      MQTTClientManager.instance = new MQTTClientManager(brokerUrl);
    }
    return MQTTClientManager.instance;
  }

  /**
   * Initialize and connect to broker
   */
  async connect(): Promise<void> {
    if (this.isInitialized || this.isConnected) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.client = new Client(this.brokerUrl, this.clientId);

        this.client.onConnectionLost = (responseObject) => {
          this.isConnected = false;
          console.warn(
            "[MQTT] Connection lost",
            responseObject.errorMessage
          );
          this.attemptReconnect();
        };

        this.client.onMessageArrived = (message: Message) => {
          this.handleMessage(message);
        };

        this.client.connect({
          onSuccess: () => {
            this.isConnected = true;
            this.isInitialized = true;
            this.reconnectAttempts = 0;
            console.log("[MQTT] Connected successfully");
            resolve();
          },
          onFailure: (error) => {
            console.error("[MQTT] Connection failed:", error);
            this.attemptReconnect();
            reject(error);
          },
        });
      } catch (error) {
        console.error("[MQTT] Initialization error:", error);
        reject(error);
      }
    });
  }

  /**
   * Subscribe to a topic with a callback
   */
  subscribe(
    topic: string,
    callback: (payload: string, message: MQTTMessage) => void
  ): void {
    if (!this.client || !this.isConnected) {
      console.warn(
        `[MQTT] Cannot subscribe to ${topic}: client not connected`
      );
      return;
    }

    // Convert MQTT topic pattern to regex
    const pattern = this.topicToRegex(topic);

    const subscription: SubscriptionCallback = {
      topic,
      pattern,
      callback,
    };

    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }

    this.subscriptions.get(topic)!.push(subscription);

    try {
      this.client.subscribe(topic);
      console.log(`[MQTT] Subscribed to ${topic}`);
    } catch (error) {
      console.error(`[MQTT] Subscription failed for ${topic}:`, error);
    }
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topic: string): void {
    if (!this.client) {
      return;
    }

    try {
      this.client.unsubscribe(topic);
      this.subscriptions.delete(topic);
      console.log(`[MQTT] Unsubscribed from ${topic}`);
    } catch (error) {
      console.error(`[MQTT] Unsubscription failed for ${topic}:`, error);
    }
  }

  /**
   * Publish a message to a topic
   */
  publish(topic: string, payload: string | object, qos: 0 | 1 | 2 = 1): void {
    if (!this.client || !this.isConnected) {
      console.warn(
        `[MQTT] Cannot publish to ${topic}: client not connected`
      );
      return;
    }

    try {
      const message = new Message(
        typeof payload === "string" ? payload : JSON.stringify(payload)
      );
      message.destinationName = topic;
      message.qos = qos;

      this.client.send(message);
      console.log(`[MQTT] Message published to ${topic}`);
    } catch (error) {
      console.error(`[MQTT] Publish failed for ${topic}:`, error);
    }
  }

  /**
   * Disconnect from broker
   */
  disconnect(): void {
    if (this.client && this.isConnected) {
      try {
        this.client.disconnect();
        this.isConnected = false;
        this.isInitialized = false;
        console.log("[MQTT] Disconnected");
      } catch (error) {
        console.error("[MQTT] Disconnect error:", error);
      }
    }
  }

  /**
   * Check connection status
   */
  isReady(): boolean {
    return this.isConnected && this.isInitialized;
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: Message): void {
    const topic = message.destinationName;
    const payload = message.payloadString;

    const mqttMessage: MQTTMessage = {
      topic,
      payload,
      timestamp: Date.now(),
    };

    // Notify all matching subscriptions
    this.subscriptions.forEach((callbacks) => {
      callbacks.forEach((sub) => {
        if (sub.pattern.test(topic)) {
          try {
            sub.callback(payload, mqttMessage);
          } catch (error) {
            console.error(
              `[MQTT] Error in callback for ${sub.topic}:`,
              error
            );
          }
        }
      });
    });
  }

  /**
   * Attempt to reconnect to broker
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[MQTT] Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `[MQTT] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("[MQTT] Reconnection failed:", error);
      });
    }, delay);
  }

  /**
   * Convert MQTT topic pattern to regex
   * Examples:
   *   "nutriapp/bottles/+/data" -> /^nutriapp\/bottles\/[^\/]+\/data$/
   *   "nutriapp/+/status" -> /^nutriapp\/[^\/]+\/status$/
   */
  private topicToRegex(topic: string): RegExp {
    const escaped = topic
      .split("/")
      .map((part) => {
        if (part === "+") {
          return "[^/]+";
        } else if (part === "#") {
          return ".*";
        } else {
          return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }
      })
      .join("\\/");

    return new RegExp(`^${escaped}$`);
  }
}

/**
 * Get singleton MQTT client manager
 */
export function getMQTTClient(
  brokerUrl?: string
): MQTTClientManager {
  return MQTTClientManager.getInstance(brokerUrl);
}

export type { MQTTMessage, SubscriptionCallback };
export { MQTTClientManager };
