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
          reminders.push(`[Nexus Reminder] T-2: Kỳ thi "${task.title}" đang đến rất gần! Hãy tập trung ôn luyện ngay hôm nay để đạt kết quả tốt nhất nhé! 📚`);
        } else if (diffDays === 1) {
          reminders.push(`[Nexus Reminder] T-1: Ngày mai là kỳ thi "${task.title}" rồi! Đừng quên chuẩn bị đầy đủ đồ dùng: Thẻ sinh viên, bút, máy tính... và đi ngủ sớm nhé! 🎒✨`);
        }
      }
    });

    return reminders;
  }
};
