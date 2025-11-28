"use client";

import { useState, useEffect } from "react";
import { Phone, Trophy, Calendar, TrendingUp, Award, CheckCircle, Info, RefreshCw, ChevronLeft, ChevronRight, Check, X, Dumbbell } from "lucide-react";
import { motion } from "framer-motion";

interface GroupPriority {
    groupId: string;
    groupName: string;
    groupColor: string;
    regularMoments: number;
    extraMoments: number;
    missedMoments: number;
    totalScore: number;
    priority: number;
    explanation: string;
}

interface Group {
    id: string;
    name: string;
    color: string;
}

interface ExtraSportMoment {
    id: string;
    date: string;
    groupId: string;
    status: string; // "COMPLETED" | "REFUSED"
}

const colorMap: Record<string, string> = {
    ROOD: "#EF4444",
    BLAUW: "#3B82F6",
    GROEN: "#10B981",
    GEEL: "#F59E0B",
    ORANJE: "#F97316",
    PAARS: "#8B5CF6",
    ROZE: "#EC4899",
};

type Tab = "PRIORITY" | "TALLY";

export default function SportPriorityPage() {
    // Priority State
    const [priorities, setPriorities] = useState<GroupPriority[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("PRIORITY");
    const [timeRange, setTimeRange] = useState<"ALL" | "WEEK" | "MONTH" | "YEAR">("ALL");

    // Tally/Table State
    const [groups, setGroups] = useState<Group[]>([]);
    const [moments, setMoments] = useState<ExtraSportMoment[]>([]);
    const [weekStart, setWeekStart] = useState(getMonday(new Date()));
    const [tableLoading, setTableLoading] = useState(false);

    function getMonday(d: Date) {
        d = new Date(d);
        const day = d.getDay(),
            diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    useEffect(() => {
        fetchPriorities();
        fetchGroups();
    }, [timeRange]);

    useEffect(() => {
        if (activeTab === "TALLY") {
            fetchMoments();
        }
    }, [weekStart, activeTab]);

    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/groups");
            const data = await res.json();
            if (Array.isArray(data)) {
                setGroups(data);
            }
        } catch (error) {
            console.error("Failed to fetch groups", error);
        }
    };

    const fetchPriorities = async () => {
        setLoading(true);
        try {
            let url = "/api/sport-priority";
            if (timeRange !== "ALL") {
                const now = new Date();
                let start = new Date();
                if (timeRange === "WEEK") start.setDate(now.getDate() - 7);
                if (timeRange === "MONTH") start.setMonth(now.getMonth() - 1);
                if (timeRange === "YEAR") start.setFullYear(now.getFullYear() - 1);
                url += `?startDate=${start.toISOString()}`;
            }

            const res = await fetch(url);
            const data = await res.json();
            setPriorities(data);
        } catch (error) {
            console.error("Error fetching priorities:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMoments = async () => {
        setTableLoading(true);
        try {
            const start = weekStart.toISOString();
            const end = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString();
            const res = await fetch(`/api/extra-sport?start=${start}&end=${end}`);
            const data = await res.json();
            setMoments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch moments", error);
        } finally {
            setTableLoading(false);
        }
    };

    const handleRegisterMoment = async (groupId: string) => {
        if (!confirm("Weet je zeker dat je een extra sportmoment wilt registreren voor deze groep?")) {
            return;
        }

        setRegistering(groupId);
        try {
            await fetch("/api/sport-priority", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupId }),
            });
            await fetchPriorities();
        } catch (error) {
            console.error("Error registering moment:", error);
            alert("Er is iets misgegaan bij het registreren.");
        } finally {
            setRegistering(null);
        }
    };

    const toggleMoment = async (groupId: string, date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        const existingMoment = moments.find(m =>
            m.groupId === groupId &&
            new Date(m.date).toISOString().split('T')[0] === dateStr
        );

        try {
            if (!existingMoment) {
                // 1. Empty -> Check (COMPLETED)
                const res = await fetch("/api/extra-sport", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ groupId, date: dateStr, status: "COMPLETED" }),
                });
                const newMoment = await res.json();
                setMoments(prev => [...prev, newMoment]);
            } else if (existingMoment.status === "COMPLETED") {
                // 2. Check -> Cross (REFUSED)
                const res = await fetch("/api/extra-sport", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: existingMoment.id, status: "REFUSED" }),
                });
                const updatedMoment = await res.json();
                setMoments(prev => prev.map(m => m.id === existingMoment.id ? updatedMoment : m));
            } else {
                // 3. Cross -> Empty (DELETE)
                await fetch(`/api/extra-sport?id=${existingMoment.id}`, {
                    method: "DELETE",
                });
                setMoments(prev => prev.filter(m => m.id !== existingMoment.id));
            }
            // Refresh priorities to keep stats in sync
            fetchPriorities();
        } catch (error) {
            console.error("Failed to toggle moment", error);
            fetchMoments(); // Revert on error
        }
    };

    const changeWeek = (offset: number) => {
        const newStart = new Date(weekStart);
        newStart.setDate(newStart.getDate() + (offset * 7));
        setWeekStart(newStart);
    };

    const getPriorityBadgeColor = (priority: number) => {
        if (priority === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
        if (priority === 2) return "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900";
        if (priority === 3) return "bg-gradient-to-r from-orange-400 to-orange-600 text-white";
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
    };

    const getPriorityIcon = (priority: number) => {
        if (priority === 1) return <Trophy className="w-5 h-5" />;
        if (priority === 2) return <Award className="w-5 h-5" />;
        if (priority === 3) return <Award className="w-5 h-5" />;
        return <TrendingUp className="w-4 h-4" />;
    };

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
    });

    function getWeekNumber(d: Date) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return weekNo;
    }

    function isToday(someDate: Date) {
        const today = new Date();
        return someDate.getDate() == today.getDate() &&
            someDate.getMonth() == today.getMonth() &&
            someDate.getFullYear() == today.getFullYear();
    }

    const [selectedGroupStats, setSelectedGroupStats] = useState<{
        groupId: string;
        groupName: string;
        weekTotal: number;
        monthTotal: number;
        refusedTotal: number;
    } | null>(null);

    const handleGroupClick = async (group: Group) => {
        // Calculate stats for the clicked group
        const weekTotal = moments.filter(m =>
            m.groupId === group.id &&
            m.status === "COMPLETED" &&
            weekDays.some(d => d.toISOString().split('T')[0] === new Date(m.date).toISOString().split('T')[0])
        ).length;

        // Fetch month and refused stats (simplified for now, ideally from API)
        // For this implementation, we'll fetch specific stats for the group
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const res = await fetch(`/api/extra-sport?start=${startOfMonth}&end=${now.toISOString()}`);
            const monthData: ExtraSportMoment[] = await res.json();

            const monthTotal = monthData.filter(m => m.groupId === group.id && m.status === "COMPLETED").length;
            const refusedTotal = monthData.filter(m => m.groupId === group.id && m.status === "REFUSED").length;

            setSelectedGroupStats({
                groupId: group.id,
                groupName: group.name,
                weekTotal,
                monthTotal,
                refusedTotal
            });
        } catch (error) {
            console.error("Failed to fetch group stats", error);
        }
    };

    const [isSplitView, setIsSplitView] = useState(true);

    const VLOED_GROUPS = ['Bron', 'Dijk', 'Duin', 'Kade', 'Kreek', 'Lei', 'Rak', 'Zift'];
    const EB_GROUPS = ['Lier', 'Nes', 'Golf', 'Gaag', 'Kust', 'Vliet', 'Zijl', 'Poel A', 'Poel B'];

    const getCategory = (name: string) => {
        if (VLOED_GROUPS.some(g => name.includes(g))) return "VLOED";
        if (EB_GROUPS.some(g => name.includes(g))) return "EB";
        return "OVERIG";
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-serif bg-gradient-to-r from-teylingereind-blue to-teylingereind-royal bg-clip-text text-transparent">
                        Extra Sportmomenten
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Beheer sportmomenten en bekijk de verdeling
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    <button
                        onClick={() => setIsSplitView(!isSplitView)}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                    >
                        {isSplitView ? "Samengevoegd Weergeven" : "Splits Vloed/Eb"}
                    </button>
                    <div className="bg-gray-100 p-1 rounded-lg flex">
                        <button
                            onClick={() => setActiveTab("PRIORITY")}
                            className={`px-4 py-2 rounded-md transition-all ${activeTab === "PRIORITY"
                                ? "bg-white shadow-sm text-teylingereind-royal font-semibold"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            <Phone className="w-4 h-4 inline mr-2" />
                            Belvolgorde
                        </button>
                        <button
                            onClick={() => setActiveTab("TALLY")}
                            className={`px-4 py-2 rounded-md transition-all ${activeTab === "TALLY"
                                ? "bg-white shadow-sm text-teylingereind-orange font-semibold"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            <CheckCircle className="w-4 h-4 inline mr-2" />
                            Turven
                        </button>
                    </div>
                </div>
            </div>

            {/* Time Range Filter (Only for Priority Tab) */}
            {activeTab === "PRIORITY" && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <span className="font-medium text-gray-700">Periode:</span>
                    {["ALL", "WEEK", "MONTH", "YEAR"].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range as typeof timeRange)}
                            className={`px-4 py-2 rounded-lg transition-all ${timeRange === range
                                ? "bg-teylingereind-royal text-white font-semibold"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {range === "ALL" && "Alles"}
                            {range === "WEEK" && "Deze Week"}
                            {range === "MONTH" && "Deze Maand"}
                            {range === "YEAR" && "Dit Jaar"}
                        </button>
                    ))}
                </div>
            )}

            {/* Priority Tab */}
            {activeTab === "PRIORITY" ? (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium opacity-90">Totaal Groepen</h3>
                                <Trophy className="opacity-80" size={24} />
                            </div>
                            <p className="text-4xl font-bold">{priorities.length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium opacity-90">Hoogste Prioriteit</h3>
                                <Award className="opacity-80" size={24} />
                            </div>
                            <p className="text-4xl font-bold">{priorities[0]?.groupName || "-"}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium opacity-90">Totaal Extra Momenten</h3>
                                <Calendar className="opacity-80" size={24} />
                            </div>
                            <p className="text-4xl font-bold">
                                {priorities.reduce((sum, g) => sum + g.extraMoments, 0)}
                            </p>
                        </div>
                    </div>

                    {/* Priority List */}
                    {isSplitView ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* VLOED Column */}
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <Phone className="w-6 h-6" />
                                        Vloed
                                    </h2>
                                </div>
                                <PriorityList
                                    items={priorities.filter(p => getCategory(p.groupName) === 'VLOED')}
                                    loading={loading}
                                    registering={registering}
                                    onRegister={handleRegisterMoment}
                                    getPriorityBadgeColor={getPriorityBadgeColor}
                                    getPriorityIcon={getPriorityIcon}
                                    colorMap={colorMap}
                                />
                            </div>

                            {/* EB Column */}
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-teal-600 to-teal-800 p-6">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <Phone className="w-6 h-6" />
                                        Eb
                                    </h2>
                                </div>
                                <PriorityList
                                    items={priorities.filter(p => getCategory(p.groupName) === 'EB')}
                                    loading={loading}
                                    registering={registering}
                                    onRegister={handleRegisterMoment}
                                    getPriorityBadgeColor={getPriorityBadgeColor}
                                    getPriorityIcon={getPriorityIcon}
                                    colorMap={colorMap}
                                />
                            </div>

                            {/* OVERIG Column (Only if there are items) */}
                            {priorities.some(p => getCategory(p.groupName) === 'OVERIG') && (
                                <div className="md:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                    <div className="bg-gray-600 p-6">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                            <Phone className="w-6 h-6" />
                                            Overig
                                        </h2>
                                    </div>
                                    <PriorityList
                                        items={priorities.filter(p => getCategory(p.groupName) === 'OVERIG')}
                                        loading={loading}
                                        registering={registering}
                                        onRegister={handleRegisterMoment}
                                        getPriorityBadgeColor={getPriorityBadgeColor}
                                        getPriorityIcon={getPriorityIcon}
                                        colorMap={colorMap}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-teylingereind-blue to-teylingereind-royal p-6">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <Phone className="w-6 h-6" />
                                    Belvolgorde voor Extra Sportmomenten
                                </h2>
                                <p className="text-blue-100 mt-1">Bel groepen in deze volgorde bij beschikbaarheid</p>
                            </div>
                            <PriorityList
                                items={priorities}
                                loading={loading}
                                registering={registering}
                                onRegister={handleRegisterMoment}
                                getPriorityBadgeColor={getPriorityBadgeColor}
                                getPriorityIcon={getPriorityIcon}
                                colorMap={colorMap}
                            />
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-6">
                    {/* Week Navigation */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-teylingereind-orange" />
                            Turf Extra Sport
                        </h2>
                        <div className="flex items-center space-x-4">
                            <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                                <ChevronLeft size={20} />
                            </button>
                            <span className="font-medium text-gray-700 min-w-[150px] text-center">
                                Week {getWeekNumber(weekStart)} - {weekStart.getFullYear()}
                            </span>
                            <button onClick={() => changeWeek(1)} className="p-2 hover:bg-gray-100 rounded-full">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Tally Table */}
                    {isSplitView ? (
                        <div className="space-y-8">
                            <TallyTable
                                title="Vloed"
                                groups={groups.filter(g => getCategory(g.name) === 'VLOED')}
                                moments={moments}
                                weekDays={weekDays}
                                isToday={isToday}
                                handleGroupClick={handleGroupClick}
                                toggleMoment={toggleMoment}
                                headerColor="bg-blue-600"
                            />
                            <TallyTable
                                title="Eb"
                                groups={groups.filter(g => getCategory(g.name) === 'EB')}
                                moments={moments}
                                weekDays={weekDays}
                                isToday={isToday}
                                handleGroupClick={handleGroupClick}
                                toggleMoment={toggleMoment}
                                headerColor="bg-teal-600"
                            />
                            {groups.some(g => getCategory(g.name) === 'OVERIG') && (
                                <TallyTable
                                    title="Overig"
                                    groups={groups.filter(g => getCategory(g.name) === 'OVERIG')}
                                    moments={moments}
                                    weekDays={weekDays}
                                    isToday={isToday}
                                    handleGroupClick={handleGroupClick}
                                    toggleMoment={toggleMoment}
                                    headerColor="bg-gray-600"
                                />
                            )}
                        </div>
                    ) : (
                        <TallyTable
                            title="Alle Groepen"
                            groups={groups}
                            moments={moments}
                            weekDays={weekDays}
                            isToday={isToday}
                            handleGroupClick={handleGroupClick}
                            toggleMoment={toggleMoment}
                        />
                    )}
                </div>
            )}

            {/* Stats Popup Modal */}
            {selectedGroupStats && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                        <button
                            onClick={() => setSelectedGroupStats(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedGroupStats.groupName}</h2>
                        <p className="text-gray-500 mb-6">Statistieken Overzicht</p>

                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                        <Calendar size={20} />
                                    </div>
                                    <span className="font-medium text-gray-700">Totaal deze week</span>
                                </div>
                                <span className="text-2xl font-bold text-blue-700">{selectedGroupStats.weekTotal}</span>
                            </div>

                            <div className="bg-purple-50 p-4 rounded-xl flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                                        <TrendingUp size={20} />
                                    </div>
                                    <span className="font-medium text-gray-700">Totaal deze maand</span>
                                </div>
                                <span className="text-2xl font-bold text-purple-700">{selectedGroupStats.monthTotal}</span>
                            </div>

                            <div className="bg-red-50 p-4 rounded-xl flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-100 p-2 rounded-lg text-red-600">
                                        <X size={20} />
                                    </div>
                                    <span className="font-medium text-gray-700">Geweigerd (Maand)</span>
                                </div>
                                <span className="text-2xl font-bold text-red-700">{selectedGroupStats.refusedTotal}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedGroupStats(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                            >
                                Sluiten
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper Components
function PriorityList({ items, loading, registering, onRegister, getPriorityBadgeColor, getPriorityIcon, colorMap }: any) {
    if (loading) {
        return (
            <div className="p-12 text-center">
                <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Prioriteiten berekenen...</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Geen groepen gevonden</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100">
            {items.map((group: any, index: number) => (
                <motion.div
                    key={group.groupId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all group"
                >
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div
                                className={`${getPriorityBadgeColor(
                                    group.priority
                                )} w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-bold text-xl sm:text-2xl shadow-lg flex-shrink-0`}
                            >
                                {group.priority}
                            </div>

                            <div className="flex items-center gap-3">
                                <div
                                    className="w-4 h-4 rounded-full shadow-md flex-shrink-0"
                                    style={{
                                        backgroundColor: colorMap[group.groupColor] || "#10B981",
                                    }}
                                />
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                                        {group.groupName}
                                        {group.priority <= 3 && getPriorityIcon(group.priority)}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-600">{group.explanation}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex items-center gap-4 text-sm">
                                <div className="text-center">
                                    <p className="text-xl sm:text-2xl font-bold text-teylingereind-orange">
                                        {group.extraMoments}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-gray-500">Extra</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                        {group.totalScore}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-gray-500">Totaal</p>
                                </div>
                            </div>

                            <button
                                onClick={() => onRegister(group.groupId)}
                                disabled={registering === group.groupId}
                                className="bg-teylingereind-orange text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl flex items-center gap-2 text-sm sm:text-base"
                            >
                                {registering === group.groupId ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Trophy className="w-5 h-5" />
                                        <span className="hidden sm:inline">Registreer</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

function TallyTable({ title, groups, moments, weekDays, isToday, handleGroupClick, toggleMoment, headerColor }: any) {
    if (groups.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {title && (
                <div className={`${headerColor || 'bg-gray-100'} px-6 py-3 border-b border-gray-200`}>
                    <h3 className={`font-bold ${headerColor ? 'text-white' : 'text-gray-800'}`}>{title}</h3>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 text-left text-sm font-semibold text-gray-600 w-48 sticky left-0 bg-gray-50 z-10">Groep</th>
                            {weekDays.map((day: Date) => (
                                <th key={day.toISOString()} className="p-4 text-center text-sm font-semibold text-gray-600 min-w-[80px]">
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs uppercase text-gray-400">{day.toLocaleDateString('nl-NL', { weekday: 'short' })}</span>
                                        <span className={`mt-1 w-8 h-8 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-900'}`}>
                                            {day.getDate()}
                                        </span>
                                    </div>
                                </th>
                            ))}
                            <th className="p-4 text-center text-sm font-semibold text-gray-600 w-24 sticky right-0 bg-gray-50 z-10 border-l border-gray-200">Totaal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {groups.map((group: any) => {
                            const groupWeekTotal = moments.filter((m: any) =>
                                m.groupId === group.id &&
                                (m.status === "COMPLETED" || m.status === "REFUSED") &&
                                weekDays.some((d: Date) => d.toISOString().split('T')[0] === new Date(m.date).toISOString().split('T')[0])
                            ).length;

                            return (
                                <tr key={group.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleGroupClick(group)}>
                                    <td className="p-4 sticky left-0 bg-white z-10 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                        <div className="font-medium text-gray-900 flex items-center">
                                            <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: group.color || '#ccc' }}></div>
                                            {group.name}
                                        </div>
                                    </td>
                                    {weekDays.map((day: Date) => {
                                        const moment = moments.find((m: any) =>
                                            m.groupId === group.id &&
                                            new Date(m.date).toISOString().split('T')[0] === day.toISOString().split('T')[0]
                                        );

                                        return (
                                            <td key={day.toISOString()} className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => toggleMoment(group.id, day)}
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 mx-auto ${moment?.status === "COMPLETED"
                                                        ? "bg-green-500 text-white shadow-sm scale-100"
                                                        : moment?.status === "REFUSED"
                                                            ? "bg-red-500 text-white shadow-sm scale-100"
                                                            : "bg-gray-100 text-gray-300 hover:bg-gray-200 scale-90 hover:scale-100"
                                                        }`}
                                                >
                                                    {moment?.status === "COMPLETED" && <Check size={20} strokeWidth={3} />}
                                                    {moment?.status === "REFUSED" && <X size={20} strokeWidth={3} />}
                                                </button>
                                            </td>
                                        );
                                    })}
                                    <td className="p-4 text-center font-bold text-gray-900 sticky right-0 bg-white z-10 border-l border-gray-100 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                        {groupWeekTotal}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
