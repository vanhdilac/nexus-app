
import React, { useState, useMemo } from 'react';
import { Task, CalendarEvent, User, EisenhowerQuadrant } from '../../types';
import { storageService } from '../../services/storageService';
import { geminiService } from '../../services/geminiService';
import { Sparkles, Save, RefreshCw, Plus, X, Trash2, Calendar as CalendarIcon, Move, ChevronLeft, ChevronRight, ListTodo, Clock } from 'lucide-react';

import { schedulerService } from '../../services/schedulerService';
import { motion, AnimatePresence } from 'framer-motion';
import NewCommitmentModal from './NewCommitmentModal';

import { gamificationService } from '../../services/gamificationService';
import confetti from 'canvas-confetti';

interface CalendarViewProps {
  tasks: Task[];
  userId: string;
  calendar: CalendarEvent[];
  onCalendarUpdated: () => void;
  onTasksUpdated: () => void;
  onUserUpdated: (user: User) => void;
}

export default function CalendarView({ tasks, userId, calendar, onCalendarUpdated, onTasksUpdated, onUserUpdated }: CalendarViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toast, setToast] = useState<string | null>(null);

  // Update current time every minute
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  // Use Monday of the current week as the reference point
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0,0,0,0);
    return monday;
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<CalendarEvent[] | null>(null);
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);
  const [movingEvent, setMovingEvent] = useState<CalendarEvent | null>(null);
  
  const [moveDate, setMoveDate] = useState('');
  const [moveTime, setMoveTime] = useState('');

  // Calculate the 7 days of the current week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return {
        date: d,
        dateStr: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate()
      };
    });
  }, [weekStart]);

  const handleCompleteTaskFromCalendar = (evt: CalendarEvent) => {
    if (evt.isCommitment || !evt.taskId) return;
    
    const task = tasks.find(t => t.id === evt.taskId);
    if (!task) return;

    const isNowCompleted = !task.isCompleted;
    const updates: Partial<Task> = {
      isCompleted: isNowCompleted,
      completedAt: isNowCompleted ? Date.now() : undefined
    };

    const data = storageService.getData();
    const taskIndex = data.tasks.findIndex(t => t.id === task.id);
    if (taskIndex !== -1) {
      let exp;
      if (isNowCompleted) {
        // Calculate after update to get the multiplier for completing
        data.tasks[taskIndex] = { ...data.tasks[taskIndex], ...updates };
        exp = gamificationService.calculateTaskExp(data.tasks[taskIndex]);
      } else {
        // Calculate before update to get the exact same multiplier that was added
        exp = gamificationService.calculateTaskExp(data.tasks[taskIndex]);
        data.tasks[taskIndex] = { ...data.tasks[taskIndex], ...updates };
      }
      
      storageService.saveData(data);
      const result = gamificationService.updateUserProgress(userId, isNowCompleted ? exp : -exp);
      
      if (result.user) {
        onUserUpdated(result.user);
        
        if (isNowCompleted) {
          const foodGain = Math.floor(exp / 10);
          setToast(`+ ${foodGain} Pet food! You're amazing, ${result.user.username}! 🚀`);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f27024', '#3b82f6', '#10b981']
          });
        } else {
          setToast(`- ${exp} EXP! Don't give up! 💪`);
        }
        setTimeout(() => setToast(null), 3000);
      }
      
      onTasksUpdated();
    }
  };

  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 7; // 07:00 to 22:00
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const handleGeneratePlan = async () => {
    const pendingTasks = tasks.filter(t => t.isAnalyzed && !t.isCompleted);
    if (pendingTasks.length === 0) {
      setToast("No pending tasks to schedule!");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const existingCommitments = calendar.filter(e => e.isCommitment);
      
      // Try current week first
      let currentWeekResults = schedulerService.autoSchedule(tasks, existingCommitments, weekStart, userId);
      
      // Try next week for remaining tasks or if current week is full
      const nextWeekStart = new Date(weekStart);
      nextWeekStart.setDate(weekStart.getDate() + 7);
      
      // We need to combine the results. To do this properly, we should pass the newly scheduled events from week 1
      // as "existing events" for week 2.
      let nextWeekResults = schedulerService.autoSchedule(tasks, [...existingCommitments, ...currentWeekResults], nextWeekStart, userId);
      
      const totalResults = [...currentWeekResults, ...nextWeekResults];

      if (totalResults.length === 0) {
        setToast("No free slots available in the next 2 weeks! 😅");
      } else {
        setToast(`AI has optimized ${totalResults.length} study sessions for you in the next 2 weeks! ✨`);
        // Only keep commitments from the original calendar and add the new AI results
        setPreviewEvents([...existingCommitments, ...totalResults]);
      }
      
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast("AI scheduling failed.");
      setTimeout(() => setToast(null), 3000);
    }
    setIsGenerating(false);
  };

  const handleAddCommitment = (newEvent: CalendarEvent) => {
    storageService.saveCalendarEvents([...calendar, newEvent], userId);
    onCalendarUpdated();
    setShowCommitmentForm(false);
  };

  const handleReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingEvent) return;

    const [h, m] = moveTime.split(':').map(Number);
    const formattedEnd = `${(h+1).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    const updated = calendar.map(evt => {
      if (evt.id === movingEvent.id) {
        return { ...evt, date: moveDate, startTime: moveTime, endTime: formattedEnd };
      }
      return evt;
    });

    storageService.saveCalendarEvents(updated, userId);
    onCalendarUpdated();
    setMovingEvent(null);
  };

  const deleteEvent = (id: string) => {
    const updated = calendar.filter(e => e.id !== id);
    storageService.saveCalendarEvents(updated, userId);
    onCalendarUpdated();
  };

  const getEventColor = (evt: CalendarEvent) => {
    if (evt.isCommitment) {
      return evt.isRecurring 
        ? 'bg-slate-100 border-slate-200 text-slate-500' 
        : 'bg-slate-50 border-slate-200 text-slate-600';
    }
    
    const task = tasks.find(t => t.id === evt.taskId);
    if (!task) return 'bg-indigo-50 border-indigo-200 text-indigo-700';

    switch (task.quadrant) {
      case EisenhowerQuadrant.DO_FIRST:
        return 'bg-rose-50 border-rose-200 text-rose-700';
      case EisenhowerQuadrant.SCHEDULE:
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case EisenhowerQuadrant.DELEGATE:
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case EisenhowerQuadrant.ELIMINATE:
        return 'bg-slate-100 border-slate-300 text-slate-600';
      default:
        return 'bg-indigo-50 border-indigo-200 text-indigo-700';
    }
  };

  const displayedEvents = previewEvents || calendar;
  const scheduledTaskIds = new Set(displayedEvents.map(e => e.taskId).filter(Boolean));

  return (
    <div className="flex flex-col gap-6 pb-24 animate-in fade-in duration-500 relative">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-3 border border-white/10"
          >
            <Sparkles className="text-indigo-400" size={18} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-sm">
            <CalendarIcon size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Study Planner</h1>
            <div className="flex items-center gap-3 mt-1">
              <button onClick={prevWeek} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronLeft size={16} /></button>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                Week of {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <button onClick={nextWeek} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowCommitmentForm(true)} className="px-4 py-2.5 rounded-xl border-2 border-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50">
            Add Commitment
          </button>
          {previewEvents ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setPreviewEvents(null)} className="px-4 py-2 text-slate-400 font-bold text-xs uppercase tracking-widest">Discard</button>
              <button onClick={() => { storageService.saveCalendarEvents(previewEvents, userId); setPreviewEvents(null); onCalendarUpdated(); }} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Save AI Week</button>
            </div>
          ) : (
            <button onClick={handleGeneratePlan} disabled={isGenerating} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-50">
              {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
              AI Week Planner
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-72 bg-white rounded-[2rem] border border-slate-200 p-6 flex-shrink-0 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
            <ListTodo size={18} className="text-indigo-600" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Task Inbox</h3>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {tasks.filter(t => t.isAnalyzed && !t.isCompleted).map(t => (
              <div key={t.id} className={`p-3 rounded-xl border transition-all ${scheduledTaskIds.has(t.id) ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-bold text-slate-800 truncate">{t.title}</p>
                  {scheduledTaskIds.has(t.id) && <CalendarIcon size={12} className="text-emerald-500" />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase text-indigo-400 tracking-tighter">Due: {t.deadline}</span>
                  <span className="text-[8px] font-black uppercase text-slate-400">{t.estimatedHours}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Time Grid */}
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar">
            <div className="w-full min-w-[800px] lg:min-w-0">
              {/* Day Header Row */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100 bg-slate-50/50">
                <div className="border-r border-slate-100 flex items-center justify-center">
                  <Clock size={14} className="text-slate-300" />
                </div>
                {weekDays.map(d => (
                  <div key={d.dateStr} className="py-4 text-center border-r border-slate-100 last:border-r-0">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">{d.label}</span>
                    <span className={`text-lg font-black ${d.dateStr === new Date().toISOString().split('T')[0] ? 'text-indigo-600' : 'text-slate-800'}`}>{d.dayNum}</span>
                  </div>
                ))}
              </div>

              {/* Time Slots Body */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] relative h-[800px] overflow-y-auto custom-scrollbar">
                {/* Hour Indicators */}
                <div className="flex flex-col">
                  {timeSlots.map(time => (
                    <div key={time} className="h-20 border-b border-slate-50 border-r border-slate-100 flex items-start justify-center pt-2">
                      <span className="text-[9px] font-black text-slate-400">{time}</span>
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {weekDays.map(d => {
                  const dayEvents = displayedEvents.filter(evt => {
                    // Single event match
                    if (evt.date === d.dateStr) return true;
                    
                    // Recurring event match
                    if (evt.isRecurring && evt.recurrence) {
                      const eventStart = new Date(evt.date);
                      const currentDay = new Date(d.dateStr);
                      
                      // Check if current day is within range
                      if (currentDay < eventStart) return false;
                      if (evt.recurrence.endDate && currentDay > new Date(evt.recurrence.endDate)) return false;
                      
                      // Check frequency
                      if (evt.recurrence.frequency === 'weekly') {
                        return evt.recurrence.daysOfWeek?.includes(currentDay.getDay());
                      }
                      if (evt.recurrence.frequency === 'daily') return true;
                    }
                    return false;
                  });
                  const isToday = d.dateStr === currentTime.toISOString().split('T')[0];
                  const currentHour = currentTime.getHours();
                  const currentMin = currentTime.getMinutes();
                  const timeIndicatorTop = (currentHour - 7) * 80 + (currentMin / 60) * 80;

                  return (
                    <div key={d.dateStr} className="relative border-r border-slate-100 last:border-r-0">
                      {/* Background Grid Lines */}
                      {timeSlots.map(time => (
                        <div key={time} className="h-20 border-b border-slate-50" />
                      ))}

                      {/* Current Time Indicator */}
                      {isToday && currentHour >= 7 && currentHour < 22 && (
                        <div 
                          className="absolute left-0 right-0 h-0.5 bg-orange-500 z-30 pointer-events-none flex items-center"
                          style={{ top: `${timeIndicatorTop}px` }}
                        >
                          <div className="w-2 h-2 rounded-full bg-orange-500 -ml-1 shadow-sm" />
                        </div>
                      )}

                      {/* Absolute Events */}
                      {dayEvents.map(evt => {
                        const [sh, sm] = evt.startTime.split(':').map(Number);
                        const [eh, em] = evt.endTime.split(':').map(Number);
                        const topPos = (sh - 7) * 80 + (sm / 60) * 80;
                        const height = (eh - sh) * 80 + ((em - sm) / 60) * 80;
                        const colorClasses = getEventColor(evt);

                        return (
                          <div 
                            key={evt.id}
                            onClick={() => {
                              if (evt.isCommitment) return;
                              handleCompleteTaskFromCalendar(evt);
                            }}
                            className={`absolute left-1.5 right-1.5 p-2 rounded-xl border shadow-sm transition-all cursor-pointer z-10 hover:z-20 hover:scale-[1.02] flex flex-col group overflow-hidden ${colorClasses} ${tasks.find(t => t.id === evt.taskId)?.isCompleted ? 'opacity-40 grayscale-[0.5]' : ''}`}
                            style={{ top: `${topPos}px`, height: `${height}px` }}
                          >
                            {/* Hover Tip */}
                            {!evt.isCommitment && (
                              <div className="absolute inset-0 bg-slate-900/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2 text-center z-20">
                                <p className="text-[8px] font-black uppercase tracking-widest leading-tight">
                                  {tasks.find(t => t.id === evt.taskId)?.isCompleted ? 'Click to undo' : 'Click to complete and earn EXP!'}
                                </p>
                              </div>
                            )}

                            <div className="flex justify-between items-start mb-1 relative z-10">
                              <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">
                                {evt.startTime} - {evt.endTime}
                              </span>
                              {evt.isCommitment && !previewEvents && (
                                <button onClick={(e) => { e.stopPropagation(); deleteEvent(evt.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-400">
                                  <Trash2 size={10} />
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] font-black leading-tight relative z-10 truncate">
                              {evt.title}
                            </p>
                            {!evt.isCommitment && (
                              <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                                <Move size={10} className="opacity-50" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {movingEvent && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Reschedule</h2>
              <button onClick={() => setMovingEvent(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleReschedule} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session</p>
                <p className="font-bold text-slate-800 text-sm">{movingEvent.title}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">New Date</label>
                <input type="date" required value={moveDate} onChange={e => setMoveDate(e.target.value)} className="w-full bg-white px-5 py-4 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-indigo-600" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Time</label>
                <input type="time" required value={moveTime} onChange={e => setMoveTime(e.target.value)} className="w-full bg-white px-5 py-4 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-indigo-600" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 mt-4">Update Task</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Commitment Modal */}
      <NewCommitmentModal 
        isOpen={showCommitmentForm}
        onClose={() => setShowCommitmentForm(false)}
        onAdd={handleAddCommitment}
        userId={userId}
      />
    </div>
  );
}
