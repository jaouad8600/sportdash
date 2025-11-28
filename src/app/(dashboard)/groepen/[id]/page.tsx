"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Users, Activity, AlertTriangle, Calendar, StickyNote, Plus, Archive, Trash2, Edit2, X, Save, MessageCircle } from "lucide-react";
import { ParsedReport } from "@/services/parserService";
import { motion, AnimatePresence } from "framer-motion";
import { anonymizeName, anonymizeText } from "@/lib/privacy";

interface Group {
    id: string;
    name: string;
    color: string;
    notes: Note[];
}

interface Note {
    id: string;
    content: string;
    createdAt: string;
    archived: boolean;
}

interface Report {
    id: string;
    date: string;
    content: string;
    parsedData: string | null;
    confidenceScore?: number;
}

interface RestorativeTalk {
    id: string;
    youthName: string;
    reason: string;
    status: "PENDING" | "COMPLETED" | "FAILED";
    createdAt: string;
    createdBy: string;
}

export default function GroupDetailPage() {
    const params = useParams();
    const groupId = params.id as string;

    const [group, setGroup] = useState<Group | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [talks, setTalks] = useState<RestorativeTalk[]>([]);
    const [loading, setLoading] = useState(true);

    // New Counts State
    const [mutationCount, setMutationCount] = useState(0);
    const [indicationCount, setIndicationCount] = useState(0);
    const [restrictionCount, setRestrictionCount] = useState(0);

    // Notes State
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [noteContent, setNoteContent] = useState("");

    // Talks State
    const [isTalkModalOpen, setIsTalkModalOpen] = useState(false);
    const [newTalk, setNewTalk] = useState({ youthName: "", reason: "", createdBy: "" });

    useEffect(() => {
        if (groupId) {
            fetchData();
        }
    }, [groupId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [groupRes, reportsRes, notesRes, talksRes] = await Promise.all([
                fetch(`/api/groups?id=${groupId}`),
                fetch(`/api/reports?groupId=${groupId}`),
                fetch(`/api/groups/notes?groupId=${groupId}`),
                fetch(`/api/restorative-talks?groupId=${groupId}`),
                // New fetches
                fetch(`/api/mutaties?groupId=${groupId}`),
                fetch(`/api/indicaties?groupId=${groupId}`),
                fetch(`/api/restrictions?groupId=${groupId}`)
            ]);

            const groupsData = await groupRes.json();
            const foundGroup = Array.isArray(groupsData)
                ? groupsData.find((g: any) => g.id === groupId)
                : groupsData;

            setGroup(foundGroup);
            setReports(await reportsRes.json());
            setNotes(await notesRes.json());
            setTalks(await talksRes.json());

            // Set counts
            // Assuming APIs return arrays. If they return objects with 'items', adjust accordingly.
            // For safety, check if array.
            const muts = await (arguments[4] as Promise<Response>).then(r => r.json()).catch(() => []);
            const inds = await (arguments[5] as Promise<Response>).then(r => r.json()).catch(() => []);
            const rests = await (arguments[6] as Promise<Response>).then(r => r.json()).catch(() => []);

            setMutationCount(Array.isArray(muts) ? muts.filter((m: any) => m.isActive).length : 0);
            setIndicationCount(Array.isArray(inds) ? inds.filter((i: any) => i.isActive).length : 0);
            setRestrictionCount(Array.isArray(rests) ? rests.filter((r: any) => r.isActive).length : 0);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNote = async () => {
        if (!noteContent.trim()) return;

        try {
            const method = editingNote ? "PUT" : "POST";
            const body = editingNote
                ? { id: editingNote.id, content: noteContent }
                : { content: noteContent, groupId };

            const res = await fetch("/api/groups/notes", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setIsNoteModalOpen(false);
                setNoteContent("");
                setEditingNote(null);
                // Refresh notes
                const notesRes = await fetch(`/api/groups/notes?groupId=${groupId}`);
                setNotes(await notesRes.json());
            }
        } catch (error) {
            console.error("Error saving note", error);
        }
    };

    const handleArchiveNote = async (noteId: string) => {
        if (!confirm("Weet je zeker dat je deze notitie wilt archiveren?")) return;
        try {
            await fetch("/api/groups/notes", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: noteId, archived: true }),
            });
            // Refresh notes
            const notesRes = await fetch(`/api/groups/notes?groupId=${groupId}`);
            setNotes(await notesRes.json());
        } catch (error) {
            console.error("Error archiving note", error);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm("Weet je zeker dat je deze notitie wilt verwijderen?")) return;
        try {
            await fetch(`/api/groups/notes?id=${noteId}`, {
                method: "DELETE",
            });
            // Refresh notes
            const notesRes = await fetch(`/api/groups/notes?groupId=${groupId}`);
            setNotes(await notesRes.json());
        } catch (error) {
            console.error("Error deleting note", error);
        }
    };

    const handleCreateTalk = async () => {
        if (!newTalk.youthName.trim() || !newTalk.reason.trim()) return;

        try {
            const res = await fetch("/api/restorative-talks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    groupId,
                    youthName: newTalk.youthName,
                    reason: newTalk.reason,
                    createdBy: newTalk.createdBy,
                }),
            });

            if (res.ok) {
                setIsTalkModalOpen(false);
                setNewTalk({ youthName: "", reason: "", createdBy: "" });
                // Refresh talks
                const talksRes = await fetch(`/api/restorative-talks?groupId=${groupId}`);
                setTalks(await talksRes.json());
            }
        } catch (error) {
            console.error("Error creating talk", error);
        }
    };

    const handleUpdateTalkStatus = async (id: string, status: string) => {
        try {
            await fetch("/api/restorative-talks", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status }),
            });
            // Refresh talks
            const talksRes = await fetch(`/api/restorative-talks?groupId=${groupId}`);
            setTalks(await talksRes.json());
        } catch (error) {
            console.error("Error updating talk", error);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!group) return <div className="p-8 text-center text-gray-500">Groep niet gevonden.</div>;

    // Calculate KPIs
    const totalReports = reports.length;
    const incidents = reports.filter(r => {
        const parsed = r.parsedData ? JSON.parse(r.parsedData) : null;
        return parsed?.incidents?.length > 0;
    }).length;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full blur-3xl -z-10 opacity-50" />

                <div>
                    <div className="flex items-center space-x-4 mb-2">
                        <div
                            className="w-5 h-5 rounded-full shadow-sm ring-2 ring-white"
                            style={{ backgroundColor: group.color }}
                        />
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight font-serif">{group.name}</h1>
                    </div>
                    <p className="text-gray-500 text-lg">Detailoverzicht en historie</p>

                    {/* Color Status Text */}
                    <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                        <span className="mr-2">Status:</span>
                        {(() => {
                            switch (group.color?.toUpperCase()) {
                                case 'ROOD': return 'Leiden (Veel sturing, weinig ondersteuning)';
                                case 'ORANJE': return 'Begeleiden (Gemiddelde sturing, gemiddelde ondersteuning)';
                                case 'GEEL': return 'Steunen (Weinig sturing, veel ondersteuning)';
                                case 'GROEN': return 'Delegeren (Weinig sturing, weinig ondersteuning)';
                                default: return 'Onbekend';
                            }
                        })()}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setEditingNote(null);
                            setNoteContent("");
                            setIsNoteModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-teylingereind-royal text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 font-medium"
                    >
                        <Plus size={20} />
                        Nieuwe Notitie
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Stats & Notes */}
                <div className="space-y-8">
                    {/* KPIs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-teylingereind-royal/10 rounded-lg">
                                    <Calendar className="text-teylingereind-royal" size={20} />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{totalReports}</p>
                            <p className="text-sm text-gray-500 mt-1 font-medium">Totaal Sessies</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-red-50 rounded-lg">
                                    <AlertTriangle className="text-red-600" size={20} />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{incidents}</p>
                            <p className="text-sm text-gray-500 mt-1 font-medium">Incidenten</p>
                        </div>
                    </div>

                    {/* Medical & Restrictions KPIs */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                            <p className="text-2xl font-bold text-purple-600">{mutationCount}</p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">Mutaties</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                            <p className="text-2xl font-bold text-blue-600">{indicationCount}</p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">Indicaties</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                            <p className="text-2xl font-bold text-red-600">{restrictionCount}</p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">Beperkingen</p>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px]">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <StickyNote className="text-yellow-500" size={20} />
                                <h2 className="text-lg font-bold text-gray-900">Notities</h2>
                            </div>
                            <span className="text-xs font-medium px-2.5 py-1 bg-gray-200 text-gray-600 rounded-full">
                                {notes.length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {notes.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <StickyNote size={48} className="mx-auto mb-3 opacity-20" />
                                    <p>Geen notities gevonden</p>
                                </div>
                            ) : (
                                notes.map((note) => (
                                    <div key={note.id} className="group bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 hover:border-yellow-200 transition-all relative">
                                        <p className="text-gray-800 text-sm whitespace-pre-wrap mb-6">{note.content}</p>

                                        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center">
                                            <span className="text-xs text-gray-400 font-medium">
                                                {new Date(note.createdAt).toLocaleDateString("nl-NL", { day: 'numeric', month: 'short' })}
                                            </span>

                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingNote(note);
                                                        setNoteContent(note.content);
                                                        setIsNoteModalOpen(true);
                                                    }}
                                                    className="p-1.5 hover:bg-white rounded-lg text-gray-500 hover:text-teylingereind-royal transition-colors"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleArchiveNote(note.id)}
                                                    className="p-1.5 hover:bg-white rounded-lg text-gray-500 hover:text-orange-600 transition-colors"
                                                >
                                                    <Archive size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteNote(note.id)}
                                                    className="p-1.5 hover:bg-white rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Restorative Talks Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col mt-8">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="text-teylingereind-orange" size={20} />
                                <h2 className="text-lg font-bold text-gray-900">Herstelgesprekken</h2>
                            </div>
                            <button
                                onClick={() => setIsTalkModalOpen(true)}
                                className="p-1.5 bg-orange-50 text-teylingereind-orange rounded-lg hover:bg-orange-100 transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            {talks.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <p>Geen gesprekken gepland</p>
                                </div>
                            ) : (
                                talks.map((talk) => (
                                    <div key={talk.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-gray-900">{anonymizeName(talk.youthName)}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${talk.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                talk.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {talk.status === 'PENDING' ? 'GEPLAND' : talk.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 mb-2">{talk.reason}</p>
                                        <div className="flex justify-between items-center text-xs text-gray-400">
                                            <div className="flex flex-col">
                                                <span>{new Date(talk.createdAt).toLocaleDateString('nl-NL')}</span>
                                                <span className="text-gray-500">Door: {talk.createdBy || "Onbekend"}</span>
                                            </div>
                                            {talk.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleUpdateTalkStatus(talk.id, 'COMPLETED')}
                                                    className="text-teylingereind-royal hover:underline"
                                                >
                                                    Afronden
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Timeline */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                            <Activity className="text-blue-500" size={24} />
                            Recente Activiteit
                        </h2>

                        <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-gray-100">
                            {reports.slice(0, 10).map((report) => {
                                const parsed: ParsedReport | null = report.parsedData ? JSON.parse(report.parsedData) : null;
                                const hasIncidents = parsed?.incidents && parsed.incidents.length > 0;

                                return (
                                    <div key={report.id} className="relative pl-12 group">
                                        <div className={`absolute left-[11px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm ${hasIncidents ? 'bg-red-500' : 'bg-teylingereind-royal'} z-10`} />

                                        <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 group-hover:border-blue-100 group-hover:bg-blue-50/30 transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-sm font-bold text-gray-900">
                                                    {new Date(report.date).toLocaleDateString("nl-NL", { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </span>
                                                {hasIncidents && (
                                                    <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1">
                                                        <AlertTriangle size={12} />
                                                        Incident
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                                                {anonymizeText(parsed?.sessionSummary || (report.content?.substring(0, 150) ?? "") + "...")}
                                            </p>

                                            <div className="flex flex-wrap gap-2">
                                                {parsed?.atmosphere && (
                                                    <span className="text-xs font-medium bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg">
                                                        Sfeer: {parsed.atmosphere}
                                                    </span>
                                                )}
                                                {/* Removed Attendance Badge as requested */}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Note Modal */}
            <AnimatePresence>
                {isNoteModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsNoteModalOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white rounded-2xl shadow-2xl z-50 p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {editingNote ? "Notitie Bewerken" : "Nieuwe Notitie"}
                                </h3>
                                <button
                                    onClick={() => setIsNoteModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="Schrijf hier je notitie..."
                                className="w-full h-48 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-6 text-gray-800 placeholder-gray-400"
                                autoFocus
                            />

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsNoteModalOpen(false)}
                                    className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Annuleren
                                </button>
                                <button
                                    onClick={handleSaveNote}
                                    disabled={!noteContent.trim()}
                                    className="px-5 py-2.5 bg-teylingereind-royal text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Opslaan
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Talk Modal */}
            <AnimatePresence>
                {isTalkModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsTalkModalOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white rounded-2xl shadow-2xl z-50 p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Nieuw Herstelgesprek</h3>
                                <button onClick={() => setIsTalkModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Naam Jongere</label>
                                    <input
                                        type="text"
                                        value={newTalk.youthName}
                                        onChange={(e) => setNewTalk({ ...newTalk, youthName: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teylingereind-orange outline-none"
                                        placeholder="Volledige naam (wordt geanonimiseerd)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reden</label>
                                    <textarea
                                        value={newTalk.reason}
                                        onChange={(e) => setNewTalk({ ...newTalk, reason: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teylingereind-orange outline-none h-24 resize-none"
                                        placeholder="Reden voor gesprek..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Begeleider (Sportdocent)</label>
                                    <input
                                        type="text"
                                        value={newTalk.createdBy || ""}
                                        onChange={(e) => setNewTalk({ ...newTalk, createdBy: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teylingereind-orange outline-none"
                                        placeholder="Naam begeleider"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsTalkModalOpen(false)}
                                    className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl"
                                >
                                    Annuleren
                                </button>
                                <button
                                    onClick={handleCreateTalk}
                                    disabled={!newTalk.youthName.trim() || !newTalk.reason.trim()}
                                    className="px-5 py-2.5 bg-teylingereind-orange text-white font-medium rounded-xl hover:bg-orange-700 disabled:opacity-50"
                                >
                                    Opslaan
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div >
    );
}
