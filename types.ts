
export enum EisenhowerQuadrant {
  DO_FIRST = 'Do First', // Urgent & Important
  SCHEDULE = 'Schedule', // Not Urgent & Important
  DELEGATE = 'Delegate', // Urgent & Not Important
  ELIMINATE = 'Eliminate' // Not Urgent & Not Important
}

export enum TaskDifficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export enum TaskImportance {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  deadline: string;
  examDate?: string;
  difficulty: TaskDifficulty;
  importance: TaskImportance;
  estimatedHours: number;
  quadrant?: EisenhowerQuadrant;
  reasoning?: string;
  isAnalyzed: boolean;
  isCompleted: boolean;
  completedAt?: number;
  createdAt: number;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  taskId?: string; 
  title: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  day: string;       // Monday, Tuesday, etc. (Legacy)
  date: string;      // YYYY-MM-DD (Start date for recurring, or the date for single)
  isCommitment?: boolean;
  isRecurring?: boolean;
  recurrence?: {
    frequency: 'daily' | 'weekly';
    daysOfWeek?: number[]; // 0-6 (Sun-Sat)
    endDate?: string;      // YYYY-MM-DD
  };
}

export interface User {
  id: string;
  username: string;
  studentId: string;
  email: string;
  password?: string;
  bio?: string;
  avatarColor?: string;
  themeColor?: string;
  isDarkMode?: boolean;
  exp: number;
  level: number;
  streak: number;
  lastActiveDate?: string; // YYYY-MM-DD
  hasSeenOnboarding: boolean;
  createdAt: number;
}

export interface Feedback {
  id: string;
  userId: string;
  username: string;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  message: string;
  rating: number;
  createdAt: number;
}

export interface AppData {
  users: User[];
  tasks: Task[];
  calendar: CalendarEvent[];
  feedback: Feedback[];
}
