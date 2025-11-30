"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    Search, Plus, Filter, FileText, Calendar, User,
    MoreVertical, CheckCircle, XCircle, AlertCircle,
    Clock, ChevronDown, ChevronUp, Archive, RefreshCw,
    Pause, Play, Edit2, Trash2, X, MessageSquare, Mail,
    Eye, RotateCcw, Activity
} from "lucide-react";
import axios from 'axios';
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useIndications, useGroups } from "@/hooks/useSportData";
import { useToast } from "@/hooks/useToast";
import { SportIndication, Group, Youth } from "@prisma/client";
import IndicationTextParser from "@/components/IndicationTextParser";
import IndicationDetailModal from "@/components/IndicationDetailModal";
import ConfirmDialog from "@/components/ConfirmDialog";
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

const INDICATION_TYPES = ["SPORT", "KRACHT", "REVALIDATIE", "OVERIG"];

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
        markEvaluationsAsMailed,
        deleteIndication
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

    // Form State - Nieuwe structuur (1-op-1 met "Aanmelding geïndiceerde activiteiten")
    const [naamJongere, setNaamJongere] = useState("");
    const [leefgroep, setLeefgroep] = useState("");
    const [indicatieActiviteiten, setIndicatieActiviteiten] = useState<string[]>([]); // Sport, Muziek, Creatief
    const [adviesInhoudActiviteit, setAdviesInhoudActiviteit] = useState("");
    const [geldigVanaf, setGeldigVanaf] = useState(new Date().toISOString().split("T")[0]);
    const [geldigTot, setGeldigTot] = useState("");
    const [indicatieAfgegevenDoor, setIndicatieAfgegevenDoor] = useState("Medische Dienst");
    const [terugkoppelingAan, setTerugkoppelingAan] = useState("");
    const [kanCombinerenMetGroepsgenoot, setKanCombinerenMetGroepsgenoot] = useState(true);
    const [onderbouwingIndicering, setOnderbouwingIndicering] = useState("");
    const [bejegeningstips, setBejegeningstips] = useState("");
    const [leerdoelen, setLeerdoelen] = useState("");

    // Confirm Dialog State
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: "danger" | "warning" | "info";
        confirmLabel?: string;
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        variant: "warning",
        confirmLabel: "Bevestigen"
    });

    // Helper to close dialog
    const closeConfirmDialog = () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        if (searchParams.get("new") === "true") {
            setShowModal(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validatie
        if (!naamJongere.trim()) {
            toast.error("Naam jongere is verplicht");
            return;
        }
        if (!leefgroep) {
            toast.error("Leefgroep is verplicht");
            return;
        }
        if (indicatieActiviteiten.length === 0) {
            toast.error("Selecteer minimaal één indicatie activiteit");
            return;
        }
        if (!onderbouwingIndicering.trim()) {
            toast.error("Onderbouwing indicering is verplicht");
            return;
        }

        const submitIndication = async () => {
            try {
                // Find group ID
                const group = groups?.find(g => g.name === leefgroep);
                if (!group) {
                    toast.error("Leefgroep niet gevonden");
                    return;
                }

                // Bepaal type op basis van indicatie activiteiten
                const type = indicatieActiviteiten.includes("Sport") ? "CARDIO" : "OVERIG";

                const body: any = {
                    groupId: group.id,
                    youthName: naamJongere,
                    description: onderbouwingIndicering, // Gebruik volledige onderbouwing als description
                    type,
                    validFrom: new Date(geldigVanaf),
                    validUntil: geldigTot ? new Date(geldigTot) : undefined,
                    issuedBy: indicatieAfgegevenDoor,
                    feedbackTo: terugkoppelingAan,
                    canCombineWithGroup: kanCombinerenMetGroepsgenoot,
                    guidanceTips: bejegeningstips,
                    learningGoals: leerdoelen,
                    // Extra velden opslaan als metadata/comment indien nodig
                    activities: indicatieActiviteiten.join(", "),
                    advice: adviesInhoudActiviteit,
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

        try {
            // Check for duplicates
            const checkResponse = await fetch('/api/indicaties/check-duplicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: naamJongere }),
            });

            if (checkResponse.ok) {
                const checkResult = await checkResponse.json();
                if (checkResult.exists) {
                    setConfirmDialog({
                        isOpen: true,
                        title: "Dubbele Indicatie Gevonden",
                        message: `Er bestaat al een indicatie(actief of gearchiveerd) voor ${naamJongere}. Weet je zeker dat je een nieuwe wilt aanmaken ? `,
                        variant: "warning",
                        onConfirm: () => {
                            closeConfirmDialog();
                            submitIndication();
                        }
                    });
                    return;
                }
            }

            // If no duplicate, proceed directly
            await submitIndication();

        } catch (error) {
            console.error("Error checking duplicate", error);
            // Fallback to submit if check fails
            await submitIndication();
        }
    };

    // Handle Delete
    const handleDelete = (indication: IndicationWithRelations) => {
        setConfirmDialog({
            isOpen: true,
            title: "Indicatie Verwijderen",
            message: `Weet je zeker dat je de indicatie voor ${indication.youth.firstName} ${indication.youth.lastName} definitief wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`,
            variant: "danger",
            confirmLabel: "Verwijderen",
            onConfirm: async () => {
                try {
                    await deleteIndication.mutateAsync(indication.id);
                    toast.success("Indicatie verwijderd");
                    closeConfirmDialog();
                } catch (error) {
                    console.error("Error deleting indication", error);
                    toast.error("Fout bij verwijderen");
                }
            }
        });
    };

    const handleArchive = (id: string) => {
        setConfirmDialog({
            isOpen: true,
            title: "Indicatie Archiveren",
            message: "Weet je zeker dat je deze indicatie wilt archiveren?",
            variant: "warning",
            confirmLabel: "Archiveren",
            onConfirm: async () => {
                try {
                    await updateIndication.mutateAsync({ id, isActive: false });
                    toast.success("Indicatie gearchiveerd");
                    closeConfirmDialog();
                } catch (error) {
                    console.error("Error archiving indication", error);
                    toast.error("Fout bij archiveren");
                }
            }
        });
    };

    const handleRestore = async (id: string) => {
        const indication = indications.find(i => i.id === id);
        if (!indication) return;

        // Check for existing active indications
        try {
            const response = await axios.post('/api/indicaties/check-duplicate', {
                firstName: indication.youth.firstName,
                lastName: indication.youth.lastName
            });

            const hasActive = response.data.indications.some((i: any) => i.isActive && i.id !== id);

            if (hasActive) {
                setConfirmDialog({
                    isOpen: true,
                    title: "Dubbele Actieve Indicatie",
                    message: `Er is al een actieve indicatie voor ${indication.youth.firstName} ${indication.youth.lastName}. Weet je zeker dat je deze ook wilt activeren?`,
                    variant: "warning",
                    confirmLabel: "Toch Herstellen",
                    onConfirm: async () => {
                        try {
                            await updateIndication.mutateAsync({ id, isActive: true });
                            toast.success("Indicatie hersteld");
                            closeConfirmDialog();
                        } catch (error) {
                            console.error("Error restoring indication", error);
                            toast.error("Fout bij herstellen");
                        }
                    }
                });
                return;
            }
        } catch (error) {
            console.error("Error checking for duplicates", error);
        }

        setConfirmDialog({
            isOpen: true,
            title: "Indicatie Herstellen",
            message: "Weet je zeker dat je deze indicatie wilt herstellen naar actief?",
            variant: "info",
            confirmLabel: "Herstellen",
            onConfirm: async () => {
                try {
                    await updateIndication.mutateAsync({ id, isActive: true });
                    toast.success("Indicatie hersteld");
                    closeConfirmDialog();
                } catch (error) {
                    console.error("Error restoring indication", error);
                    toast.error("Fout bij herstellen");
                }
            }
        });
    };

    const handleEndIndication = (id: string) => {
        setConfirmDialog({
            isOpen: true,
            title: "Indicatie Beëindigen",
            message: "Weet je zeker dat je deze indicatie wilt beëindigen? De einddatum wordt op vandaag gezet en de indicatie wordt gearchiveerd.",
            variant: "warning",
            confirmLabel: "Beëindigen",
            onConfirm: async () => {
                try {
                    await updateIndication.mutateAsync({
                        id,
                        validUntil: new Date(),
                        isActive: false
                    });
                    toast.success("Indicatie beëindigd");
                    closeConfirmDialog();
                } catch (error) {
                    console.error("Error ending indication", error);
                    toast.error("Fout bij beëindigen");
                }
            }
        });
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
        const subject = encodeURIComponent(`Evaluaties sportindicatie ${showEvaluationModal.youth?.firstName || ''} - ${format(new Date(), "d-M-yyyy")} `);

        let bodyText = `Hierbij de geselecteerde evaluaties van de sportindicatie.\n\n` +
            `Jongere: ${showEvaluationModal.youth?.firstName} ${showEvaluationModal.youth?.lastName} \n\n`;

        evaluationsToMail.forEach(evalItem => {
            const dateLongStr = (() => {
                try {
                    return format(new Date(evalItem.createdAt), "d MMMM yyyy", { locale: nl });
                } catch {
                    return "Datum onbekend";
                }
            })();

            bodyText += `-- - Evaluatie van ${dateLongStr} ---\n` +
                `Ingevuld door: ${evalItem.author || "Onbekend"} \n` +
                `Evaluatie: \n${evalItem.summary} \n\n`;
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

        window.location.href = `mailto:? subject = ${subject}& body=${body} `;
    };

    const handleEditIndication = async () => {
        if (!editingIndication) return;
        try {
            // Bepaal type op basis van indicatie activiteiten
            const type = indicatieActiviteiten.includes("Sport") ? "CARDIO" : "OVERIG";

            await updateIndication.mutateAsync({
                id: editingIndication.id,
                description: onderbouwingIndicering,
                type: type as any,
                validUntil: geldigTot ? new Date(geldigTot) : undefined,
                guidanceTips: bejegeningstips,
                learningGoals: leerdoelen,
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
        setOnderbouwingIndicering(indication.description);
        setGeldigTot(indication.validUntil ? new Date(indication.validUntil).toISOString().split('T')[0] : "");
        setBejegeningstips(indication.guidanceTips || "");
        setLeerdoelen(indication.learningGoals || "");
        setShowModal(true);
        setActiveTab("manual");
    };

    const resetForm = () => {
        setNaamJongere("");
        setLeefgroep("");
        setIndicatieActiviteiten([]);
        setAdviesInhoudActiviteit("");
        setGeldigVanaf(new Date().toISOString().split("T")[0]);
        setGeldigTot("");
        setIndicatieAfgegevenDoor("Medische Dienst");
        setTerugkoppelingAan("");
        setKanCombinerenMetGroepsgenoot(true);
        setOnderbouwingIndicering("");
        setBejegeningstips("");
        setLeerdoelen("");
        setActiveTab("manual");
    };

    const handleParsedData = (parsed: ParsedIndicatie) => {
        // Map parsed data to new form fields (1-op-1 met officieel formulier)

        // 1. Naam jongere
        setNaamJongere(parsed.naamJongere || "");

        // 2. Leefgroep (direct de naam, niet het ID)
        setLeefgroep(parsed.leefgroep || "");

        // 3. Indicatie voor (array van activiteiten)
        setIndicatieActiviteiten(parsed.indicatieActiviteit || []);

        // 4. Advies/suggestie
        setAdviesInhoudActiviteit(parsed.adviesInhoudActiviteit || "");

        // 5. Geldig vanaf/tot
        if (parsed.geldigVanaf) {
            setGeldigVanaf(parsed.geldigVanaf);
        }
        if (parsed.geldigTot) {
            setGeldigTot(parsed.geldigTot);
        }

        // 6. Indicatie afgegeven door
        setIndicatieAfgegevenDoor(parsed.indicatieAfgegevenDoor || "Medische Dienst");

        // 7. Terugkoppeling aan
        setTerugkoppelingAan(parsed.terugkoppelingAan || "");

        // 8. Kan combineren met groepsgenoot
        setKanCombinerenMetGroepsgenoot(parsed.kanCombinerenMetGroepsgenoot ?? true);

        // 9. Onderbouwing indicering
        setOnderbouwingIndicering(parsed.onderbouwingIndicering || "");

        // 10. Bejegeningstips
        setBejegeningstips(parsed.bejegeningstips || "");

        // 11. Leerdoelen
        setLeerdoelen(parsed.leerdoelen || "");

        // Switch to manual tab to show filled form
        setActiveTab("manual");

        // Show success message
        toast.success("✅ Tekst geanalyseerd! Controleer de velden en pas aan indien nodig.");
    };

    if (loadingIndications || loadingGroups) return <div className="p-8">Laden...</div>;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={closeConfirmDialog}
                variant={confirmDialog.variant}
                confirmLabel={confirmDialog.confirmLabel}
            />

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
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium border ${showArchived
                            ? "bg-gray-800 text-white border-gray-800"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
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
                                                    {m.youth ? `${m.youth.firstName} ${m.youth.lastName} ` : "Onbekend"}
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
                                                {m.type === "CARDIO" ? "SPORT" : m.type}
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
                                            {m.validUntil && new Date(m.validUntil).getFullYear() > 1900 ? (
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

                                        {/* Actions Column in Table */}
                                        <td className="px-4 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingIndication(m);
                                                        setNaamJongere(`${m.youth.firstName} ${m.youth.lastName}`);
                                                        setLeefgroep(m.group.name);
                                                        // Note: activities and advice are merged into description, so we can't easily pre-fill them separately without parsing
                                                        setIndicatieActiviteiten([]);
                                                        setAdviesInhoudActiviteit("");
                                                        setGeldigVanaf(format(new Date(m.validFrom), "yyyy-MM-dd"));
                                                        setGeldigTot(m.validUntil ? format(new Date(m.validUntil), "yyyy-MM-dd") : "");
                                                        setIndicatieAfgegevenDoor(m.issuedBy || "");
                                                        setTerugkoppelingAan(m.feedbackTo || "");
                                                        setKanCombinerenMetGroepsgenoot(m.canCombineWithGroup);
                                                        setOnderbouwingIndicering(m.description);
                                                        setBejegeningstips(m.guidanceTips || "");
                                                        setLeerdoelen(m.learningGoals || "");
                                                        setShowModal(true);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Bewerken"
                                                >
                                                    <Edit2 size={16} />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setEditingIndication(m);
                                                        setEvaluationNotes("");
                                                        setEvaluationAuthor("");
                                                        setShowEvaluationModal(m);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                                    title="Nieuwe Evaluatie"
                                                >
                                                    <MessageSquare size={16} />
                                                </button>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => handleDelete(m)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Verwijderen"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                {!showArchived ? (
                                                    <button
                                                        onClick={() => handleArchive(m.id)}
                                                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                                        title="Archiveren"
                                                    >
                                                        <Archive size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRestore(m.id)}
                                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                        title="Herstellen"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                )}
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                                <Activity className="mr-2 text-purple-500" />
                                Nieuwe Sportindicatie
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 sticky top-[73px] z-10 pt-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab("manual")}
                                className={`flex items - center gap - 2 px - 6 py - 4 font - medium text - sm transition - all relative ${activeTab === "manual"
                                    ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50/50 dark:bg-purple-900/10 rounded-t-lg"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-t-lg"
                                    } `}
                            >
                                <Edit2 size={18} />
                                Handmatig
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("paste")}
                                className={`flex items - center gap - 2 px - 6 py - 4 font - medium text - sm transition - all relative ${activeTab === "paste"
                                    ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50/50 dark:bg-purple-900/10 rounded-t-lg"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-t-lg"
                                    } `}
                            >
                                <FileText size={18} />
                                Plak Tekst
                            </button>
                        </div>

                        {/* Paste Tab Content */}
                        {activeTab === "paste" && (
                            <div className="p-6">
                                <IndicationTextParser onParsed={handleParsedData} />
                            </div>
                        )}


                        {/* Manual Tab Content - NIEUWE STRUCTUUR */}
                        {activeTab === "manual" && (
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Rij 1: Naam jongere + Leefgroep */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Naam jongere <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={naamJongere}
                                            onChange={(e) => setNaamJongere(e.target.value)}
                                            className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:text-white"
                                            placeholder="bijv. Pablo de Jeger"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Leefgroep <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={leefgroep}
                                            onChange={(e) => setLeefgroep(e.target.value)}
                                            className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="">Selecteer Leefgroep</option>
                                            {groups?.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Rij 2: Indicatie voor (checkboxes) - ZONDER NAMEN */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Indicatie voor* <span className="text-red-500">*</span>
                                        <span className="text-xs text-gray-500 ml-2">* zet een X achter welke activiteit van toepassing is</span>
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={indicatieActiviteiten.includes("Sport")}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setIndicatieActiviteiten([...indicatieActiviteiten, "Sport"]);
                                                    } else {
                                                        setIndicatieActiviteiten(indicatieActiviteiten.filter(a => a !== "Sport"));
                                                    }
                                                }}
                                                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Sport</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={indicatieActiviteiten.includes("Muziek")}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setIndicatieActiviteiten([...indicatieActiviteiten, "Muziek"]);
                                                    } else {
                                                        setIndicatieActiviteiten(indicatieActiviteiten.filter(a => a !== "Muziek"));
                                                    }
                                                }}
                                                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Muziek</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={indicatieActiviteiten.includes("Creatief aanbod")}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setIndicatieActiviteiten([...indicatieActiviteiten, "Creatief aanbod"]);
                                                    } else {
                                                        setIndicatieActiviteiten(indicatieActiviteiten.filter(a => a !== "Creatief aanbod"));
                                                    }
                                                }}
                                                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Creatief aanbod</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Rij 3: Advies/suggestie */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Advies/suggestie betreft inhoud activiteit
                                    </label>
                                    <input
                                        type="text"
                                        value={adviesInhoudActiviteit}
                                        onChange={(e) => setAdviesInhoudActiviteit(e.target.value)}
                                        className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:text-white"
                                        placeholder="bijv. Focus op individuele begeleiding"
                                    />
                                </div>

                                {/* Rij 4: Datums (Van - Tot) */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Indicatie afgegeven van <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={geldigVanaf}
                                            onChange={(e) => setGeldigVanaf(e.target.value)}
                                            className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Tot <span className="text-xs text-gray-500">(optioneel)</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={geldigTot}
                                            onChange={(e) => setGeldigTot(e.target.value)}
                                            className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>

                                {/* Rij 5: Indicatie afgegeven door + Terugkoppeling aan */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Indicatie afgegeven door
                                        </label>
                                        <input
                                            type="text"
                                            value={indicatieAfgegevenDoor}
                                            onChange={(e) => setIndicatieAfgegevenDoor(e.target.value)}
                                            className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:text-white"
                                            placeholder="bijv. Medische Dienst"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Terugkoppelen voortgang aan
                                        </label>
                                        <input
                                            type="text"
                                            value={terugkoppelingAan}
                                            onChange={(e) => setTerugkoppelingAan(e.target.value)}
                                            className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:text-white"
                                            placeholder="bijv. GW"
                                        />
                                    </div>
                                </div>

                                {/* Rij 6: Kan gecombineerd worden (toggle) */}
                                <div>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={kanCombinerenMetGroepsgenoot}
                                            onChange={(e) => setKanCombinerenMetGroepsgenoot(e.target.checked)}
                                            className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Kan gecombineerd worden met groepsgenoot met indicatie?
                                        </span>
                                    </label>
                                </div>

                                {/* Rij 7: Onderbouwing indicering (grote textarea) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Onderbouwing indicering <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        required
                                        value={onderbouwingIndicering}
                                        onChange={(e) => setOnderbouwingIndicering(e.target.value)}
                                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg h-32 focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:text-white"
                                        placeholder="Uitgebreide onderbouwing van de indicatie..."
                                    />
                                </div>

                                {/* Rij 8: Bejegeningstips */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Bejegeningstips in het licht van de diagnostiek
                                    </label>
                                    <textarea
                                        value={bejegeningstips}
                                        onChange={(e) => setBejegeningstips(e.target.value)}
                                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg h-32 focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:text-white"
                                        placeholder="• Geef duidelijke instructies&#10;• Houdt rekening met..."
                                    />
                                </div>

                                {/* Rij 9: Leerdoelen */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Leerdoelen <span className="text-xs text-gray-500">(indien van toepassing)</span>
                                    </label>
                                    <textarea
                                        value={leerdoelen}
                                        onChange={(e) => setLeerdoelen(e.target.value)}
                                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg h-24 focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:text-white"
                                        placeholder="N.v.t. of specifieke leerdoelen..."
                                    />
                                </div>

                                {/* Submit buttons */}
                                <div className="pt-4 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                    >
                                        Annuleren
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center transition"
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
                                                <div key={evalItem.id} className={`bg - white p - 4 rounded - xl border transition - shadow ${selectedEvaluations.includes(evalItem.id) ? 'border-blue-200 shadow-md' : 'border-gray-200 shadow-sm hover:shadow-md'} `}>
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

                                                                const subject = encodeURIComponent(`Evaluatie sportindicatie ${showEvaluationModal.youth?.firstName || ''} - ${dateStr} `);
                                                                const body = encodeURIComponent(
                                                                    `Hierbij de evaluatie van de sportindicatie.\n\n` +
                                                                    `Jongere: ${showEvaluationModal.youth?.firstName} ${showEvaluationModal.youth?.lastName} \n` +
                                                                    `Datum evaluatie: ${dateLongStr} \n` +
                                                                    `Ingevuld door: ${evalItem.author || "Onbekend"} \n\n` +
                                                                    `Evaluatie: \n${evalItem.summary} \n`
                                                                );

                                                                // Mark as mailed
                                                                markEvaluationsAsMailed.mutateAsync([evalItem.id]);

                                                                window.location.href = `mailto:? subject = ${subject}& body=${body} `;
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
