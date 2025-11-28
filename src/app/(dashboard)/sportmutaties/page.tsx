"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Filter, Calendar, User, AlertCircle, X, Trash2, Edit2, Archive, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useSportMutations, useGroups } from "@/hooks/useSportData";
import { SportMutation, Group, Youth } from "@prisma/client";
import { useToast } from "@/hooks/useToast";

// Extended type to include relations
type SportMutationWithRelations = SportMutation & {
    group: Group | null;
    youth: Youth | null;
};

const MUTATION_TYPES = [
    { value: "MEDISCH", label: "Medisch" },
    { value: "GEDRAG", label: "Gedrag" },
    { value: "BLESSURE", label: "Blessure" },
    { value: "OVERIG", label: "Overig" }
];

export default function SportMutationsPage() {
    const searchParams = useSearchParams();
    const { data: mutationsData, isLoading: loadingMutations, createMutation, updateMutation, deleteMutation } = useSportMutations();
    const { data: groups, isLoading: loadingGroups } = useGroups();
    const toast = useToast();

    const [showArchived, setShowArchived] = useState(false);
    const [editingMutation, setEditingMutation] = useState<SportMutationWithRelations | null>(null);

    // Cast data to the correct type with relations
    const allMutations = mutationsData as unknown as SportMutationWithRelations[] || [];

    // Filter by active status based on showArchived toggle
    // Assuming the API returns all, or we need to filter client side if API doesn't support filtering yet.
    // My API returns all. I should filter client side for now or update API to filter.
    // Let's filter client side for simplicity as data volume is likely low for now.
    // Actually, standard is usually isActive=true by default.
    // Let's assume the API returns everything and we filter here.
    const mutations = allMutations.filter(m => showArchived ? !m.isActive : m.isActive !== false);

    const [showModal, setShowModal] = useState(false);

    // Form State
    const [selectedGroup, setSelectedGroup] = useState("");
    const [youthName, setYouthName] = useState("");
    const [reason, setReason] = useState("");
    const [reasonType, setReasonType] = useState("MEDISCH");
    const [restrictionType, setRestrictionType] = useState<"TOTAAL_SPORTVERBOD" | "ALLEEN_FITNESS" | "ANDERS" | null>(null);
    const [customRestriction, setCustomRestriction] = useState("");
    const [injuryDetails, setInjuryDetails] = useState("");
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState("");

    // Filters
    const [filterGroup, setFilterGroup] = useState("");
    const [filterType, setFilterType] = useState("");

    useEffect(() => {
        if (searchParams.get("new") === "true") {
            resetForm();
            setShowModal(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedGroup || !youthName || !reason) {
            toast.warning("Vul alle verplichte velden in");
            return;
        }

        const finalRestriction = restrictionType === "ANDERS" ? customRestriction : restrictionType;

        try {
            if (editingMutation) {
                await updateMutation.mutateAsync({
                    id: editingMutation.id,
                    reason: `${reason} (Jongere: ${youthName})`,
                    reasonType: reasonType as any,
                    restriction: finalRestriction || undefined,
                    injuryDetails: injuryDetails || undefined,
                    startDate: new Date(startDate),
                    endDate: endDate ? new Date(endDate) : undefined,
                });
                toast.success("Mutatie succesvol bijgewerkt!");
            } else {
                await createMutation.mutateAsync({
                    groupId: selectedGroup,
                    reason: `${reason} (Jongere: ${youthName})`,
                    reasonType: reasonType as any,
                    restriction: finalRestriction || undefined,
                    injuryDetails: injuryDetails || undefined,
                    startDate: new Date(startDate),
                    endDate: endDate ? new Date(endDate) : undefined,
                });
                toast.success("Mutatie succesvol toegevoegd!");
            }

            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error("Error saving mutation", error);
            toast.error("Fout bij opslaan van de mutatie");
        }
    };

    const handleArchive = async (id: string) => {
        if (!confirm("Weet je zeker dat je deze mutatie wilt archiveren?")) return;
        try {
            await updateMutation.mutateAsync({
                id,
                isActive: false,
            });
            toast.success("Mutatie gearchiveerd");
        } catch (error) {
            console.error("Error archiving mutation", error);
            toast.error("Fout bij archiveren");
        }
    };

    const startEditMutation = (mutation: SportMutationWithRelations) => {
        setEditingMutation(mutation);
        setSelectedGroup(mutation.groupId);
        const nameMatch = mutation.reason.match(/\(Jongere: (.*?)\)/);
        const cleanReason = mutation.reason.replace(/\(Jongere: .*?\)/, "").trim();

        setYouthName(mutation.youth ? `${mutation.youth.firstName} ${mutation.youth.lastName}` : (nameMatch ? nameMatch[1] : ""));
        setReason(cleanReason);
        setReasonType(mutation.reasonType);
        setInjuryDetails((mutation as any).injuryDetails || "");

        const currentRestriction = (mutation as any).restriction;
        if (currentRestriction === "TOTAAL_SPORTVERBOD" || currentRestriction === "ALLEEN_FITNESS") {
            setRestrictionType(currentRestriction);
            setCustomRestriction("");
        } else if (currentRestriction) {
            setRestrictionType("ANDERS");
            setCustomRestriction(currentRestriction);
        } else {
            setRestrictionType(null);
            setCustomRestriction("");
        }

        setStartDate(new Date(mutation.startDate).toISOString().split('T')[0]);
        setEndDate(mutation.endDate ? new Date(mutation.endDate).toISOString().split('T')[0] : "");

        setShowModal(true);
    };

    const resetForm = () => {
        setEditingMutation(null);
        setSelectedGroup("");
        setYouthName("");
        setReason("");
        setReasonType("MEDISCH");
        setRestrictionType(null);
        setCustomRestriction("");
        setInjuryDetails("");
        setStartDate(new Date().toISOString().split("T")[0]);
        setEndDate("");
    };

    const filteredMutations = mutations?.filter(m => {
        const groupName = m.group?.name || "";
        const matchesGroup = !filterGroup || groupName === filterGroup;
        const matchesType = !filterType || m.reasonType === filterType;
        return matchesGroup && matchesType;
    }) || [];

    if (loadingMutations || loadingGroups) return <div className="p-8">Laden...</div>;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Sportmutaties</h1>
                    <p className="text-gray-500 mt-1">Beheer zieken, geblesseerden en andere afwezigheden</p>
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
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 font-medium"
                    >
                        <Plus size={20} />
                        Nieuwe Mutatie
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4">
                <div className="flex items-center text-gray-500">
                    <Filter size={18} className="mr-2" />
                    <span className="text-sm font-medium">Filters:</span>
                </div>
                <select
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="bg-gray-50 border-none text-sm rounded-md px-3 py-1 focus:ring-0"
                >
                    <option value="">Alle Groepen</option>
                    {groups?.map(g => (
                        <option key={g.id} value={g.name}>
                            {g.name}
                        </option>
                    ))}
                </select>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-gray-50 border-none text-sm rounded-md px-3 py-1 focus:ring-0"
                >
                    <option value="">Alle Categorieën</option>
                    {MUTATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Jongere</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Groep</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Categorie</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type (Beperking)</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Bijzonderheden</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Periode</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actie</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredMutations.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-gray-400 italic">
                                    {showArchived ? "Geen gearchiveerde mutaties gevonden." : "Geen actieve mutaties gevonden."}
                                </td>
                            </tr>
                        ) : (
                            filteredMutations.map((m) => (
                                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-3">
                                                <User size={14} />
                                            </div>
                                            <span className="font-medium text-gray-900">
                                                {m.youth ? `${m.youth.firstName} ${m.youth.lastName}` : (m.reason.match(/\(Jongere: (.*?)\)/)?.[1] || "Onbekend")}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                                            {m.group?.name || "Onbekend"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.reasonType === "MEDISCH" ? "bg-red-50 text-red-700" :
                                            m.reasonType === "BLESSURE" ? "bg-yellow-50 text-yellow-700" :
                                                m.reasonType === "GEDRAG" ? "bg-purple-50 text-purple-700" :
                                                    "bg-gray-50 text-gray-700"
                                            }`}>
                                            {MUTATION_TYPES.find(t => t.value === m.reasonType)?.label || m.reasonType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {(m as any).restriction ? (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                {(m as any).restriction === "TOTAAL_SPORTVERBOD" ? "Totaal Sportverbod" :
                                                    (m as any).restriction === "ALLEEN_FITNESS" ? "Alleen Fitness" :
                                                        (m as any).restriction}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-600">{m.reason.replace(/\(Jongere: .*?\)/, "").trim()}</span>
                                            {(m as any).injuryDetails && (
                                                <span className="text-xs text-gray-400 mt-1 italic">
                                                    Blessure: {(m as any).injuryDetails}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Calendar size={14} className="mr-2 text-gray-400" />
                                            {format(new Date(m.startDate), "d MMM", { locale: nl })}
                                            {" - "}
                                            {m.endDate ? format(new Date(m.endDate), "d MMM", { locale: nl }) : "..."}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => startEditMutation(m)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Bewerken"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            {!showArchived && (
                                                <button
                                                    onClick={() => handleArchive(m.id)}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Archiveren"
                                                >
                                                    <Archive size={16} />
                                                </button>
                                            )}
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
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                <AlertCircle className="mr-2 text-orange-500" />
                                {editingMutation ? "Mutatie Bewerken" : "Nieuwe Sportmutatie"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Groep <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={selectedGroup}
                                        onChange={(e) => setSelectedGroup(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        disabled={!!editingMutation}
                                    >
                                        <option value="">Selecteer Groep</option>
                                        {groups?.map(g => (
                                            <option key={g.id} value={g.id}>
                                                {g.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Naam Jongere <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={youthName}
                                        onChange={(e) => setYouthName(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="bijv. Jan Jansen"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Startdatum <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Einddatum (optioneel)
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Restriction Selection */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type Mutatie (Beperking)
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="restriction"
                                            value="TOTAAL_SPORTVERBOD"
                                            checked={restrictionType === "TOTAAL_SPORTVERBOD"}
                                            onChange={() => setRestrictionType("TOTAAL_SPORTVERBOD")}
                                            className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                                        />
                                        <span className="text-sm text-gray-700">Totaal sportverbod</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="restriction"
                                            value="ALLEEN_FITNESS"
                                            checked={restrictionType === "ALLEEN_FITNESS"}
                                            onChange={() => setRestrictionType("ALLEEN_FITNESS")}
                                            className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                                        />
                                        <span className="text-sm text-gray-700">Alleen fitness</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="restriction"
                                            value="ANDERS"
                                            checked={restrictionType === "ANDERS"}
                                            onChange={() => setRestrictionType("ANDERS")}
                                            className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                                        />
                                        <span className="text-sm text-gray-700">Anders, namelijk:</span>
                                    </label>

                                    {restrictionType === "ANDERS" && (
                                        <input
                                            type="text"
                                            value={customRestriction}
                                            onChange={(e) => setCustomRestriction(e.target.value)}
                                            placeholder="Vul type beperking in..."
                                            className="w-full mt-2 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categorie (Oorzaak)</label>
                                    <select
                                        value={reasonType}
                                        onChange={(e) => setReasonType(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                    >
                                        {MUTATION_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Injury Details (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Specificatie Blessure (optioneel)
                                </label>
                                <input
                                    type="text"
                                    value={injuryDetails}
                                    onChange={(e) => setInjuryDetails(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="Bijv. gebroken hand, verstuikte enkel..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bijzonderheden <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-lg h-24 focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="Bijv. Vermoeden lichte hersenschudding..."
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
                                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center"
                                >
                                    <CheckCircle size={18} className="mr-2" />
                                    {editingMutation ? "Bijwerken" : "Opslaan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
