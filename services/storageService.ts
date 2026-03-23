
import { AppData, User, Task, CalendarEvent, Feedback } from '../types';
import { db, auth } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const storageService = {
  getUser: async (userId: string): Promise<User | null> => {
    const path = `users/${userId}`;
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as User : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null; // Should not reach here as handleFirestoreError throws
    }
  },

  saveUser: async (user: User): Promise<void> => {
    const path = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  getTasksByUserId: async (userId: string): Promise<Task[]> => {
    const path = 'tasks';
    try {
      const q = query(collection(db, 'tasks'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Task);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  saveTask: async (task: Task): Promise<void> => {
    const path = `tasks/${task.id}`;
    try {
      await setDoc(doc(db, 'tasks', task.id), task);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  deleteTask: async (taskId: string): Promise<void> => {
    const path = `tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      // Also delete associated calendar events
      const q = query(collection(db, 'calendar'), where('taskId', '==', taskId));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, 'calendar', d.id)));
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  getCalendarByUserId: async (userId: string): Promise<CalendarEvent[]> => {
    const path = 'calendar';
    try {
      const q = query(collection(db, 'calendar'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as CalendarEvent);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  saveCalendarEvents: async (events: CalendarEvent[], userId: string): Promise<void> => {
    const path = 'calendar';
    try {
      const q = query(collection(db, 'calendar'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, 'calendar', d.id)));
      await Promise.all(deletePromises);

      const savePromises = events.map(event => setDoc(doc(db, 'calendar', event.id), event));
      await Promise.all(savePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  saveFeedback: async (feedback: Feedback): Promise<void> => {
    const path = `feedback/${feedback.id}`;
    try {
      await setDoc(doc(db, 'feedback', feedback.id), feedback);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  wipeAllData: async (): Promise<void> => {
    try {
      // This is a dangerous operation, only for admin use during system reset
      const collections = ['users', 'tasks', 'calendar', 'feedback'];
      for (const colName of collections) {
        const querySnapshot = await getDocs(collection(db, colName));
        const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, colName, d.id)));
        await Promise.all(deletePromises);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'all_collections');
    }
  },

  subscribeToTasks: (userId: string, callback: (tasks: Task[]) => void) => {
    const path = 'tasks';
    const q = query(collection(db, 'tasks'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => doc.data() as Task));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  subscribeToCalendar: (userId: string, callback: (events: CalendarEvent[]) => void) => {
    const path = 'calendar';
    const q = query(collection(db, 'calendar'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => doc.data() as CalendarEvent));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  getAllUsers: async (): Promise<User[]> => {
    const path = 'users';
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    const path = `users/${userId}`;
    try {
      // 1. Delete user from Firebase Auth via our API
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        const response = await fetch('/api/admin/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: userId, idToken })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.activationUrl) {
            console.error("CRITICAL: Identity Toolkit API is disabled. Please enable it here:", errorData.activationUrl);
            throw new Error(`Admin must enable Identity Toolkit API to delete accounts. Visit: ${errorData.activationUrl}`);
          }
          console.warn("Could not delete user from Auth (they might not exist or API failed):", errorData.error);
        } else {
          console.log(`Successfully deleted user ${userId} from Auth`);
        }
      }

      // 2. Delete user doc from Firestore
      await deleteDoc(doc(db, 'users', userId));
      
      // 3. Delete associated data
      const collections = ['tasks', 'calendar', 'feedback'];
      for (const colName of collections) {
        const q = query(collection(db, colName), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, colName, d.id)));
        await Promise.all(deletePromises);
      }
      
      console.log(`Successfully deleted all Firestore data for user ${userId}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
