
import React from 'react';
import { Task } from '../types';
import { GraduationCap, Clock } from 'lucide-react';

interface UpcomingExamsProps {
  tasks: Task[];
}

export default function UpcomingExams({ tasks }: UpcomingExamsProps) {
  const examTasks = tasks
    .filter(t => t.examDate)
    .sort((a, b) => new Date(a.examDate!).getTime() - new Date(b.examDate!).getTime())
    .slice(0, 3);

  const getDaysLeft = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = dateStr.split('-').map(Number);
    const examDate = new Date(y, m - 1, d);
    examDate.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (examTasks.length === 0) return null;

  return (
    <div className="mt-8 px-2">
      <div className="flex items-center gap-2 mb-4 px-2">
        <GraduationCap size={16} className="text-rose-500" />
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upcoming Tests/Exams</h3>
      </div>
      <div className="space-y-3">
        {examTasks.map(task => {
          const daysLeft = getDaysLeft(task.examDate!);
          const isUrgent = daysLeft <= 3;
          
          return (
            <div key={task.id} className={`p-3 rounded-2xl border transition-all ${isUrgent ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
              <p className={`font-bold text-xs truncate ${isUrgent ? 'text-rose-700' : 'text-slate-700'}`}>
                {task.title}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px] font-medium text-slate-400">{task.examDate}</span>
                <span className={`text-[9px] font-extrabold flex items-center gap-1 ${isUrgent ? 'text-rose-600 animate-pulse' : 'text-slate-500'}`}>
                  <Clock size={10} />
                  {daysLeft < 0 ? 'Already passed' : daysLeft === 0 ? "It's today!" : `${daysLeft} days left`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
