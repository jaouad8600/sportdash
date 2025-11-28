"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { GroupReport } from './ReportingApp';

interface Props {
    onAdd: (report: GroupReport) => void;
    reports: GroupReport[];
    onRemove: (id: string) => void;
    onFinish: () => void;
}

export default function ReportingForm({ onAdd, reports, onRemove, onFinish }: Props) {
    const [groups, setGroups] = useState<any[]>([]);

    // Form state
    const [selectedGroup, setSelectedGroup] = useState('');
    const [youthCount, setYouthCount] = useState<number>(0);
    const [glCount, setGlCount] = useState<number>(0);
    const [warmingUp, setWarmingUp] = useState('');
    const [sportMoment, setSportMoment] = useState('');
    const [particularities, setParticularities] = useState('');

    useEffect(() => {
        // Try to fetch groups
        fetch('/api/groepen')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setGroups(data);
                }
            })
            .catch(() => {
                console.log('Could not fetch groups, using manual input');
            });
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup) return;

        const newReport: GroupReport = {
            id: Math.random().toString(36).substr(2, 9),
            groupName: selectedGroup,
            youthCount,
            glCount,
            warmingUp: warmingUp || 'n.v.t',
            sportMoment: sportMoment || 'n.v.t',
            particularities: particularities || 'Geen bijzonderheden',
        };

        onAdd(newReport);

        // Reset form
        setSelectedGroup('');
        setYouthCount(0);
        setGlCount(0);
        setWarmingUp('');
        setSportMoment('');
        setParticularities('');
    };

    return (
        <div className="space-y-6">
            {/* List of added reports */}
            {reports.length > 0 && (
                <div className="space-y-2 mb-6">
                    <h3 className="text-sm font-medium text-gray-700">Toegevoegde groepen:</h3>
                    <div className="space-y-2">
                        {reports.map(r => (
                            <div key={r.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <span className="font-medium text-gray-900">{r.groupName}</span>
                                <button onClick={() => onRemove(r.id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Groep</label>
                        {groups.length > 0 ? (
                            <select
                                value={selectedGroup}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Selecteer groep...</option>
                                {groups.map((g: any) => (
                                    <option key={g.id} value={g.name}>{g.name}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={selectedGroup}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Bijv. De Vliet"
                                required
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Aantal Jongeren</label>
                        <input
                            type="number"
                            value={youthCount}
                            onChange={(e) => setYouthCount(parseInt(e.target.value) || 0)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            min="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Aantal GL</label>
                        <input
                            type="number"
                            value={glCount}
                            onChange={(e) => setGlCount(parseInt(e.target.value) || 0)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            min="0"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warming-up</label>
                    <input
                        type="text"
                        value={warmingUp}
                        onChange={(e) => setWarmingUp(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="Bijv. Voetbal 4v4"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sportmoment</label>
                    <input
                        type="text"
                        value={sportMoment}
                        onChange={(e) => setSportMoment(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="Bijv. Fitness"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bijzonderheden</label>
                    <textarea
                        value={particularities}
                        onChange={(e) => setParticularities(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg h-24"
                        placeholder="Bijv. Goede sfeer..."
                    />
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={18} />
                        Groep Toevoegen
                    </button>

                    {reports.length > 0 && (
                        <button
                            type="button"
                            onClick={onFinish}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-auto"
                        >
                            <Check size={18} />
                            Naar Rapportage
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
