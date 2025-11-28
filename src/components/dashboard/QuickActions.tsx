'use client';

import React from 'react';
import { Activity, CalendarDays, ClipboardList, Stethoscope, AlertTriangle } from 'lucide-react';
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
        <div className="bg-[#1e293b] p-4 rounded-xl shadow-lg mb-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {actions.map((action) => (
                        <Link
                            key={action.label}
                            href={action.href}
                            className="flex-1 md:flex-none flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg transition-all text-sm font-medium whitespace-nowrap border border-white/5"
                        >
                            <div className={`p-1 rounded-md ${action.color}`}>
                                <action.icon size={14} className="text-white" />
                            </div>
                            {action.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
