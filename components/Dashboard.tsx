
import React, { useMemo } from 'react';
import { Task, User, EisenhowerQuadrant } from '../types';
import { taskService } from '../services/taskService';
import { 
  ArrowRight, ListTodo, BrainCircuit, Target, LayoutGrid, 
  GraduationCap, Flame, Star, Sparkles, Clock, Zap, CheckCircle2
} from 'lucide-react';
import { gamificationService } from '../services/gamificationService';

interface DashboardProps {
  tasks: Task[];
  user: User;
  onTabChange: (tab: any) => void;
}

export default function Dashboard({ tasks, user, onTabChange }: DashboardProps) {
  const analyzedTasks = tasks.filter(t => t.isAnalyzed);
  const completedTasks = tasks.filter(t => t.isCompleted);
  const urgentTasks = tasks.filter(t => taskService.calculateQuadrant(t) === EisenhowerQuadrant.DO_FIRST && !t.isCompleted);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return `Buổi sáng vui vẻ nhé, ${user.username}! ☕️`;
    if (hour >= 12 && hour < 18) return `Buổi chiều năng suất nhé, ${user.username}!`;
    if (hour >= 18 && hour < 22) return `Chào buổi tối, ${user.username}!`;
    return `Cú đêm ơi, ${user.username}! 🦉`;
  }, [user.username]);

  const levelInfo = useMemo(() => gamificationService.getLevelInfo(user.exp), [user.exp]);
  
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  
  // Progress bar for the day (simple mock based on completed tasks)
  const dayProgress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Row 1: Greeting & Streak/Level */}
        <div className="md:col-span-3 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:scale-[1.02] transition-all group">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="text-[#f27024]" size={20} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Nexus Academic Portal</span>
              </div>
              <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">{greeting}</h1>
              <p className="text-slate-500 font-medium max-w-xl mb-8">
                Hôm nay bạn đã hoàn thành <span className="text-[#f27024] font-bold">{completedTasks.length}/{tasks.length}</span> mục tiêu. Cố gắng lên nhé!
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tiến độ ngày</span>
                <span className="text-sm font-bold text-[#f27024]">{Math.round(dayProgress || 0)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#f27024] to-orange-400 transition-all duration-1000" 
                  style={{ width: `${dayProgress || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:scale-[1.02] transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className={`p-4 rounded-2xl ${user.streak > 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
              <Flame size={32} fill={user.streak > 0 ? "currentColor" : "none"} />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Streak</p>
              <p className="text-3xl font-black text-slate-900">{user.streak}</p>
            </div>
          </div>
          <div className="mt-8">
            <div className="flex justify-between items-end mb-2">
              <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Level {levelInfo.level}</p>
              <p className="text-[10px] text-slate-400 font-bold">{user.exp % 500} / 500 EXP</p>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-1000" 
                style={{ width: `${levelInfo.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Row 2: AI Insight, Completion Rate, Urgent Tasks */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#3B348B] to-[#2D2769] p-8 rounded-3xl text-white shadow-lg hover:scale-[1.02] transition-all relative overflow-hidden min-h-[250px] flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <BrainCircuit size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                <Sparkles size={20} className="text-indigo-300" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-100">AI Daily Insight</h3>
            </div>
            <p className="text-xl font-medium leading-relaxed mb-6">
              Dựa trên lịch trình, <span className="text-orange-400 font-bold">14:00 - 16:00</span> hôm nay là 'Giờ Vàng' để bạn xử lý task quan trọng vì đây là lúc bạn tập trung nhất!
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-indigo-300 font-bold relative z-10">
            <Clock size={14} />
            <span>Cập nhật 5 phút trước</span>
          </div>
        </div>

        <div className="md:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:scale-[1.02] transition-all flex flex-col items-center justify-center text-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeDasharray="100, 100"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#f27024] transition-all duration-1000 ease-out"
                strokeDasharray={`${completionRate || 0}, 100`}
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-900">{completionRate}%</span>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Done</span>
            </div>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Completion Rate</p>
        </div>

        <div className="md:col-span-1 bg-orange-50 p-8 rounded-3xl border border-orange-100 shadow-sm hover:scale-[1.02] transition-all flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Target size={20} className="text-[#f27024]" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-orange-900">Urgent</h3>
          </div>
          {urgentTasks.length > 0 ? (
            <div className="space-y-3 flex-1">
              {urgentTasks.slice(0, 2).map(task => (
                <div key={task.id} className="bg-white p-3 rounded-xl border border-orange-200 shadow-sm">
                  <p className="text-xs font-bold text-orange-900 truncate">{task.title}</p>
                </div>
              ))}
              {urgentTasks.length > 2 && (
                <p className="text-[10px] text-orange-600 font-bold">+{urgentTasks.length - 2} tasks khác</p>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-orange-600/50 italic font-medium">No urgent tasks</p>
            </div>
          )}
          <button 
            onClick={() => onTabChange('matrix')}
            className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#f27024] hover:text-orange-700 transition-colors"
          >
            Check Matrix <ArrowRight size={14} />
          </button>
        </div>

        {/* Row 3: Stats */}
        <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:scale-[1.02] transition-all flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <ListTodo size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tasks</p>
            <p className="text-xl font-bold text-slate-900">{tasks.length}</p>
          </div>
        </div>

        <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:scale-[1.02] transition-all flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
            <BrainCircuit size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Analyzed</p>
            <p className="text-xl font-bold text-slate-900">{analyzedTasks.length}</p>
          </div>
        </div>

        <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:scale-[1.02] transition-all flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
            <p className="text-xl font-bold text-slate-900">{completedTasks.length}</p>
          </div>
        </div>

        <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:scale-[1.02] transition-all flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#f27024]">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total EXP</p>
            <p className="text-xl font-bold text-slate-900">{user.exp || 0}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
