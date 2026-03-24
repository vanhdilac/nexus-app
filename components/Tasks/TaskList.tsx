
import React, { useState } from 'react';
import { Task, TaskDifficulty, EisenhowerQuadrant, TaskImportance, User, CalendarEvent } from '../../types';
import { storageService } from '../../services/storageService';
import { geminiService } from '../../services/geminiService';
import { gamificationService } from '../../services/gamificationService';
import { taskService } from '../../services/taskService';
import { 
  Plus, Trash2, Brain, AlertCircle, Clock, X, Sparkles, 
  CheckCircle2, Circle, Hourglass, ClipboardList, Edit3, Calendar,
  Zap
} from 'lucide-react';
import { QUADRANT_COLORS } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';

import confetti from 'canvas-confetti';

interface TaskListProps {
  tasks: Task[];
  calendar: CalendarEvent[];
  userId: string;
  onTasksUpdated: () => void;
  onUserUpdated: (user: User) => void;
}

const QuestionButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string, key?: string }) => (
  <button 
    onClick={onClick}
    className={`w-full px-6 py-4 rounded-2xl border-2 transition-all text-left font-bold ${
      active 
        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
        : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
    }`}
  >
    {label}
  </button>
);

export default function TaskList({ tasks, calendar, userId, onTasksUpdated, onUserUpdated }: TaskListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [analyzingTaskId, setAnalyzingTaskId] = useState<string | null>(null);
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [taskType, setTaskType] = useState<'normal' | 'exam'>('normal');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(TaskDifficulty.MEDIUM);
  const [importance, setImportance] = useState<TaskImportance>(TaskImportance.MEDIUM);
  const [estimatedHours, setEstimatedHours] = useState(1);

  const [analysisStep, setAnalysisStep] = useState(0);
  const [answers, setAnswers] = useState({ urgency: '', importance: '', pressure: '' });
  const [isClassifying, setIsClassifying] = useState(false);

  const scheduledTaskIds = new Set(calendar.map(e => e.taskId).filter(Boolean));

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const taskData: any = {
        id: editingTask ? editingTask.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)),
        userId,
        title,
        description,
        deadline,
        difficulty,
        importance,
        estimatedHours,
        isAnalyzed: editingTask ? editingTask.isAnalyzed : false,
        isCompleted: editingTask ? editingTask.isCompleted : false,
        createdAt: editingTask ? editingTask.createdAt : Date.now()
      };

      if (taskType === 'exam') {
        taskData.examDate = deadline;
      }
      
      if (editingTask?.completedAt !== undefined) {
        taskData.completedAt = editingTask.completedAt;
      }

      if (editingTask?.reasoning !== undefined) {
        taskData.reasoning = editingTask.reasoning;
      }
      
      if (editingTask?.quadrant !== undefined) {
        taskData.quadrant = editingTask.quadrant;
      }
      
      console.log("Saving task:", taskData);
      await storageService.saveTask(taskData);
      onTasksUpdated();
      closeForm();
    } catch (err) {
      console.error("Failed to save task:", err);
      closeForm();
    }
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingTask(null);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDeadline('');
    setTaskType('normal');
    setDifficulty(TaskDifficulty.MEDIUM);
    setImportance(TaskImportance.MEDIUM);
    setEstimatedHours(1);
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setDeadline(task.deadline);
    setTaskType(task.examDate ? 'exam' : 'normal');
    setDifficulty(task.difficulty);
    setImportance(task.importance);
    setEstimatedHours(task.estimatedHours);
    setShowAddForm(true);
  };

  const handleToggleComplete = async (task: Task) => {
    const isNowCompleted = !task.isCompleted;
    const updatedTask = { ...task, isCompleted: isNowCompleted };
    if (isNowCompleted) {
      updatedTask.completedAt = Date.now();
      
      // Delete all associated calendar events if task is completed
      const updatedCalendar = calendar.filter(evt => evt.taskId !== task.id);
      if (updatedCalendar.length !== calendar.length) {
        await storageService.saveCalendarEvents(updatedCalendar, userId);
      }
    } else {
      delete updatedTask.completedAt;
    }

    await storageService.saveTask(updatedTask);
    
    const exp = gamificationService.calculateTaskExp(updatedTask);
    const result = await gamificationService.updateUserProgress(userId, isNowCompleted ? exp : -exp);
    
    if (result.user) {
      onUserUpdated(result.user);
      
      if (isNowCompleted) {
        // Confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f27024', '#3b82f6', '#10b981']
        });

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
    }
    
    onTasksUpdated();
  };

  const startAnalysis = (task: Task) => {
    setAnalyzingTaskId(task.id);
    setAnalysisStep(1);
    document.body.style.overflow = 'hidden';
  };

  const handleBulkAnalyze = async () => {
    const tasksToAnalyze = tasks.filter(t => selectedTasks.size > 0 ? selectedTasks.has(t.id) : !t.isAnalyzed);
    
    if (tasksToAnalyze.length === 0) {
      setToast({ message: "I don't see any tasks waiting for analysis.", type: 'info' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsBulkAnalyzing(true);
    document.body.style.overflow = 'hidden';
    try {
      const results = await geminiService.bulkClassifyTasks(tasksToAnalyze);
      let totalExp = 0;
      for (const res of results) {
        const task = tasks.find(t => t.id === res.taskId);
        if (task) {
          const updatedTask = {
            ...task,
            reasoning: res.reasoning,
            isAnalyzed: true
          };
          await storageService.saveTask(updatedTask);
        }
      }
      
      onTasksUpdated();
      setSelectedTasks(new Set());
    } catch (err) {
      console.error(err);
      setToast({ message: "I encountered an error during bulk analysis, please try again.", type: 'info' });
      setTimeout(() => setToast(null), 3000);
    }
    setIsBulkAnalyzing(false);
    document.body.style.overflow = 'auto';
  };

  const handleAnalysisSubmit = async () => {
    setIsClassifying(true);
    const task = tasks.find(t => t.id === analyzingTaskId);
    if (task) {
      try {
        const result = await geminiService.classifyTask(task, answers);
        const updatedTask = {
          ...task,
          reasoning: result.reasoning,
          isAnalyzed: true
        };
        await storageService.saveTask(updatedTask);
        
        onTasksUpdated();
        setAnalyzingTaskId(null);
        setAnalysisStep(0);
        setAnswers({ urgency: '', importance: '', pressure: '' });
        document.body.style.overflow = 'auto';
      } catch (err) {
        setToast({ message: "I couldn't classify this task, please try again.", type: 'info' });
        setTimeout(() => setToast(null), 3000);
      }
    }
    setIsClassifying(false);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedTasks);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTasks(newSet);
  };

  const handleDelete = async (id: string) => {
    await storageService.deleteTask(id);
    onTasksUpdated(); 
  };

  const handleOpenAddForm = () => {
    setShowAddForm(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseModals = () => {
    closeForm();
    setAnalyzingTaskId(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <>
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Academic Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Manage and prioritize your academic workload.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleBulkAnalyze}
            disabled={isBulkAnalyzing}
            className="group relative bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-100 flex items-center gap-2 font-black transition-all disabled:opacity-50 text-xs uppercase tracking-widest overflow-hidden"
          >
            {isBulkAnalyzing && (
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
              />
            )}
            {isBulkAnalyzing ? <Sparkles className="animate-pulse" size={16} /> : <Brain size={16} />}
            <span>{selectedTasks.size > 0 ? `Process (${selectedTasks.size})` : 'Analyze All Tasks'}</span>
          </button>
          <button 
            onClick={handleOpenAddForm}
            className="bg-accent hover:bg-orange-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-orange-100 flex items-center gap-2 font-black transition-all text-xs uppercase tracking-widest"
          >
            <Plus size={18} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-[2.5rem] p-20 text-center">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ClipboardList className="text-slate-300 dark:text-slate-600" size={32} />
            </div>
            <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">The list is empty</p>
          </div>
        ) : (
          tasks.sort((a,b) => b.createdAt - a.createdAt).map(task => {
            const currentQuadrant = taskService.calculateQuadrant(task);
            return (
              <div key={task.id} className={`bg-white dark:bg-slate-800 p-6 rounded-[1.5rem] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group relative overflow-hidden ${task.isCompleted ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/10 opacity-60' : task.examDate ? 'border-rose-300 dark:border-rose-900/50 ring-4 ring-rose-50 dark:ring-rose-900/10' : 'border-slate-100 dark:border-slate-700'} ${!task.isAnalyzed && !task.isCompleted ? 'border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/10 dark:bg-indigo-900/5' : ''}`}>
                
                <div className="flex items-start gap-5 flex-1">
                  <div className="flex flex-col gap-2 mt-1">
                    <button 
                      onClick={() => handleToggleComplete(task)}
                      className={`relative p-2 rounded-full transition-all border-2 ${task.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100 dark:shadow-none scale-110' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-200 dark:text-slate-500 hover:border-emerald-500 hover:text-emerald-500'}`}
                      title={task.isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
                    >
                      <CheckCircle2 size={24} strokeWidth={3} />
                    </button>
                    <button 
                      onClick={() => toggleSelection(task.id)}
                      className={`p-1 rounded-md transition-colors text-center ${selectedTasks.has(task.id) ? 'text-accent' : 'text-slate-200 dark:text-slate-600 hover:text-orange-400'}`}
                      title="Select Task"
                    >
                      {selectedTasks.has(task.id) ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className={`font-black text-xl tracking-tight transition-all ${task.isCompleted ? 'text-slate-400 dark:text-slate-500 line-through decoration-emerald-500 decoration-2' : 'text-slate-800 dark:text-white'}`}>{task.title}</h3>
                      {scheduledTaskIds.has(task.id) && (
                        <span className="p-1.5 bg-emerald-900 dark:bg-emerald-900/30 text-emerald-300 dark:text-emerald-300 rounded-lg shadow-sm border border-emerald-100 dark:border-emerald-800" title="Scheduled in Calendar">
                          <Calendar size={14} strokeWidth={2.5} />
                        </span>
                      )}
                      {task.isAnalyzed ? (
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border tracking-tighter shadow-sm ${QUADRANT_COLORS[currentQuadrant]}`}>
                          {currentQuadrant}
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 tracking-tighter shadow-sm">
                          AI Pending
                        </span>
                      )}
                      <span className="text-[9px] font-black uppercase px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center gap-1.5 tracking-tighter border border-orange-100 dark:border-orange-900/30 shadow-sm">
                        <Hourglass size={12} strokeWidth={2.5} /> {task.estimatedHours}H NEEDED
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-3 break-words whitespace-pre-wrap">{task.description}</p>
                    <div className="flex items-center gap-5">
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                        <Clock size={14} className="text-indigo-500 dark:text-indigo-400" />
                        Due: {task.deadline}
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                        <AlertCircle size={14} className="text-indigo-500 dark:text-indigo-400" />
                        {task.difficulty}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => startAnalysis(task)}
                    className={`group relative flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest overflow-hidden ${task.isAnalyzed ? 'bg-slate-50 text-slate-500 hover:bg-slate-100' : 'bg-accent text-white hover:bg-orange-700 shadow-lg shadow-orange-100'}`}
                  >
                    {!task.isAnalyzed && (
                      <motion.div 
                        initial={{ left: '-100%' }}
                        animate={{ left: '100%' }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                        className="absolute top-0 bottom-0 w-1 bg-white/40 blur-sm z-10"
                      />
                    )}
                    <Brain size={16} className={!task.isAnalyzed ? 'animate-pulse' : ''} />
                    {task.isAnalyzed ? 'Update Logic' : 'Analyze'}
                  </button>
                  <button 
                    onClick={() => startEdit(task)}
                    className="p-3 text-slate-400 hover:text-accent transition-colors hover:bg-orange-50 rounded-xl"
                    title="Edit Task"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(task.id)}
                    className="p-3 text-slate-200 hover:text-rose-600 transition-colors hover:bg-rose-50 rounded-xl"
                    title="Remove Task"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
    <AnimatePresence>
        {showAddForm && (
          <div 
            className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleCloseModals}
          >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-slate-800 w-full max-w-lg md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl overflow-y-auto max-h-full md:max-h-[90vh] relative no-scrollbar modal-content border border-slate-100 dark:border-slate-700"
              >
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                      {editingTask ? 'Edit Task' : 'Create Task'}
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Feeding the AI Matrix</p>
                  </div>
                  <button onClick={handleCloseModals} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
                    <X size={24} />
                  </button>
                </div>
              <form onSubmit={handleAddTask} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                  <input required value={title || ''} onChange={e => setTitle(e.target.value)} className="w-full bg-white dark:bg-slate-900 px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 outline-none text-slate-700 dark:text-white font-bold" placeholder="E.g. Discrete Math HW" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detail</label>
                  <textarea value={description || ''} onChange={e => setDescription(e.target.value)} className="w-full bg-white dark:bg-slate-900 px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 outline-none h-24 text-slate-700 dark:text-white font-bold" placeholder="Context for the AI..." />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Calendar size={14} className="text-slate-900 dark:text-white" strokeWidth={2.5} /> Deadline Date
                    </label>
                    <input type="date" required value={deadline || ''} onChange={e => setDeadline(e.target.value)} className="w-full bg-white dark:bg-slate-900 px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 outline-none text-slate-700 dark:text-white font-bold cursor-pointer focus:border-indigo-500" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Category</label>
                    <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
                      <button 
                        type="button"
                        onClick={() => setTaskType('normal')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${taskType === 'normal' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <ClipboardList size={14} />
                        Normal Task
                      </button>
                      <button 
                        type="button"
                        onClick={() => setTaskType('exam')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${taskType === 'exam' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <Zap size={14} />
                        Tests / Exams
                      </button>
                    </div>
                    {taskType === 'exam' && (
                      <p className="text-[9px] font-bold text-rose-500 ml-2 animate-pulse">✨ I will remind you to study for the exam on this day!</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Hourglass size={12} /> Time Needed (Hours)
                    </label>
                    <input 
                      type="number" required min="1" max="100"
                      value={estimatedHours || ''} 
                      onChange={e => setEstimatedHours(e.target.value === '' ? 0 : parseInt(e.target.value))} 
                      className="w-full bg-white dark:bg-slate-900 px-5 py-4 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900 focus:border-indigo-600 outline-none text-slate-800 dark:text-white font-black text-center text-xl" 
                    />
                    <p className="text-[9px] font-bold text-slate-400 text-center">How much time do you need to study each week?</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Level of Importance</label>
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                      {[TaskImportance.LOW, TaskImportance.MEDIUM, TaskImportance.HIGH].map(imp => (
                        <button 
                          key={imp} type="button"
                          onClick={() => setImportance(imp)}
                          className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase transition-all ${importance === imp ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                        >
                          {imp}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full nexus-bg-gradient text-white py-5 rounded-2xl font-black shadow-xl hover:opacity-95 transition-all uppercase tracking-[0.25em] text-xs">
                  {editingTask ? 'Update Task' : 'Synchronize to Tasks'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isBulkAnalyzing && (
        <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-md flex items-center justify-center">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 border border-indigo-50 text-center relative overflow-hidden"
          >
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute left-0 right-0 h-1 bg-indigo-500/30 blur-sm z-0"
            />
            <Sparkles className="text-indigo-600 animate-bounce relative z-10" size={56} />
            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter relative z-10">AI Analyze</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest relative z-10">I'm applying Eisenhower logic to all your tasks...</p>
          </motion.div>
        </div>
      )}

      {analyzingTaskId && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={handleCloseModals}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[3rem] p-12 shadow-2xl text-center relative overflow-hidden modal-content border border-slate-100 dark:border-slate-700"
          >
            {isClassifying ? (
              <div className="py-12 flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 border-8 border-indigo-100 rounded-full" />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="absolute inset-0 w-24 h-24 border-8 border-indigo-600 border-t-transparent rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="text-indigo-600 animate-pulse" size={32} />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mt-8">I'm processing the matrix logic...</h2>
                <div className="mt-4 w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    className="h-full w-1/2 bg-indigo-600 rounded-full"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="mb-10 text-left">
                  <span className="inline-block px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase mb-8 tracking-widest">Logic Node {analysisStep} / 3</span>
                  {analysisStep === 1 && (
                    <div className="animate-in slide-in-from-right-4">
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tighter">Criticality?</h2>
                      <div className="space-y-3">
                        {["Immediate (< 48h)", "Weekly Goal", "Long-term"].map(opt => (
                          <QuestionButton key={opt} active={answers.urgency === opt} onClick={() => { setAnswers({...answers, urgency: opt}); }} label={opt} />
                        ))}
                      </div>
                      <div className="mt-8 flex justify-end">
                        <button 
                          disabled={!answers.urgency}
                          onClick={() => setAnalysisStep(2)}
                          className="px-10 py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-100 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                        >
                          Next Step
                        </button>
                      </div>
                    </div>
                  )}
                  {analysisStep === 2 && (
                    <div className="animate-in slide-in-from-right-4">
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tighter">Academic Value?</h2>
                      <div className="space-y-3">
                        {["Critical Grade", "Important Study", "Routine Admin"].map(opt => (
                          <QuestionButton key={opt} active={answers.importance === opt} onClick={() => { setAnswers({...answers, importance: opt}); }} label={opt} />
                        ))}
                      </div>
                      <div className="mt-8 flex justify-between gap-4">
                        <button 
                          onClick={() => setAnalysisStep(1)}
                          className="px-8 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:bg-slate-200"
                        >
                          Back
                        </button>
                        <button 
                          disabled={!answers.importance}
                          onClick={() => setAnalysisStep(3)}
                          className="flex-1 py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-100 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                        >
                          Next Step
                        </button>
                      </div>
                    </div>
                  )}
                  {analysisStep === 3 && (
                    <div className="animate-in slide-in-from-right-4">
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tighter">Mental Bandwidth?</h2>
                      <div className="space-y-3">
                        {["Stressed", "Alert", "Stable"].map(opt => (
                          <QuestionButton key={opt} active={answers.pressure === opt} onClick={() => setAnswers({...answers, pressure: opt})} label={opt} />
                        ))}
                      </div>
                      <div className="mt-8 flex justify-between gap-4">
                        <button 
                          onClick={() => setAnalysisStep(2)}
                          className="px-8 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:bg-slate-200"
                        >
                          Back
                        </button>
                        <button 
                          disabled={!answers.pressure}
                          onClick={handleAnalysisSubmit} 
                          className="flex-1 py-5 bg-accent text-white rounded-2xl font-black shadow-xl uppercase tracking-[0.25em] text-xs transition-all hover:scale-105 active:scale-95"
                        >
                          Execute Matrix
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={handleCloseModals} className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">Exit</button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
}
