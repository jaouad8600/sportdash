"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Shield, Search, Filter } from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";

interface AuditLog {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    authorId: string;
    details: string | null;
    timestamp: string;
}

export default function AuditPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, we would check role here or in middleware
        // if (user.role !== "BEHEERDER") return; 

        fetch("/api/audit")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setLogs(data);
                } else {
                    console.error("API returned non-array for audit logs:", data);
                    setLogs([]);
                }
                setLoading(false);
            });
    }, [user]);

    if (loading) return <div className="p-8">Laden...</div>;

    if (!user || (user.role !== "BEHEERDER" && user.role !== "AV_MT")) {
        return (
            <div className="p-8 text-center">
                <Shield className="mx-auto text-red-500 mb-4" size={48} />
                <h1 className="text-2xl font-bold text-gray-800">Toegang Geweigerd</h1>
                <p className="text-gray-600">U heeft geen rechten om deze pagina te bekijken.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
                    <p className="text-gray-500">Overzicht van systeemactiviteit</p>
                </div>
                <div className="flex space-x-2">
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Filter size={20} />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Search size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tijdstip</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actie</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entiteit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gebruiker</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {format(new Date(log.timestamp), "d MMM yyyy HH:mm", { locale: nl })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.action === "CREATE" ? "bg-green-100 text-green-800" :
                                        log.action === "UPDATE" ? "bg-blue-100 text-blue-800" :
                                            log.action === "DELETE" ? "bg-red-100 text-red-800" :
                                                "bg-gray-100 text-gray-800"
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {log.entity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {log.authorId}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate font-mono">
                                    {log.details}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
