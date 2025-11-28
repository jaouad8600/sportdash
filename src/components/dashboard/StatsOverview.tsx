
'use client';

import React from 'react';
import { Activity, ShieldBan, Stethoscope } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import Link from 'next/link';

export default function StatsOverview() {
    const { data: stats, isLoading } = useDashboardStats();

    if (isLoading || !stats) {
        return <StatsSkeleton />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
                title="Sportmutaties"
                count={stats.mutations.count}
                label="actief"
                icon={Activity}
                color="text-orange-600"
                bgColor="bg-orange-50"
                borderColor="border-orange-100"
                items={stats.mutations.active}
                href="/sportmutaties"
            />
            <StatCard
                title="Sportindicaties"
                count={stats.indications.count}
                label="actief"
                icon={Stethoscope}
                color="text-blue-600"
                bgColor="bg-blue-50"
                borderColor="border-blue-100"
                items={stats.indications.active}
                href="/sportindicaties"
            />
            <StatCard
                title="In Beperking"
                count={stats.restrictions.count}
                label="in beperking"
                icon={ShieldBan}
                color="text-red-600"
                bgColor="bg-red-50"
                borderColor="border-red-100"
                items={stats.restrictions.active}
                href="/incidenten" // Or specific restrictions page if available
            />
        </div>
    );
}

function StatCard({ title, count, label, icon: Icon, color, bgColor, borderColor, items, href }: any) {
    return (
        <Link
            href={href}
            className={`block rounded-xl border ${borderColor} bg-white p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group`}
        >
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon size={80} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2 rounded-lg ${bgColor} ${color}`}>
                        <Icon size={20} />
                    </div>
                    <h3 className="font-semibold text-gray-700">{title}</h3>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-gray-900">{count}</span>
                    <span className="text-sm text-gray-500 font-medium">{label}</span>
                </div>

                <div className="space-y-1">
                    {items.slice(0, 3).map((item: any) => (
                        <div key={item.id} className="text-xs text-gray-500 flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} />
                            <span className="truncate font-medium">
                                {item.youth ? (
                                    `${item.youth.firstName} ${item.youth.lastName}`
                                ) : (
                                    // Try to extract from reason if it's a mutation and has the format
                                    item.reason?.match(/\(Jongere: (.*?)\)/)?.[1] ||
                                    item.youthName ||
                                    'Onbekend'
                                )}
                                {/* Always show group if available */}
                                {item.group?.name && (
                                    <span className="text-[10px] text-gray-400">({item.group.name})</span>
                                )}
                            </span>
                        </div>
                    ))}
                    {items.length > 3 && (
                        <div className="text-xs text-gray-400 pl-3.5">
                            + {items.length - 3} meer...
                        </div>
                    )}
                    {items.length === 0 && (
                        <div className="text-xs text-gray-400 italic pl-3.5">
                            Geen actieve items
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
            ))}
        </div>
    );
}
