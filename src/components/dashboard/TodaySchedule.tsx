
'use client';

import React from 'react';
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Mock data for now, ideally fetched via hook
const MOCK_SCHEDULE = [
    { id: 1, time: '09:00', group: 'De Vliet', type: 'Sport', location: 'Sportzaal EB' },
    { id: 2, time: '10:30', group: 'De Bron', type: 'Extra Sport', location: 'Fitness Vloed' },
    { id: 3, time: '13:00', group: 'De Gaag', type: 'Sport', location: 'Sportveld' },
    { id: 4, time: '14:30', group: 'Het Rak', type: 'Indicatie', location: 'Fitness Vloed' },
    { id: 5, time: '16:00', group: 'De Kreek', type: 'Sport', location: 'Sportzaal EB' },
];

export default function TodaySchedule() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden mb-8">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-2">
                    <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
                    <h2 className="font-bold text-gray-800 dark:text-gray-200">Sportmomenten Vandaag</h2>
                </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {MOCK_SCHEDULE.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-mono font-medium w-16">
                                <Clock size={16} className="text-gray-400" />
                                {item.time}
                            </div>

                            <div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">{item.group}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${getTypeColor(item.type)}`}>
                                        {item.type}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin size={10} />
                                        {item.location}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 text-center">
                <Link href="/kalender" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
                    Bekijk volledige kalender
                </Link>
            </div>
        </div>
    );
}

function getTypeColor(type: string) {
    switch (type.toLowerCase()) {
        case 'sport': return 'bg-blue-50 text-blue-700 border-blue-100';
        case 'extra sport': return 'bg-green-50 text-green-700 border-green-100';
        case 'indicatie': return 'bg-purple-50 text-purple-700 border-purple-100';
        default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
}
