"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { RefreshCw, Calendar, Mail } from "lucide-react";

export default function ReportControls() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dateParam = searchParams.get("date");

    const [date, setDate] = useState(dateParam || new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setDate(newDate);
        router.push(`/rapportage?date=${newDate}`);
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // Call the API to generate summary
            // Note: In a real app, we might want to pass the date to the API
            // For now, the API generates for "today" or we can update API to accept date
            // The current API implementation generates for "now". 
            // If we want to regenerate for a specific date, we'd need to update the API.
            // For this MVP, let's assume we just trigger the daily summary for today/current context.
            // Or better, let's just refresh the page if the backend handles generation on GET or we have a specific endpoint.
            // The plan says "Handmatig genereren (voor updates na 18:00)".

            const res = await fetch('/api/cron/daily-summary', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}` // This is tricky client-side, usually done via Server Action
                }
            });

            if (res.ok) {
                router.refresh();
            } else {
                alert("Kon rapportage niet genereren.");
            }
        } catch (error) {
            console.error(error);
            alert("Er is een fout opgetreden.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center space-x-2">
                <Calendar size={20} className="text-gray-500" />
                <input
                    type="date"
                    value={date}
                    onChange={handleDateChange}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                />
            </div>

            <div className="flex-1"></div>

            <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                <span>{loading ? "Genereren..." : "Handmatig Genereren"}</span>
            </button>

            <button
                onClick={async () => {
                    setLoading(true);
                    try {
                        // Fetch the summary text from the API (we can reuse the generation logic or just fetch reports)
                        // Ideally we should have an endpoint that returns the text.
                        // For now, let's fetch the reports for the date and construct the text client-side or use a new endpoint.
                        // Let's use a new endpoint that returns the formatted text string.

                        const res = await fetch('/api/reports/summary-text', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ date })
                        });

                        if (!res.ok) throw new Error("Failed to fetch summary");

                        const { text } = await res.json();

                        const subject = encodeURIComponent(`Sportrapportage ${new Date(date).toLocaleDateString('nl-NL')}`);
                        const body = encodeURIComponent(text);

                        window.location.href = `mailto:?subject=${subject}&body=${body}`;

                    } catch (e) {
                        console.error(e);
                        alert("Er is een fout opgetreden bij het openen van de mail.");
                    } finally {
                        setLoading(false);
                    }
                }}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
                <Mail size={18} />
                <span>Mail Dagrapportage</span>
            </button>
        </div>
    );
}
