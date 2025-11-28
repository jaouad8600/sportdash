"use client";

import React from 'react';
import { MapPin } from 'lucide-react';

export default function RoomAvailabilityCard() {
    // Mock data
    const rooms = [
        { name: "Sportzaal EB", status: "Bezet tot 14:00", available: false },
        { name: "Fitness Vloed", status: "Vrij", available: true },
        { name: "Sportveld EB", status: "Vrij tot 16:30", available: true },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-orange-600" />
                Beschikbare Ruimtes
            </h3>
            <div className="space-y-3">
                {rooms.map((room, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-700">{room.name}</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${room.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}>
                            {room.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
