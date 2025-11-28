"use client";

import { useState, useEffect } from "react";
import { Loader2, Send, AlertTriangle, CheckCircle, Plus, Trash2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { ParsedReport } from "@/services/parserService";

interface Group {
    id: string;
    name: string;
}

interface ReportEntry {
    id: string;
    groupId: string;
    groupName: string;
    text: string;
    parsedData: ParsedReport | null;
    isAnalyzing: boolean;
    isSaved: boolean;
}

export default function InputPage() {
    const router = useRouter();
    const [groups, setGroups] = useState<Group[]>([]);
    const [entries, setEntries] = useState<ReportEntry[]>([{
        id: '1',
        groupId: '',
        groupName: '',
        text: '',
        parsedData: null,
        isAnalyzing: false,
        isSaved: false
    }]);
    const [isGlobalSaving, setIsGlobalSaving] = useState(false);

    useEffect(() => {
        fetch("/api/groups")
            .then((res) => res.json())
            .then((data) => setGroups(data))
            .catch((err) => console.error("Failed to fetch groups", err));
    }, []);

    const handleAddEntry = () => {
        setEntries([...entries, {
            id: Math.random().toString(36).substr(2, 9),
            groupId: '',
            groupName: '',
            text: '',
            parsedData: null,
            isAnalyzing: false,
            isSaved: false
        }]);
    };

    const handleRemoveEntry = (id: string) => {
        if (entries.length > 1) {
            setEntries(entries.filter(e => e.id !== id));
        }
    };

    const updateEntry = (id: string, field: keyof ReportEntry, value: any) => {
        setEntries(entries.map(e => {
            if (e.id === id) {
                const updated = { ...e, [field]: value };
                if (field === 'groupId') {
                    const group = groups.find(g => g.id === value);
                    if (group) updated.groupName = group.name;
                }
                return updated;
            }
            return e;
        }));
    };

    const updateParsedData = (id: string, field: string, value: any) => {
        setEntries(entries.map(e => {
            if (e.id === id && e.parsedData) {
                return {
                    ...e,
                    parsedData: { ...e.parsedData, [field]: value }
                };
            }
            return e;
        }));
    };

    const analyzeEntry = async (id: string) => {
        const entry = entries.find(e => e.id === id);
        if (!entry || !entry.text || !entry.groupId) return;

        updateEntry(id, 'isAnalyzing', true);

        try {
            const res = await fetch("/api/reports/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: entry.text }),
            });

            if (!res.ok) throw new Error("Analysis failed");

            const data = await res.json();
            // Initialize missing fields if they don't exist
            const completeData = {
                ...data,
                leaderCount: data.leaderCount || 2,
                warmingUp: data.warmingUp || "",
                activity: data.activity || "",
                planForTomorrow: data.planForTomorrow || ""
            };

            updateEntry(id, 'parsedData', completeData);
        } catch (error) {
            console.error("Analysis error:", error);
            alert("Kon de tekst niet analyseren. Probeer het opnieuw.");
        } finally {
            updateEntry(id, 'isAnalyzing', false);
        }
    };

    const saveAll = async () => {
        const entriesToSave = entries.filter(e => e.parsedData && !e.isSaved);
        if (entriesToSave.length === 0) return;

        setIsGlobalSaving(true);

        try {
            await Promise.all(entriesToSave.map(async (entry) => {
                const res = await fetch("/api/reports", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        groupId: entry.groupId,
                        content: entry.text,
                        parsedData: entry.parsedData,
                        date: new Date().toISOString(),
                    }),
                });

                if (!res.ok) throw new Error(`Failed to save report for ${entry.groupName}`);
                updateEntry(entry.id, 'isSaved', true);
            }));

            // If all saved successfully
            if (entries.every(e => e.isSaved || entriesToSave.find(s => s.id === e.id))) {
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Er is een fout opgetreden bij het opslaan.");
        } finally {
            setIsGlobalSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Snel Invoeren</h1>
                    <p className="text-gray-500">Rapporteer voor meerdere groepen tegelijk</p>
                </div>
                <button
                    onClick={saveAll}
                    disabled={isGlobalSaving || !entries.some(e => e.parsedData && !e.isSaved)}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-all"
                >
                    {isGlobalSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                    Alles Opslaan
                </button>
            </div>

            <div className="space-y-6">
                {entries.map((entry, index) => (
                    <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="font-bold text-gray-700 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                    {index + 1}
                                </span>
                                {entry.groupName || "Nieuwe Rapportage"}
                            </h2>
                            {entries.length > 1 && (
                                <button
                                    onClick={() => handleRemoveEntry(entry.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>

                        <div className="p-6">
                            {!entry.parsedData ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Selecteer Groep</label>
                                        <select
                                            value={entry.groupId}
                                            onChange={(e) => updateEntry(entry.id, 'groupId', e.target.value)}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        >
                                            <option value="">Kies een groep...</option>
                                            {groups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rapportage Tekst</label>
                                        <textarea
                                            value={entry.text}
                                            onChange={(e) => updateEntry(entry.id, 'text', e.target.value)}
                                            placeholder="Plak hier de tekst..."
                                            className="w-full h-40 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => analyzeEntry(entry.id)}
                                            disabled={!entry.groupId || !entry.text || entry.isAnalyzing}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center text-sm font-medium"
                                        >
                                            {entry.isAnalyzing ? <Loader2 className="animate-spin mr-2" size={16} /> : <Send className="mr-2" size={16} />}
                                            Analyseren
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Review Mode */}
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Groep</label>
                                            <div className="font-bold text-gray-900 text-lg">{entry.groupName}</div>
                                        </div>
                                        <div className="w-px h-10 bg-blue-200 hidden md:block"></div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Aantal Jongeren</label>
                                            <input
                                                type="number"
                                                value={entry.parsedData.presentYouth}
                                                onChange={(e) => updateParsedData(entry.id, 'presentYouth', parseInt(e.target.value))}
                                                className="w-full bg-white border border-blue-200 rounded px-2 py-1 font-bold text-lg"
                                            />
                                        </div>
                                        <div className="w-px h-10 bg-blue-200 hidden md:block"></div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Aantal Begeleiders</label>
                                            <input
                                                type="number"
                                                value={entry.parsedData.leaderCount || 2}
                                                onChange={(e) => updateParsedData(entry.id, 'leaderCount', parseInt(e.target.value))}
                                                className="w-full bg-white border border-blue-200 rounded px-2 py-1 font-bold text-lg"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Warming-up</label>
                                            <input
                                                type="text"
                                                value={entry.parsedData.warmingUp || ""}
                                                onChange={(e) => updateParsedData(entry.id, 'warmingUp', e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg"
                                                placeholder="Bijv. Rondje rennen"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Hoofdactiviteit</label>
                                            <input
                                                type="text"
                                                value={entry.parsedData.activity || ""}
                                                onChange={(e) => updateParsedData(entry.id, 'activity', e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg"
                                                placeholder="Bijv. Voetbal"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sfeer & Dynamiek</label>
                                        <textarea
                                            value={entry.parsedData.atmosphere}
                                            onChange={(e) => updateParsedData(entry.id, 'atmosphere', e.target.value)}
                                            className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Plan voor morgen</label>
                                        <textarea
                                            value={entry.parsedData.planForTomorrow || ""}
                                            onChange={(e) => updateParsedData(entry.id, 'planForTomorrow', e.target.value)}
                                            className="w-full h-20 p-3 border border-gray-200 rounded-lg text-sm"
                                            placeholder="Wat gaan we morgen doen?"
                                        />
                                    </div>

                                    {/* Incidents Section */}
                                    {entry.parsedData.incidents && entry.parsedData.incidents.length > 0 && (
                                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                            <h3 className="font-bold text-red-800 mb-3 flex items-center">
                                                <AlertTriangle size={16} className="mr-2" />
                                                Geregistreerde Incidenten
                                            </h3>
                                            <div className="space-y-3">
                                                {entry.parsedData.incidents.map((inc, idx) => (
                                                    <div key={idx} className="bg-white p-3 rounded border border-red-100 text-sm">
                                                        <div className="font-bold text-red-700 mb-1">{inc.type}</div>
                                                        <div className="text-gray-600 mb-2">{inc.description}</div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                                            <div>Betrokken: {inc.involvedYouth.join(", ")}</div>
                                                            <div>Actie: {inc.actionTaken}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={() => updateEntry(entry.id, 'parsedData', null)}
                                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                                        >
                                            Terug naar bewerken
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                <button
                    onClick={handleAddEntry}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center font-medium"
                >
                    <Plus className="mr-2" />
                    Nog een groep toevoegen
                </button>
            </div>
        </div>
    );
}
