"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Filter, Calendar, User, Activity, CheckCircle, X, Edit2, Archive, Pause, Play, FileText, MessageSquare, Mail, Eye } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useIndications, useGroups } from "@/hooks/useSportData";
import { useToast } from "@/hooks/useToast";
import { SportIndication, Group, Youth } from "@prisma/client";
import IndicationTextParser from "@/components/IndicationTextParser";
import IndicationDetailModal from "@/components/IndicationDetailModal";
import type { ParsedIndicatie } from "@/types/indication";

// Define Evaluation locally if not exported or use any
interface Evaluation {
    id: string;
    indicationId: string;
    date: Date;
    summary: string;
    author: string | null;
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

    // Edit/Action Modals
    const [editingIndication, setEditingIndication] = useState<IndicationWithRelations | null>(null);
    const [showDetailModal, setShowDetailModal] = useState<IndicationWithRelations | null>(null);
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
        setActiveTab("manual");
    };

    const handleParsedData = (parsed: ParsedIndicatie) => {
        // Map parsed data to form fields

        // 1. Find matching group based on leefgroep
        if (parsed.leefgroep) {
            const group = groups?.find(g =>
                g.name.toLowerCase().includes(parsed.leefgroep.toLowerCase())
            );
            if (group) {
                setSelectedGroup(group.id);
            }
        }

        // 2. Set youth name
        setYouthName(parsed.naamJongere || "");

        // 3. Set description - prefer korteBeschrijving for table, full onderbouwing for details
        const tableDescription = parsed.korteBeschrijving || parsed.onderbouwingIndicering || "";
        setDescription(tableDescription);

        // 4. Set type based on indicatie activiteit
        if (parsed.indicatieActiviteit.length > 0) {
            const firstActivity = parsed.indicatieActiviteit[0];
            if (firstActivity.toLowerCase().includes("sport")) {
                setType("CARDIO"); // or appropriate type
            } else if (firstActivity.toLowerCase().includes("kracht")) {
                setType("KRACHT");
            } else if (firstActivity.toLowerCase().includes("muziek")) {
                setType("OVERIG");
            } else {
                setType("OVERIG");
            }
        }

        // 5. Set dates - prefer parsed geldigVanaf/geldigTot if available
        if (parsed.geldigVanaf) {
            setValidFrom(parsed.geldigVanaf);
        } else if (parsed.indicatieVanTot) {
            // Fallback: try to extract date from old format
            const dateMatch = parsed.indicatieVanTot.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{4})/);
            if (dateMatch) {
                // Convert DD-MM-YYYY to YYYY-MM-DD
                const parts = dateMatch[1].split(/[-/]/);
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2];
                    setValidFrom(`${year}-${month}-${day}`);
                }
            }
        }

        if (parsed.geldigTot) {
            setValidUntil(parsed.geldigTot);
        }

        // 6. Set other fields
        setLeefgroep(parsed.leefgroep || "");
        setIssuedBy(parsed.indicatieAfgegevenDoor || "Medische Dienst");
        setFeedbackTo(parsed.terugkoppelingAan || "");
        setCanCombine(parsed.kanCombinerenMetGroepsgenoot ?? true);
        setGuidanceTips(parsed.bejegeningstips || "");
        setLearningGoals(parsed.leerdoelen || "");

        // 7. Switch to manual tab to show filled form
        setActiveTab("manual");

        // 8. Show success message
        toast.success("✅ Tekst geanalyseerd! Controleer de velden en pas aan indien nodig.");
    };

    if (loadingIndications || loadingGroups) return <div className="p-8">Laden...</div>;

    return (
        <div className="max-w-[1600px] mx-auto">
            {/* Header - Animated */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex justify-between items-center mb-8"
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sportindicaties</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Beheer extra sportmomenten op indicatie</p>
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
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 font-medium"
                    >
                        <Plus size={20} />
                        Nieuwe Indicatie
                    </button>
                </div>
            </motion.div>

            {/* Filters - Animated with delay */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex gap-4"
            >
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Filter size={18} className="mr-2" />
                    <span className="text-sm font-medium">Filters:</span>
                </div>
                <select className="bg-gray-50 dark:bg-gray-700 border-none text-sm rounded-md px-3 py-1 focus:ring-0 text-gray-900 dark:text-gray-100">
                    <option>Alle Groepen</option>
                    {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <select className="bg-gray-50 dark:bg-gray-700 border-none text-sm rounded-md px-3 py-1 focus:ring-0 text-gray-900 dark:text-gray-100">
                    <option>Alle Types</option>
                    {INDICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </motion.div>

            {/* Table - Animated with delay */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide w-[12%]">Jongere</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide w-[8%]">Groep</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide w-[6%]">Type</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide w-[20%]">Beschrijving</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide w-[9%]">Geldig Vanaf</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide w-[9%]">Geldig Tot</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide w-[10%]">Issued By</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide w-[8%]">Feedback</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide w-[8%]">Combinatie</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide text-right w-[10%]">Actie</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {indications.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                                        <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">Geen indicaties gevonden</p>
                                        <p className="text-sm mt-1">Klik op "Nieuwe Indicatie" om te beginnen</p>
                                    </td>
                                </tr>
                            ) : (
                                indications.map((m, index) => (
                                    <motion.tr
                                        key={m.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.3 + (index * 0.03) }}
                                        onClick={() => setShowDetailModal(m)}
                                        className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group"
                                    >
                                        {/* Jongere */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                                    <User size={14} className="text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                                    {m.youth ? `${m.youth.firstName} ${m.youth.lastName}` : "Onbekend"}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Groep */}
                                        <td className="px-4 py-3.5">
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                {m.group?.name || "?"}
                                            </span>
                                        </td>

                                        {/* Type */}
                                        <td className="px-4 py-3.5">
                                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                                {m.type}
                                            </span>
                                        </td>

                                        {/* Beschrijving - truncated */}
                                        <td className="px-4 py-3.5">
                                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                                                {m.description && m.description.length > 100
                                                    ? `${m.description.substring(0, 100)}...`
                                                    : m.description || "Geen omschrijving"}
                                            </p>
                                        </td>

                                        {/* Geldig Vanaf */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                                <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                                                <span className="font-medium">
                                                    {format(new Date(m.validFrom), "dd MMM yyyy", { locale: nl })}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Geldig Tot */}
                                        <td className="px-4 py-3.5">
                                            {m.validUntil ? (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                                    <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                                                    <span className="font-medium">
                                                        {format(new Date(m.validUntil), "dd MMM yyyy", { locale: nl })}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 dark:text-gray-500 italic">Onbepaald</span>
                                            )}
                                        </td>

                                        {/* Issued By */}
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                                {m.issuedBy || "-"}
                                            </span>
                                        </td>

                                        {/* Feedback To */}
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                                {m.feedbackTo || "-"}
                                            </span>
                                        </td>

                                        {/* Can Combine */}
                                        <td className="px-4 py-3.5">
                                            {m.canCombineWithGroup ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold border border-green-200 dark:border-green-800">
                                                    <CheckCircle size={12} />
                                                    Ja
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-semibold border border-gray-200 dark:border-gray-600">
                                                    <X size={12} />
                                                    Nee
                                                </span>
                                            )}
                                        </td>

                                        {/* Actie */}
                                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowDetailModal(m);
                                                    }}
                                                    className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="Bekijken"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEditIndication(m);
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                                    title="Bewerken"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowEvaluationModal(m);
                                                    }}
                                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all"
                                                    title="Evaluatie"
                                                >
                                                    <MessageSquare size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleArchiveIndication(m.id);
                                                    }}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                                                    title="Archiveren"
                                                >
                                                    <Archive size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Detail Modal */}
            <IndicationDetailModal
                indication={showDetailModal}
                isOpen={!!showDetailModal}
                onClose={() => setShowDetailModal(null)}
            />

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
                            <div className="p-6">
                                <IndicationTextParser onParsed={handleParsedData} />
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
