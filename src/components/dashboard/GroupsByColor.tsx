"use client";
import React, { useEffect, useState } from 'react';
import { Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function GroupsByColor() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard/stats')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl"></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                Groepen per Kleur
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <div className="text-2xl font-bold text-green-700">{stats?.GROEN || 0}</div>
                    <div className="text-sm text-green-600 font-medium">Groen</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                    <div className="text-2xl font-bold text-yellow-700">{stats?.GEEL || 0}</div>
                    <div className="text-sm text-yellow-600 font-medium">Geel</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <div className="text-2xl font-bold text-orange-700">{stats?.ORANJE || 0}</div>
                    <div className="text-sm text-orange-600 font-medium">Oranje</div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <div className="text-2xl font-bold text-red-700">{stats?.ROOD || 0}</div>
                    <div className="text-sm text-red-600 font-medium">Rood</div>
                </div>
            </div>
            <Link href="/groepen" className="mt-4 flex items-center text-sm text-blue-600 font-medium hover:underline">
                Bekijk alle groepen <ArrowRight size={16} className="ml-1" />
            </Link>
        </div>
    );
}
