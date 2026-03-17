
import { User, Task, TaskImportance } from '../types';
import { authService } from './authService';

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
        baseExp = 20;
        break;
      default:
        baseExp = 0;
    }

    let multiplier = 1;
    if (task.completedAt && task.deadline) {
      const deadlineDate = new Date(task.deadline).getTime();
      const completedDate = task.completedAt;
      const diffHours = (deadlineDate - completedDate) / (1000 * 60 * 60);
      if (diffHours > 24) {
        multiplier = 1.2;
      }
    }

    return Math.floor(baseExp * multiplier);
  },

  getLevelInfo: (totalExp: number) => {
    const exp = (isNaN(totalExp) || totalExp === undefined || totalExp === null) ? 0 : totalExp;
    const level = Math.floor(exp / 500) + 1;
    const progress = ((exp % 500) / 500) * 100;
    return { level, progress, nextLevelExp: 500 };
  },

  updateUserProgress: async (userId: string, expGain: number): Promise<{ user: User | null, leveledUp: boolean }> => {
    const user = await authService.getCurrentUser();
    if (!user || user.id !== userId) return { user: null, leveledUp: false };

    const currentExp = (isNaN(user.exp) || user.exp === undefined || user.exp === null) ? 0 : user.exp;
    const oldLevel = Math.floor(currentExp / 500) + 1;
    
    // Allow negative expGain but ensure exp doesn't go below 0
    const newExp = Math.max(0, currentExp + expGain);
    const newLevel = Math.floor(newExp / 500) + 1;
    
    // Convert expGain to food (10 EXP = 1 food)
    // Only positive gains convert to food
    let foodGain = 0;
    if (expGain > 0) {
      foodGain = Math.floor(expGain / 10);
    }

    const updates: Partial<User> = {
      exp: newExp,
      level: newLevel
    };

    if (user.pet) {
      updates.pet = {
        ...user.pet,
        food: (user.pet.food || 0) + foodGain
      };
    }

    const updatedUser = await authService.updateUser(userId, updates);
    return { 
      user: updatedUser, 
      leveledUp: newLevel > oldLevel 
    };
  }
};
