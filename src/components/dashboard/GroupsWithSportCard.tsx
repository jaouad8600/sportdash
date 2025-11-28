"use client";

import React from 'react';
import { Users } from 'lucide-react';

export default function GroupsWithSportCard() {
    // Mock data
    const groups = ["Gaag", "Zijl", "Lier", "Vliet", "Poel", "Kust", "Golf"];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} className="text-purple-600" />
                Groepen met Sport
            </h3>
            <div className="flex flex-wrap gap-2">
                {groups.map((group, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-100">
                        {group}
                    </span>
                ))}
            </div>
            <p className="mt-auto pt-4 text-xs text-gray-400">
                Totaal {groups.length} groepen vandaag
            </p>
        </div>
    );
}
