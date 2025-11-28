"use client";

import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Book, User, Users, Clock, Plus } from "lucide-react";

interface LibraryPlanningProps {
    loans: any[];
    books: any[];
    onAddLoan: (loan: any) => void;
}

export default function LibraryPlanning({ loans, books, onAddLoan }: LibraryPlanningProps) {
    const [events, setEvents] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
    const [groups, setGroups] = useState<any[]>([]); // Fetch groups if needed, or pass as prop

    // Form State
    const [formData, setFormData] = useState({
        bookId: "",
        groupId: "",
        youthName: "",
        notes: "",
    });

    useEffect(() => {
        // Transform loans to calendar events
        const calendarEvents = loans
            .filter((loan) => loan.startTime && loan.endTime)
            .map((loan) => ({
                id: loan.id,
                title: `${loan.book.title} - ${loan.group ? loan.group.name : loan.youthName}`,
                start: loan.startTime,
                end: loan.endTime,
                backgroundColor: loan.status === "ACTIVE" ? "#3b82f6" : "#10b981",
                borderColor: loan.status === "ACTIVE" ? "#2563eb" : "#059669",
                extendedProps: {
                    book: loan.book,
                    group: loan.group,
                    youthName: loan.youthName,
                    status: loan.status,
                },
            }));
        setEvents(calendarEvents);
    }, [loans]);

    useEffect(() => {
        // Fetch groups for dropdown
        fetch("/api/groups")
            .then(res => res.json())
            .then(data => setGroups(data))
            .catch(err => console.error("Error fetching groups", err));
    }, []);


    const handleDateSelect = (selectInfo: any) => {
        setSelectedSlot({ start: selectInfo.start, end: selectInfo.end });
        setShowModal(true);
    };

    const handleSubmit = () => {
        if (!selectedSlot || !formData.bookId) return;

        const newLoan = {
            ...formData,
            startTime: selectedSlot.start.toISOString(),
            endTime: selectedSlot.end.toISOString(),
        };

        onAddLoan(newLoan);
        setShowModal(false);
        setFormData({ bookId: "", groupId: "", youthName: "", notes: "" });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 h-[800px]">
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                initialView="timeGridWeek"
                editable={false}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                events={events}
                select={handleDateSelect}
                locale="nl"
                slotMinTime="08:00:00"
                slotMaxTime="22:00:00"
                allDaySlot={false}
                height="100%"
            />

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Nieuwe Reservering / Lening</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Boek</label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-xl"
                                    value={formData.bookId}
                                    onChange={(e) => setFormData({ ...formData, bookId: e.target.value })}
                                >
                                    <option value="">Selecteer een boek</option>
                                    {books.filter(b => b.available > 0).map((book) => (
                                        <option key={book.id} value={book.id}>
                                            {book.title} ({book.available} beschikbaar)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Groep (Optioneel)</label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-xl"
                                    value={formData.groupId}
                                    onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                                >
                                    <option value="">Geen groep</option>
                                    {groups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Naam (Indien geen groep)</label>
                                <input
                                    className="w-full p-2.5 border border-gray-200 rounded-xl"
                                    placeholder="Naam jongere / medewerker"
                                    value={formData.youthName}
                                    onChange={(e) => setFormData({ ...formData, youthName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tijdstip</label>
                                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                    {selectedSlot && (
                                        <>
                                            {format(selectedSlot.start, "d MMM HH:mm", { locale: nl })} -{" "}
                                            {format(selectedSlot.end, "HH:mm", { locale: nl })}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Annuleren
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!formData.bookId}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Opslaan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
