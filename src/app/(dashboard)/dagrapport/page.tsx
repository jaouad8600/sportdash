"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Calendar, Users, AlertTriangle, FileText, ChevronDown, ChevronUp, Activity } from "lucide-react";
import { ParsedReport } from "@/services/parserService";
import { anonymizeName, anonymizeText } from "@/lib/privacy";

interface Report {
    id: string;
    groupId: string;
    group: { name: string; color: string };
    content: string;
    parsedData: string | null; // JSON string
    youthCount: number;
    author: string;
    createdAt: string;
    confidenceScore?: number;
}

export default function DailyReportPage() {
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

    useEffect(() => {
        fetchReports();
    }, [date]);

    const [mutations, setMutations] = useState<any[]>([]);
    const [indications, setIndications] = useState<any[]>([]);

    useEffect(() => {
        fetchReports();
        fetchMedicalData();
    }, [date]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports?date=${date}`);
            const data = await res.json();
            setReports(data);
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMedicalData = async () => {
        try {
            const [mutRes, indRes] = await Promise.all([
                fetch(`/api/medical/mutations?date=${date}`),
                fetch(`/api/medical/indications?date=${date}`)
            ]);
            setMutations(await mutRes.json());
            setIndications(await indRes.json());
        } catch (error) {
            console.error("Failed to fetch medical data", error);
        }
    };

    // Helper to parse the JSON string safely
    const getParsed = (report: Report): ParsedReport | null => {
        if (!report.parsedData) return null;
        try {
            return JSON.parse(report.parsedData);
        } catch (e) {
            return null;
        }
    };

    const incidents = reports.flatMap(r => {
        const parsed = getParsed(r);
        return parsed?.incidents?.map(inc => ({ ...inc, group: r.group.name })) || [];
    });

    const totalYouth = reports.reduce((sum, r) => {
        const parsed = getParsed(r);
        return sum + (parsed?.presentYouth || 0);
    }, 0);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dagrapport</h1>
                    <p className="text-gray-500">
                        {format(new Date(date), "EEEE d MMMM yyyy", { locale: nl })}
                    </p>
                </div>
                <div className="flex items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <Calendar className="text-gray-400 mr-2" size={20} />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="outline-none text-gray-700 font-medium"
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500">Totaal Jongeren</h3>
                        <Users className="text-blue-500" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{totalYouth}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500">Rapportages</h3>
                        <FileText className="text-green-500" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{reports.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500">Incidenten</h3>
                        <AlertTriangle className="text-red-500" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{incidents.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500">Medisch</h3>
                        <Activity className="text-purple-500" size={20} />
                    </div>
                    <div className="text-sm">
                        <span className="font-bold text-gray-900">{mutations.length}</span> mutaties<br />
                        <span className="font-bold text-gray-900">{indications.length}</span> indicaties
                    </div>
                </div>
            </div>

            {/* Incidents Section */}
            {incidents.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-red-800 mb-4 flex items-center">
                        <AlertTriangle className="mr-2" />
                        Incidenten Overzicht
                    </h2>
                    <div className="space-y-4">
                        {incidents.map((inc, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-red-100">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-gray-900">{inc.group}</span>
                                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                                        {inc.type}
                                    </span>
                                </div>
                                <p className="text-gray-700 mb-2">{anonymizeText(inc.description)}</p>
                                <div className="text-sm text-gray-500">
                                    <span>Maatregel: {anonymizeText(inc.actionTaken)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Medical Overview Section */}
            {(mutations.length > 0 || indications.length > 0) && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
                        <Activity className="mr-2" />
                        Medisch Overzicht
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {mutations.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-purple-700 mb-2 uppercase">Sportmutaties (Niet sporten)</h3>
                                <div className="space-y-2">
                                    {mutations.map((m) => (
                                        <div key={m.id} className="bg-white p-3 rounded-lg shadow-sm border border-purple-100 flex justify-between items-center">
                                            <div>
                                                <span className="font-bold text-gray-900">{anonymizeName(m.youth.firstName + " " + m.youth.lastName)}</span>
                                                <span className="text-xs text-gray-500 ml-2">({m.group.name})</span>
                                            </div>
                                            <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-700 rounded-full">
                                                {m.reasonType}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {indications.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-purple-700 mb-2 uppercase">Sportindicaties (Extra sport)</h3>
                                <div className="space-y-2">
                                    {indications.map((i) => (
                                        <div key={i.id} className="bg-white p-3 rounded-lg shadow-sm border border-purple-100 flex justify-between items-center">
                                            <div>
                                                <span className="font-bold text-gray-900">{anonymizeName(i.youth.firstName + " " + i.youth.lastName)}</span>
                                                <span className="text-xs text-gray-500 ml-2">({i.group.name})</span>
                                            </div>
                                            <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                {i.type}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Group Overview Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Groepsoverzicht</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groep</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aanwezig</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sfeer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bijzonderheden</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actie</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Geen rapportages gevonden voor deze datum.
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => {
                                    const parsed = getParsed(report);
                                    const isExpanded = expandedGroup === report.id;

                                    return (
                                        <>
                                            <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div
                                                            className="w-3 h-3 rounded-full mr-3"
                                                            style={{ backgroundColor: report.group.color || 'gray' }}
                                                        />
                                                        <span className="font-medium text-gray-900">{report.group.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                                    {parsed?.presentYouth || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${parsed?.atmosphere.toLowerCase().includes("goed") || parsed?.atmosphere.toLowerCase().includes("positief")
                                                        ? "bg-green-100 text-green-800"
                                                        : parsed?.atmosphere.toLowerCase().includes("onrust")
                                                            ? "bg-orange-100 text-orange-800"
                                                            : "bg-gray-100 text-gray-800"
                                                        }`}>
                                                        {parsed?.atmosphere || "Onbekend"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">
                                                    {anonymizeText(parsed?.sessionSummary || (report.content?.substring(0, 50) ?? ""))}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => setExpandedGroup(isExpanded ? null : report.id)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan={5} className="px-6 py-4">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="text-sm font-bold text-gray-700 mb-1">Volledige Rapportage</h4>
                                                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{anonymizeText(report.content)}</p>
                                                            </div>
                                                            {parsed?.planForTomorrow && (
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-gray-700 mb-1">Plan voor Morgen</h4>
                                                                    <p className="text-sm text-gray-600">{anonymizeText(parsed.planForTomorrow)}</p>
                                                                </div>
                                                            )}
                                                            <div className="text-xs text-gray-400 pt-2 border-t border-gray-200 flex justify-between">
                                                                <span>Ingevoerd door: {report.author || "Onbekend"}</span>
                                                                <span>Betrouwbaarheid AI: {Math.round((report.confidenceScore || 0) * 100)}%</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
