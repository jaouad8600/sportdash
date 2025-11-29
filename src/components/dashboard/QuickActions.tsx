'use client';

import React from 'react';
import { Activity, CalendarDays, ClipboardList, Stethoscope, AlertTriangle, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function QuickActions() {
    const actions = [
        {
            label: 'Nieuwe Mutatie',
            href: '/sportmutaties?new=true',
            icon: Activity,
            color: 'bg-orange-500',
        },
        {
            label: 'Nieuwe Indicatie',
            href: '/sportindicaties?new=true',
            icon: Stethoscope,
            color: 'bg-blue-500',
        },
        {
            label: 'Herstelgesprek',
            href: '/herstelgesprekken',
            icon: MessageCircle,
            color: 'bg-purple-600',
        },
        {
            label: 'Planning Bekijken',
            href: '/planning',
            icon: CalendarDays,
            color: 'bg-purple-500',
        },
        {
            label: 'Nieuwe Rapportage',
            href: '/rapportage',
            icon: ClipboardList,
            color: 'bg-red-500',
        },
        {
            label: 'Incident Melden',
            href: '/incidenten?new=true',
            icon: AlertTriangle,
            color: 'bg-orange-600',
        },
    ];

    return (
        <div className="bg-gray-800 dark:bg-gray-900 p-3.5 rounded-lg shadow-md border border-gray-700 dark:border-gray-800">
            <div className="flex flex-wrap gap-2.5 justify-center items-center">
                {actions.map((action) => (
                    <Link
                        key={action.label}
                        href={action.href}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-md transition-all text-sm font-medium whitespace-nowrap border border-white/5 hover:border-white/10"
                    >
                        <div className={`p-0.5 rounded ${action.color}`}>
                            <action.icon size={14} className="text-white" />
                        </div>
                        {action.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
