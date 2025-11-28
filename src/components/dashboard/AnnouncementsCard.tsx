"use client";

import React from 'react';
import { Megaphone } from 'lucide-react';

export default function AnnouncementsCard() {
    // Mock data
    const announcements = [
        "Bezoek externe partij in sportzaal 10:00–12:00",
        "Onderhoud fitnessapparatuur 15:00–17:00",
        "Materiaalcheck vrijdag vóór 16:00 invullen"
    ];

    return (
        <div className="bg-blue-600 rounded-xl shadow-sm p-6 text-white h-full">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Megaphone size={20} className="text-blue-200" />
                Mededelingen
            </h3>
            <ul className="space-y-3">
                {announcements.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-blue-50">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-blue-300 rounded-full flex-shrink-0" />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}
