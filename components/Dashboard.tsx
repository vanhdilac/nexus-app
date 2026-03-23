
import React, { useMemo, useState, useEffect } from 'react';
import { Task, User, EisenhowerQuadrant } from '../types';
import { taskService } from '../services/taskService';
import { 
  ArrowRight, ListTodo, BrainCircuit, Target, LayoutGrid, 
  GraduationCap, Flame, Star, Sparkles, Clock, Zap, CheckCircle2
} from 'lucide-react';
import { gamificationService } from '../services/gamificationService';
import { geminiService } from '../services/geminiService';

interface DashboardProps {
  tasks: Task[];
  user: User;
  onTabChange: (tab: any) => void;
}

interface Quote {
  text: string;
  author: string;
  timestamp: number;
}

export default function Dashboard({ tasks, user, onTabChange }: DashboardProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);

  const t = (en: string, vi: string) => user.language === 'vi' ? vi : en;

  const analyzedTasks = tasks.filter(t => t.isAnalyzed);
  const completedTasks = tasks.filter(t => t.isCompleted);
  const urgentTasks = tasks.filter(t => taskService.calculateQuadrant(t) === EisenhowerQuadrant.DO_FIRST && !t.isCompleted);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t(`Good morning, ${user.username}! ☕️`, `Chào buổi sáng, ${user.username}! ☕️`);
    if (hour >= 12 && hour < 18) return t(`Have a productive afternoon, ${user.username}!`, `Chúc ${user.username} buổi chiều làm việc hiệu quả!`);
    if (hour >= 18 && hour < 22) return t(`Good evening, ${user.username}!`, `Chào buổi tối, ${user.username}!`);
    return t(`You're a true night owl, ${user.username}! 🦉`, `Bạn đúng là một "cú đêm" thực thụ, ${user.username}! 🦉`);
  }, [user.username, user.language]);

  const levelInfo = useMemo(() => gamificationService.getLevelInfo(user.exp), [user.exp]);
  
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  
  const dayProgress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  useEffect(() => {
    const fetchQuote = async () => {
      const storedQuote = localStorage.getItem('nexus_motivational_quote');
      const now = Date.now();
      const sixHours = 6 * 60 * 60 * 1000;

      if (storedQuote) {
        const parsedQuote: Quote = JSON.parse(storedQuote);
        if (now - parsedQuote.timestamp < sixHours) {
          setQuote(parsedQuote);
          return;
        }
      }

      setIsGeneratingQuote(true);
      try {
        const newQuoteData = await geminiService.generateMotivationalQuote();
        const newQuote: Quote = {
          text: newQuoteData.quote,
          author: newQuoteData.author,
          timestamp: now
        };
        setQuote(newQuote);
        localStorage.setItem('nexus_motivational_quote', JSON.stringify(newQuote));
      } catch (error) {
        console.error("Failed to generate quote:", error);
        // Fallback quote
        const fallback = { text: "The secret of getting ahead is getting started.", author: "Mark Twain", timestamp: now };
        setQuote(fallback);
      } finally {
        setIsGeneratingQuote(false);
      }
    };

    fetchQuote();
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Row 1: Greeting & Streak/Level */}
        <div className="md:col-span-3 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all group">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="text-accent" size={20} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Nexus Academic Portal</span>
              </div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">{greeting}</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mb-8">
                {t(`Today you've completed`, `Hôm nay bạn đã hoàn thành`)} <span className="text-accent font-bold">{completedTasks.length}/{tasks.length}</span> {t(`goals. I believe in you, keep it up!`, `mục tiêu. Tôi tin bạn sẽ làm được, cố lên!`)}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('Daily Progress', 'Tiến độ hàng ngày')}</span>
                <span className="text-sm font-bold text-accent">{Math.round(dayProgress || 0)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-accent to-orange-400 transition-all duration-1000" 
                  style={{ width: `${dayProgress || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-1 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex flex-col justify-center items-center text-center">
          <div className={`p-6 rounded-[2.5rem] mb-4 ${user.streak > 0 ? 'bg-orange-500 text-white shadow-2xl shadow-orange-500/40' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
            <Flame size={56} fill={user.streak > 0 ? "white" : "none"} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mb-1">{t('Daily Streak', 'Chuỗi ngày')}</p>
            <p className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">{user.streak}</p>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-3">{t('Keep logging in daily! 🔥', 'Hãy duy trì đăng nhập hàng ngày! 🔥')}</p>
          </div>
        </div>

        {/* Row 2: Motivational Quote, Completion Rate, Urgent Tasks */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#3B348B] to-[#2D2769] p-10 rounded-[3rem] text-white shadow-2xl transition-all relative overflow-hidden min-h-[280px] flex flex-col justify-between border border-white/10">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <BrainCircuit size={140} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md border border-white/20">
                <Sparkles size={22} className="text-white" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/90">{t('Motivational Quote', 'Lời chúc động lực')}</h3>
            </div>
            {isGeneratingQuote ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-white/10 rounded w-3/4" />
                <div className="h-8 bg-white/10 rounded w-1/2" />
              </div>
            ) : (
              <div className="animate-in fade-in duration-700">
                <p className="text-3xl font-bold leading-tight mb-6 italic tracking-tight">
                  "{quote?.text}"
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-px w-8 bg-indigo-400" />
                  <p className="text-lg text-indigo-200 font-black">{quote?.author}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-1 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex flex-col items-center justify-center text-center">
          <div className="relative w-36 h-36 mb-6">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="text-slate-100 dark:text-slate-700"
                strokeDasharray="100, 100"
                strokeWidth="4.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-accent transition-all duration-1000 ease-out"
                strokeDasharray={`${completionRate || 0}, 100`}
                strokeWidth="4.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-900 dark:text-white">{completionRate}%</span>
              <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('Done', 'Xong')}</span>
            </div>
          </div>
          <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{t('Completion Rate', 'Tỷ lệ hoàn thành')}</p>
        </div>

        <div className="md:col-span-1 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg transition-all flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-accent p-2 rounded-xl shadow-lg shadow-orange-500/20">
              <Target size={20} className="text-white" strokeWidth={3} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent">{t('Urgent', 'Khẩn cấp')}</h3>
          </div>
          {urgentTasks.length > 0 ? (
            <div className="space-y-3 flex-1">
              {urgentTasks.slice(0, 2).map(task => (
                <div 
                  key={task.id} 
                  onClick={() => onTabChange('tasks')}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border-[4px] border-accent shadow-sm hover:scale-[1.02] hover:shadow-md transition-all cursor-pointer group/task"
                >
                  <p className="text-slate-900 text-sm font-bold text-slate-950 dark:text-white truncate group-hover/task:text-accent transition-colors">{task.title}</p>
                </div>
              ))}
              {urgentTasks.length > 2 && (
                <p className="text-[10px] text-slate-400 font-black px-1 uppercase tracking-widest">+{urgentTasks.length - 2} {t('more tasks', 'nhiệm vụ khác')}</p>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-slate-400 italic font-medium">{t('No urgent tasks', 'Không có nhiệm vụ khẩn cấp')}</p>
            </div>
          )}
          <button 
            onClick={() => onTabChange('matrix')}
            className="mt-6 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-accent bg-white dark:bg-slate-900 border-[4px] border-accent p-4 rounded-2xl hover:bg-accent hover:text-white dark:hover:bg-accent dark:hover:text-white transition-all cursor-pointer shadow-sm hover:shadow-orange-500/20 active:scale-95"
          >
            {t('Check Matrix', 'Kiểm tra Ma trận')} <ArrowRight size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Row 3: Stats */}
        <div className="md:col-span-1 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md transition-all flex items-center gap-4">
          <div className="w-14 h-14 shrink-0 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <ListTodo size={28} strokeWidth={3} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5 truncate">{t('Total Tasks', 'Tổng nhiệm vụ')}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{tasks.length}</p>
          </div>
        </div>

        <div className="md:col-span-1 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md transition-all flex items-center gap-4">
          <div className="w-14 h-14 shrink-0 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <BrainCircuit size={28} strokeWidth={3} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5 truncate">{t('AI Analyzed', 'AI Phân tích')}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{analyzedTasks.length}</p>
          </div>
        </div>

        <div className="md:col-span-1 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md transition-all flex items-center gap-4">
          <div className="w-14 h-14 shrink-0 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
            <CheckCircle2 size={28} strokeWidth={3} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5 truncate">{t('Completed', 'Đã hoàn thành')}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{completedTasks.length}</p>
          </div>
        </div>

        <div className="md:col-span-1 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md transition-all flex items-center gap-4">
          <div className="w-14 h-14 shrink-0 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
            <Zap size={28} strokeWidth={3} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5 truncate">{t('Total EXP', 'Tổng EXP')}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {Math.floor(user.exp)}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
