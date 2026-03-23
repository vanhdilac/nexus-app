
import React, { useState } from 'react';
import { User } from '../../types';
import { authService } from '../../services/authService';
import { User as UserIcon, Lock, Save, CheckCircle2, AlertCircle, Palette, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface ProfileViewProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

const AVATAR_COLORS = [
  '#f27024', // Original Orange
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#1e293b', // Slate
];

export default function ProfileView({ user, onUserUpdated }: ProfileViewProps) {
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [avatarColor, setAvatarColor] = useState(user.avatarColor || '#f27024');
  const [themeColor, setThemeColor] = useState(user.themeColor || '#f27024');
  const [language, setLanguage] = useState<'en' | 'vi'>(user.language || 'en');

  const t = (en: string, vi: string) => language === 'vi' ? vi : en;

  const applyThemeColor = (color: string) => {
    setThemeColor(color);
    document.documentElement.style.setProperty('--accent', color);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const updatedUser = await authService.updateUser(user.id, {
        username,
        bio,
        avatarColor,
        themeColor,
        language
      });

      if (updatedUser) {
        onUserUpdated(updatedUser);
        setMessage({ type: 'success', text: t('Profile updated successfully!', 'Cập nhật hồ sơ thành công!') });
      } else {
        setMessage({ type: 'error', text: t('Failed to update profile.', 'Cập nhật hồ sơ thất bại.') });
      }
    } catch (err) {
      setMessage({ type: 'error', text: t('An error occurred.', 'Đã có lỗi xảy ra.') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: t('New passwords do not match.', 'Mật khẩu mới không khớp.') });
      setIsSubmitting(false);
      return;
    }

    try {
      const updatedUser = await authService.updateUser(user.id, {
        password: newPassword
      });

      if (updatedUser) {
        onUserUpdated(updatedUser);
        setMessage({ type: 'success', text: t('Password changed successfully!', 'Đổi mật khẩu thành công!') });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: t('Failed to change password.', 'Đổi mật khẩu thất bại.') });
      }
    } catch (err) {
      setMessage({ type: 'error', text: t('An error occurred.', 'Đã có lỗi xảy ra.') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          {t('Profile Settings', 'Cài đặt hồ sơ')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {t('Customize your Nexus experience and manage security.', 'Tùy chỉnh trải nghiệm Nexus và quản lý bảo mật.')}
        </p>
      </header>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Customization */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300">
                <UserIcon size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('Personal Information', 'Thông tin cá nhân')}</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('Username', 'Tên người dùng')}</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all font-medium text-slate-900 dark:text-white"
                    placeholder={t('Your display name', 'Tên hiển thị của bạn')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('Student ID', 'Mã số sinh viên')}</label>
                  <input 
                    type="text" 
                    value={user.studentId}
                    disabled
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('Bio / Academic Goal', 'Tiểu sử / Mục tiêu học tập')}</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all font-medium min-h-[100px] text-slate-900 dark:text-white"
                  placeholder={t('Tell us about your academic goals...', 'Hãy cho chúng tôi biết về mục tiêu học tập của bạn...')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Palette size={14} />
                    {t('Accent Color', 'Màu chủ đạo')}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {AVATAR_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => applyThemeColor(color)}
                        className={`w-10 h-10 rounded-full border-4 transition-all ${
                          themeColor === color ? 'border-white ring-2 ring-slate-800 scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    🌐 {t('Language', 'Ngôn ngữ')}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`flex-1 py-3 px-4 rounded-2xl font-bold transition-all border-2 ${
                        language === 'en' 
                          ? 'bg-accent border-accent text-white shadow-lg' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('vi')}
                      className={`flex-1 py-3 px-4 rounded-2xl font-bold transition-all border-2 ${
                        language === 'vi' 
                          ? 'bg-accent border-accent text-white shadow-lg' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Tiếng Việt
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white rounded-2xl font-bold shadow-lg shadow-orange-100 dark:shadow-none hover:opacity-90 transition-all disabled:opacity-50"
              >
                <Save size={18} />
                <span>{t('Save Changes', 'Lưu thay đổi')}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Security / Password */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300">
                <Lock size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('Security', 'Bảo mật')}</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('Current Password', 'Mật khẩu hiện tại')}</label>
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all font-medium text-slate-900 dark:text-white pr-12"
                    placeholder="••••••••"
                    required={!!user.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('New Password', 'Mật khẩu mới')}</label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all font-medium text-slate-900 dark:text-white pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('Confirm New Password', 'Xác nhận mật khẩu mới')}</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all font-medium text-slate-900 dark:text-white pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 dark:bg-slate-700 text-white rounded-2xl font-bold hover:bg-slate-900 dark:hover:bg-slate-600 transition-all disabled:opacity-50 mt-4"
              >
                <Lock size={18} />
                <span>{t('Update Password', 'Cập nhật mật khẩu')}</span>
              </button>
            </form>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('Account Info', 'Thông tin tài khoản')}</h3>
            <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>{t('Account Created', 'Ngày tạo tài khoản')}</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('System Status', 'Trạng thái hệ thống')}</span>
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  {t('Active', 'Đang hoạt động')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
