
import { User, Task, TaskImportance, Rank } from '../types';
import { authService } from './authService';

const RANK_THRESHOLDS: Record<Rank, number> = {
  [Rank.UNRANKED]: 500,
  [Rank.IRON]: 1000,
  [Rank.BRONZE]: 2000,
  [Rank.SILVER]: 3000,
  [Rank.GOLD]: 4000,
  [Rank.PLATINUM]: 5000,
  [Rank.DIAMOND]: 7500,
  [Rank.MASTER]: 10000,
  [Rank.GRANDMASTER]: Infinity
};

const RANK_ORDER = [
  Rank.UNRANKED,
  Rank.IRON,
  Rank.BRONZE,
  Rank.SILVER,
  Rank.GOLD,
  Rank.PLATINUM,
  Rank.DIAMOND,
  Rank.MASTER,
  Rank.GRANDMASTER
];

export const gamificationService = {
  calculateTaskExp: (task: Task): number => {
    let baseExp = 0;
    switch (task.importance) {
      case TaskImportance.HIGH:
        baseExp = 100;
        break;
      case TaskImportance.MEDIUM:
        baseExp = 50;
        break;
      case TaskImportance.LOW:
        baseExp = 25;
        break;
      default:
        baseExp = 0;
    }

    return baseExp;
  },

  getLevelInfo: (totalExp: number) => {
    const exp = (isNaN(totalExp) || totalExp === undefined || totalExp === null) ? 0 : totalExp;
    const level = Math.floor(exp / 500) + 1;
    const progress = ((exp % 500) / 500) * 100;
    return { level, progress, nextLevelExp: 500 };
  },

  getRankInfo: (user: User) => {
    let remainingExp = user.exp || 0;
    let currentRank = Rank.UNRANKED;
    
    for (let i = 0; i < RANK_ORDER.length; i++) {
      const rank = RANK_ORDER[i];
      const threshold = RANK_THRESHOLDS[rank];
      
      if (remainingExp >= threshold && rank !== Rank.GRANDMASTER) {
        remainingExp -= threshold;
        currentRank = RANK_ORDER[i + 1];
      } else {
        break;
      }
    }

    const nextRankThreshold = RANK_THRESHOLDS[currentRank];
    const progress = nextRankThreshold === Infinity ? 100 : Math.min(100, (remainingExp / nextRankThreshold) * 100);
    
    return {
      currentRank,
      currentRankExp: remainingExp,
      nextRankThreshold,
      progress
    };
  },

  updateUserProgress: async (userId: string, expGain: number): Promise<{ user: User | null, leveledUp: boolean, rankedUp: boolean }> => {
    const user = await authService.getCurrentUser();
    if (!user || user.id !== userId) return { user: null, leveledUp: false, rankedUp: false };

    const currentExp = (isNaN(user.exp) || user.exp === undefined || user.exp === null) ? 0 : user.exp;
    const oldLevel = Math.floor(currentExp / 500) + 1;
    const oldRank = gamificationService.getRankInfo(user).currentRank;

    const newExp = Math.max(0, currentExp + expGain);
    const newLevel = Math.floor(newExp / 500) + 1;
    
    const rankInfo = gamificationService.getRankInfo({ ...user, exp: newExp });
    const newRank = rankInfo.currentRank;

    const rankedUp = newRank !== oldRank && RANK_ORDER.indexOf(newRank) > RANK_ORDER.indexOf(oldRank);

    const updates: Partial<User> = {
      exp: newExp,
      level: newLevel,
      rank: newRank,
      rankExp: rankInfo.currentRankExp
    };

    const updatedUser = await authService.updateUser(userId, updates);
    return { 
      user: updatedUser, 
      leveledUp: newLevel > oldLevel,
      rankedUp
    };
  }
};
