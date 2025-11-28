
'use client';

import React from 'react';
import { Users, Activity, AlertCircle, Shield } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import Link from 'next/link';
import { Group } from '@prisma/client';

export default function GroupStatusGrid() {
    const { data: stats, isLoading } = useDashboardStats();

    if (isLoading || !stats) {
        return <GridSkeleton />;
    }

    // Sort groups: active first, then alphabetical
    const sortedGroups = [...stats.groups].sort((a, b) => {
        if (a.isActive === b.isActive) {
            return a.name.localeCompare(b.name);
        }
        return a.isActive ? -1 : 1;
    });

    return (
        <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 font-serif">Groepen & Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedGroups.map((group) => (
                    <GroupCard key={group.id} group={group} />
                ))}
            </div>
        </div>
    );
}

function GroupCard({ group }: { group: Group & { activeMutations: number; activeIndications: number } }) {
    // Mock status logic if not in DB, or use existing field
    // Assuming 'status' field exists or we derive it
    const isActive = group.isActive;
    const statusColor = isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200';
    const statusLabel = isActive ? 'Actief' : 'Inactief';

    // Mock "Leiden" vs "Zelfstandig" logic for demo purposes if not in DB
    // In real app, this would come from group.guidanceType or similar
    const guidanceType = group.name.includes('Vliet') || group.name.includes('Rak') ? 'LEIDEN' : 'ZELFSTANDIG';
    const guidanceColor = guidanceType === 'LEIDEN' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100';
    const guidanceLabel = guidanceType === 'LEIDEN' ? 'Leiden (Veel sturing)' : 'Zelfstandig (Veel vertrouwen)';

    return (
        <Link
            href={`/groepen/${group.id}`}
            className="block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:border-blue-300 group"
        >
            <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                        {group.name}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${guidanceColor}`}>
                        {guidanceType}
                    </span>
                </div>

                <div className="text-xs text-gray-500 mb-4 line-clamp-1" title={guidanceLabel}>
                    {guidanceLabel}
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600" title="Aantal jongeren">
                        <Users size={14} className="text-gray-400" />
                        <span>{group.youthCount || 0}</span>
                    </div>

                    {group.activeMutations > 0 && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                            <Activity size={12} />
                            <span>{group.activeMutations}</span>
                        </div>
                    )}

                    {group.activeIndications > 0 && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            <AlertCircle size={12} />
                            <span>{group.activeIndications}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

function GridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            ))}
        </div>
    );
}
