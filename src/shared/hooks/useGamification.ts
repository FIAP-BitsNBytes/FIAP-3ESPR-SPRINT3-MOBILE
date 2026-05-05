import { useState } from 'react';
import { GamificationState, calculateLevel, EXPERIENCE_PER_POINT } from '../domain/gamification';

export const useGamification = () => {
  const [state, setState] = useState<GamificationState>({
    stats: {
      points: 0,
      level: 1,
      experience: 0,
      nextLevelExperience: 1000,
      streakDays: 0,
    },
    badges: [],
  });

  const addPoints = (points: number) => {
    setState((prev) => {
      const newExperience = prev.stats.experience + points * EXPERIENCE_PER_POINT;
      const newLevel = calculateLevel(newExperience);
      
      return {
        ...prev,
        stats: {
          ...prev.stats,
          points: prev.stats.points + points,
          experience: newExperience,
          level: newLevel,
          nextLevelExperience: newLevel * 1000,
        },
      };
    });
  };

  return { ...state, addPoints };
};
