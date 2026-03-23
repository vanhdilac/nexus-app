import React, { useState, useEffect } from 'react';
import { User, Rank } from '../../types';
import { storageService } from '../../services/storageService';
import { gamificationService } from '../../services/gamificationService';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Star, User as UserIcon, Shield } from 'lucide-react';

interface LeaderboardViewProps {
  currentUser: User;
}

export default function LeaderboardView({ currentUser }: LeaderboardViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const allUsers = await storageService.getAllUsers();
      // Sort by total EXP descending
      const sortedUsers = allUsers.sort((a, b) => b.exp - a.exp);
      setUsers(sortedUsers);
      setIsLoading(false);
    };
    fetchUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const topThree = users.slice(0, 3);
  const others = users.slice(3);

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-2xl text-yellow-600 mb-4 shadow-sm">
          <Trophy size={32} />
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Global Leaderboard</h1>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2">See who's leading the academic race</p>
      </div>

      {/* Podium */}
      <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-16 px-4">
        {/* Top 2 */}
        {topThree[1] && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center w-full md:w-1/3 order-2 md:order-1"
          >
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-slate-300 flex items-center justify-center text-slate-500 shadow-lg">
                <Medal size={40} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center text-white font-black text-sm border-2 border-white">2</div>
            </div>
            <div className="bg-white p-6 rounded-t-[2rem] border-x border-t border-slate-200 shadow-sm w-full text-center h-32 flex flex-col justify-center">
              <p className="font-black text-slate-800 truncate px-2">{topThree[1].username}</p>
              <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mt-1">
                {gamificationService.getRankInfo(topThree[1]).currentRank}
              </p>
              <p className="text-sm font-black text-slate-500 mt-2">{Math.floor(topThree[1].exp).toLocaleString()} EXP</p>
            </div>
          </motion.div>
        )}

        {/* Top 1 */}
        {topThree[0] && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center w-full md:w-1/3 order-1 md:order-2 z-10"
          >
            <div className="relative mb-6">
              <motion.div 
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-500"
              >
                <Crown size={48} fill="currentColor" />
              </motion.div>
              <div className="w-28 h-28 rounded-full bg-yellow-100 border-4 border-yellow-400 flex items-center justify-center text-yellow-600 shadow-xl">
                <Trophy size={56} />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-black text-lg border-2 border-white">1</div>
            </div>
            <div className="bg-white p-8 rounded-t-[2.5rem] border-x border-t border-yellow-200 shadow-xl w-full text-center h-44 flex flex-col justify-center ring-4 ring-yellow-400/20">
              <p className="font-black text-xl text-slate-900 truncate px-2">{topThree[0].username}</p>
              <p className="text-sm font-black text-indigo-600 uppercase tracking-widest mt-1">
                {gamificationService.getRankInfo(topThree[0]).currentRank}
              </p>
              <p className="text-lg font-black text-yellow-500 mt-2">{Math.floor(topThree[0].exp).toLocaleString()} EXP</p>
            </div>
          </motion.div>
        )}

        {/* Top 3 */}
        {topThree[2] && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center w-full md:w-1/3 order-3"
          >
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 border-4 border-orange-300 flex items-center justify-center text-orange-600 shadow-lg">
                <Medal size={32} />
              </div>
              <div className="absolute -top-2 -right-2 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-white">3</div>
            </div>
            <div className="bg-white p-5 rounded-t-[1.5rem] border-x border-t border-slate-200 shadow-sm w-full text-center h-28 flex flex-col justify-center">
              <p className="font-black text-slate-800 truncate px-2">{topThree[2].username}</p>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">
                {gamificationService.getRankInfo(topThree[2]).currentRank}
              </p>
              <p className="text-xs font-black text-orange-600 mt-2">{Math.floor(topThree[2].exp).toLocaleString()} EXP</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Others List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mx-4">
        {others.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {others.map((user, index) => (
              <div 
                key={user.id} 
                className={`flex items-center gap-4 p-6 hover:bg-slate-50 transition-colors ${user.id === currentUser.id ? 'bg-indigo-50/50' : ''}`}
              >
                <div className="w-10 text-center font-black text-slate-400">{index + 4}</div>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <UserIcon size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-black text-slate-800 flex items-center gap-2">
                    {user.username}
                    {user.id === currentUser.id && (
                      <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">You</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Shield size={12} className="text-indigo-600" />
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                      {gamificationService.getRankInfo(user).currentRank}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">{Math.floor(user.exp).toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total EXP</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest">No other users yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
