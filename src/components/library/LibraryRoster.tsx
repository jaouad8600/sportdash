"use client";

import React, { useState, useEffect } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LibraryRosterProps {
    loans: any[];
    books: any[];
    onAddLoan: (loan: any) => void;
}

const WEEKDAY_SLOTS = [
    { start: "16:00", end: "16:30" },
    { start: "17:00", end: "17:30", label: "Rust halfuur" },
    { start: "18:00", end: "18:30" },
    { start: "18:45", end: "19:15" },
    { start: "19:45", end: "20:15" },
];

const WEEKEND_SLOTS = [
    { start: "10:30", end: "11:00" },
    { start: "11:15", end: "11:45" },
    { start: "12:00", end: "12:30", label: "Rust halfuur" },
    { start: "13:45", end: "14:15" },
    { start: "14:15", end: "14:45" },
    { start: "15:15", end: "15:45" },
    { start: "16:30", end: "17:00", label: "Rust halfuur" },
    { start: "17:00", end: "17:30" },
];

// Fixed schedule mapping: Day Index (0=Sunday, 1=Monday...) -> Slot Index -> Group Name
// This mimics the "image" the user referred to by assigning groups to slots.
const FIXED_SCHEDULE: Record<number, Record<number, string>> = {
    1: { 0: "Gaag", 2: "Zijl", 3: "Lier", 4: "Vliet" }, // Monday
    2: { 0: "Poel", 2: "Kust", 3: "Golf", 4: "Zift" },  // Tuesday
    3: { 0: "Gaag", 2: "Zijl", 3: "Lier", 4: "Vliet" }, // Wednesday
    4: { 0: "Poel", 2: "Kust", 3: "Golf", 4: "Zift" },  // Thursday
    5: { 0: "Gaag", 2: "Zijl", 3: "Lier", 4: "Vliet" }, // Friday
    6: { 0: "Poel", 1: "Kust", 3: "Golf", 4: "Zift", 5: "Gaag", 7: "Zijl" }, // Saturday
    0: { 0: "Lier", 1: "Vliet", 3: "Poel", 4: "Kust", 5: "Golf", 7: "Zift" }, // Sunday
};

export default function LibraryRoster({ loans, books, onAddLoan }: LibraryRosterProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

    useEffect(() => {
        setWeekStart(startOfWeek(currentDate, { weekStartsOn: 1 }));
    }, [currentDate]);

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
    const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

    const getGroupForSlot = (day: Date, slotIndex: number, isWeekend: boolean) => {
        const dayIndex = day.getDay();
        const schedule = FIXED_SCHEDULE[dayIndex];
        return schedule ? schedule[slotIndex] : null;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Bibliotheek rooster</h2>
                <div className="flex items-center gap-4">
                    <button onClick={handlePrevWeek} className="p-2 hover:bg-gray-100 rounded-full">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-medium">
                        Week {format(weekStart, "w")} - {format(weekStart, "MMMM yyyy", { locale: nl })}
                    </span>
                    <button onClick={handleNextWeek} className="p-2 hover:bg-gray-100 rounded-full">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full min-w-[1000px] border-collapse">
                    <thead>
                        <tr>
                            <th className="p-3 border border-gray-200 bg-gray-50 text-left font-bold w-32">Dag</th>
                            {WEEKDAY_SLOTS.map((slot, index) => (
                                <th key={index} className="p-3 border border-gray-200 bg-gray-50 text-center font-bold text-xs">
                                    {slot.start}-{slot.end}
                                </th>
                            ))}
                            {/* Fill remaining columns if weekend has more slots */}
                            {Array.from({ length: Math.max(0, WEEKEND_SLOTS.length - WEEKDAY_SLOTS.length) }).map((_, i) => (
                                <th key={`empty-header-${i}`} className="p-3 border border-gray-200 bg-gray-50"></th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Weekdays */}
                        {weekDays.slice(0, 5).map((day) => (
                            <tr key={day.toISOString()}>
                                <td className="p-3 border border-gray-200 font-medium bg-gray-50">
                                    {format(day, "EEEE", { locale: nl })}
                                </td>
                                {WEEKDAY_SLOTS.map((slot, index) => {
                                    const groupName = getGroupForSlot(day, index, false);
                                    const isRest = slot.label === "Rust halfuur";

                                    return (
                                        <td
                                            key={index}
                                            className={`p-2 border border-gray-200 text-center h-16 min-w-[100px] relative
                                                ${isRest ? "bg-orange-50" : "bg-white"}
                                            `}
                                        >
                                            {isRest ? (
                                                <span className="text-sm font-bold text-orange-800">Rust halfuur</span>
                                            ) : (
                                                <>
                                                    <div className="text-xs text-gray-400 mb-1">{slot.start}-{slot.end}</div>
                                                    {groupName ? (
                                                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-bold">
                                                            {groupName}
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-300 text-xs">-</div>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    );
                                })}
                                {/* Fill remaining cells to align if needed */}
                                {Array.from({ length: 8 - WEEKDAY_SLOTS.length }).map((_, i) => (
                                    <td key={`empty-${i}`} className="p-2 border border-gray-200 bg-gray-100"></td>
                                ))}
                            </tr>
                        ))}

                        {/* Time Header for Weekend */}
                        <tr>
                            <td className="p-3 border border-gray-200 bg-gray-100 font-bold text-sm">Weekend</td>
                            {WEEKEND_SLOTS.map((slot, index) => (
                                <td key={index} className="p-2 border border-gray-200 text-center text-xs font-bold bg-gray-100">
                                    {slot.start}-{slot.end}
                                </td>
                            ))}
                        </tr>

                        {/* Weekend */}
                        {weekDays.slice(5).map((day) => (
                            <tr key={day.toISOString()}>
                                <td className="p-3 border border-gray-200 font-medium bg-gray-50">
                                    {format(day, "EEEE", { locale: nl })}
                                </td>
                                {WEEKEND_SLOTS.map((slot, index) => {
                                    const groupName = getGroupForSlot(day, index, true);
                                    const isRest = slot.label === "Rust halfuur";

                                    return (
                                        <td
                                            key={index}
                                            className={`p-2 border border-gray-200 text-center h-16 min-w-[100px] relative
                                                ${isRest ? "bg-orange-50" : "bg-white"}
                                            `}
                                        >
                                            {isRest ? (
                                                <span className="text-sm font-bold text-orange-800">Rust halfuur</span>
                                            ) : (
                                                <>
                                                    {groupName ? (
                                                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-bold">
                                                            {groupName}
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-300 text-xs">-</div>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
