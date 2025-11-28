
'use client';

import React from 'react';
import { MessageCircle, CheckCircle2, Clock } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export default function RestorativeTalksList() {
    const { data: stats, isLoading } = useDashboardStats();
    const queryClient = useQueryClient();

    const completeTalk = useMutation({
        mutationFn: async (id: string) => {
            await axios.put('/api/restorative-talks', {
                id,
                status: 'COMPLETED'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        },
    });

    if (isLoading) return <Skeleton />;

    const talks = stats?.restorativeTalks || [];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-purple-50/50">
                <div className="flex items-center gap-2">
                    <MessageCircle className="text-purple-600" size={20} />
                    <h2 className="font-bold text-gray-800">Herstelgesprekken</h2>
                </div>
                {talks.length > 0 && (
                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">
                        {talks.length}
                    </span>
                )}
            </div>

            <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                {talks.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        Geen openstaande herstelgesprekken.
                    </div>
                ) : (
                    talks.map((talk: any) => (
                        <div key={talk.id} className="p-4 hover:bg-gray-50 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{talk.youthName}</h3>
                                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">
                                            {talk.group?.name || 'Onbekend'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(talk.createdAt).toLocaleDateString('nl-NL')}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => completeTalk.mutate(talk.id)}
                                    disabled={completeTalk.isPending}
                                    className="text-gray-300 hover:text-green-600 transition-colors p-1"
                                    title="Markeer als voltooid"
                                >
                                    <CheckCircle2 size={20} />
                                </button>
                            </div>
                            {talk.reason && (
                                <p className="text-sm text-gray-600 line-clamp-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    {talk.reason}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-64 animate-pulse" />
    );
}
