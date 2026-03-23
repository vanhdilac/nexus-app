
import { User, Rank } from '../types';
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

  login: async (studentId: string, password?: string): Promise<User | null> => {
    if (!password) return null;
    // Sử dụng định dạng email dựa trên Student ID với đuôi @gmail.com
    const authEmail = `${studentId.toLowerCase()}@gmail.com`;
    const userCredential = await signInWithEmailAndPassword(auth, authEmail, password);
    return await storageService.getUser(userCredential.user.uid);
  },

  register: async (username: string, studentId: string, email: string, password?: string): Promise<User | null> => {
    if (!password) return null;
    // Sử dụng Student ID để tạo tài khoản Auth với đuôi @gmail.com
    const authEmail = `${studentId.toLowerCase()}@gmail.com`;
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
      const userId = userCredential.user.uid;

      const newUser: User = {
        id: userId,
        username,
        studentId: studentId.toUpperCase(),
        email, // Email thực tế của sinh viên dùng để liên lạc, lưu trong Firestore
        exp: 0,
        level: 1,
        rank: Rank.UNRANKED,
        rankExp: 0,
        streak: 0,
        hasSeenOnboarding: false,
        language: 'en',
        createdAt: Date.now()
      };

      await storageService.saveUser(newUser);
      return newUser;
    } catch (error: any) {
      // Auto-Heal logic: If Auth exists but Firestore is missing
      if (error.code === 'auth/email-already-in-use') {
        try {
          // Try to sign in to check if it's a "limbo" account
          const userCredential = await signInWithEmailAndPassword(auth, authEmail, password);
          const userId = userCredential.user.uid;
          const existingUser = await storageService.getUser(userId);
          
          if (!existingUser) {
            // Account exists in Auth but NOT in Firestore. Let's recreate it.
            const recoveredUser: User = {
              id: userId,
              username,
              studentId: studentId.toUpperCase(),
              email,
              exp: 0,
              level: 1,
              rank: Rank.UNRANKED,
              rankExp: 0,
              streak: 0,
              hasSeenOnboarding: false,
              language: 'en',
              createdAt: Date.now()
            };
            await storageService.saveUser(recoveredUser);
            return recoveredUser;
          }
        } catch (loginError) {
          // If login fails (wrong password for existing account), re-throw original error
          throw error;
        }
      }
      throw error;
    }
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

    // Ensure rank exists if it doesn't (for existing users)
    const rankUpdate: Partial<User> = (!user.rank || user.rankExp === undefined) ? {
      rank: user.rank || Rank.UNRANKED,
      rankExp: user.rankExp || 0
    } : {};

    if (lastActive === today) {
      if (!user.rank || user.rankExp === undefined) {
        return await authService.updateUser(user.id, rankUpdate);
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
      ...rankUpdate
    });
  }
};
