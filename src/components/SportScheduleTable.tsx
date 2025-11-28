"use client";

import { getAllSchedules, ScheduleEvent } from "@/lib/schedules";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";

type LocationFilter = "ALL" | "EB" | "VLOED";

interface SportScheduleTableProps {
    locationFilter?: LocationFilter;
}

export default function SportScheduleTable({ locationFilter = "ALL" }: SportScheduleTableProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const allSchedules = getAllSchedules();

    // Filter schedules based on location
    const schedules = locationFilter === "ALL"
        ? allSchedules
        : allSchedules.filter(schedule => {
            if (locationFilter === "EB") {
                return schedule.location.includes("Eb") || schedule.location.includes("EB");
            } else if (locationFilter === "VLOED") {
                return schedule.location.includes("Vloed");
            }
            return true;
        });

    // Calculate week range
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(start, i));

    // Define time slots based on the images
    // Langverblijf slots: 16:00-16:45, 17:45-18:30, 18:45-19:30, 19:45-20:30
    // Eb slots: 16:00-16:45, 17:00-17:30, 17:30-18:15, 18:15-18:45, 18:45-19:30, 19:45-20:30
    // We'll merge them into a sorted unique list for the header
    const timeSlots = [
        "16:00 - 16:45",
        "17:00 - 17:30",
        "17:30 - 18:15",
        "17:45 - 18:30",
        "18:15 - 18:45",
        "18:45 - 19:30",
        "19:45 - 20:30"
    ];

    // Helper to find event for a specific day and time slot
    const getEvent = (dayDate: Date, timeSlot: string) => {
        const dayName = dayDate.toLocaleDateString("nl-NL", { weekday: "long" });
        const day = dayName.charAt(0).toUpperCase() + dayName.slice(1);

        // Parse slot start time
        const [slotStart] = timeSlot.split(" - ");

        return schedules.find(s => {
            if (s.day !== day) return false;
            // Simple check: does the event start at the slot start time?
            // Or does it overlap significantly? For now, exact start match is safest given the static data.
            // Actually, the images show specific columns for specific times.
            // Let's try to match start time.
            return s.startTime === slotStart.trim();
        });
    };

    const [restrictions, setRestrictions] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/restrictions')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setRestrictions(data);
            })
            .catch(err => console.error("Failed to fetch restrictions", err));
    }, []);

    const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const prevWeek = () => setCurrentDate(addDays(currentDate, -7));

    return (
        <div className="bg-teylingereind-blue text-white rounded-xl overflow-hidden shadow-2xl border border-white/10">
            {/* Header */}
            <div className="p-6 bg-white/5 border-b border-white/10 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white font-serif">
                        Sportrooster
                        {locationFilter === "EB" && " - EB (Oudbouw)"}
                        {locationFilter === "VLOED" && " - Vloed (Nieuwbouw)"}
                    </h2>
                    <p className="text-gray-300 text-sm">Week {format(currentDate, "w", { locale: nl })}: {format(start, "d MMM")} - {format(addDays(start, 6), "d MMM yyyy")}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={prevWeek} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft /></button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-teylingereind-royal hover:bg-blue-600 rounded-lg text-sm font-bold transition-colors">Vandaag</button>
                    <button onClick={nextWeek} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronRight /></button>
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="p-4 text-left border-r border-white/10 min-w-[150px] font-bold text-gray-200">DAG</th>
                            {timeSlots.map(slot => (
                                <th key={slot} className="p-4 text-center border-r border-white/10 min-w-[120px] font-bold text-gray-200 whitespace-nowrap">
                                    {slot}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {weekDays.map((day) => {
                            const dayName = format(day, "EEEE", { locale: nl });
                            const dayRestrictions = restrictions.filter(r => {
                                const start = new Date(r.startDate);
                                const end = r.endDate ? new Date(r.endDate) : new Date(2100, 0, 1);
                                return day >= start && day <= end;
                            });

                            return (
                                <tr key={day.toISOString()} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4 border-r border-white/10 font-bold text-white capitalize bg-white/5">
                                        {dayName}
                                        <span className="block text-xs text-gray-400 font-normal">{format(day, "d MMM")}</span>

                                        {/* Restrictions Indicator */}
                                        {dayRestrictions.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {dayRestrictions.map(r => (
                                                    <div key={r.id} className="text-[10px] bg-red-500/20 text-red-200 px-1.5 py-0.5 rounded border border-red-500/30 flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                        {r.youth?.firstName} ({r.group?.name})
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    {timeSlots.map(slot => {
                                        const event = getEvent(day, slot);
                                        return (
                                            <td key={slot} className="p-2 border-r border-white/10 h-20 relative group">
                                                {event ? (
                                                    <div className={`
                                                        w-full h-full rounded-lg p-2 flex flex-col justify-center items-center text-center text-sm font-bold shadow-lg
                                                        ${event.location.includes("Vloed") ? "bg-teylingereind-orange text-white" : ""}
                                                        ${event.location.includes("Eb") ? "bg-teylingereind-royal text-white" : ""}
                                                        ${event.activity.includes("Voetbal") ? "bg-teylingereind-royal text-white" : ""} 
                                                        ${event.activity.includes("Rust") || event.activity.includes("Pauze") ? "bg-white/10 text-gray-400 border border-white/10" : ""}
                                                    `}>
                                                        <span className="leading-tight">{event.activity}</span>
                                                        <span className="text-[10px] font-normal opacity-80 mt-1">{event.location.split(" - ")[1] || event.location}</span>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full"></div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-teylingereind-orange rounded"></div>
                    <span className="text-gray-300">Langverblijf - Vloed</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-teylingereind-royal rounded"></div>
                    <span className="text-gray-300">Eb (oudbouw) / Voetbal</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white/10 border border-white/10 rounded"></div>
                    <span className="text-gray-300">Rust / Pauze</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-gray-300">Beperking</span>
                </div>
            </div>
        </div>
    );
}
