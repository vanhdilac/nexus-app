import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { storageService } from '../../services/storageService';
import { Trash2, Users, Search, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminViewProps {
  currentUser: User;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isAdmin = currentUser.email === 'vanhdilac@gmail.com' || currentUser.studentId === 'AD020107';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    const allUsers = await storageService.getAllUsers();
    setUsers(allUsers.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    await storageService.deleteUser(userId);
    setUsers(users.filter(u => u.id !== userId));
    setDeleteConfirm(null);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500 max-w-md">
          You do not have administrative privileges to access this section.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <ShieldCheck className="text-indigo-600" />
            Accounts
          </h1>
          <p className="text-slate-500 font-medium">Manage accounts and resolve duplicates</p>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-2xl flex items-center gap-2">
          <Users size={18} className="text-indigo-600" />
          <span className="text-indigo-900 font-black">{users.length} Total Users</span>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search by name, email, or student ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredUsers.map((user) => (
              <motion.div
                layout
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-slate-100 rounded-3xl p-6 flex items-center justify-between hover:border-indigo-100 transition-all shadow-sm group"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-inner"
                    style={{ backgroundColor: user.avatarColor || '#6366f1' }}
                  >
                    {user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 flex items-center gap-2">
                      {user.username}
                      {(user.email === 'vanhdilac@gmail.com' || user.studentId === 'AD020107') && (
                        <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">Admin</span>
                      )}
                    </h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                      <span>{user.email}</span>
                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                      <span>ID: {user.studentId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Rank & EXP</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-indigo-600">{user.rank}</span>
                      <span className="text-xs font-bold text-slate-500">{user.exp} EXP</span>
                    </div>
                  </div>

                  {(user.email !== 'vanhdilac@gmail.com' && user.studentId !== 'AD020107') && (
                    <button
                      onClick={() => setDeleteConfirm(user.id)}
                      className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 text-center mb-4">Delete Account?</h2>
              <p className="text-slate-500 text-center font-medium mb-8">
                This will permanently delete the user's account and all their data (tasks, calendar, progress). This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 rounded-2xl font-black text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirm)}
                  className="flex-1 py-4 rounded-2xl font-black bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
