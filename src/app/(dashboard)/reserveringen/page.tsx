"use client";

import { useState, useEffect } from "react";
import { format, addDays, isSameDay, parseISO, addMinutes, setHours, setMinutes } from "date-fns";
import { nl } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Plus, Trash2, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";

interface Reservation {
    id: string;
    resourceId: string;
    resourceName: string;
    userId: string;
    userName: string;
    startTime: string;
    endTime: string;
    title?: string;
    description?: string;
}

const RESOURCES = [
    { id: "SPORTZAAL_EB", name: "Sportzaal EB" },
    { id: "SPORTZAAL_VLOED", name: "Sportzaal Vloed" },
    { id: "SPORTVELD_EB", name: "Sportveld EB" },
    { id: "SPORTVELD_VLOED", name: "Sportveld Vloed" },
    { id: "FITNESSZAAL", name: "Fitnesszaal" },
    { id: "GYMZAAL", name: "Gymzaal" },
];

const TIME_SLOTS = [
    { start: "16:00", end: "16:45" },
    { start: "16:45", end: "17:30" },
    { start: "17:30", end: "18:15" },
    { start: "18:15", end: "19:00" },
    { start: "19:00", end: "19:45" },
    { start: "19:45", end: "20:30" },
];

export default function ReservationsPage() {
    const { user } = useAuth();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        resourceId: RESOURCES[0].id,
        date: format(new Date(), "yyyy-MM-dd"),
        startTime: "16:00",
        endTime: "16:45",
        userName: "",
        title: "",
        description: "",
        groupId: ""
    });

    const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        if (user?.name) {
            setFormData(prev => ({ ...prev, userName: user.name }));
        }
        fetchGroups();
    }, [user]);

    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/groups");
            const data = await res.json();
            setGroups(data);
        } catch (error) {
            console.error("Failed to fetch groups", error);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, [selectedDate]);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const dateStr = format(selectedDate, "yyyy-MM-dd");
            const res = await fetch(`/api/reservations?date=${dateStr}`);
            const data = await res.json();
            setReservations(data);
        } catch (error) {
            console.error("Error fetching reservations", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSlotClick = (resourceId: string, start: string, end: string) => {
        // Check if slot is already booked
        const isBooked = reservations.some(r =>
            r.resourceId === resourceId &&
            format(parseISO(r.startTime), "HH:mm") === start
        );

        if (isBooked) return; // Or open details modal

        setFormData({
            ...formData,
            resourceId,
            date: format(selectedDate, "yyyy-MM-dd"),
            startTime: start,
            endTime: end,
            title: "",
            description: "",
            groupId: ""
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        // Validation
        if (!formData.userName.trim()) {
            alert("Vul een naam in.");
            return;
        }
        if (formData.endTime <= formData.startTime) {
            alert("Eindtijd moet later zijn dan starttijd.");
            return;
        }

        try {
            const resource = RESOURCES.find(r => r.id === formData.resourceId);
            const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
            const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

            const res = await fetch("/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resourceId: formData.resourceId,
                    resourceName: resource?.name,
                    userId: user?.id || "unknown",
                    userName: formData.userName,
                    groupId: formData.groupId,
                    startTime: startDateTime.toISOString(),
                    endTime: endDateTime.toISOString(),
                    title: formData.title,
                    description: formData.description
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Fout bij opslaan");
                return;
            }

            setIsModalOpen(false);
            fetchReservations();
        } catch (error) {
            console.error("Error saving reservation", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Weet je zeker dat je deze reservering wilt verwijderen?")) return;
        try {
            await fetch(`/api/reservations?id=${id}`, { method: "DELETE" });
            fetchReservations();
        } catch (error) {
            console.error("Error deleting reservation", error);
        }
    };

    const nextDay = () => setSelectedDate(addDays(selectedDate, 1));
    const prevDay = () => setSelectedDate(addDays(selectedDate, -1));

    return (
        <div className="max-w-[1600px] mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-serif">Reserveringen</h1>
                    <p className="text-gray-500 mt-1">Klik op een tijdslot om te reserveren (16:00 - 20:30)</p>
                </div>

                {/* Date Navigation */}
                <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                    <button onClick={prevDay} className="p-2 hover:bg-gray-100 rounded-full">
                        <ChevronLeft size={24} className="text-gray-600" />
                    </button>
                    <div className="flex items-center gap-2 text-lg font-medium text-gray-800 min-w-[200px] justify-center">
                        <CalendarIcon size={20} className="text-blue-600" />
                        {format(selectedDate, "EEEE d MMMM", { locale: nl })}
                    </div>
                    <button onClick={nextDay} className="p-2 hover:bg-gray-100 rounded-full">
                        <ChevronRight size={24} className="text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-[100px_repeat(6,1fr)] divide-x divide-gray-200">
                    {/* Header Row */}
                    <div className="bg-gray-50 p-4 border-b border-gray-200 font-medium text-gray-500 text-center flex items-center justify-center">
                        Tijd
                    </div>
                    {RESOURCES.map(resource => (
                        <div key={resource.id} className="bg-gray-50 p-4 border-b border-gray-200 font-bold text-gray-700 text-center">
                            {resource.name}
                        </div>
                    ))}

                    {/* Time Slots */}
                    {TIME_SLOTS.map((slot, index) => (
                        <>
                            {/* Time Column */}
                            <div key={`time-${index}`} className="p-4 border-b border-gray-100 text-sm font-medium text-gray-500 flex items-center justify-center bg-gray-50/50">
                                {slot.start} - {slot.end}
                            </div>

                            {/* Resource Columns */}
                            {RESOURCES.map(resource => {
                                const reservation = reservations.find(r =>
                                    r.resourceId === resource.id &&
                                    format(parseISO(r.startTime), "HH:mm") === slot.start
                                );

                                return (
                                    <div
                                        key={`${resource.id}-${slot.start}`}
                                        className={`
                                            p-2 border-b border-gray-100 min-h-[80px] transition-all relative group
                                            ${reservation
                                                ? "bg-blue-50 hover:bg-blue-100"
                                                : "hover:bg-gray-50 cursor-pointer"
                                            }
                                        `}
                                        onClick={() => !reservation && handleSlotClick(resource.id, slot.start, slot.end)}
                                    >
                                        {reservation ? (
                                            <div className="h-full flex flex-col justify-center items-center text-center">
                                                <span className="font-bold text-blue-800 text-sm">{reservation.userName}</span>
                                                {reservation.title && (
                                                    <span className="text-xs text-blue-600 mt-1">{reservation.title}</span>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(reservation.id);
                                                    }}
                                                    className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <Plus size={20} className="text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-6 text-gray-900">Nieuwe Reservering</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                                <input
                                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.userName}
                                    onChange={e => setFormData({ ...formData, userName: e.target.value })}
                                    placeholder="Jouw naam"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Groep (Optioneel)</label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={formData.groupId}
                                    onChange={e => {
                                        const group = groups.find(g => g.id === e.target.value);
                                        setFormData(prev => ({
                                            ...prev,
                                            groupId: e.target.value,
                                            title: group ? group.name : prev.title
                                        }));
                                    }}
                                >
                                    <option value="">Selecteer een groep...</option>
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ruimte</label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={formData.resourceId}
                                    onChange={e => setFormData({ ...formData, resourceId: e.target.value })}
                                    disabled
                                >
                                    {RESOURCES.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                                    <input
                                        type="date"
                                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                        value={formData.date}
                                        disabled
                                    />
                                </div>
                                <div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Starttijd</label>
                                    <input
                                        type="time"
                                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                        value={formData.startTime}
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Eindtijd</label>
                                    <input
                                        type="time"
                                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                        value={formData.endTime}
                                        disabled
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Titel / Activiteit (Optioneel)</label>
                                <input
                                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Bijv. Zaalvoetbal"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Opmerking (Optioneel)</label>
                                <textarea
                                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Annuleren</button>
                                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-200">Opslaan</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
