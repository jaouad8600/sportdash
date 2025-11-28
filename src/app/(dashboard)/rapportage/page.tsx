import { getDailyReports } from "@/services/reportService";
import ReportControls from "@/components/domain/ReportControls";
import DailyReportForm from "@/components/domain/DailyReportForm";
import prisma from "@/lib/db";

export default async function ReportsPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>;
}) {
    const { date: dateParam } = await searchParams;
    const dateStr = dateParam || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);

    // Fetch raw reports for display
    const reports = await getDailyReports(date);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-serif">Dagrapportage</h1>
                    <p className="text-gray-500 mt-1">Sportmomenten aan het einde van de dag</p>
                </div>
                <div className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200">
                    {date.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* Main Form Section */}
            <DailyReportForm />

            <div className="border-t border-gray-200 my-8"></div>

            {/* Existing Reports List */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">
                        Rapportages van {date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                    </h2>
                    <ReportControls />
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {reports.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {reports.map((report) => (
                                <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-gray-900">
                                                {report.group?.name || "Algemeen"}
                                            </span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${report.isIncident ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                                                }`}>
                                                {report.type}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {new Date(report.date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="text-gray-700 text-sm whitespace-pre-wrap">
                                        {report.rawText || report.cleanedText || report.sessionSummary || "Geen inhoud"}
                                    </div>
                                    {report.author && (
                                        <p className="text-xs text-gray-400 mt-2">Door: {report.author}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-500 italic">
                            Geen rapportages gevonden voor deze datum.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
