/**
 * useSmartBottle Hook
 *
 * Purpose:
 *   Manages MQTT connection lifecycle and real-time hydration tracking from
 *   IoT SmartBottles. Exposes connect/disconnect controls and inserts readings
 *   into meal_logs with source='IOT'.
 *
 * State:
 *   - status: MqttStatus — current connection state
 *   - lastReading: SmartBottleReading | null — most recent valid reading
 *   - error: string | null — user-facing error message
 *
 * Dependencies:
 *   - createMqttClient (factory, no singleton)
 *   - supabase client
 *   - useAuthContext
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { createMqttClient } from '@/shared/infrastructure/mqtt/mqttClient';
import type { MqttClientHandle, MqttStatus } from '@/shared/infrastructure/mqtt/mqttClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface SmartBottleReading {
  deviceId: string;
  amountMl: number;
  timestamp: string;
}

export type SmartBottleStatus = MqttStatus;

export interface UseSmartBottleReturn {
  status: SmartBottleStatus;
  lastReading: SmartBottleReading | null;
  connect: () => void;
  disconnect: () => void;
  error: string | null;
}

export function useSmartBottle(): UseSmartBottleReturn {
  const { user } = useAuthContext();
  const [status, setStatus] = useState<SmartBottleStatus>('disconnected');
  const [lastReading, setLastReading] = useState<SmartBottleReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<MqttClientHandle | null>(null);
  const broadcastChannelRef = useRef<RealtimeChannel | null>(null);

  const handleMessage = useCallback(
    async (msg: { topic: string; payloadString: string }) => {
      if (!user) return;

      let parsed: unknown;
      try {
        parsed = JSON.parse(msg.payloadString);
      } catch {
        // invalid JSON — discard silently
        return;
      }

      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        typeof (parsed as Record<string, unknown>).amountMl !== 'number'
      ) {
        return;
      }

      const { amountMl, deviceId, timestamp } = parsed as {
        amountMl: number;
        deviceId?: string;
        timestamp?: string;
      };

      if (amountMl <= 0 || amountMl > 2000) return;

      const loggedAt = timestamp ?? new Date().toISOString();

      const reading: SmartBottleReading = { deviceId: deviceId ?? 'unknown', amountMl, timestamp: loggedAt };

      const { error: insertError } = await supabase.from('meal_logs').insert({
        patient_id: user.id,
        food_name: 'Água (SmartBottle)',
        quantity: amountMl,
        unit: 'MILLILITERS',
        category: 'WATER',
        source: 'IOT',
        logged_at: loggedAt,
      });

      if (insertError) {
        setError('Falha ao salvar leitura da garrafa');
        return;
      }

      setLastReading(reading);

      void broadcastChannelRef.current?.send({
        type: 'broadcast',
        event: 'bottle-status',
        payload: { isOnline: true, patientId: user.id, lastSeen: loggedAt },
      });
    },
    [user],
  );

  const connect = useCallback(() => {
    if (!user || clientRef.current) return;
    setError(null);

    const clientId = `nutriapp-${user.id.slice(0, 8)}-${Date.now()}`;
    const topic = `nutriapp/v1/${user.id}/water`;

    const handle = createMqttClient({
      brokerUrl: 'wss://broker.emqx.io:8084/mqtt',
      clientId,
      onStatusChange: (s) => {
        setStatus(s);
        if (s === 'connected') {
          clientRef.current?.subscribe(topic);
          void broadcastChannelRef.current?.send({
            type: 'broadcast',
            event: 'bottle-status',
            payload: { isOnline: true, patientId: user.id },
          });
        }
        if (s === 'error') setError('Falha na conexão com o broker MQTT');
      },
      onMessage: (msg) => { void handleMessage(msg); },
    });

    clientRef.current = handle;

    const channelName = `device-status:${user.id}`;
    const broadcastChannel = supabase.channel(channelName);
    broadcastChannel.subscribe();
    broadcastChannelRef.current = broadcastChannel;
  }, [user, handleMessage]);

  const disconnect = useCallback(() => {
    void broadcastChannelRef.current?.send({
      type: 'broadcast',
      event: 'bottle-status',
      payload: { isOnline: false, patientId: user?.id },
    });
    if (broadcastChannelRef.current) {
      supabase.removeChannel(broadcastChannelRef.current);
      broadcastChannelRef.current = null;
    }
    clientRef.current?.disconnect();
    clientRef.current = null;
    setStatus('disconnected');
  }, [user?.id]);

  // Cleanup on unmount
  useEffect(() => () => {
    clientRef.current?.disconnect();
    if (broadcastChannelRef.current) {
      supabase.removeChannel(broadcastChannelRef.current);
      broadcastChannelRef.current = null;
    }
  }, []);

  return { status, lastReading, connect, disconnect, error };
}
