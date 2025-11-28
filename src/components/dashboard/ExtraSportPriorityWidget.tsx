
'use client';

import React from 'react';
import { Trophy, TrendingUp, AlertCircle } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import Link from 'next/link';

export default function ExtraSportPriorityWidget() {
    const { data: stats, isLoading } = useDashboardStats();

    if (isLoading) return <Skeleton />;

    const priorityGroups = stats?.extraSportPriority?.slice(0, 3) || [];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-green-50/50">
                <div className="flex items-center gap-2">
                    <Trophy className="text-green-600" size={20} />
                    <h2 className="font-bold text-gray-800">Extra Sport Prioriteit</h2>
                </div>
                <Link href="/extra-sportmomenten" className="text-xs font-medium text-green-700 hover:underline">
                    Bekijk alles
                </Link>
            </div>

            <div className="p-4 space-y-4">
                {priorityGroups.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-4">
                        Geen data beschikbaar.
                    </div>
                ) : (
                    priorityGroups.map((group: any, index: number) => (
                        <div key={group.id} className="flex items-center gap-4">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    index === 1 ? 'bg-gray-100 text-gray-700' :
                                        'bg-orange-50 text-orange-700'}
                            `}>
                                {index + 1}
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-gray-900">{group.name}</span>
                                    <span className="text-xs font-medium text-gray-500">
                                        Score: {group.score}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${group.score > 80 ? 'bg-green-500' :
                                            group.score > 50 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${Math.min(group.score, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-[10px] text-gray-400">Prioriteit</span>
                                    <span className="text-[10px] text-gray-400">{group.momentCount} momenten</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex items-start gap-2">
                <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                <p>Prioriteit wordt berekend op basis van gemiste kansen en aantal extra momenten in de afgelopen 30 dagen.</p>
            </div>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-64 animate-pulse" />
    );
}
