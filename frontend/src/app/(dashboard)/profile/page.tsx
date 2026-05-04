'use client';

import { useState } from 'react';
import { User, Lock, Save, AlertCircle, CheckCircle, Mail, Shield, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth';
import { useTheme, ThemeToggle } from '@/components/ThemeProvider';

export default function ProfilePage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'security'>('profile');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    // Validation
    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      setLoading(false);
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const getCardClass = () => isDark 
    ? 'bg-[#1a1a1a]/60 border-[#2a2a2a]' 
    : 'bg-white/60 border-[#e0e0e0]';
  
  const getInputClass = () => isDark
    ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-500 focus:border-[#33b843] focus:ring-[#33b843]/20'
    : 'bg-white border-[#e0e0e0] text-[#1a1a1a] placeholder-gray-400 focus:border-[#33b843] focus:ring-[#33b843]/20';
  
  const getTabClass = (active: boolean) => active
    ? (isDark ? 'border-b-2 border-[#33b843] text-[#33b843]' : 'border-b-2 border-[#33b843] text-[#2da33a]')
    : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#1a1a1a]');
  
  const getAlertClass = (type: 'success' | 'error') => type === 'success'
    ? (isDark ? 'bg-[#33b843]/10 border-[#33b843]/20 text-[#33b843]' : 'bg-[#33b843]/10 border-[#33b843]/20 text-[#2da33a]')
    : (isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-500');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white' : 'bg-white hover:bg-gray-50 text-gray-500 hover:text-[#1a1a1a]'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Profile Settings</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Manage your account and preferences</p>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <div className={`p-4 rounded-lg border flex items-center gap-3 ${getAlertClass(message.type)}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className={`border-b ${isDark ? 'border-[#2a2a2a]' : 'border-[#e0e0e0]'}`}>
        <div className="flex gap-6">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'password', label: 'Change Password', icon: Lock },
            { id: 'security', label: 'Security', icon: Shield },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'profile' | 'password' | 'security')}
              className={`flex items-center gap-2 px-1 py-3 text-sm font-medium transition-colors ${getTabClass(activeTab === id)}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className={`rounded-xl border p-6 ${getCardClass()}`}>
          <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Personal Information</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border outline-none transition-all ${getInputClass()}`}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border outline-none transition-all ${getInputClass()}`}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border outline-none transition-all ${getInputClass()}`}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#33b843] hover:bg-[#2da33a] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <div className={`rounded-xl border p-6 ${getCardClass()}`}>
          <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Change Password</h2>
          <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Update your password to keep your account secure. Use at least 8 characters.
          </p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="max-w-md space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Current Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border outline-none transition-all ${getInputClass()}`}
                    placeholder="Enter current password"
                    required
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  New Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border outline-none transition-all ${getInputClass()}`}
                    placeholder="Enter new password (min 8 chars)"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border outline-none transition-all ${getInputClass()}`}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#33b843] hover:bg-[#2da33a] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className={`rounded-xl border p-6 ${getCardClass()}`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Appearance</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Theme</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Toggle between dark and light mode
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
          
          <div className={`rounded-xl border p-6 ${getCardClass()}`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Account Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-dashed ${isDark ? 'border-[#2a2a2a]' : 'border-[#e0e0e0]'}">
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Two-Factor Authentication</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Add an extra layer of security
                  </p>
                </div>
                <button className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:text-white' : 'bg-white border-[#e0e0e0] text-gray-500 hover:text-[#1a1a1a]'}`}>
                  Enable
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Active Sessions</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Manage your active login sessions
                  </p>
                </div>
                <button className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:text-white' : 'bg-white border-[#e0e0e0] text-gray-500 hover:text-[#1a1a1a]'}`}>
                  Manage
                </button>
              </div>
            </div>
          </div>
          
          <div className={`rounded-xl border p-6 ${getCardClass()}`}>
            <h2 className={`text-lg font-semibold mb-4 text-red-400`}>Danger Zone</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Delete Account</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Permanently delete your account and all data
                </p>
              </div>
              <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
