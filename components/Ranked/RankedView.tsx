import React, { useState, useEffect } from 'react';
import { User, Rank } from '../../types';
import { gamificationService } from '../../services/gamificationService';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Star, Award, Trophy, Zap, Sparkles, Book, Pencil, PenTool, Gem, GraduationCap, Crown, Info, X, HelpCircle } from 'lucide-react';

interface RankedViewProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

const RANK_COLORS: Record<Rank, string> = {
  [Rank.UNRANKED]: 'text-slate-400',
  [Rank.IRON]: 'text-amber-800',
  [Rank.BRONZE]: 'text-orange-700',
  [Rank.SILVER]: 'text-zinc-400',
  [Rank.GOLD]: 'text-yellow-500',
  [Rank.PLATINUM]: 'text-emerald-500',
  [Rank.DIAMOND]: 'text-blue-500',
  [Rank.MASTER]: 'text-purple-600',
  [Rank.GRANDMASTER]: 'text-red-600',
};

const RANK_BG_COLORS: Record<Rank, string> = {
  [Rank.UNRANKED]: 'bg-slate-100',
  [Rank.IRON]: 'bg-amber-100',
  [Rank.BRONZE]: 'bg-orange-100',
  [Rank.SILVER]: 'bg-zinc-100',
  [Rank.GOLD]: 'bg-yellow-100',
  [Rank.PLATINUM]: 'bg-emerald-100',
  [Rank.DIAMOND]: 'bg-blue-100',
  [Rank.MASTER]: 'bg-purple-100',
  [Rank.GRANDMASTER]: 'bg-red-100',
};

export default function RankedView({ user, onUserUpdated }: RankedViewProps) {
  const rankInfo = gamificationService.getRankInfo(user);
  const [showRankUp, setShowRankUp] = useState(false);
  const [prevRank, setPrevRank] = useState<Rank>(user.rank);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (user.rank !== prevRank) {
      setShowRankUp(true);
      const timer = setTimeout(() => {
        setShowRankUp(false);
        setPrevRank(user.rank);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user.rank, prevRank]);

  const getRankIcon = (rank: Rank, size = 160) => {
    const colorClass = RANK_COLORS[rank];
    const iconProps = { size, className: colorClass };
    
    switch (rank) {
      case Rank.UNRANKED:
        return (
          <div className="relative flex items-center justify-center">
            <Shield {...iconProps} />
            <HelpCircle size={size / 2} className="absolute text-slate-500" />
          </div>
        );
      case Rank.IRON:
        return (
          <div className="relative flex items-center justify-center">
            <Book {...iconProps} />
            <Pencil size={size / 2.5} className="absolute text-amber-900" />
          </div>
        );
      case Rank.BRONZE:
        return (
          <div className="relative flex items-center justify-center">
            <Book {...iconProps} />
            <div className="absolute flex gap-1">
              <Pencil size={size / 3} className="text-orange-900 -rotate-12" />
              <Pencil size={size / 3} className="text-orange-900 rotate-12" />
            </div>
          </div>
        );
      case Rank.SILVER:
        return (
          <div className="relative flex items-center justify-center">
            <Book {...iconProps} />
            <div className="absolute flex gap-1">
              <Pencil size={size / 3} className="text-zinc-600 -rotate-12" />
              <Pencil size={size / 3} className="text-zinc-600 rotate-12" />
            </div>
          </div>
        );
      case Rank.GOLD:
        return (
          <div className="relative flex items-center justify-center">
            <Book {...iconProps} />
            <div className="absolute flex gap-1">
              <Pencil size={size / 4} className="text-yellow-700 -rotate-12" />
              <Pencil size={size / 4} className="text-yellow-700" />
              <Pencil size={size / 4} className="text-yellow-700 rotate-12" />
            </div>
          </div>
        );
      case Rank.PLATINUM:
        return (
          <div className="relative flex items-center justify-center">
            <Book {...iconProps} />
            <div className="absolute flex flex-col items-center">
              <GraduationCap size={size / 3} className="text-emerald-700 mb-1" />
              <PenTool size={size / 3} className="text-emerald-700" />
            </div>
          </div>
        );
      case Rank.DIAMOND:
        return (
          <div className="relative flex items-center justify-center">
            <Book {...iconProps} />
            <div className="absolute flex flex-col items-center">
              <GraduationCap size={size / 3} className="text-blue-700 mb-1" />
              <Gem size={size / 2.5} className="text-blue-400 fill-blue-400" />
            </div>
          </div>
        );
      case Rank.MASTER:
        return (
          <div className="relative flex items-center justify-center">
            <Book {...iconProps} />
            <div className="absolute flex flex-col items-center">
              <GraduationCap size={size / 3} className="text-purple-700 mb-1" />
              <Gem size={size / 2.5} className="text-purple-400 fill-purple-400" />
              <div className="absolute -top-4 flex gap-1">
                <Sparkles size={size / 6} className="text-purple-300" />
                <Sparkles size={size / 6} className="text-purple-300" />
              </div>
            </div>
          </div>
        );
      case Rank.GRANDMASTER:
        return (
          <div className="relative flex items-center justify-center">
            <Book {...iconProps} />
            <div className="absolute flex flex-col items-center">
              <Crown size={size / 3} className="text-red-700 mb-1" />
              <Gem size={size / 2.5} className="text-red-400 fill-red-400" />
              <div className="absolute -top-6 flex gap-2">
                <Sparkles size={size / 5} className="text-red-300" />
                <Sparkles size={size / 5} className="text-red-300" />
                <Sparkles size={size / 5} className="text-red-300" />
              </div>
            </div>
          </div>
        );
      default:
        return <Shield {...iconProps} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8 bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] shadow-xl relative overflow-hidden">
      {/* Help Button */}
      <button 
        onClick={() => setShowHelp(true)}
        className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all z-20"
      >
        <Info size={20} />
      </button>

      {/* Background Sparkles */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <Sparkles className="absolute top-10 left-10 text-yellow-400 animate-pulse" size={24} />
        <Sparkles className="absolute bottom-10 right-10 text-blue-400 animate-pulse" size={20} />
        <Sparkles className="absolute top-1/2 right-20 text-purple-400 animate-pulse" size={16} />
      </div>

      <div className="text-center mb-12">
        <h2 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-white mb-2 uppercase">Ranked Progression</h2>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Complete sessions to climb the ranks</p>
      </div>

      <div className="relative mb-12 flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={user.rank}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="relative z-10 flex items-center justify-center"
          >
            {getRankIcon(user.rank)}
            
            {/* Sparkling Aura Effect */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`absolute inset-0 -z-10 blur-3xl rounded-full ${RANK_BG_COLORS[user.rank]}`}
              style={{ width: '200px', height: '200px' }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="text-center mb-8">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`text-3xl font-black uppercase tracking-[0.2em] ${RANK_COLORS[user.rank]}`}
        >
          {user.rank}
        </motion.div>
      </div>

      {/* EXP Bar */}
      <div className="w-full max-w-md">
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3 border border-slate-200 dark:border-slate-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${rankInfo.progress}%` }}
            className={`h-full transition-all duration-1000 ${RANK_COLORS[user.rank].replace('text-', 'bg-')}`}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>Current Progress</span>
          <span>{Math.floor(rankInfo.currentRankExp)} / {rankInfo.nextRankThreshold} EXP</span>
        </div>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowHelp(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">How Ranks Work</h2>
              
              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">Earning EXP</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    You earn <span className="font-bold text-indigo-600">100 EXP</span> for every Pomodoro session you complete. 
                    Completing tasks also grants EXP based on their importance and difficulty.
                  </p>
                  <p className="text-xs text-slate-400 mt-2 italic">
                    Note: If you undo a session completion, the earned EXP will be deducted accordingly.
                  </p>
                </section>

                <section>
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">Rank Tiers (EXP to reach next rank)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Unranked', range: '0' },
                      { name: 'Iron', range: '500' },
                      { name: 'Bronze', range: '1,000' },
                      { name: 'Silver', range: '2,000' },
                      { name: 'Gold', range: '3,000' },
                      { name: 'Platinum', range: '4,000' },
                      { name: 'Diamond', range: '5,000' },
                      { name: 'Master', range: '7,500' },
                      { name: 'Grandmaster', range: '10,000+' },
                    ].map((r, i) => (
                      <div key={r.name} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <span className="text-xs font-bold text-slate-700">{r.name}</span>
                        <span className="text-[10px] font-black text-slate-400">{r.range} EXP</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-slate-400 italic">
                    * Your rank bar resets to 0 each time you reach a new tier.
                  </p>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rank Up Animation Overlay */}
      <AnimatePresence>
        {showRankUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: -500, scale: 2, opacity: 0 }}
              animate={{ 
                y: 0, 
                scale: 1, 
                opacity: 1,
                transition: { 
                  type: "spring", 
                  damping: 15, 
                  stiffness: 100 
                } 
              }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="mb-8">
                {getRankIcon(user.rank, 240)}
              </div>
              <motion.h1 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, transition: { delay: 0.3 } }}
                className="text-6xl font-black text-white uppercase tracking-tighter text-center"
              >
                Rank Up!
              </motion.h1>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { delay: 0.5 } }}
                className={`text-3xl font-bold mt-4 uppercase tracking-[0.3em] ${RANK_COLORS[user.rank]}`}
              >
                {user.rank}
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
