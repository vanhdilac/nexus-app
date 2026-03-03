
import React, { useState, useEffect } from 'react';
import { User, Task, CalendarEvent } from './types';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import TaskList from './components/Tasks/TaskList';
import MatrixView from './components/Matrix/MatrixView';
import CalendarView from './components/Calendar/CalendarView';
import ProfileView from './components/Profile/ProfileView';
import FeedbackView from './components/FeedbackView';
import OnboardingModal from './components/OnboardingModal';
import UpcomingExams from './components/UpcomingExams';
import Footer from './components/Footer';
import { Activity, ClipboardList, LayoutGrid, Calendar, LogOut, MapPin, MessageSquare, BookOpen, Menu, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NexusLogo from './components/NexusLogo';

import { notificationService } from './services/notificationService';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'matrix' | 'calendar' | 'profile' | 'feedback'>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Refresh every minute to update dynamic quadrants
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loggedInUser = authService.getCurrentUser();
    if (loggedInUser) {
      setUser(loggedInUser);
      refreshData(loggedInUser.id);
      
      // Show onboarding if first time
      if (!loggedInUser.hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, []);

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
      }
    }
  }, [user?.isDarkMode, user?.themeColor]);

  const refreshData = (userId: string) => {
    setTasks(storageService.getTasksByUserId(userId));
    setCalendar(storageService.getCalendarByUserId(userId));
  };

  const handleLogin = (u: User) => {
    setUser(u);
    refreshData(u.id);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setTasks([]);
    setCalendar([]);
  };

  const handleCloseOnboarding = () => {
    if (user) {
      const updated = authService.updateUser(user.id, { hasSeenOnboarding: true });
      if (updated) setUser(updated);
    }
    setShowOnboarding(false);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    const data = storageService.getData();
    const taskIndex = data.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      data.tasks[taskIndex] = { ...data.tasks[taskIndex], ...updates };
      storageService.saveData(data);
      if (user) refreshData(user.id);
    }
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard tasks={tasks} user={user} onTabChange={setActiveTab} />;
      case 'tasks':
        return <TaskList tasks={tasks} calendar={calendar} userId={user.id} onTasksUpdated={() => refreshData(user.id)} onUserUpdated={(u) => setUser(u)} />;
      case 'matrix':
        return <MatrixView tasks={tasks} onUpdateTask={handleUpdateTask} />;
      case 'calendar':
        return <CalendarView tasks={tasks} userId={user.id} calendar={calendar} onCalendarUpdated={() => refreshData(user.id)} onTasksUpdated={() => refreshData(user.id)} onUserUpdated={(u) => setUser(u)} />;
      case 'profile':
        return <ProfileView user={user} onUserUpdated={(updatedUser) => setUser(updatedUser)} />;
      case 'feedback':
        return <FeedbackView user={user} />;
      default:
        return <Dashboard tasks={tasks} user={user} onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-[var(--card-bg)] border-r border-[var(--card-border)] p-6 fixed h-full shadow-lg z-50">
        <div className="flex items-center gap-3 mb-2 px-2">
          <NexusLogo size={36} />
          <div className="flex flex-col">
            <span className="font-extrabold text-2xl tracking-tighter text-slate-800 leading-none">NEXUS</span>
            <span className="text-[7px] font-black text-[#f27024] uppercase tracking-widest mt-1">Da Nang Campus</span>
          </div>
        </div>
        
        <div className="px-2 mb-8 flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">
          <MapPin size={10} className="text-slate-300" />
          FPT University
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
          <NavItem icon={<Activity size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<ClipboardList size={20}/>} label="Academic Tasks" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
          <NavItem icon={<LayoutGrid size={20}/>} label="The Matrix" active={activeTab === 'matrix'} onClick={() => setActiveTab('matrix')} />
          <NavItem icon={<Calendar size={20}/>} label="Study Planner" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} specialIconColor="text-black" />
          <NavItem icon={<MessageSquare size={20}/>} label="Feedback" active={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')} />
          
          <UpcomingExams tasks={tasks} />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 mb-6 p-2 w-full rounded-2xl border transition-all text-left ${
              activeTab === 'profile' 
                ? 'bg-slate-100 border-slate-200 ring-2 ring-slate-200' 
                : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
            }`}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white shadow-lg shrink-0"
              style={{ backgroundColor: user.avatarColor || '#f27024' }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-slate-800 truncate text-sm">{user.username}</p>
              <p className="text-[10px] font-black text-slate-400 truncate uppercase tracking-tighter">{user.studentId}</p>
            </div>
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-rose-600 transition-colors w-full text-left px-4 py-3 hover:bg-rose-50 rounded-xl font-bold text-sm"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Nav */}
      <div className="md:hidden glass-effect sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <NexusLogo size={32} />
            <div className="flex flex-col">
              <span className="font-extrabold text-xl text-slate-800 tracking-tighter leading-none">NEXUS</span>
              <span className="text-[6px] font-black text-[#f27024] uppercase tracking-widest">Da Nang</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setActiveTab('profile')}
          className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs shadow-md"
          style={{ backgroundColor: user.avatarColor || '#f27024' }}
        >
          {user.username[0].toUpperCase()}
        </button>
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
                <NavItem icon={<Activity size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }} />
                <NavItem icon={<ClipboardList size={20}/>} label="Academic Tasks" active={activeTab === 'tasks'} onClick={() => { setActiveTab('tasks'); setIsMenuOpen(false); }} />
                <NavItem icon={<LayoutGrid size={20}/>} label="The Matrix" active={activeTab === 'matrix'} onClick={() => { setActiveTab('matrix'); setIsMenuOpen(false); }} />
                <NavItem icon={<Calendar size={20}/>} label="Study Planner" active={activeTab === 'calendar'} onClick={() => { setActiveTab('calendar'); setIsMenuOpen(false); }} specialIconColor="text-black" />
                <NavItem icon={<MessageSquare size={20}/>} label="Feedback" active={activeTab === 'feedback'} onClick={() => { setActiveTab('feedback'); setIsMenuOpen(false); }} />
                
                <UpcomingExams tasks={tasks} />
              </nav>

              <div className="mt-auto pt-6 border-t border-slate-100">
                <button 
                  onClick={() => { setActiveTab('profile'); setIsMenuOpen(false); }}
                  className={`flex items-center gap-3 mb-6 p-2 w-full rounded-2xl border transition-all text-left ${
                    activeTab === 'profile' 
                      ? 'bg-slate-100 border-slate-200 ring-2 ring-slate-200' 
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white shadow-lg shrink-0"
                    style={{ backgroundColor: user.avatarColor || '#f27024' }}
                  >
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-800 truncate text-sm">{user.username}</p>
                    <p className="text-[10px] font-black text-slate-400 truncate uppercase tracking-tighter">{user.studentId}</p>
                  </div>
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-slate-400 hover:text-rose-600 transition-colors w-full text-left px-4 py-3 hover:bg-rose-50 rounded-xl font-bold text-sm"
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
      <div className="flex-1 flex flex-col md:ml-72">
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

      {/* Notification Modal (Simulated Email) */}
      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-100 rounded-2xl text-[#f27024]">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Nexus Mail</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hệ thống nhắc nhở tự động</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                {notifications.map((note, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-medium text-slate-700 leading-relaxed">
                    {note}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowNotifications(false)}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-100 hover:bg-black transition-all"
              >
                Đã hiểu, cảm ơn Nexus!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Help Button */}
      <button
        onClick={() => setShowOnboarding(true)}
        className="fixed bottom-24 md:bottom-8 right-8 z-[100] p-4 bg-white text-[#f27024] rounded-full shadow-2xl border border-slate-100 hover:scale-110 active:scale-95 transition-all group flex items-center gap-2"
        title="Show User Guide"
      >
        <div className="bg-orange-100 p-1.5 rounded-lg group-hover:bg-orange-200 transition-colors">
          <BookOpen size={20} />
        </div>
        <span className="hidden md:block font-bold text-xs uppercase tracking-widest pr-2">Guide</span>
      </button>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-effect border-t border-slate-200 px-6 py-4 flex justify-between items-center z-[100]">
        <MobileNavItem icon={<Activity size={24}/>} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <MobileNavItem icon={<ClipboardList size={24}/>} active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
        <MobileNavItem icon={<LayoutGrid size={24}/>} active={activeTab === 'matrix'} onClick={() => setActiveTab('matrix')} />
        <MobileNavItem icon={<Calendar size={24}/>} active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
      </nav>
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick, specialIconColor }: { icon: any, label: string, active: boolean, onClick: () => void, specialIconColor?: string }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-200 font-bold ${
      active 
        ? 'bg-[#f27024] text-white shadow-xl shadow-orange-100' 
        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
    }`}
  >
    <div className={`${active ? (specialIconColor ? specialIconColor : 'text-white') : ''}`}>
      {icon}
    </div>
    <span className="text-sm">{label}</span>
  </button>
);

const MobileNavItem = ({ icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`${active ? 'text-[#f27024] scale-110' : 'text-slate-400'} transition-all p-2`}>
    {icon}
  </button>
);
