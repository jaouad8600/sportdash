"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Send, Save, Archive, FileText } from 'lucide-react';

interface ReportGroup {
    id: string;
    groupId: string;
    groupName: string;
    youthCount: number;
    glCount: number;
    warmingUp: string;
    activity: string;
    notes: string;
}

export default function ReportingApp() {
    const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
    const [reportGroups, setReportGroups] = useState<ReportGroup[]>([]);
    const [generatedText, setGeneratedText] = useState("");
    const [step, setStep] = useState<'EDIT' | 'PREVIEW'>('EDIT');

    useEffect(() => {
        fetch('/api/groups').then(res => res.json()).then(setGroups);
    }, []);

    const addGroup = () => {
        setReportGroups([...reportGroups, {
            id: Math.random().toString(36).substr(2, 9),
            groupId: "",
            groupName: "",
            youthCount: 0,
            glCount: 0,
            warmingUp: "",
            activity: "",
            notes: ""
        }]);
    };

    const updateGroup = (id: string, field: keyof ReportGroup, value: any) => {
        setReportGroups(prev => prev.map(g => {
            if (g.id === id) {
                const updates: any = { [field]: value };
                if (field === 'groupId') {
                    const group = groups.find(grp => grp.id === value);
                    if (group) updates.groupName = group.name;
                }
                return { ...g, ...updates };
            }
            return g;
        }));
    };

    const removeGroup = (id: string) => {
        setReportGroups(prev => prev.filter(g => g.id !== id));
    };

    const generatePreview = () => {
        const text = reportGroups.map(r => `
Groep: ${r.groupName} (${r.youthCount}- jongeren, ${r.glCount} GL)

Warming-up: ${r.warmingUp || 'n.v.t'}
Sportmoment: ${r.activity || 'n.v.t'}
Bijzonderheden: ${r.notes || 'Geen bijzonderheden'}
`).join('\n');
        setGeneratedText(text.trim());
        setStep('PREVIEW');
    };

    const handleAction = async (action: 'SAVE' | 'ARCHIVE' | 'EMAIL') => {
        try {
            const res = await fetch('/api/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reports: reportGroups, action })
            });
            if (res.ok) {
                alert(`Actie ${action} succesvol uitgevoerd!`);
                if (action === 'EMAIL') {
                    // Reset form after email
                    setReportGroups([]);
                    setStep('EDIT');
                }
            }
        } catch (error) {
            console.error("Failed to perform action", error);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <FileText size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Dagrapportage</h2>
            </div>

            {step === 'EDIT' ? (
                <div className="space-y-6">
                    {reportGroups.map((group, index) => (
                        <div key={group.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative">
                            <button
                                onClick={() => removeGroup(group.id)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                            >
                                <Trash2 size={18} />
                            </button>

                            <h3 className="font-semibold text-gray-700 mb-4">Groep {index + 1}</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Groep</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={group.groupId}
                                        onChange={e => updateGroup(group.id, 'groupId', e.target.value)}
                                    >
                                        <option value="">Selecteer...</option>
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jongeren</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded-lg"
                                        value={group.youthCount}
                                        onChange={e => updateGroup(group.id, 'youthCount', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">GL</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded-lg"
                                        value={group.glCount}
                                        onChange={e => updateGroup(group.id, 'glCount', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <input
                                    placeholder="Warming-up"
                                    className="w-full p-2 border rounded-lg"
                                    value={group.warmingUp}
                                    onChange={e => updateGroup(group.id, 'warmingUp', e.target.value)}
                                />
                                <input
                                    placeholder="Sportmoment"
                                    className="w-full p-2 border rounded-lg"
                                    value={group.activity}
                                    onChange={e => updateGroup(group.id, 'activity', e.target.value)}
                                />
                                <textarea
                                    placeholder="Bijzonderheden"
                                    className="w-full p-2 border rounded-lg"
                                    rows={2}
                                    value={group.notes}
                                    onChange={e => updateGroup(group.id, 'notes', e.target.value)}
                                />
                            </div>
                        </div>
                    ))}

                    <div className="flex gap-3">
                        <button
                            onClick={addGroup}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                        >
                            <Plus size={18} /> Groep toevoegen
                        </button>
                        {reportGroups.length > 0 && (
                            <button
                                onClick={generatePreview}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium ml-auto"
                            >
                                Naar Preview
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 font-mono text-sm whitespace-pre-wrap">
                        {generatedText}
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setStep('EDIT')}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium mr-auto"
                        >
                            Terug naar bewerken
                        </button>

                        <button
                            onClick={() => handleAction('ARCHIVE')}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                        >
                            <Archive size={18} /> Archiveren
                        </button>
                        <button
                            onClick={() => handleAction('SAVE')}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                        >
                            <Save size={18} /> Opslaan
                        </button>
                        <button
                            onClick={() => handleAction('EMAIL')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            <Send size={18} /> Versturen
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
