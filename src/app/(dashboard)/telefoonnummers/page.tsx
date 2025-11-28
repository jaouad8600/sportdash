'use client';

import React, { useState, useMemo } from 'react';
import { Search, Phone, Filter, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { usePhoneNumbers } from '@/hooks/useSportData';
import { useToast } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';

type TelefoonRecord = {
    id: string;
    department: string;
    location: string;
    number: string;
    description?: string;
};

export default function TelefoonnummersPage() {
    const { data: phoneNumbers, isLoading, createPhoneNumber, updatePhoneNumber, deletePhoneNumber } = usePhoneNumbers();
    const toast = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('Alle');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<TelefoonRecord | null>(null);
    const [formData, setFormData] = useState({
        department: '',
        location: '',
        number: '',
        description: ''
    });

    // Extract unique departments for the filter dropdown
    const departments = useMemo(() => {
        if (!phoneNumbers) return ['Alle'];
        const depts = new Set(phoneNumbers.map((r: TelefoonRecord) => r.department));
        return ['Alle', ...Array.from(depts).sort()];
    }, [phoneNumbers]);

    // Filter logic
    const filteredRecords = useMemo(() => {
        if (!phoneNumbers) return [];
        return phoneNumbers.filter((record: TelefoonRecord) => {
            const matchesSearch =
                record.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.number.includes(searchTerm) ||
                (record.description && record.description.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesDepartment = selectedDepartment === 'Alle' || record.department === selectedDepartment;

            return matchesSearch && matchesDepartment;
        });
    }, [phoneNumbers, searchTerm, selectedDepartment]);

    const handleOpenModal = (record?: TelefoonRecord) => {
        if (record) {
            setEditingRecord(record);
            setFormData({
                department: record.department,
                location: record.location,
                number: record.number,
                description: record.description || ''
            });
        } else {
            setEditingRecord(null);
            setFormData({
                department: '',
                location: '',
                number: '',
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRecord) {
                await updatePhoneNumber.mutateAsync({ id: editingRecord.id, ...formData });
                toast.success('Nummer bijgewerkt');
            } else {
                await createPhoneNumber.mutateAsync(formData);
                toast.success('Nummer toegevoegd');
            }
            setIsModalOpen(false);
        } catch (error) {
            toast.error('Er is iets misgegaan');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Weet je zeker dat je dit nummer wilt verwijderen?')) {
            try {
                await deletePhoneNumber.mutateAsync(id);
                toast.success('Nummer verwijderd');
            } catch (error) {
                toast.error('Kon nummer niet verwijderen');
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Telefoonnummers gebouw</h1>
                    <p className="text-gray-600 mt-2">
                        Overzicht van interne nummers per afdeling en ruimte
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 font-medium"
                >
                    <Plus size={20} />
                    <span>Nieuw Nummer</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Zoek op afdeling, ruimte of nummer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>
                <div className="relative w-full md:w-64">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white cursor-pointer"
                    >
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold text-sm uppercase tracking-wider">
                                <th className="p-4">Afdeling</th>
                                <th className="p-4">Ruimte / Locatie</th>
                                <th className="p-4">Nummer</th>
                                <th className="p-4">Omschrijving</th>
                                <th className="p-4 w-24">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">Laden...</td>
                                </tr>
                            ) : filteredRecords.length > 0 ? (
                                filteredRecords.map((record: TelefoonRecord, index: number) => (
                                    <tr
                                        key={record.id}
                                        className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                    >
                                        <td className="p-4 font-medium text-gray-900">{record.department}</td>
                                        <td className="p-4">{record.location}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 font-bold font-mono">
                                                <Phone size={14} />
                                                {record.number}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 italic">{record.description || '-'}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(record)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(record.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        Geen resultaten gevonden voor "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-xs text-gray-500 text-center">
                    Totaal {filteredRecords.length} nummer(s) gevonden
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingRecord ? 'Nummer Bewerken' : 'Nieuw Nummer'}
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Afdeling</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Bijv. Medische Dienst"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ruimte / Locatie</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Bijv. Spreekkamer 1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nummer</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.number}
                                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Bijv. 1234"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Omschrijving (optioneel)</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Bijv. Arts"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Annuleren
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
                                    >
                                        <Save size={18} />
                                        Opslaan
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
