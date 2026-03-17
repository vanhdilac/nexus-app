
import { User } from '../types';
import { storageService } from './storageService';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  deleteUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const authService = {
  getCurrentUser: async (): Promise<User | null> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    return await storageService.getUser(firebaseUser.uid);
  },

  login: async (email: string, password?: string): Promise<User | null> => {
    if (!password) return null;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return await storageService.getUser(userCredential.user.uid);
  },

  register: async (username: string, studentId: string, email: string, password?: string): Promise<User | null> => {
    if (!password) return null;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    const newUser: User = {
      id: userId,
      username,
      studentId: studentId.toUpperCase(),
      email,
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

    await storageService.saveUser(newUser);
    return newUser;
  },

  logout: async (): Promise<void> => {
    await signOut(auth);
  },

  deleteCurrentAccount: async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await deleteUser(user);
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<User | null> => {
    // Force save without checking existence to prevent stuck states
    const user = await storageService.getUser(userId);
    const updatedUser = { ...(user || {}), ...updates } as User;
    await storageService.saveUser(updatedUser);
    return updatedUser;
  },

  checkAndUpdateStreak: async (user: User): Promise<User | null> => {
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
        return await authService.updateUser(user.id, petUpdate);
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

    return await authService.updateUser(user.id, { 
      streak: newStreak, 
      lastActiveDate: today,
      ...petUpdate
    });
  }
};
