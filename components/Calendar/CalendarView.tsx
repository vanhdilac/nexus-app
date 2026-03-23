
import React, { useState, useMemo, useEffect } from 'react';
import { Task, CalendarEvent, User, EisenhowerQuadrant } from '../../types';
import { storageService } from '../../services/storageService';
import { geminiService } from '../../services/geminiService';
import { Sparkles, Save, RefreshCw, Plus, X, Trash2, Calendar as CalendarIcon, Move, ChevronLeft, ChevronRight, ListTodo, Clock } from 'lucide-react';

import { schedulerService } from '../../services/schedulerService';
import { motion, AnimatePresence } from 'framer-motion';
import NewCommitmentModal from './NewCommitmentModal';

import { gamificationService } from '../../services/gamificationService';
import confetti from 'canvas-confetti';

import { 
  DndContext, 
  DragOverlay, 
  useDraggable, 
  useDroppable, 
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  rectIntersection,
  KeyboardSensor,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  userId: string;
  calendar: CalendarEvent[];
  onCalendarUpdated: () => void;
  onTasksUpdated: () => void;
  onUserUpdated: (user: User) => void;
}

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

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

  const [isInboxExpanded, setIsInboxExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<CalendarEvent[] | null>(null);
  const [optimisticCalendar, setOptimisticCalendar] = useState<CalendarEvent[] | null>(null);
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);
  const [movingEvent, setMovingEvent] = useState<CalendarEvent | null>(null);
  
  const [moveDate, setMoveDate] = useState('');
  const [moveTime, setMoveTime] = useState('');
  const [moveEndTime, setMoveEndTime] = useState('');
  const [moveIsCompleted, setMoveIsCompleted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Clear optimistic calendar when real data arrives with a small delay to prevent flickering
  useEffect(() => {
    const timer = setTimeout(() => {
      setOptimisticCalendar(null);
    }, 150);
    return () => clearTimeout(timer);
  }, [calendar]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over) {
      const activeId = active.id as string;
      const [date, time] = (over.id as string).split('|');
      const newStartMins = timeToMinutes(time);
      
      const existingEvent = calendar.find(e => e.id === activeId);
      let durationMinutes = 60;
      let originalEvent: CalendarEvent | null = null;

      if (existingEvent) {
        if (existingEvent.date === date && existingEvent.startTime === time) return;
        durationMinutes = timeToMinutes(existingEvent.endTime) - timeToMinutes(existingEvent.startTime);
        originalEvent = existingEvent;
      }

      const newEndMins = newStartMins + durationMinutes;
      const dayEvents = calendar.filter(e => e.date === date && e.id !== activeId);
      
      // 1. Check for exact swap
      const swapTarget = dayEvents.find(e => 
        timeToMinutes(e.startTime) === newStartMins && 
        timeToMinutes(e.endTime) === newEndMins
      );

      let updatedCalendar = [...calendar];

      if (swapTarget && originalEvent && originalEvent.date === date) {
        updatedCalendar = calendar.map(e => {
          if (e.id === activeId) return { ...e, startTime: swapTarget.startTime, endTime: swapTarget.endTime };
          if (e.id === swapTarget.id) return { ...e, startTime: originalEvent!.startTime, endTime: originalEvent!.endTime };
          return e;
        });
      } else {
        // 2. Handle Overlap (Push) Logic
        const overlapping = dayEvents.filter(e => {
          const s = timeToMinutes(e.startTime);
          const f = timeToMinutes(e.endTime);
          return (newStartMins < f && newEndMins > s);
        });

        if (overlapping.length > 0) {
          const firstOverlapped = overlapping[0];
          const isFromAbove = !originalEvent || originalEvent.date !== date || timeToMinutes(originalEvent.startTime) < newStartMins;
          
          if (isFromAbove) {
            // Push Down
            let currentEnd = newEndMins;
            const sortedDayEvents = [...dayEvents].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
            
            const shiftedEvents = sortedDayEvents.map(e => {
              const s = timeToMinutes(e.startTime);
              const f = timeToMinutes(e.endTime);
              const dur = f - s;
              
              if (s < currentEnd && f > newStartMins) {
                const newS = currentEnd;
                const newF = newS + dur;
                currentEnd = newF;
                return { ...e, startTime: minutesToTime(newS), endTime: minutesToTime(newF) };
              }
              return e;
            });

            updatedCalendar = [
              ...calendar.filter(e => e.date !== date && e.id !== activeId),
              ...shiftedEvents
            ];
          } else {
            // Push Up
            let currentStart = newStartMins;
            const sortedDayEvents = [...dayEvents].sort((a, b) => timeToMinutes(b.startTime) - timeToMinutes(a.startTime));
            
            const shiftedEvents = sortedDayEvents.map(e => {
              const s = timeToMinutes(e.startTime);
              const f = timeToMinutes(e.endTime);
              const dur = f - s;
              
              if (f > currentStart && s < newEndMins) {
                const newF = currentStart;
                const newS = newF - dur;
                currentStart = newS;
                return { ...e, startTime: minutesToTime(newS), endTime: minutesToTime(newF) };
              }
              return e;
            });

            updatedCalendar = [
              ...calendar.filter(e => e.date !== date && e.id !== activeId),
              ...shiftedEvents
            ];
          }
        } else {
          updatedCalendar = calendar.filter(e => e.id !== activeId);
        }

        // Add/Update the active event
        const baseEvent = existingEvent || {
          id: crypto.randomUUID(),
          userId,
          taskId: tasks.find(t => t.id === activeId)?.id,
          title: tasks.find(t => t.id === activeId)?.title || 'New Event',
          isCommitment: false,
          day: new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
        };

        updatedCalendar.push({
          ...baseEvent,
          date,
          startTime: minutesToTime(newStartMins),
          endTime: minutesToTime(newEndMins)
        } as CalendarEvent);
      }

      setOptimisticCalendar(updatedCalendar);
      storageService.saveCalendarEvents(updatedCalendar, userId);
      onCalendarUpdated();
    }
  };

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

  const timeSlots = Array.from({ length: 32 }, (_, i) => {
    const hour = Math.floor(i / 2) + 7; // 07:00 to 22:30
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
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

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingEvent) return;

    const updated = calendar.map(evt => {
      if (evt.id === movingEvent.id) {
        return { ...evt, date: moveDate, startTime: moveTime, endTime: moveEndTime };
      }
      return evt;
    });

    // Handle task completion toggle
    if (!movingEvent.isCommitment && movingEvent.taskId) {
      const task = tasks.find(t => t.id === movingEvent.taskId);
      if (task && task.isCompleted !== moveIsCompleted) {
        const updates: Partial<Task> = {
          isCompleted: moveIsCompleted,
          completedAt: moveIsCompleted ? Date.now() : undefined
        };
        const updatedTask = { ...task, ...updates };
        await storageService.saveTask(updatedTask);
        
        const exp = gamificationService.calculateTaskExp(updatedTask);
        const result = await gamificationService.updateUserProgress(userId, moveIsCompleted ? exp : -exp);
        
        if (result.user) {
          onUserUpdated(result.user);
          if (moveIsCompleted) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#f27024', '#3b82f6', '#10b981']
            });
          }
          if (result.leveledUp || result.rankedUp) {
            setTimeout(() => {
              confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#FFD700', '#f27024']
              });
            }, 500);
          }
        }
        onTasksUpdated();
      }
    } else if (movingEvent.isCommitment) {
      // Handle commitment completion
      if (movingEvent.isCompleted !== moveIsCompleted) {
        const [sh, sm] = movingEvent.startTime.split(':').map(Number);
        const [eh, em] = movingEvent.endTime.split(':').map(Number);
        const durationHours = (eh - sh) + (em - sm) / 60;
        const expGain = Math.floor(durationHours * 100);
        
        const result = await gamificationService.updateUserProgress(userId, moveIsCompleted ? expGain : -expGain);
        
        if (result.user) {
          onUserUpdated(result.user);
          if (moveIsCompleted) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#f27024', '#3b82f6', '#10b981']
            });
          }
        }
        
        // Update the event in the list
        const updatedWithCompletion = updated.map(evt => {
          if (evt.id === movingEvent.id) {
            return { ...evt, isCompleted: moveIsCompleted, completedAt: moveIsCompleted ? Date.now() : undefined };
          }
          return evt;
        });
        storageService.saveCalendarEvents(updatedWithCompletion, userId);
        onCalendarUpdated();
        setMovingEvent(null);
        document.body.style.overflow = 'auto';
        return;
      }
    }

    storageService.saveCalendarEvents(updated, userId);
    onCalendarUpdated();
    setMovingEvent(null);
    document.body.style.overflow = 'auto';
  };

  useEffect(() => {
    if (movingEvent || showCommitmentForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [movingEvent, showCommitmentForm]);

  const deleteEvent = (id: string) => {
    const updated = calendar.filter(e => e.id !== id);
    storageService.saveCalendarEvents(updated, userId);
    onCalendarUpdated();
  };

  const getDeadlinesForDate = (dateStr: string) => {
    return tasks.filter(t => t.deadline === dateStr && !t.isCompleted);
  };

  const getEventColor = (evt: CalendarEvent) => {
    if (evt.isCommitment) {
      return evt.isRecurring 
        ? 'bg-slate-100 border-slate-200 text-slate-900' 
        : 'bg-slate-50 border-slate-200 text-slate-900';
    }
    
    const task = tasks.find(t => t.id === evt.taskId);
    if (!task) return 'bg-indigo-50 border-indigo-200 text-slate-900';

    switch (task.quadrant) {
      case EisenhowerQuadrant.DO_FIRST:
        return 'bg-rose-50 border-rose-200 text-slate-900';
      case EisenhowerQuadrant.SCHEDULE:
        return 'bg-blue-50 border-blue-200 text-slate-900';
      case EisenhowerQuadrant.DELEGATE:
        return 'bg-amber-50 border-amber-200 text-slate-900';
      case EisenhowerQuadrant.ELIMINATE:
        return 'bg-slate-100 border-slate-300 text-slate-900';
      default:
        return 'bg-indigo-50 border-indigo-200 text-slate-900';
    }
  };

  const displayedEvents = previewEvents || optimisticCalendar || calendar;
  const scheduledTaskIds = new Set(displayedEvents.map(e => e.taskId).filter(Boolean));

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={rectIntersection}
    >
      <div className="flex flex-col gap-6 pb-24 relative">
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

      <div className="flex flex-col gap-6">
        {/* Task Inbox Header (Collapsible) */}
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-4 shadow-sm transition-all duration-300">
          <div 
            className="flex items-center justify-between cursor-pointer group"
            onClick={() => setIsInboxExpanded(!isInboxExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm group-hover:scale-110 transition-transform">
                <ListTodo size={20} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Task Inbox</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-[10px]">
                    {tasks.filter(t => t.isAnalyzed && !t.isCompleted).length}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Pending Tasks</span>
                </div>
              </div>
            </div>
            <button className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-all">
              {isInboxExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
          
          <AnimatePresence>
            {isInboxExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {tasks.filter(t => t.isAnalyzed && !t.isCompleted).map(t => (
                    <DraggableTaskItem 
                      key={t.id} 
                      task={t} 
                      isScheduled={scheduledTaskIds.has(t.id)} 
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                {weekDays.map(d => {
                  const deadlines = getDeadlinesForDate(d.dateStr);
                  return (
                    <div key={d.dateStr} className="py-4 text-center border-r border-slate-100 last:border-r-0 relative group/header">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">{d.label}</span>
                      <span className={`text-lg font-black ${d.dateStr === new Date().toISOString().split('T')[0] ? 'text-indigo-600' : 'text-slate-800'}`}>{d.dayNum}</span>
                      
                      {deadlines.length > 0 && (
                        <div className="absolute top-2 right-2">
                          <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                            {deadlines.length}
                          </div>
                          
                          {/* Deadline Tooltip */}
                          <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 text-white p-3 rounded-xl shadow-2xl opacity-0 group-hover/header:opacity-100 transition-opacity z-[100] pointer-events-none text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-2">Deadlines Today</p>
                            <ul className="space-y-1">
                              {deadlines.map(t => (
                                <li key={t.id} className="text-[11px] font-medium leading-tight">• {t.title}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Time Slots Body */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] relative h-[800px] overflow-y-auto custom-scrollbar">
                {/* Hour Indicators */}
                <div className="flex flex-col">
                  {timeSlots.map(time => (
                    <div key={time} className={`h-10 ${time.endsWith(':30') ? 'border-b border-slate-50' : ''} border-r border-slate-100 flex items-start justify-center pt-2`}>
                      {time.endsWith(':00') && <span className="text-[9px] font-black text-slate-400">{time}</span>}
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
                      {/* Background Grid Lines (Droppable Slots) */}
                      {timeSlots.map(time => (
                        <DroppableTimeSlot 
                          key={`${d.dateStr}|${time}`} 
                          id={`${d.dateStr}|${time}`} 
                          activeId={activeId}
                          calendar={calendar}
                          tasks={tasks}
                        />
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
                        const task = tasks.find(t => t.id === evt.taskId);

                        return (
                          <DraggableEventItem
                            key={evt.id}
                            evt={evt}
                            task={task}
                            topPos={topPos}
                            height={height}
                            colorClasses={colorClasses}
                            previewEvents={previewEvents}
                            onComplete={() => {}} // Removed direct completion
                            onDelete={deleteEvent}
                            onMove={(evt) => {
                              setMovingEvent(evt);
                              setMoveDate(evt.date);
                              setMoveTime(evt.startTime);
                              setMoveEndTime(evt.endTime);
                              setMoveIsCompleted(task?.isCompleted || false);
                            }}
                          />
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
        <div 
          className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setMovingEvent(null)}
        >
          <div 
            className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Edit Session</h2>
              <button onClick={() => setMovingEvent(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleReschedule} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session</p>
                <p className="font-bold text-slate-800 text-sm">{movingEvent.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Date</label>
                  <input type="date" required value={moveDate} onChange={e => setMoveDate(e.target.value)} className="w-full bg-white px-4 py-3 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-indigo-600 text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Start</label>
                  <input type="time" required value={moveTime} onChange={e => setMoveTime(e.target.value)} className="w-full bg-white px-4 py-3 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-indigo-600 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">End</label>
                <input type="time" required value={moveEndTime} onChange={e => setMoveEndTime(e.target.value)} className="w-full bg-white px-4 py-3 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-indigo-600 text-sm" />
              </div>
              
              {(!movingEvent.isCommitment || movingEvent.isCommitment) && (
                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl">
                  <input 
                    type="checkbox" 
                    id="complete-item"
                    checked={moveIsCompleted}
                    onChange={(e) => setMoveIsCompleted(e.target.checked)}
                    className="w-5 h-5 rounded border-indigo-200 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="complete-item" className="text-xs font-bold text-indigo-900 cursor-pointer">
                    {movingEvent.isCommitment ? 'Mark Session as Completed' : 'Mark Task as Completed'}
                  </label>
                </div>
              )}
              
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 mt-2">Save Changes</button>
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

      <DragOverlay dropAnimation={null}>
        {activeId ? (() => {
          const evt = calendar.find(e => e.id === activeId);
          const task = tasks.find(t => t.id === activeId);
          const title = evt?.title || task?.title || 'Moving...';
          
          if (evt) {
            const colorClasses = getEventColor(evt);
            const [sh, sm] = evt.startTime.split(':').map(Number);
            const [eh, em] = evt.endTime.split(':').map(Number);
            const height = (eh - sh) * 80 + ((em - sm) / 60) * 80;

            return (
              <div 
                className={`w-[100px] p-2 rounded-xl border shadow-2xl flex flex-col overflow-hidden scale-105 ${colorClasses}`}
                style={{ height: `${height}px` }}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">
                    {evt.startTime}
                  </span>
                </div>
                <p className="text-[9px] font-black leading-tight">
                  {title}
                </p>
              </div>
            );
          }

          return (
            <div className="bg-white rounded-xl p-3 shadow-2xl border-2 border-orange-500 w-48 scale-105">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-bold text-slate-800 truncate">{title}</p>
              </div>
              {task && (
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase text-indigo-400 tracking-tighter">Due: {task.deadline}</span>
                  <span className="text-[8px] font-black uppercase text-slate-400">{task.estimatedHours}h</span>
                </div>
              )}
            </div>
          );
        })() : null}
      </DragOverlay>
    </div>
    </DndContext>
  );
}

// --- Sub-components for DnD ---

function DraggableTaskItem({ task, isScheduled }: { task: Task, isScheduled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${isScheduled ? 'bg-emerald-50 !bg-emerald-50 border-emerald-100' : 'bg-slate-50 !bg-slate-50 border-slate-100'}`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-bold text-black dark:text-black truncate">{task.title}</p>
        {isScheduled && <CalendarIcon size={12} className="text-emerald-500" />}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-black uppercase text-black dark:text-black tracking-tighter opacity-70">Due: {task.deadline}</span>
        <span className="text-[8px] font-black uppercase text-black dark:text-black opacity-60">{task.estimatedHours}h</span>
      </div>
    </div>
  );
}

function DroppableTimeSlot({ id, activeId, calendar, tasks }: { id: string, activeId: string | null, calendar: CalendarEvent[], tasks: Task[] }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });
  const isHalfHour = id.endsWith(':30');

  const highlightHeight = useMemo(() => {
    if (!activeId || !isOver) return 80;
    
    // Check existing events
    const evt = calendar.find(e => e.id === activeId);
    if (evt) {
      const [sh, sm] = evt.startTime.split(':').map(Number);
      const [eh, em] = evt.endTime.split(':').map(Number);
      return Math.max(40, (eh - sh) * 80 + ((em - sm) / 60) * 80);
    }
    
    // Check inbox tasks
    const task = tasks.find(t => t.id === activeId);
    if (task) return 80; // Default 1h for inbox tasks
    
    return 80;
  }, [activeId, isOver, calendar, tasks]);

  return (
    <div 
      ref={setNodeRef}
      className={`h-10 ${isHalfHour ? 'border-b border-slate-50' : ''} relative transition-colors`}
    >
      {isOver && (
        <div 
          className="absolute inset-x-0 top-0 bg-indigo-50/50 ring-2 ring-inset ring-indigo-200 rounded-xl z-20 pointer-events-none shadow-sm" 
          style={{ height: `${highlightHeight}px` }}
        />
      )}
    </div>
  );
}

function DraggableEventItem({ 
  evt, 
  task, 
  topPos, 
  height, 
  colorClasses, 
  previewEvents, 
  onComplete, 
  onDelete, 
  onMove 
}: { 
  evt: CalendarEvent, 
  task?: Task, 
  topPos: number, 
  height: number, 
  colorClasses: string, 
  previewEvents: any, 
  onComplete: (evt: CalendarEvent) => void, 
  onDelete: (id: string) => void, 
  onMove: (evt: CalendarEvent) => void 
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: evt.id,
    disabled: !!previewEvents
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    top: `${topPos}px`, 
    height: `${height}px`,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 50 : 10
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        onMove(evt); // Open edit modal instead of completing
      }}
      className={`absolute left-1.5 right-1.5 p-2 rounded-xl border shadow-sm transition-all cursor-pointer hover:z-20 hover:scale-[1.02] flex flex-col group overflow-hidden ${colorClasses} ${task?.isCompleted || evt.isCompleted ? 'opacity-40 grayscale-[0.5]' : ''}`}
    >
      {/* Hover Tip */}
      <div className="absolute inset-0 bg-slate-900/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2 text-center z-20">
        <p className="text-[8px] font-black uppercase tracking-widest leading-tight">
          Click to edit session or status
        </p>
      </div>

      <div className="flex justify-between items-start mb-1 relative z-10">
        <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">
          {evt.startTime} - {evt.endTime}
        </span>
        {!previewEvents && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onMove(evt);
              }} 
              className="text-slate-400 hover:text-indigo-600"
            >
              <Move size={10} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(evt.id); }} className="text-rose-400 hover:text-rose-600">
              <Trash2 size={10} />
            </button>
          </div>
        )}
      </div>
      <p className="text-[10px] font-black leading-tight relative z-10 truncate">
        {evt.title}
      </p>
      <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
        <Move size={10} className="opacity-50" />
      </div>
    </div>
  );
}
