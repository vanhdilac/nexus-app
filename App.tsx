
import React, { useState, useEffect } from 'react';
import { User, Task, CalendarEvent, Rank } from './types';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import TaskList from './components/Tasks/TaskList';
import MatrixView from './components/Matrix/MatrixView';
import CalendarView from './components/Calendar/CalendarView';
import ProfileView from './components/Profile/ProfileView';
import FeedbackView from './components/FeedbackView';
import RankedView from './components/Ranked/RankedView';
import LeaderboardView from './components/Leaderboard/LeaderboardView';
import { AdminView } from './components/Admin/AdminView';
import OnboardingModal from './components/OnboardingModal';
import UpcomingExams from './components/UpcomingExams';
import Footer from './components/Footer';
import { Activity, ClipboardList, LayoutGrid, Calendar, LogOut, MapPin, MessageSquare, BookOpen, Menu, X as CloseIcon, Shield, Timer, Moon, Sun, Trophy, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NexusLogo from './components/NexusLogo';
import PomodoroView from './components/Pomodoro/PomodoroView';

import { notificationService } from './services/notificationService';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'matrix' | 'calendar' | 'profile' | 'feedback' | 'pomodoro' | 'ranked' | 'leaderboard' | 'admin'>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Clean up old localStorage data to ensure a clean Firebase-only system
  useEffect(() => {
    const oldKeys = ['nexus_user', 'nexus_tasks', 'nexus_calendar', 'nexus_app_data'];
    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let userData = await storageService.getUser(firebaseUser.uid);
        if (userData) {
          // Force reset to 0 as requested by user (v2)
          if (!userData.hasBeenReset_v2) {
            userData = {
              ...userData,
              exp: 0,
              rankExp: 0,
              level: 1,
              rank: Rank.UNRANKED,
              hasBeenReset_v2: true
            };
            await storageService.saveUser(userData);
          }
          const updatedUser = await authService.checkAndUpdateStreak(userData);
          const finalUser = updatedUser || userData;
          setUser(finalUser);
          
          if (!finalUser.hasSeenOnboarding) {
            setShowOnboarding(true);
          }
        }
      } else {
        setUser(null);
        setTasks([]);
        setCalendar([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Data Listeners
  useEffect(() => {
    if (user) {
      const unsubscribeTasks = storageService.subscribeToTasks(user.id, (newTasks) => {
        setTasks(newTasks);
      });
      const unsubscribeCalendar = storageService.subscribeToCalendar(user.id, (newEvents) => {
        setCalendar(newEvents);
      });

      return () => {
        unsubscribeTasks();
        unsubscribeCalendar();
      };
    }
  }, [user?.id]);

  // Auto-delete logic: 15 minutes after completion
  useEffect(() => {
    if (user && tasks.length > 0) {
      const interval = setInterval(() => {
        const now = Date.now();
        const fifteenMinutes = 15 * 60 * 1000;
        
        tasks.forEach(task => {
          if (task.isCompleted && task.completedAt) {
            if (now - task.completedAt >= fifteenMinutes) {
              storageService.deleteTask(task.id);
            }
          }
        });
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [user, tasks]);

  useEffect(() => {
    if (user) {
      const checkStreakRisk = () => {
        const now = new Date();
        const hours = now.getHours();
        const today = now.toISOString().split('T')[0];
        
        if (hours >= 21 && user.lastActiveDate !== today) {
          setNotifications(prev => [...prev, "🔥 Hey! The day is almost over! Keep your streak alive, only 3 hours left!"]);
          setShowNotifications(true);
        }
      };

      const streakInterval = setInterval(checkStreakRisk, 1000 * 60 * 30); // Check every 30 mins
      checkStreakRisk();
      return () => clearInterval(streakInterval);
    }
  }, [user]);

  useEffect(() => {
    if (tasks.length > 0) {
      const reminders = notificationService.checkExamReminders(tasks);
      if (reminders.length > 0) {
        setNotifications(reminders);
        setShowNotifications(true);
      }
    }
  }, [tasks]);

  useEffect(() => {
    if (user) {
      if (user.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      if (user.themeColor) {
        document.documentElement.style.setProperty('--accent', user.themeColor);
        
        const r = parseInt(user.themeColor.slice(1, 3), 16);
        const g = parseInt(user.themeColor.slice(3, 5), 16);
        const b = parseInt(user.themeColor.slice(5, 7), 16);
        document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
      }
    }
  }, [user?.isDarkMode, user?.themeColor]);

  const handleLogin = async (u: User) => {
    const updatedUser = await authService.checkAndUpdateStreak(u);
    setUser(updatedUser || u);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  const handleCloseOnboarding = async () => {
    if (user) {
      const updated = await authService.updateUser(user.id, { hasSeenOnboarding: true });
      if (updated) setUser(updated);
    }
    setShowOnboarding(false);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await storageService.saveTask({ ...task, ...updates });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <NexusLogo size={64} className="animate-pulse" />
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (user?.studentId === 'AD020107') {
      return <AdminView currentUser={user} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard tasks={tasks} user={user} onTabChange={setActiveTab} />;
      case 'tasks':
        return <TaskList tasks={tasks} calendar={calendar} userId={user.id} onTasksUpdated={() => {}} onUserUpdated={(u) => setUser(u)} />;
      case 'matrix':
        return <MatrixView tasks={tasks} onUpdateTask={handleUpdateTask} />;
      case 'calendar':
        return <CalendarView tasks={tasks} userId={user.id} calendar={calendar} onCalendarUpdated={() => {}} onTasksUpdated={() => {}} onUserUpdated={(u) => setUser(u)} />;
      case 'profile':
        return <ProfileView user={user} onUserUpdated={(updatedUser) => setUser(updatedUser)} />;
      case 'feedback':
        return <FeedbackView user={user} />;
      case 'pomodoro':
        return <PomodoroView user={user} onUserUpdated={(u) => setUser(u)} />;
      case 'ranked':
        return <RankedView user={user} onUserUpdated={(u) => setUser(u)} />;
      case 'leaderboard':
        return <LeaderboardView currentUser={user} />;
      case 'admin':
        return <AdminView currentUser={user} />;
      default:
        return <Dashboard tasks={tasks} user={user} onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      {/* Sidebar Overlay Backdrop (Desktop/Tablet) */}
      <AnimatePresence>
        {!isSidebarCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarCollapsed(true)}
            className="hidden md:block fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[45]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 96 : 288 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="hidden md:flex flex-col bg-[var(--card-bg)] border-r border-[var(--card-border)] p-6 fixed h-full shadow-lg z-50 overflow-hidden"
      >
        <div className={`flex items-center mb-6 px-2 transition-all ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3">
              <NexusLogo size={36} />
              <div className="flex flex-col">
                <span className="font-extrabold text-2xl tracking-tighter text-slate-800 leading-none">NEXUS</span>
                <span className="text-[7px] font-black text-accent uppercase tracking-widest mt-1">Da Nang Campus</span>
              </div>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
        
        {!isSidebarCollapsed && (
          <div className="px-2 mb-8 flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">
            <MapPin size={10} className="text-slate-300" />
            FPT University
          </div>
        )}


        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
          {user.studentId === 'AD020107' ? (
            <NavItem icon={<Users size={20}/>} label="Accounts" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} collapsed={isSidebarCollapsed} />
          ) : (
            <>
              <NavItem icon={<Activity size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={isSidebarCollapsed} />
              <NavItem icon={<ClipboardList size={20}/>} label="Academic Tasks" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} collapsed={isSidebarCollapsed} />
              <NavItem icon={<LayoutGrid size={20}/>} label="The Matrix" active={activeTab === 'matrix'} onClick={() => setActiveTab('matrix')} collapsed={isSidebarCollapsed} />
              <NavItem icon={<Calendar size={20}/>} label="Study Planner" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} collapsed={isSidebarCollapsed} specialIconColor="text-white" />
              <NavItem icon={<Timer size={20}/>} label="Pomodoro" active={activeTab === 'pomodoro'} onClick={() => setActiveTab('pomodoro')} collapsed={isSidebarCollapsed} />
              <NavItem icon={<Shield size={20}/>} label="Ranked" active={activeTab === 'ranked'} onClick={() => setActiveTab('ranked')} collapsed={isSidebarCollapsed} />
              <NavItem icon={<Trophy size={20}/>} label="Leaderboard" active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} collapsed={isSidebarCollapsed} />
              <NavItem icon={<MessageSquare size={20}/>} label="Feedback" active={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')} collapsed={isSidebarCollapsed} />
              
              {!isSidebarCollapsed && <UpcomingExams tasks={tasks} />}
            </>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 mb-6 p-2 w-full rounded-2xl border transition-all text-left ${
              activeTab === 'profile' 
                ? 'bg-slate-200 dark:bg-slate-900 border-slate-300 dark:border-slate-800 ring-2 ring-slate-300 dark:ring-slate-800' 
                : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            } ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white shadow-lg shrink-0"
              style={{ backgroundColor: user.avatarColor || '#f27024' }}
            >
              {user.username[0].toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="font-bold text-slate-900 dark:text-slate-50 truncate text-sm">{user.username}</p>
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 truncate uppercase tracking-tighter">{user.studentId}</p>
              </div>
            )}
          </button>
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-2 text-slate-400 hover:text-rose-600 transition-colors w-full text-left px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl font-bold text-sm ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={18} />
            {!isSidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Top Nav */}
      <div className="md:hidden glass-effect sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <NexusLogo size={32} />
          <div className="flex flex-col">
            <span className="font-extrabold text-xl text-slate-800 tracking-tighter leading-none">NEXUS</span>
            <span className="text-[6px] font-black text-accent uppercase tracking-widest">Da Nang</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('profile')}
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs shadow-md"
            style={{ backgroundColor: user.avatarColor || '#f27024' }}
          >
            {user.username[0].toUpperCase()}
          </button>
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-[101] md:hidden p-6 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                  <NexusLogo size={36} />
                  <div className="flex flex-col">
                    <span className="font-extrabold text-2xl tracking-tighter text-slate-800 leading-none">NEXUS</span>
                    <span className="text-[7px] font-black text-[#f27024] uppercase tracking-widest mt-1">Da Nang Campus</span>
                  </div>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <CloseIcon size={20} />
                </button>
              </div>
              
              <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                {user.studentId === 'AD020107' ? (
                  <NavItem icon={<Users size={20}/>} label="Accounts" active={activeTab === 'admin'} onClick={() => { setActiveTab('admin'); setIsMenuOpen(false); }} />
                ) : (
                  <>
                    <NavItem icon={<Activity size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }} />
                    <NavItem icon={<ClipboardList size={20}/>} label="Academic Tasks" active={activeTab === 'tasks'} onClick={() => { setActiveTab('tasks'); setIsMenuOpen(false); }} />
                    <NavItem icon={<LayoutGrid size={20}/>} label="The Matrix" active={activeTab === 'matrix'} onClick={() => { setActiveTab('matrix'); setIsMenuOpen(false); }} />
                    <NavItem icon={<Calendar size={20}/>} label="Study Planner" active={activeTab === 'calendar'} onClick={() => { setActiveTab('calendar'); setIsMenuOpen(false); }} specialIconColor="text-black" />
                    <NavItem icon={<Timer size={20}/>} label="Pomodoro" active={activeTab === 'pomodoro'} onClick={() => { setActiveTab('pomodoro'); setIsMenuOpen(false); }} />
                    <NavItem icon={<Shield size={20}/>} label="Ranked" active={activeTab === 'ranked'} onClick={() => { setActiveTab('ranked'); setIsMenuOpen(false); }} />
                    <NavItem icon={<Trophy size={20}/>} label="Leaderboard" active={activeTab === 'leaderboard'} onClick={() => { setActiveTab('leaderboard'); setIsMenuOpen(false); }} />
                    <NavItem icon={<MessageSquare size={20}/>} label="Feedback" active={activeTab === 'feedback'} onClick={() => { setActiveTab('feedback'); setIsMenuOpen(false); }} />
                    
                    <UpcomingExams tasks={tasks} />
                  </>
                )}
              </nav>

              <div className="mt-auto pt-6 border-t border-slate-100">
                <button 
                  onClick={() => { setActiveTab('profile'); setIsMenuOpen(false); }}
                  className={`flex items-center gap-3 mb-6 p-2 w-full rounded-2xl border transition-all text-left ${
                    activeTab === 'profile' 
                      ? 'bg-slate-200 dark:bg-slate-900 border-slate-300 dark:border-slate-800 ring-2 ring-slate-300 dark:ring-slate-800' 
                      : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white shadow-lg shrink-0"
                    style={{ backgroundColor: user.avatarColor || '#f27024' }}
                  >
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-900 dark:text-slate-50 truncate text-sm">{user.username}</p>
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 truncate uppercase tracking-tighter">{user.studentId}</p>
                  </div>
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-slate-400 hover:text-rose-600 transition-colors w-full text-left px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl font-bold text-sm"
                >
                  <LogOut size={18} />
                  <span>Sign out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-24 transition-all duration-300">
        <main className="flex-1 p-4 md:p-10">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </main>
        
        {/* Footer Integration */}
        <Footer />
      </div>

      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={handleCloseOnboarding} 
      />

      {/* Floating Buttons Container */}
      <div className="fixed bottom-24 md:bottom-8 right-8 z-[100] flex items-center gap-[10px]">
        {/* Floating Help Button */}
        {user.studentId !== 'AD020107' && (
          <button
            onClick={() => setShowOnboarding(true)}
            className="p-4 bg-white dark:bg-slate-800 text-[#f27024] rounded-full shadow-2xl border border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all group flex items-center gap-2"
            title="Show User Guide"
          >
            <div className="bg-orange-500 p-1.5 rounded-lg shadow-lg shadow-orange-500/30 transition-colors">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="hidden md:block font-bold text-xs uppercase tracking-widest pr-2">{user.language === 'vi' ? 'Hướng dẫn' : 'Guide'}</span>
          </button>
        )}
      </div>

      {/* Mobile Bottom Nav */}
      {user.studentId !== 'AD020107' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-effect border-t border-slate-200 px-6 py-4 flex justify-between items-center z-[100]">
          <MobileNavItem icon={<Activity size={24}/>} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <MobileNavItem icon={<ClipboardList size={24}/>} active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
          <MobileNavItem icon={<LayoutGrid size={24}/>} active={activeTab === 'matrix'} onClick={() => setActiveTab('matrix')} />
          <MobileNavItem icon={<Timer size={24}/>} active={activeTab === 'pomodoro'} onClick={() => setActiveTab('pomodoro')} />
          <MobileNavItem icon={<Shield size={24}/>} active={activeTab === 'ranked'} onClick={() => setActiveTab('ranked')} />
          <MobileNavItem icon={<Trophy size={24}/>} active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} />
          <MobileNavItem icon={<Calendar size={24}/>} active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
        </nav>
      )}
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick, specialIconColor, collapsed }: { icon: any, label: string, active: boolean, onClick: () => void, specialIconColor?: string, collapsed?: boolean }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-200 font-bold ${
      active 
        ? 'bg-accent text-white shadow-xl shadow-indigo-100' 
        : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200'
    } ${collapsed ? 'justify-center' : ''}`}
    title={collapsed ? label : ''}
  >
    <div className={`${active ? (specialIconColor ? specialIconColor : 'text-white') : ''}`}>
      {icon}
    </div>
    {!collapsed && <span className="text-sm truncate">{label}</span>}
  </button>
);

const MobileNavItem = ({ icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`${active ? 'text-accent scale-110' : 'text-slate-400'} transition-all p-2`}>
    {icon}
  </button>
);
