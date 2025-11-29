'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  Activity,
  CalendarCheck,
  BookOpen,
  Package,
  Database,
  LogOut,
  Calendar,
  Settings,
  Trophy,
  FolderOpen,
  MessageSquare,
  MessageCircle,
  ClipboardList,
  AlertTriangle,
  Stethoscope,
  Dumbbell,
  Phone
} from "lucide-react";
import { useAuth } from '@/components/providers/AuthContext';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/groepen', label: 'Groepen', icon: Users },
  { href: '/sportmomenten', label: 'Dagplanning', icon: CalendarDays },

  { href: '/rapportage', label: 'Rapportages', icon: ClipboardList },
  { href: '/incidenten', label: 'Incidenten', icon: AlertTriangle },
  { href: '/herstelgesprekken', label: 'Herstelgesprekken', icon: MessageSquare },
  { href: '/sportindicaties', label: 'Sportindicaties', icon: Stethoscope },
  { href: '/sportmutaties', label: 'Sportmutaties', icon: Activity },
  { href: '/extra-sportmomenten', label: 'Extra Sport', icon: Dumbbell },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/telefoonnummers', label: 'Telefoonnummers', icon: Phone }, // Added Phone Numbers link
  { href: '/bestanden', label: 'Bestanden', icon: FolderOpen }, // Added Bestanden link
  { href: '/reserveringen', label: 'Reserveringen', icon: CalendarCheck },
  { href: '/kalender', label: 'Kalender', icon: Calendar }, // Added Kalender link
  { href: '/bibliotheek', label: 'Bibliotheek', icon: BookOpen },
  { href: '/materialen', label: 'Materialen', icon: Package },
  { href: '/backup', label: 'Back-up', icon: Database },
  { href: '/instellingen', label: 'Instellingen', icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-black text-white flex flex-col shrink-0 border-r border-gray-900">
      {/* Logo & Branding */}
      {/* Logo & Branding */}
      <div className="p-6 border-b border-gray-900 relative overflow-hidden group">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 opacity-50"></div>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-orange-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <img
              src="/logos/teylingereind-logo-white.jpg"
              alt="Teylingereind Logo"
              className="relative w-12 h-12 object-contain rounded-lg shadow-xl bg-black/20"
            />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide uppercase">Teylingereind</h1>
            <p className="text-xs text-blue-400 font-medium tracking-wider">Activiteitenteam</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
              SportDash
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-900 text-gray-400 border border-gray-800">
              v1.0
            </span>
          </div>
          <div className="h-1 w-12 bg-orange-500 rounded-full mt-1"></div>
        </div>

        {/* Current Date - Enhanced */}
        <div className="mt-5 pt-4 border-t border-gray-800/50">
          <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-gray-900/50 to-gray-800/30 p-2.5 rounded-lg border border-gray-800/50 backdrop-blur-sm">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <div className="text-xs font-semibold text-gray-300 tracking-wide capitalize">
              {new Date().toLocaleDateString('nl-NL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {NAV.map(i => {
          const active = path === i.href || (path !== '/' && path?.startsWith(i.href));
          const Icon = i.icon;
          return (
            <Link
              key={i.href}
              href={i.href}
              className={
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm ' +
                (active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white')
              }
            >
              <Icon size={18} />
              {i.label}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout Section */}
      <div className="p-4 border-t border-gray-900">
        <div className="flex items-center gap-3 px-2 py-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Gebruiker'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role || 'Rol'}</p>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 text-sm transition-colors border border-gray-800"
        >
          <LogOut size={16} />
          <span>Uitloggen</span>
        </button>
      </div>
    </aside>
  );
}
