import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Timer, Bell, X, CheckCircle2 } from 'lucide-react';
import { User } from '../../types';
import { gamificationService } from '../../services/gamificationService';

interface PomodoroViewProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

export default function PomodoroView({ user, onUserUpdated }: PomodoroViewProps) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [tempHours, setTempHours] = useState(0);
  const [tempMinutes, setTempMinutes] = useState(25);
  const [tempSeconds, setTempSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [showBreakPopup, setShowBreakPopup] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const t = (en: string, vi: string) => user.language === 'vi' ? vi : en;

  const handleSaveTime = () => {
    const h = Math.max(0, Math.min(23, tempHours));
    const m = Math.max(0, Math.min(59, tempMinutes));
    const s = Math.max(0, Math.min(59, tempSeconds));
    
    setHours(h);
    setMinutes(m);
    setSeconds(s);
    const totalSeconds = h * 3600 + m * 60 + s;
    setTimeLeft(totalSeconds);
    setIsActive(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const setPreset = (m: number) => {
    setTempHours(0);
    setTempMinutes(m);
    setTempSeconds(0);
    // Auto-save preset for convenience
    setHours(0);
    setMinutes(m);
    setSeconds(0);
    setTimeLeft(m * 60);
    setIsActive(false);
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setShowBreakPopup(true);
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Grant EXP for session completion
      const grantExp = async () => {
        const totalMinutes = hours * 60 + minutes;
        // 1 hour = 100 EXP, so 1 minute = 100/60 EXP
        // We use the raw float to ensure 3 x 20mins = 100 EXP
        const expGain = (totalMinutes / 60) * 100;
        
        if (expGain > 0) {
          const result = await gamificationService.updateUserProgress(user.id, expGain);
          if (result.user) {
            onUserUpdated(result.user);
          }
        }
      };
      grantExp();

      // Play a notification sound if possible
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play();
      } catch (e) {
        console.log("Audio playback failed");
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, user.id, onUserUpdated]);

  const toggleTimer = () => {
    if (timeLeft === 0) {
      resetTimer();
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    setTimeLeft(totalSeconds);
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalInitialSeconds = hours * 3600 + minutes * 60 + seconds || 1;
  const progress = (1 - timeLeft / totalInitialSeconds) * 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-white uppercase">
            {t('Pomodoro Focus', 'Tập trung Pomodoro')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {t('Master your time, master your future.', 'Làm chủ thời gian, làm chủ tương lai.')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timer Display Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[3rem] p-8 md:p-16 shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 dark:bg-slate-700">
            <motion.div 
              className="h-full bg-accent shadow-[0_0_15px_rgba(242,112,36,0.5)]"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
            />
          </div>

          <motion.div 
            key={timeLeft}
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-8xl md:text-[10rem] font-black tracking-tighter text-slate-900 dark:text-white mb-12 font-mono drop-shadow-sm"
          >
            {formatTime(timeLeft)}
          </motion.div>

          <div className="flex items-center gap-8">
            <button
              onClick={toggleTimer}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl hover:scale-105 active:scale-95 ${
                isActive 
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600' 
                  : 'bg-accent text-white shadow-orange-500/30'
              }`}
            >
              {isActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
            </button>
            <button
              onClick={resetTimer}
              className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-all hover:bg-slate-100 dark:hover:bg-slate-600 hover:rotate-180 duration-500"
              title={t('Reset Timer', 'Đặt lại đồng hồ')}
            >
              <RotateCcw size={24} />
            </button>
          </div>

          {/* Decorative elements */}
          <div className="absolute -bottom-10 -right-10 opacity-5 dark:opacity-10 pointer-events-none">
            <Timer size={200} />
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-accent rounded-2xl shadow-sm">
              <Timer size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('Configuration', 'Cấu hình')}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Customize your session', 'Tùy chỉnh phiên học')}</p>
            </div>
          </div>

          <div className="space-y-8 flex-1">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">{t('Hrs', 'Giờ')}</label>
                <input 
                  type="number" 
                  min="0"
                  max="23"
                  value={tempHours || 0}
                  onChange={(e) => setTempHours(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-accent rounded-2xl px-2 py-4 font-black text-white dark:text-white text-center text-xl transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">{t('Min', 'Phút')}</label>
                <input 
                  type="number" 
                  min="0"
                  max="59"
                  value={tempMinutes || 0}
                  onChange={(e) => setTempMinutes(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-accent rounded-2xl px-2 py-4 font-black text-white dark:text-white text-center text-xl transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">{t('Sec', 'Giây')}</label>
                <input 
                  type="number" 
                  min="0"
                  max="59"
                  value={tempSeconds || 0}
                  onChange={(e) => setTempSeconds(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-accent rounded-2xl px-2 py-4 font-black text-white dark:text-white text-center text-xl transition-all outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveTime}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl flex items-center justify-center gap-2 ${
                isSaved 
                  ? 'bg-emerald-500 text-white shadow-emerald-100' 
                  : 'bg-accent text-white shadow-orange-100 dark:shadow-none hover:opacity-90'
              }`}
            >
              {isSaved ? (
                <>
                  <CheckCircle2 size={16} strokeWidth={3} />
                  {t('Settings Applied', 'Đã áp dụng')}
                </>
              ) : (
                t('Apply Settings', 'Áp dụng thiết lập')
              )}
            </button>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Quick Presets', 'Thiết lập nhanh')}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Focus', time: 25, vi: 'Tập trung' },
                  { label: 'Short Break', time: 5, vi: 'Nghỉ ngắn' },
                  { label: 'Long Break', time: 15, vi: 'Nghỉ dài' },
                  { label: 'Deep Work', time: 50, vi: 'Học sâu' }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setPreset(preset.time)}
                    className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-tighter hover:border-accent hover:text-accent transition-all shadow-sm flex flex-col items-center gap-1"
                  >
                    <span>{t(preset.label, preset.vi)}</span>
                    <span className="text-accent">{preset.time}m</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
            <p className="text-[10px] text-indigo-600 dark:text-indigo-300 font-bold leading-relaxed italic text-center">
              {t('Tip: Regular breaks help maintain peak cognitive performance.', 'Mẹo: Nghỉ ngơi thường xuyên giúp duy trì hiệu suất trí tuệ cao nhất.')}
            </p>
          </div>
        </div>
      </div>

      {/* Break Popup */}
      <AnimatePresence>
        {showBreakPopup && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
            onClick={() => setShowBreakPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 md:p-16 max-w-xl w-full text-center shadow-2xl relative overflow-hidden border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-3 bg-accent" />
              
              <div className="mb-10 flex justify-center">
                <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-[2rem] flex items-center justify-center text-accent shadow-lg">
                  <Bell size={48} strokeWidth={2.5} className="animate-ring" />
                </div>
              </div>

              <h2 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 uppercase">
                {t("Session Complete!", 'Hoàn thành phiên!')}
              </h2>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 font-medium mb-12 leading-relaxed">
                {t('Excellent focus! Your brain needs a quick recharge. Take 5-10 minutes to stretch, hydrate, and look away from the screen.', 'Tập trung tuyệt vời! Não bộ của bạn cần được nạp lại năng lượng. Hãy dành 5-10 phút để vươn vai, uống nước và rời mắt khỏi màn hình nhé.')}
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => setShowBreakPopup(false)}
                  className="w-full bg-accent text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {t('Start Break', 'Bắt đầu nghỉ ngơi')}
                </button>
                <button
                  onClick={() => {
                    setShowBreakPopup(false);
                    resetTimer();
                  }}
                  className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  {t('Skip Break', 'Bỏ qua nghỉ ngơi')}
                </button>
              </div>

              <button 
                onClick={() => setShowBreakPopup(false)}
                className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
