
import { User } from '../types';
import { storageService } from './storageService';

const AUTH_KEY = 'nexus_auth_user';

export const authService = {
  getCurrentUser: (): User | null => {
    const user = localStorage.getItem(AUTH_KEY);
    return user ? JSON.parse(user) : null;
  },

  login: (studentId: string, password?: string): User | null => {
    const data = storageService.getData();
    const user = data.users.find(u => u.studentId === studentId && u.password === password);
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  register: (username: string, studentId: string, email: string, password?: string): User | null => {
    const data = storageService.getData();
    if (data.users.find(u => u.studentId === studentId)) return null;

    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      studentId,
      email,
      password,
      exp: 0,
      level: 1,
      streak: 0,
      hasSeenOnboarding: false,
      createdAt: Date.now(),
      pet: {
        name: 'Buddy',
        level: 0,
        food: 0,
        colorTheme: 1 as 1 | 2 | 3,
        isSleeping: false,
        lastSleepTime: 0,
        isHidden: false
      }
    };

    data.users.push(newUser);
    storageService.saveData(data);
    localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    return newUser;
  },

  logout: (): void => {
    localStorage.removeItem(AUTH_KEY);
  },

  getUserByStudentId: (studentId: string): User | null => {
    const data = storageService.getData();
    return data.users.find(u => u.studentId === studentId.toUpperCase()) || null;
  },

  requestPasswordReset: (studentId: string): string | null => {
    const data = storageService.getData();
    const user = data.users.find(u => u.studentId === studentId.toUpperCase());
    if (!user) return null;

    // Generate a code and store it
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem(`reset_code_${user.studentId}`, resetCode);
    
    return resetCode;
  },

  verifyResetCode: (studentId: string, code: string): boolean => {
    const storedCode = localStorage.getItem(`reset_code_${studentId.toUpperCase()}`);
    return storedCode === code;
  },

  resetPassword: (studentId: string, newPassword: string): boolean => {
    const data = storageService.getData();
    const userIndex = data.users.findIndex(u => u.studentId === studentId.toUpperCase());
    if (userIndex === -1) return false;

    data.users[userIndex].password = newPassword;
    storageService.saveData(data);
    localStorage.removeItem(`reset_code_${studentId.toUpperCase()}`);
    return true;
  },

  updateUser: (userId: string, updates: Partial<User>): User | null => {
    const data = storageService.getData();
    const userIndex = data.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    const updatedUser = { ...data.users[userIndex], ...updates };
    data.users[userIndex] = updatedUser;
    storageService.saveData(data);

    // Update current session if it's the same user
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
    }

    return updatedUser;
  },

  checkAndUpdateStreak: (user: User): User | null => {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = user.lastActiveDate;

    // Ensure pet exists if it doesn't (for existing users)
    const petUpdate: Partial<User> = !user.pet ? {
      pet: {
        name: 'Buddy',
        level: 0,
        food: Math.floor((user.exp || 0) / 10), // Convert existing EXP to food
        colorTheme: 1 as 1 | 2 | 3,
        isSleeping: false,
        lastSleepTime: 0,
        lastPettedTime: Date.now(),
        isHidden: false
      }
    } : {};

    if (lastActive === today) {
      if (!user.pet) {
        return authService.updateUser(user.id, petUpdate);
      }
      return user;
    }

    let newStreak = user.streak;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActive === yesterdayStr) {
      newStreak += 1;
    } else {
      newStreak = 1; // Reset to 1 since they are logging in today
    }

    return authService.updateUser(user.id, { 
      streak: newStreak, 
      lastActiveDate: today,
      ...petUpdate
    });
  }
};
