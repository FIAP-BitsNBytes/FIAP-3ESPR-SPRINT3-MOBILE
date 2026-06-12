/**
 * useDeviceStatus Hook
 *
 * Purpose:
 *   Subscribes to a patient's SmartBottle device status via Supabase broadcast.
 *   Tracks whether the bottle is currently online and the last timestamp it was seen.
 *
 * State:
 *   - isOnline: boolean — whether the device is currently connected
 *   - lastSeen: string | null — ISO timestamp of the last successful reading
 *
 * Dependencies:
 *   - supabase client
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface DeviceStatus {
  isOnline: boolean;
  lastSeen: string | null;
}

export function useDeviceStatus(patientId: string | null): DeviceStatus {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!patientId) return;

    const channelName = `device-status:${patientId}`;
    const channel = supabase.channel(channelName);

    channel.on('broadcast', { event: 'bottle-status' }, ({ payload }) => {
      const p = payload as { isOnline: boolean; lastSeen?: string };
      setIsOnline(p.isOnline);
      if (p.lastSeen) setLastSeen(p.lastSeen);
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [patientId]);

  return { isOnline, lastSeen };
}
