"use client";

import React from 'react';
import { Trophy, Info } from 'lucide-react';

export default function ExtraSportPriorityCard() {
    // Mock data
    const priorities = [
        { rank: 1, group: "Zijl", score: 3, reason: "Langst niet geweest" },
        { rank: 2, group: "Zift", score: 4, reason: "" },
        { rank: 3, group: "Vliet", score: 5, reason: "" },
        { rank: 4, group: "Gaag", score: 6, reason: "" },
        { rank: 5, group: "Poel", score: 7, reason: "" },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy size={20} className="text-yellow-600" />
                Extra Sport Prioriteit
            </h3>
            <div className="overflow-hidden rounded-lg border border-gray-100">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-4 py-2">#</th>
                            <th className="px-4 py-2">Groep</th>
                            <th className="px-4 py-2 text-right">Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {priorities.map((item) => (
                            <tr key={item.rank} className="hover:bg-gray-50">
                                <td className="px-4 py-2 font-bold text-gray-700">{item.rank}</td>
                                <td className="px-4 py-2">
                                    <span className="font-medium text-gray-900">{item.group}</span>
                                    {item.reason && <span className="ml-2 text-xs text-gray-400">({item.reason})</span>}
                                </td>
                                <td className="px-4 py-2 text-right font-mono text-gray-600">{item.score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex items-start gap-2 text-xs text-gray-400 bg-gray-50 p-2 rounded">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                <p>Lagere score = hogere prioriteit. Score is gebaseerd op reguliere én extra sportmomenten.</p>
            </div>
        </div>
    );
}
