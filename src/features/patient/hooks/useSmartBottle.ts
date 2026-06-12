/**
 * useSmartBottle Hook
 *
 * Manages real-time hydration tracking from IoT SmartBottles via MQTT.
 *
 * Features:
 *   - Real-time hydration data reception from MQTT
 *   - Automatic insertion into Supabase smart_bottle_logs
 *   - Device status monitoring (battery, signal)
 *   - Optional local notification on hydration event
 *   - Automatic cleanup on unmount
 *
 * Dependencies:
 *   - MQTT client (mqttClient.ts)
 *   - Supabase (real-time and direct insert)
 *   - useAuth (patient_id from auth context)
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { getMQTTClient } from "@/shared/infrastructure/mqtt/mqttClient";
import { supabase } from "@/shared/infrastructure/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";

export interface SmartBottleEvent {
  timestamp: string;
  bottle_mac: string;
  patient_id: string;
  hydration_ml: number;
  battery_level: number;
  signal_strength: number;
  source: string;
}

export interface SmartBottleStatus {
  bottleMac: string;
  lastUpdate: string;
  hydrationMl: number;
  batteryLevel: number;
  signalStrength: number;
  isConnected: boolean;
}

interface UseSmartBottleOptions {
  enabled?: boolean;
  brokerUrl?: string;
  topicPattern?: string;
  onEventReceived?: (event: SmartBottleEvent) => void;
  onError?: (error: Error) => void;
}

export function useSmartBottle(options: UseSmartBottleOptions = {}) {
  const {
    enabled = true,
    brokerUrl,
    topicPattern = "nutriapp/bottles/+/data",
    onEventReceived,
    onError,
  } = options;

  const { user } = useAuth();
  const [status, setStatus] = useState<SmartBottleStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mqttClientRef = useRef(getMQTTClient(brokerUrl));
  const isInitializedRef = useRef(false);

  /**
   * Initialize MQTT connection and subscription
   */
  useEffect(() => {
    if (!enabled || !user || isInitializedRef.current) {
      return;
    }

    const initializeMQTT = async () => {
      try {
        setIsLoading(true);

        const client = mqttClientRef.current;

        // Connect to MQTT broker
        if (!client.isReady()) {
          await client.connect();
        }

        setIsConnected(client.isReady());

        // Subscribe to smart bottle data
        client.subscribe(topicPattern, async (payload: string) => {
          try {
            const event = JSON.parse(payload) as SmartBottleEvent;

            // Validate event
            if (
              !event.hydration_ml ||
              !event.bottle_mac ||
              !event.timestamp
            ) {
              console.warn("[useSmartBottle] Invalid event payload:", event);
              return;
            }

            // Update local status
            setStatus({
              bottleMac: event.bottle_mac,
              lastUpdate: event.timestamp,
              hydrationMl: event.hydration_ml,
              batteryLevel: event.battery_level,
              signalStrength: event.signal_strength,
              isConnected: true,
            });

            // Insert into Supabase
            await insertSmartBottleLog(user.id, event);

            // Notify parent
            if (onEventReceived) {
              onEventReceived(event);
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error("[useSmartBottle] Error processing event:", error);
            setError(error);
            if (onError) {
              onError(error);
            }
          }
        });

        isInitializedRef.current = true;
        setIsLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[useSmartBottle] Initialization error:", error);
        setError(error);
        setIsLoading(false);
        if (onError) {
          onError(error);
        }
      }
    };

    initializeMQTT();

    // Cleanup on unmount
    return () => {
      const client = mqttClientRef.current;
      if (client) {
        client.unsubscribe(topicPattern);
      }
    };
  }, [enabled, user, topicPattern, onEventReceived, onError]);

  /**
   * Insert smart bottle log into Supabase
   * Note: smart_bottle_logs table created by migration 20260611120000_sprint4_iot_photos.sql
   */
  const insertSmartBottleLog = useCallback(
    async (patientId: string, event: SmartBottleEvent) => {
      try {
        // Table smart_bottle_logs added by migration
        const { error: insertError } = await (supabase as any)
          .from("smart_bottle_logs")
          .insert({
            patient_id: patientId,
            bottle_mac_address: event.bottle_mac,
            hydration_ml: event.hydration_ml,
            battery_level: event.battery_level,
            signal_strength: event.signal_strength,
            source: event.source || "mqtt",
            timestamp: event.timestamp,
          });

        if (insertError) {
          throw new Error(`[Supabase] ${insertError.message}`);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[useSmartBottle] Log insert failed:", error);
        throw error;
      }
    },
    []
  );

  /**
   * Manually log hydration (fallback for manual input)
   * Note: smart_bottle_logs table created by migration 20260611120000_sprint4_iot_photos.sql
   */
  const logHydration = useCallback(
    async (hydrationMl: number, bottleMac?: string) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      try {
        // Table smart_bottle_logs added by migration
        const { error: insertError } = await (supabase as any)
          .from("smart_bottle_logs")
          .insert({
            patient_id: user.id,
            bottle_mac_address: bottleMac || "manual",
            hydration_ml: hydrationMl,
            battery_level: null,
            signal_strength: null,
            source: "manual",
            timestamp: new Date().toISOString(),
          });

        if (insertError) {
          throw new Error(`[Supabase] ${insertError.message}`);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[useSmartBottle] Manual log failed:", error);
        throw error;
      }
    },
    [user]
  );

  /**
   * Disconnect MQTT client (optional manual cleanup)
   */
  const disconnect = useCallback(() => {
    const client = mqttClientRef.current;
    if (client) {
      client.unsubscribe(topicPattern);
      // Note: not calling disconnect() here to preserve connection for other subscribers
    }
    isInitializedRef.current = false;
    setIsConnected(false);
  }, [topicPattern]);

  return {
    status,
    isConnected,
    isLoading,
    error,
    logHydration,
    disconnect,
  };
}

export type { UseSmartBottleOptions };
