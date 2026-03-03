
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

  updateUserProgress: (userId: string, expGain: number): { user: User | null, leveledUp: boolean } => {
    const user = authService.getCurrentUser();
    if (!user || user.id !== userId) return { user: null, leveledUp: false };

    const currentExp = (isNaN(user.exp) || user.exp === undefined || user.exp === null) ? 0 : user.exp;
    const oldLevel = Math.floor(currentExp / 500) + 1;
    
    // Allow negative expGain but ensure exp doesn't go below 0
    const newExp = Math.max(0, currentExp + expGain);
    const newLevel = Math.floor(newExp / 500) + 1;
    
    const updates: Partial<User> = {
      exp: newExp,
      level: newLevel
    };

    // Update streak logic
    const today = new Date().toISOString().split('T')[0];
    if (user.lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (user.lastActiveDate === yesterdayStr) {
        updates.streak = (user.streak || 0) + 1;
      } else {
        updates.streak = 1; // Reset if missed a day or first time
      }
      updates.lastActiveDate = today;
    }

    const updatedUser = authService.updateUser(userId, updates);
    return { 
      user: updatedUser, 
      leveledUp: newLevel > oldLevel 
    };
  }
};
