"use client";

import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function WeekStatsCard() {
    // Mock data
    const stats = {
        totalMoments: 32,
        attendance: 78,
        cancellations: [
            { group: "Poel", count: 3 },
            { group: "Zijl", count: 2 },
            { group: "Vliet", count: 2 }
        ],
        incidents: 4
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-600" />
                Weekstatistieken
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-gray-900">{stats.totalMoments}</div>
                    <div className="text-xs text-gray-500">Sportmomenten</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-gray-900">{stats.attendance}%</div>
                    <div className="text-xs text-gray-500">Gem. Opkomst</div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Meeste Afzeggingen</h4>
                    <div className="flex flex-wrap gap-2">
                        {stats.cancellations.map((item, index) => (
                            <span key={index} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium border border-red-100">
                                {item.group} ({item.count})
                            </span>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Sport-gerelateerde meldingen</span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">
                            {stats.incidents}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
