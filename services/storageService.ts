
import { AppData, User, Task, CalendarEvent } from '../types';

const STORAGE_KEY = 'academia_flow_data';

const getInitialData = (): AppData => ({
  users: [],
  tasks: [],
  calendar: [],
  feedback: []
});

export const storageService = {
  getData: (): AppData => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return getInitialData();
    const parsed = JSON.parse(data);
    // Ensure feedback array exists for older data
    if (!parsed.feedback) parsed.feedback = [];
    return parsed;
  },

  saveData: (data: AppData): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  saveFeedback: (feedback: any): void => {
    const data = storageService.getData();
    data.feedback.push(feedback);
    storageService.saveData(data);
  },

  getTasksByUserId: (userId: string): Task[] => {
    const data = storageService.getData();
    return [...data.tasks.filter(t => t.userId === userId)];
  },

  saveTask: (task: Task): void => {
    const data = storageService.getData();
    const existingIndex = data.tasks.findIndex(t => t.id === task.id);
    if (existingIndex > -1) {
      data.tasks[existingIndex] = { ...task };
    } else {
      data.tasks.push({ ...task });
    }
    storageService.saveData(data);
  },

  deleteTask: (taskId: string): void => {
    const data = storageService.getData();
    data.tasks = data.tasks.filter(t => t.id !== taskId);
    data.calendar = data.calendar.filter(e => e.taskId !== taskId);
    storageService.saveData(data);
  },

  getCalendarByUserId: (userId: string): CalendarEvent[] => {
    const data = storageService.getData();
    // Corrected: Filter by userId directly
    return [...data.calendar.filter(e => e.userId === userId)];
  },

  saveCalendarEvents: (events: CalendarEvent[], userId: string): void => {
    const data = storageService.getData();
    // Corrected: Remove all previous events for THIS user before saving the new set
    data.calendar = data.calendar.filter(e => e.userId !== userId);
    data.calendar.push(...events);
    storageService.saveData(data);
  }
};
