import { Task } from '../types';

export const notificationService = {
  checkExamReminders: (tasks: Task[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reminders: string[] = [];

    tasks.forEach(task => {
      if (task.examDate) {
        const examDate = new Date(task.examDate);
        examDate.setHours(0, 0, 0, 0);
        
        const diffTime = examDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 2) {
          reminders.push(`[Nexus Reminder] T-2: The exam for "${task.title}" is approaching! Focus on your revision today to achieve the best results! 📚`);
        } else if (diffDays === 1) {
          reminders.push(`[Nexus Reminder] T-1: Tomorrow is the exam for "${task.title}"! Don't forget to prepare everything: Student ID, pens, calculator... and get to bed early! 🎒✨`);
        }
      }
    });

    return reminders;
  }
};
