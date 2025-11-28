"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Filter, Calendar, User, Activity, CheckCircle, X, Edit2, Archive, Pause, Play, FileText, MessageSquare, Mail } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useIndications, useGroups } from "@/hooks/useSportData";
import { useToast } from "@/hooks/useToast";
import { SportIndication, Group, Youth } from "@prisma/client";

// Define Evaluation locally if not exported or use any
interface Evaluation {
    id: string;
    indicationId: string;
    date: Date;
    summary: string;
    author: string | null;
    createdAt: Date;
    createdAt: Date;
    updatedAt: Date;
    emailedAt?: Date | null;
}

// Extended type to include relations
type IndicationWithRelations = SportIndication & {
    group: Group;
    youth: Youth;
    evaluations: Evaluation[];
};

const INDICATION_TYPES = ["CARDIO", "KRACHT", "REVALIDATIE", "OVERIG"];

export default function SportIndicationsPage() {
    const searchParams = useSearchParams();
    const [showArchived, setShowArchived] = useState(false);
    const toast = useToast();

    const {
        data: indicationsData,
        isLoading: loadingIndications,
        createIndication,
        updateIndication,
        addEvaluation,
        markEvaluationsAsMailed
    } = useIndications(showArchived);

    const { data: groups, isLoading: loadingGroups } = useGroups();

    // Cast data
    const indications = indicationsData as unknown as IndicationWithRelations[] || [];

    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<"manual" | "paste">("manual");
    const [pasteText, setPasteText] = useState("");
    const [isParsing, setIsParsing] = useState(false);

    // Edit/Action Modals
    const [editingIndication, setEditingIndication] = useState<IndicationWithRelations | null>(null);
    const [showEvaluationModal, setShowEvaluationModal] = useState<IndicationWithRelations | null>(null);
    const [showPauseModal, setShowPauseModal] = useState<IndicationWithRelations | null>(null);
    const [evaluationNotes, setEvaluationNotes] = useState("");
    const [evaluationAuthor, setEvaluationAuthor] = useState("");
    const [pauseReason, setPauseReason] = useState("");
    const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([]);

    // Form State - Basic
    const [selectedGroup, setSelectedGroup] = useState("");
    const [youthName, setYouthName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<string>(INDICATION_TYPES[0]);
    const [validFrom, setValidFrom] = useState(new Date().toISOString().split("T")[0]);
    const [validUntil, setValidUntil] = useState("");

    // Form State - Medical Service Fields
    const [leefgroep, setLeefgroep] = useState("");
    const [responsiblePersons, setResponsiblePersons] = useState("");
    const [issuedBy, setIssuedBy] = useState("Medische Dienst");
    const [feedbackTo, setFeedbackTo] = useState("");
    const [canCombine, setCanCombine] = useState(true);
    const [guidanceTips, setGuidanceTips] = useState("");
    const [learningGoals, setLearningGoals] = useState("");

    useEffect(() => {
        if (searchParams.get("new") === "true") {
            setShowModal(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const body: any = {
                groupId: selectedGroup,
                youthName: youthName, // Send youthName for creation/linking
                description: description,
                type,
                validFrom: new Date(validFrom),
                validUntil: validUntil ? new Date(validUntil) : undefined,
                issuedBy,
            };

            await createIndication.mutateAsync(body);

            setShowModal(false);
            resetForm();
            toast.success("Indicatie succesvol toegevoegd!");
        } catch (error) {
            console.error("Error saving indication", error);
            toast.error("Fout bij opslaan.");
        }
    };

    const handleEndIndication = async (id: string) => {
        if (!confirm("Weet je zeker dat je deze indicatie wilt beëindigen?")) return;
        try {
            await updateIndication.mutateAsync({
                id,
                isActive: false,
                validUntil: new Date(),
            });
        } catch (error) {
            console.error("Error ending indication", error);
        }
    };

    const handleArchiveIndication = async (id: string) => {
        if (!confirm("Weet je zeker dat je deze indicatie wilt archiveren?")) return;
        try {
            await updateIndication.mutateAsync({
                id,
                isActive: false,
            });
        } catch (error) {
            console.error("Error archiving indication", error);
        }
    };

    const handlePauseIndication = async () => {
        if (!showPauseModal || !pauseReason.trim()) {
            alert("Vul een reden in voor het pauzeren");
            return;
        }
        alert("Pauzeren functionaliteit vereist database update.");
        setShowPauseModal(null);
    };

    const handleResumeIndication = async (id: string) => {
        alert("Hervatten functionaliteit vereist database update.");
    };

    const handleMailSelected = async () => {
        if (selectedEvaluations.length === 0 || !showEvaluationModal) return;

        const evaluationsToMail = showEvaluationModal.evaluations.filter(e => selectedEvaluations.includes(e.id));

        if (evaluationsToMail.length === 0) return;

        // Construct email body
        const subject = encodeURIComponent(`Evaluaties sportindicatie ${showEvaluationModal.youth?.firstName || ''} - ${format(new Date(), "d-M-yyyy")}`);

        let bodyText = `Hierbij de geselecteerde evaluaties van de sportindicatie.\n\n` +
            `Jongere: ${showEvaluationModal.youth?.firstName} ${showEvaluationModal.youth?.lastName}\n\n`;

        evaluationsToMail.forEach(evalItem => {
            const dateLongStr = (() => {
                try {
                    return format(new Date(evalItem.createdAt), "d MMMM yyyy", { locale: nl });
                } catch {
                    return "Datum onbekend";
                }
            })();

            bodyText += `--- Evaluatie van ${dateLongStr} ---\n` +
                `Ingevuld door: ${evalItem.author || "Onbekend"}\n` +
                `Evaluatie:\n${evalItem.summary}\n\n`;
        });

        const body = encodeURIComponent(bodyText);

        // Mark as mailed
        try {
            await markEvaluationsAsMailed.mutateAsync(selectedEvaluations);
            toast.success(`${selectedEvaluations.length} evaluaties gemarkeerd als gemaild`);
            setSelectedEvaluations([]); // Clear selection
        } catch (error) {
            console.error("Error marking as mailed", error);
            toast.error("Kon evaluaties niet markeren als gemaild, maar email wordt wel geopend.");
        }

        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const handleEditIndication = async () => {
        if (!editingIndication) return;
        try {
            await updateIndication.mutateAsync({
                id: editingIndication.id,
                description,
                type: type as any,
                validUntil: validUntil ? new Date(validUntil) : undefined,
            });
            setEditingIndication(null);
            resetForm();
        } catch (error) {
            console.error("Error updating indication", error);
        }
    };

    const handleAddEvaluation = async () => {
        if (!showEvaluationModal || !evaluationNotes.trim() || !evaluationAuthor.trim()) {
            toast.warning("Vul alle velden in");
            return;
        }
        try {
            await addEvaluation.mutateAsync({
                indicationId: showEvaluationModal.id,
                notes: evaluationNotes,
                createdBy: evaluationAuthor,
            });

            // Optimistic update or refetch is handled by React Query invalidation
            // We clear the form but keep the modal open to show the list
            setEvaluationNotes("");
            setEvaluationAuthor("");
            toast.success("Evaluatie succesvol toegevoegd!");

            // We need to update the local state 'showEvaluationModal' with the new evaluation
            // or rely on the parent data refreshing and re-opening? 
            // Since 'showEvaluationModal' is a local copy, it won't auto-update unless we sync it.
            // We should probably re-fetch the specific indication or rely on the list update.
            // For now, let's close it as per strict requirement "Sluit de evaluatie-popup automatisch"
            // But wait, if we close it, we can't see the list.
            // Let's compromise: Close it, as requested.
            setShowEvaluationModal(null);
        } catch (error) {
            console.error("Error adding evaluation", error);
            toast.error("Fout bij toevoegen evaluatie");
        }
    };

    const startEditIndication = (indication: IndicationWithRelations) => {
        setEditingIndication(indication);
        setDescription(indication.description);
        setType(indication.type);
        setValidUntil(indication.validUntil ? new Date(indication.validUntil).toISOString().split('T')[0] : "");
        setShowModal(true);
        setActiveTab("manual");
    };

    const resetForm = () => {
        setSelectedGroup("");
        setYouthName("");
        setDescription("");
        setType(INDICATION_TYPES[0]);
        setValidUntil("");
        setPasteText("");
        setActiveTab("manual");
    };

    const handleParse = async () => {
        if (!pasteText.trim()) {
            alert("Plak eerst tekst in het veld");
            return;
        }

        setIsParsing(true);
        try {
            const res = await fetch("/api/indicaties/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: pasteText }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
                throw new Error(errorData.details || errorData.error || "Parse failed");
            }

            const parsed = await res.json();

            if (parsed.warning) {
                alert(`⚠️ ${parsed.warning}`);
            }

            if (parsed.groupName) {
                const group = groups?.find(g => g.name.toLowerCase() === parsed.groupName.toLowerCase());
                if (group) {
                    setSelectedGroup(group.id);
                }
            }

            setYouthName(parsed.youthName || "");
            setDescription(parsed.description || "");
            setType(parsed.type || "OVERIG");
            setValidFrom(parsed.validFrom || new Date().toISOString().split("T")[0]);
            if (parsed.validUntil) {
                setValidUntil(parsed.validUntil);
            }

            setActiveTab("manual");

            const message = parsed.warning
                ? "✅ Gegevens geanalyseerd met basis-parser.\n\n⚠️ Controleer alle velden zorgvuldig voordat je opslaat!"
                : "✅ Gegevens succesvol geanalyseerd!\n\nControleer de velden en pas indien nodig aan.";

            alert(message);
        } catch (error) {
            console.error("Parse error:", error);
            const errorMessage = error instanceof Error ? error.message : "Onbekende fout";
            alert(`❌ Fout bij analyseren van tekst:\n\n${errorMessage}\n\n💡 Tip: Gebruik het 'Handmatig' tabblad om de gegevens zelf in te vullen.`);
        } finally {
            setIsParsing(false);
        }
    };

    if (loadingIndications || loadingGroups) return <div className="p-8">Laden...</div>;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Sportindicaties</h1>
                    <p className="text-gray-500 mt-1">Beheer extra sportmomenten op indicatie</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${showArchived ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        <Archive size={20} />
                        {showArchived ? "Toon Actief" : "Archief"}
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-medium"
                    >
                        <Plus size={20} />
                        Nieuwe Indicatie
                    </button>
                </div>
            </div>

            {/* Filters (Placeholder) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4">
                <div className="flex items-center text-gray-500">
                    <Filter size={18} className="mr-2" />
                    <span className="text-sm font-medium">Filters:</span>
                </div>
                <select className="bg-gray-50 border-none text-sm rounded-md px-3 py-1 focus:ring-0">
                    <option>Alle Groepen</option>
                    {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <select className="bg-gray-50 border-none text-sm rounded-md px-3 py-1 focus:ring-0">
                    <option>Alle Types</option>
                    {INDICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Jongere</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Groep</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Omschrijving</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Geldigheid</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actie</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {indications.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">
                                    Geen indicaties gevonden.
                                </td>
                            </tr>
                        ) : (
                            indications.map((m) => (
                                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mr-3">
                                                <User size={14} />
                                            </div>
                                            <span className="font-medium text-gray-900">
                                                {m.youth ? `${m.youth.firstName} ${m.youth.lastName}` : "Onbekend"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                            {m.group?.name || "Onbekend"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{m.type}</span>
                                            <span className="text-xs text-gray-500">{m.description}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Calendar size={14} className="mr-2 text-gray-400" />
                                            {(() => {
                                                try {
                                                    return format(new Date(m.validFrom), "d MMM", { locale: nl });
                                                } catch {
                                                    return "Datum onbekend";
                                                }
                                            })()}
                                            {" - "}
                                            {m.validUntil ? (() => {
                                                try {
                                                    return format(new Date(m.validUntil), "d MMM", { locale: nl });
                                                } catch {
                                                    return "...";
                                                }
                                            })() : "..."}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => startEditIndication(m)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Bewerken"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setShowEvaluationModal(m)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Evaluatie Toevoegen"
                                                >
                                                    <MessageSquare size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleArchiveIndication(m.id)}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Archiveren"
                                                >
                                                    <Archive size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleEndIndication(m.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Beëindigen"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                <Activity className="mr-2 text-purple-500" />
                                Nieuwe Sportindicatie
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 bg-gray-50 px-6">
                            <button
                                type="button"
                                onClick={() => setActiveTab("manual")}
                                className={`px-4 py-3 font-medium text-sm transition-colors relative ${activeTab === "manual"
                                    ? "text-purple-600 border-b-2 border-purple-600"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Handmatig
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("paste")}
                                className={`px-4 py-3 font-medium text-sm transition-colors relative ${activeTab === "paste"
                                    ? "text-purple-600 border-b-2 border-purple-600"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Plak Tekst
                            </button>
                        </div>

                        {/* Paste Tab Content */}
                        {activeTab === "paste" && (
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Plak hier de volledige tekst van het indicatie document
                                    </label>
                                    <textarea
                                        value={pasteText}
                                        onChange={(e) => setPasteText(e.target.value)}
                                        className="w-full p-4 border border-gray-200 rounded-lg h-64 focus:ring-2 focus:ring-purple-500 outline-none resize-none text-sm font-mono"
                                        placeholder="Plak de tekst van het Word document hier..."
                                    />
                                </div>

                                <div className="pt-4 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Annuleren
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleParse}
                                        disabled={isParsing || !pasteText.trim()}
                                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {isParsing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                                Analyseren...
                                            </>
                                        ) : (
                                            "Analyseer"
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Manual Tab Content */}
                        {activeTab === "manual" && (
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Groep</label>
                                        <select
                                            required
                                            value={selectedGroup}
                                            onChange={(e) => setSelectedGroup(e.target.value)}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        >
                                            <option value="">Selecteer Groep</option>
                                            {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Naam Jongere</label>
                                        <input
                                            type="text"
                                            required
                                            value={youthName}
                                            onChange={(e) => setYouthName(e.target.value)}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                            placeholder="bijv. Jan Jansen"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select
                                            value={type}
                                            onChange={(e) => setType(e.target.value)}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        >
                                            <option value="CARDIO">Cardio</option>
                                            <option value="KRACHT">Kracht</option>
                                            <option value="REVALIDATIE">Revalidatie</option>
                                            <option value="MEDISCH">Medisch</option>
                                            <option value="GEDRAG">Gedrag</option>
                                            <option value="OVERIG">Overig</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Geldig Vanaf</label>
                                        <input
                                            type="date"
                                            required
                                            value={validFrom}
                                            onChange={(e) => setValidFrom(e.target.value)}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Omschrijving</label>
                                    <textarea
                                        required
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-lg h-24 focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="Bijv. 2x per week cardio..."
                                    />
                                </div>

                                <div className="pt-4 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Annuleren
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                                    >
                                        <CheckCircle size={18} className="mr-2" />
                                        Opslaan
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Evaluation Modal */}
            <AnimatePresence>
                {showEvaluationModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEvaluationModal(null)}
                            className="fixed inset-0 bg-black/50 z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 m-auto w-full max-w-2xl h-[80vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <MessageSquare className="text-green-600" />
                                        Evaluaties
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {showEvaluationModal.youth?.firstName} {showEvaluationModal.youth?.lastName}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowEvaluationModal(null)}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                                {/* List of existing evaluations */}
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Eerdere Evaluaties</h4>
                                        {selectedEvaluations.length > 0 && (
                                            <button
                                                onClick={handleMailSelected}
                                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Mail size={14} />
                                                Selectie Mailen ({selectedEvaluations.length})
                                            </button>
                                        )}
                                    </div>

                                    {showEvaluationModal.evaluations && showEvaluationModal.evaluations.length > 0 ? (
                                        <div className="space-y-3">
                                            {/* Select All / Deselect All */}
                                            <div className="flex items-center gap-2 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEvaluations.length === showEvaluationModal.evaluations.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedEvaluations(showEvaluationModal.evaluations.map(e => e.id));
                                                        } else {
                                                            setSelectedEvaluations([]);
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-xs text-gray-500">Alles selecteren</span>
                                            </div>

                                            {showEvaluationModal.evaluations.map((evalItem) => (
                                                <div key={evalItem.id} className={`bg-white p-4 rounded-xl border transition-shadow ${selectedEvaluations.includes(evalItem.id) ? 'border-blue-200 shadow-md' : 'border-gray-200 shadow-sm hover:shadow-md'}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedEvaluations.includes(evalItem.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedEvaluations([...selectedEvaluations, evalItem.id]);
                                                                    } else {
                                                                        setSelectedEvaluations(selectedEvaluations.filter(id => id !== evalItem.id));
                                                                    }
                                                                }}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                                                            />
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        {(() => {
                                                                            try {
                                                                                return format(new Date(evalItem.createdAt), "d MMMM yyyy", { locale: nl });
                                                                            } catch {
                                                                                return "Datum onbekend";
                                                                            }
                                                                        })()}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">• {evalItem.author || "Onbekend"}</span>
                                                                </div>
                                                                {evalItem.emailedAt && (
                                                                    <div className="flex items-center gap-1 mt-0.5 text-xs text-green-600">
                                                                        <CheckCircle size={10} />
                                                                        <span>Gemaild op {(() => {
                                                                            try {
                                                                                return format(new Date(evalItem.emailedAt), "d-M-yyyy HH:mm");
                                                                            } catch {
                                                                                return "...";
                                                                            }
                                                                        })()}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                // Single mail action
                                                                const dateStr = (() => {
                                                                    try {
                                                                        return format(new Date(evalItem.createdAt), "d-M-yyyy");
                                                                    } catch {
                                                                        return "Datum onbekend";
                                                                    }
                                                                })();
                                                                const dateLongStr = (() => {
                                                                    try {
                                                                        return format(new Date(evalItem.createdAt), "d MMMM yyyy", { locale: nl });
                                                                    } catch {
                                                                        return "Datum onbekend";
                                                                    }
                                                                })();

                                                                const subject = encodeURIComponent(`Evaluatie sportindicatie ${showEvaluationModal.youth?.firstName || ''} - ${dateStr}`);
                                                                const body = encodeURIComponent(
                                                                    `Hierbij de evaluatie van de sportindicatie.\n\n` +
                                                                    `Jongere: ${showEvaluationModal.youth?.firstName} ${showEvaluationModal.youth?.lastName}\n` +
                                                                    `Datum evaluatie: ${dateLongStr}\n` +
                                                                    `Ingevuld door: ${evalItem.author || "Onbekend"}\n\n` +
                                                                    `Evaluatie:\n${evalItem.summary}\n`
                                                                );

                                                                // Mark as mailed
                                                                markEvaluationsAsMailed.mutateAsync([evalItem.id]);

                                                                window.location.href = `mailto:?subject=${subject}&body=${body}`;
                                                            }}
                                                            className="text-gray-400 hover:text-blue-600 transition-colors"
                                                            title="Mail deze evaluatie"
                                                        >
                                                            <Mail size={16} />
                                                        </button>
                                                    </div>
                                                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed pl-7">
                                                        {evalItem.summary}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                                            Nog geen evaluaties.
                                        </div>
                                    )}
                                </div>

                                {/* Add New Evaluation Form */}
                                <div className="bg-white p-5 rounded-xl border border-green-100 shadow-sm">
                                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Plus size={16} className="text-green-600" />
                                        Nieuwe Evaluatie Toevoegen
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Ingevuld door</label>
                                            <input
                                                type="text"
                                                value={evaluationAuthor}
                                                onChange={(e) => setEvaluationAuthor(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                placeholder="Naam begeleider"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Evaluatie</label>
                                            <textarea
                                                value={evaluationNotes}
                                                onChange={(e) => setEvaluationNotes(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none h-32 resize-none text-sm"
                                                placeholder="Beschrijf de voortgang, observaties, en aanbevelingen..."
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleAddEvaluation}
                                                disabled={!evaluationNotes.trim() || !evaluationAuthor.trim()}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm transition-colors shadow-sm"
                                            >
                                                <CheckCircle size={16} />
                                                Opslaan & Toevoegen
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {/* Pause Modal */}
            <AnimatePresence>
                {showPauseModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPauseModal(null)}
                            className="fixed inset-0 bg-black/50 z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-white rounded-2xl shadow-2xl z-50 p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Pause className="text-orange-600" />
                                    Indicatie Pauzeren
                                </h3>
                                <button
                                    onClick={() => setShowPauseModal(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                                <p className="text-sm text-gray-700">
                                    <strong>Jongere:</strong> {showPauseModal.youth?.firstName} {showPauseModal.youth?.lastName}
                                </p>
                                <p className="text-sm text-gray-700">
                                    <strong>Type:</strong> {showPauseModal.type}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reden voor Pauzeren <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={pauseReason}
                                        onChange={(e) => setPauseReason(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none h-24 resize-none"
                                        placeholder="Bijv. Blessure, medische redenen, etc..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowPauseModal(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Annuleren
                                </button>
                                <button
                                    onClick={handlePauseIndication}
                                    disabled={!pauseReason.trim()}
                                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Pause size={18} />
                                    Pauzeren
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
