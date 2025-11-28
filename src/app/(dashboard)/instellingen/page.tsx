
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthContext';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Lock,
  Moon,
  Sun,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Laptop
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance'>('profile');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-serif">Instellingen</h1>
        <p className="text-gray-500 mt-2">Beheer je accountinstellingen en voorkeuren.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            <NavButton
              active={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
              icon={User}
              label="Algemeen"
            />
            <NavButton
              active={activeTab === 'security'}
              onClick={() => setActiveTab('security')}
              icon={Lock}
              label="Beveiliging"
            />
            <NavButton
              active={activeTab === 'appearance'}
              onClick={() => setActiveTab('appearance')}
              icon={Sun}
              label="Weergave"
            />
          </nav>

          {/* Role Card */}
          <div className="mt-8 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Shield size={18} />
              </div>
              <span className="font-semibold text-blue-900">Jouw Rol</span>
            </div>
            <p className="text-sm text-blue-700 font-medium ml-1">
              {user?.role || 'Onbekend'}
            </p>
            <p className="text-xs text-blue-600/80 mt-1 ml-1">
              Je hebt toegang tot functionaliteiten op basis van deze rol.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'appearance' && <AppearanceSettings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${active
          ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
          : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
      <Icon size={18} className={active ? 'text-blue-600' : 'text-gray-400'} />
      {label}
    </button>
  );
}

function ProfileSettings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setStatus('success');
      setMessage('Profiel succesvol bijgewerkt');
      // Reload to update context
      window.location.reload();
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Profielinformatie</h2>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gebruikersnaam
          </label>
          <input
            type="text"
            value={user?.username || ''}
            disabled
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Gebruikersnaam kan niet worden gewijzigd.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weergavenaam
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg text-sm">
            <CheckCircle2 size={16} />
            {message}
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
            <AlertCircle size={16} />
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Opslaan
        </button>
      </form>
    </div>
  );
}

function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Nieuwe wachtwoorden komen niet overeen');
      return;
    }

    setIsLoading(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setStatus('success');
      setMessage('Wachtwoord succesvol gewijzigd');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Wachtwoord Wijzigen</h2>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Huidig Wachtwoord
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            required
          />
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">
            Nieuw Wachtwoord
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bevestig Nieuw Wachtwoord
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            required
            minLength={6}
          />
        </div>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg text-sm">
            <CheckCircle2 size={16} />
            {message}
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
            <AlertCircle size={16} />
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Wachtwoord Wijzigen
        </button>
      </form>
    </div>
  );
}

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Weergave Instellingen</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
        <ThemeCard
          active={theme === 'light'}
          onClick={() => setTheme('light')}
          icon={Sun}
          label="Licht"
          description="Standaard lichte weergave"
        />
        <ThemeCard
          active={theme === 'dark'}
          onClick={() => setTheme('dark')}
          icon={Moon}
          label="Donker"
          description="Prettig voor de ogen in het donker"
        />
        <ThemeCard
          active={theme === 'system'}
          onClick={() => setTheme('system')}
          icon={Laptop}
          label="Systeem"
          description="Volgt je systeeminstellingen"
        />
      </div>
    </div>
  );
}

function ThemeCard({ active, onClick, icon: Icon, label, description }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 text-left ${active
          ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
    >
      <div className={`p-2 rounded-lg mb-3 ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
        <Icon size={20} />
      </div>
      <span className={`font-semibold mb-1 ${active ? 'text-blue-900' : 'text-gray-900'}`}>
        {label}
      </span>
      <span className={`text-xs ${active ? 'text-blue-700' : 'text-gray-500'}`}>
        {description}
      </span>
    </button>
  );
}
