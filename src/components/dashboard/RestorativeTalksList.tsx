
'use client';

import React from 'react';
import { MessageCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
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

    const failTalk = useMutation({
        mutationFn: async (id: string) => {
            await axios.put('/api/restorative-talks', {
                id,
                status: 'FAILED',
                failureReason: 'Gesprek niet gelukt - te herhalen'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        },
    });

    if (isLoading) return <Skeleton />;

    const talks = stats?.restorativeTalks || [];

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden h-full">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-purple-50/50 dark:bg-purple-900/20">
                <div className="flex items-center gap-2">
                    <MessageCircle className="text-purple-600 dark:text-purple-400" size={20} />
                    <h2 className="font-bold text-gray-800 dark:text-gray-200">Herstelgesprekken</h2>
                </div>
                {talks.length > 0 && (
                    <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-bold px-2 py-1 rounded-full">
                        {talks.length}
                    </span>
                )}
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[300px] overflow-y-auto">
                {talks.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                        Geen openstaande herstelgesprekken.
                    </div>
                ) : (
                    talks.map((talk: any) => (
                        <div key={talk.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{talk.youthName}</h3>
                                        {talk.status === 'FAILED' && (
                                            <span className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                                                Te herhalen
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                        <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 font-medium">
                                            {talk.group?.name || 'Onbekend'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(talk.createdAt).toLocaleDateString('nl-NL')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-3">
                                    <button
                                        onClick={() => completeTalk.mutate(talk.id)}
                                        disabled={completeTalk.isPending || failTalk.isPending}
                                        className="text-gray-300 dark:text-gray-600 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors p-1.5 rounded-lg"
                                        title="Gesprek gelukt - verwijderen"
                                    >
                                        <CheckCircle2 size={20} />
                                    </button>
                                    <button
                                        onClick={() => failTalk.mutate(talk.id)}
                                        disabled={completeTalk.isPending || failTalk.isPending}
                                        className="text-gray-300 dark:text-gray-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors p-1.5 rounded-lg"
                                        title="Gesprek niet gelukt - blijft staan voor herhaling"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            </div>
                            {talk.reason && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
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
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 h-64 animate-pulse" />
    );
}
