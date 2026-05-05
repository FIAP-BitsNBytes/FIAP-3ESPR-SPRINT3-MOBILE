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

export const calculateLevel = (experience: number): number => {
  return Math.floor(experience / 1000) + 1;
};

export const EXPERIENCE_PER_POINT = 10;
