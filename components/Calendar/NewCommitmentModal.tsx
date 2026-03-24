
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock, RefreshCw } from 'lucide-react';
import { CalendarEvent } from '../../types';

import { getLocalDateString } from '@/utils/dateUtils';

interface NewCommitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (event: CalendarEvent) => void;
  userId: string;
}

export default function NewCommitmentModal({ isOpen, onClose, onAdd, userId }: NewCommitmentModalProps) {
  const [comTitle, setComTitle] = useState('');
  const [comDate, setComDate] = useState(getLocalDateString());
  const [comStart, setComStart] = useState('09:00');
  const [comEnd, setComEnd] = useState('10:00');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<number[]>([]); // 0-6 (Sun-Sat)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(getLocalDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));

  const resetForm = () => {
    setComTitle('');
    setComDate(getLocalDateString());
    setComStart('09:00');
    setComEnd('10:00');
    setIsRecurring(false);
    setRecurringDays([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      userId,
      title: comTitle,
      date: comDate,
      day: new Date(comDate).toLocaleDateString('en-US', { weekday: 'long' }),
      startTime: comStart,
      endTime: comEnd,
      isCommitment: true,
      isRecurring: isRecurring,
      recurrence: isRecurring ? {
        frequency: 'weekly',
        daysOfWeek: recurringDays,
        endDate: recurrenceEndDate
      } : undefined
    };

    onAdd(newEvent);
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <CalendarIcon size={20} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">New Commitment</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Event Title</label>
            <input required value={comTitle} onChange={e => setComTitle(e.target.value)} className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-600 outline-none font-bold transition-all" placeholder="E.g. Yoga, Part-time Work, University Class" />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <CalendarIcon size={12} /> Start Date
              </label>
              <input type="date" required value={comDate} onChange={e => setComDate(e.target.value)} className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-600 outline-none font-bold" />
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Clock size={12} /> Time Range
              </label>
              <div className="flex items-center gap-2">
                <input type="time" required value={comStart} onChange={e => setComStart(e.target.value)} className="flex-1 bg-slate-50 px-4 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-600 outline-none font-bold text-center" />
                <span className="text-slate-300">→</span>
                <input type="time" required value={comEnd} onChange={e => setComEnd(e.target.value)} className="flex-1 bg-slate-50 px-4 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-600 outline-none font-bold text-center" />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw size={16} className="text-indigo-600" />
                <span className="text-sm font-bold text-slate-700">Recurring Event</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`w-12 h-6 rounded-full transition-all relative ${isRecurring ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRecurring ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {isRecurring && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-6 pt-4 border-t border-slate-200"
              >
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Repeat on</label>
                  <div className="flex justify-between">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (recurringDays.includes(idx)) {
                            setRecurringDays(recurringDays.filter(d => d !== idx));
                          } else {
                            setRecurringDays([...recurringDays, idx]);
                          }
                        }}
                        className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${recurringDays.includes(idx) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-200 hover:border-indigo-200'}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <CalendarIcon size={12} /> End Recurrence On
                  </label>
                  <input type="date" value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} className="w-full bg-white px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none font-bold focus:border-indigo-600" />
                </div>
              </motion.div>
            )}
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-100 mt-4 hover:bg-black transition-all">
            Save To Planner
          </button>
        </form>
      </motion.div>
    </div>
  );
}
