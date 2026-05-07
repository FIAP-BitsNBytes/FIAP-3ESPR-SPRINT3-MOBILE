import { useState } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';

interface WaterLogResult {
  logId: string;
  xpEarned: number;
  totalMl: number;
}

type LogWaterReturn =
  | { success: true; data: WaterLogResult }
  | { success: false; error: string };

interface UseLogWaterReturn {
  logWater: (amountMl: number) => Promise<LogWaterReturn>;
  isLogging: boolean;
}

export function useLogWater(): UseLogWaterReturn {
  const [isLogging, setIsLogging] = useState(false);

  const logWater = async (amountMl: number): Promise<LogWaterReturn> => {
    setIsLogging(true);
    try {
      const { data, error } = await supabase.rpc('log_water_intake', {
        p_amount_ml: amountMl,
      });

      if (error) return { success: false, error: error.message };

      const result = data as { log_id: string; xp_earned: number; total_ml: number };
      return {
        success: true,
        data: {
          logId:    result.log_id,
          xpEarned: result.xp_earned,
          totalMl:  result.total_ml,
        },
      };
    } catch {
      return { success: false, error: 'Erro ao registrar agua' };
    } finally {
      setIsLogging(false);
    }
  };

  return { logWater, isLogging };
}
