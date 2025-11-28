"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Mail, Archive, FileText, Check, RefreshCw, User, Users, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";

interface Group {
    id: string;
    name: string;
}

type ReportItemType = "SESSION" | "INDICATION" | "RESTRICTION";

interface ReportItem {
    id: string; // unique id for the form list
    type: ReportItemType;

    // Group Fields
    groupId: string;
    groupName: string;
    youthCount: number;
    glCount: number;

    // Individual Fields
    youthName: string;

    // Common Fields
    warmingUp: string;
    activity: string;
    notes: string;
    evaluation?: string;
}

export default function DailyReportForm() {
    const [authorName, setAuthorName] = useState("");

    const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
    const [reportItems, setReportItems] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState("");
    const toast = useToast();
    const router = useRouter();

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        generatePreview();
    }, [reportItems]);

    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/groups");
            const data = await res.json();
            if (Array.isArray(data)) {
                setAvailableGroups(data);
            }
        } catch (error) {
            console.error("Failed to fetch groups", error);
        }
    };

    const addReportItem = () => {
        const newItem: ReportItem = {
            id: Math.random().toString(36).substr(2, 9),
            type: "SESSION",
            groupId: availableGroups[0]?.id || "",
            groupName: availableGroups[0]?.name || "",
            youthCount: 0,
            glCount: 0,
            youthName: "",
            warmingUp: "",
            activity: "",
            notes: "Geen",
            evaluation: "",
        };
        setReportItems([...reportItems, newItem]);
    };

    const removeReportItem = (id: string) => {
        setReportItems(reportItems.filter((g) => g.id !== id));
    };

    const updateReportItem = (id: string, field: keyof ReportItem, value: any) => {
        setReportItems(
            reportItems.map((item) => {
                if (item.id === id) {
                    const updated = { ...item, [field]: value };
                    if (field === "groupId") {
                        const group = availableGroups.find((ag) => ag.id === value);
                        if (group) updated.groupName = group.name;
                    }
                    return updated;
                }
                return item;
            })
        );
    };

    const generatePreview = () => {
        if (reportItems.length === 0) {
            setPreview("Nog geen items toegevoegd.");
            return;
        }

        let text = "Bij deze de sportrapportage,\n\n";

        const sessions = reportItems.filter(i => i.type === "SESSION");
        if (sessions.length > 0) {
            text += sessions.map(g =>
                `Groep: ${g.groupName} (${g.youthCount} jongeren, ${g.glCount}-GL)\n` +
                `Warming-up: ${g.warmingUp || "nvt"}\n` +
                `Sportmoment: ${g.activity || "nvt"}\n` +
                `Bijzonderheden: ${g.notes || "Geen"}`
            ).join("\n\n");
            text += "\n\n";
        }

        const indications = reportItems.filter(i => i.type === "INDICATION");
        if (indications.length > 0) {
            text += indications.map(i =>
                `Indicatie – ${i.youthName || "Onbekend"}\n` +
                `Warming-up: ${i.warmingUp || "nvt"}\n` +
                `Sportmoment: ${i.activity || "nvt"}\n` +
                `Evaluatie: ${i.evaluation || "Geen"}\n` +
                `Bijzonderheden: ${i.notes || "Geen"}`
            ).join("\n\n");
            text += "\n\n";
        }

        const restrictions = reportItems.filter(i => i.type === "RESTRICTION");
        if (restrictions.length > 0) {
            text += restrictions.map(r =>
                `Beperking – ${r.youthName || "Onbekend"}\n` +
                `Warming-up: ${r.warmingUp || "nvt"}\n` +
                `Sportmoment: ${r.activity || "nvt"}\n` +
                `Bijzonderheden: ${r.notes || "Geen"}`
            ).join("\n\n");
        }

        setPreview(text.trim());
    };

    const handleSubmit = async (action: "SAVE" | "ARCHIVE" | "MAIL" | "COPY" | "OWN_VERSION") => {
        if (!authorName.trim()) {
            toast.warning("Vul de naam van de begeleider in.");
            return;
        }

        if (reportItems.length === 0) {
            toast.warning("Voeg eerst minimaal één item toe.");
            return;
        }

        // Validate all items
        for (const item of reportItems) {
            if (!item.warmingUp.trim() || !item.activity.trim() || !item.notes.trim()) {
                toast.warning("Vul alle velden in voor elk item (Warming-up, Sportmoment, Bijzonderheden).");
                return;
            }
            if (item.type !== "SESSION" && !item.youthName.trim()) {
                toast.warning("Vul de naam van de jongere in voor indicaties/beperkingen.");
                return;
            }
        }

        if (action === "COPY") {
            try {
                await navigator.clipboard.writeText(preview);
                toast.success("Rapportage gekopieerd naar klembord!");
            } catch (err) {
                console.error("Failed to copy", err);
                toast.error("Kon niet kopiëren.");
            }
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/reports/daily", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reports: reportItems,
                    action: action === "MAIL" ? "SAVE" : action, // Save even if mailing
                    previewText: preview,
                    authorName: authorName || "Onbekend", // Pass author name
                }),
            });

            if (!res.ok) throw new Error("Failed to save reports");

            if (action === "MAIL") {
                const subject = encodeURIComponent(`Sportrapportage ${new Date().toLocaleDateString('nl-NL')}`);
                const body = encodeURIComponent(preview);
                window.location.href = `mailto:?subject=${subject}&body=${body}`;
                toast.success("Rapportage opgeslagen en mail geopend!");
                // DO NOT RESET FORM FOR MAIL ACTION
            } else if (action === "ARCHIVE") {
                toast.success("Rapportage gearchiveerd!");
                setReportItems([]);
                router.refresh();
            } else if (action === "OWN_VERSION") {
                toast.success("Eigen versie opgeslagen op het dashboard!");
                // DO NOT RESET FORM FOR OWN VERSION
            } else {
                toast.success("Rapportage opgeslagen!");
                setReportItems([]);
                router.refresh();
            }

        } catch (error) {
            console.error("Error submitting report", error);
            toast.error("Er is iets misgegaan bij het opslaan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        Nieuwe Dagrapportage
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            <User size={16} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Naam begeleider"
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
                                className="bg-transparent outline-none text-sm text-gray-700 w-40"
                            />
                        </div>
                        <button
                            onClick={addReportItem}
                            className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus size={18} />
                            Item Toevoegen
                        </button>
                    </div>
                </div>

                {/* ... existing list code ... */}
                <div className="space-y-6">
                    {reportItems.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-500">Klik op "Item Toevoegen" om te beginnen.</p>
                        </div>
                    ) : (
                        reportItems.map((item, index) => (
                            <div
                                key={item.id}
                                className="bg-gray-50 rounded-xl p-6 border border-gray-200 relative group-card transition-all hover:shadow-md"
                            >
                                <div className="absolute top-4 right-4">
                                    <button
                                        onClick={() => removeReportItem(item.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                        title="Verwijder item"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                {/* Type Selector */}
                                <div className="mb-6">
                                    <div className="flex space-x-4">
                                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors border ${item.type === 'SESSION' ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                            <input
                                                type="radio"
                                                name={`type-${item.id}`}
                                                checked={item.type === 'SESSION'}
                                                onChange={() => updateReportItem(item.id, 'type', 'SESSION')}
                                                className="hidden"
                                            />
                                            <Users size={16} />
                                            <span className="font-medium">Groep</span>
                                        </label>
                                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors border ${item.type === 'INDICATION' ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                            <input
                                                type="radio"
                                                name={`type-${item.id}`}
                                                checked={item.type === 'INDICATION'}
                                                onChange={() => updateReportItem(item.id, 'type', 'INDICATION')}
                                                className="hidden"
                                            />
                                            <User size={16} />
                                            <span className="font-medium">Indicatie</span>
                                        </label>
                                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors border ${item.type === 'RESTRICTION' ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                            <input
                                                type="radio"
                                                name={`type-${item.id}`}
                                                checked={item.type === 'RESTRICTION'}
                                                onChange={() => updateReportItem(item.id, 'type', 'RESTRICTION')}
                                                className="hidden"
                                            />
                                            <AlertCircle size={16} />
                                            <span className="font-medium">Beperking</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                                    {item.type === 'SESSION' ? (
                                        <>
                                            <div className="md:col-span-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Groep</label>
                                                <select
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                    value={item.groupId}
                                                    onChange={(e) => updateReportItem(item.id, "groupId", e.target.value)}
                                                >
                                                    {availableGroups.map((g) => (
                                                        <option key={g.id} value={g.id}>
                                                            {g.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Jongeren</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={item.youthCount}
                                                    onChange={(e) => updateReportItem(item.id, "youthCount", parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">GL</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={item.glCount}
                                                    onChange={(e) => updateReportItem(item.id, "glCount", parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="md:col-span-8">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Naam Jongere</label>
                                            <input
                                                type="text"
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Voornaam / Geanonimiseerd"
                                                value={item.youthName}
                                                onChange={(e) => updateReportItem(item.id, "youthName", e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Warming-up</label>
                                        <textarea
                                            rows={2}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                            placeholder={item.type === 'SESSION' ? "Bijv. 4vs4 voetbal" : "Bijv. Fietsen"}
                                            value={item.warmingUp}
                                            onChange={(e) => updateReportItem(item.id, "warmingUp", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sportmoment</label>
                                        <textarea
                                            rows={2}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                            placeholder={item.type === 'SESSION' ? "Bijv. Fitness en zaalvoetbal" : "Bijv. Krachttraining"}
                                            value={item.activity}
                                            onChange={(e) => updateReportItem(item.id, "activity", e.target.value)}
                                        />
                                    </div>
                                </div>

                                {item.type === 'INDICATION' && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Evaluatie</label>
                                        <textarea
                                            rows={2}
                                            className="w-full p-2.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none bg-purple-50"
                                            placeholder="Evaluatie van de indicatie..."
                                            value={item.evaluation || ''}
                                            onChange={(e) => updateReportItem(item.id, "evaluation", e.target.value)}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bijzonderheden</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Bijv. Geen bijzonderheden"
                                        value={item.notes}
                                        onChange={(e) => updateReportItem(item.id, "notes", e.target.value)}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Preview & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Voorbeeld</h3>
                    <div className="bg-gray-900 text-gray-100 p-6 rounded-xl font-mono text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                        {preview}
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => handleSubmit("SAVE")}
                        disabled={loading}
                        className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 font-bold shadow-sm flex items-center justify-center gap-3 transition-all"
                    >
                        <Save size={20} />
                        Opslaan
                    </button>

                    <button
                        onClick={() => handleSubmit("OWN_VERSION")}
                        disabled={loading}
                        className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 font-bold shadow-sm flex items-center justify-center gap-3 transition-all"
                    >
                        <User size={20} />
                        Eigen versie opslaan
                    </button>

                    <button
                        onClick={() => handleSubmit("ARCHIVE")}
                        disabled={loading}
                        className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 font-bold shadow-sm flex items-center justify-center gap-3 transition-all"
                    >
                        <Archive size={20} />
                        Archiveren
                    </button>

                    <button
                        onClick={() => handleSubmit("COPY")}
                        disabled={loading}
                        className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 font-bold shadow-sm flex items-center justify-center gap-3 transition-all"
                    >
                        <FileText size={20} />
                        Kopieer Tekst
                    </button>

                    <button
                        onClick={() => handleSubmit("MAIL")}
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-3 transition-all"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={20} /> : <Mail size={20} />}
                        Versturen per Mail
                    </button>
                </div>
            </div>
        </div>
    );
}
