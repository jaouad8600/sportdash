"use client";
import React, { useEffect, useState } from 'react';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TodaysSchedule() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard/schedule')
            .then(res => res.json())
            .then(data => {
                setItems(data.items || []);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl"></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-purple-600" />
                Vandaag Gepland
            </h3>
            <div className="space-y-3">
                {items.length === 0 ? (
                    <p className="text-gray-500 text-sm">Geen items gepland voor vandaag.</p>
                ) : (
                    items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${item.type === 'Beperking' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                <span className="text-sm font-medium text-gray-700">{item.title}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                                <Clock size={12} />
                                {item.time}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <Link href="/kalender" className="mt-4 flex items-center text-sm text-purple-600 font-medium hover:underline">
                Bekijk volledige agenda <ArrowRight size={16} className="ml-1" />
            </Link>
        </div>
    );
}
