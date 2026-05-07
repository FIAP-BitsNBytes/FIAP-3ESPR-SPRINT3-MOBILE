export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  unlockedAt?: Date;
}

export interface UserStats {
  points: number;
  level: number;
  experience: number;
  nextLevelExperience: number;
  streakDays: number;
}

export interface GamificationState {
  stats: UserStats;
  badges: Badge[];
}

// Matches award_xp() DB formula: level = floor(experience / 500) + 1, capped at 100
export const calculateLevel = (experience: number): number => {
  return Math.min(Math.floor(experience / 500) + 1, 100);
};

export const nextLevelExperience = (level: number): number => {
  return level * 500;
};

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Iniciante',
  2: 'Aprendiz',
  3: 'Praticante',
  4: 'Guerreiro Nutricional',
  5: 'Mestre da Saúde',
};
