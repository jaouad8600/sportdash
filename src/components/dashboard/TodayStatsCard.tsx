"use client";

import React from 'react';
import { Activity, CheckCircle, XCircle } from 'lucide-react';

export default function TodayStatsCard() {
    // Mock data - replace with API call later
    const stats = {
        planned: 12,
        realized: 7,
        cancelled: 2
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between h-full">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity size={20} className="text-blue-600" />
                Sportmomenten Vandaag
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{stats.planned}</div>
                    <div className="text-xs text-blue-600 font-medium uppercase">Gepland</div>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{stats.realized}</div>
                    <div className="text-xs text-green-600 font-medium uppercase">Gedaan</div>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-700">{stats.cancelled}</div>
                    <div className="text-xs text-red-600 font-medium uppercase">Uitval</div>
                </div>
            </div>
        </div>
    );
}
