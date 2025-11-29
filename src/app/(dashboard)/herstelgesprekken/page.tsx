'use client';

import React, { useState } from 'react';
import { MessageCircle, Plus, CheckCircle2, XCircle, Archive, Clock, Filter, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

type RestorativeTalk = {
    id: string;
    youthName: string;
    groupId: string;
    reason: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    createdBy?: string;
    createdAt: string;
    completedAt?: string;
    failureReason?: string;
    archived: boolean;
    group?: {
        name: string;
    };
};

export default function HerstelgesprekkenPage() {
    const [showForm, setShowForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'PENDING' | 'COMPLETED' | 'FAILED'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    // Fetch all talks
    const { data: talks = [], isLoading } = useQuery({
        queryKey: ['restorative-talks', filterStatus],
        queryFn: async () => {
            const url = filterStatus === 'all'
                ? '/api/restorative-talks?status=all'
                : `/api/restorative-talks?status=${filterStatus}`;
            const { data } = await axios.get(url);
            return data as RestorativeTalk[];
        },
    });

    // Fetch groups for form
    const { data: groups = [] } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const { data } = await axios.get('/api/groepen');
            return data;
        },
    });

    // Create mutation
    const createTalk = useMutation({
        mutationFn: async (newTalk: { groupId: string; youthName: string; reason: string }) => {
            await axios.post('/api/restorative-talks', newTalk);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['restorative-talks'] });
            setShowForm(false);
        },
    });

    // Complete mutation
    const completeTalk = useMutation({
        mutationFn: async (id: string) => {
            await axios.put('/api/restorative-talks', { id, status: 'COMPLETED' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['restorative-talks'] });
        },
    });

    // Fail mutation
    const failTalk = useMutation({
        mutationFn: async (id: string) => {
            await axios.put('/api/restorative-talks', { id, status: 'FAILED', failureReason: 'Gesprek niet gelukt - te herhalen' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['restorative-talks'] });
        },
    });

    // Archive mutation
    const archiveTalk = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/restorative-talks?id=${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['restorative-talks'] });
        },
    });

    const filteredTalks = talks.filter(talk =>
        talk.youthName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talk.group?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded">Pending</span>;
            case 'COMPLETED':
                return <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Gelukt</span>;
            case 'FAILED':
                return <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">Te herhalen</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-3 rounded-xl">
                        <MessageCircle className="text-purple-600" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Herstelgesprekken</h1>
                        <p className="text-gray-500 text-sm">Beheer alle herstelgesprekken</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-purple-500/30"
                >
                    <Plus size={20} />
                    Nieuw Gesprek
                </button>
            </div>

            {/* New Talk Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Nieuw Herstelgesprek</h2>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            createTalk.mutate({
                                groupId: formData.get('groupId') as string,
                                youthName: formData.get('youthName') as string,
                                reason: formData.get('reason') as string,
                            });
                        }}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Groep</label>
                                <select
                                    name="groupId"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Selecteer groep...</option>
                                    {groups.map((group: any) => (
                                        <option key={group.id} value={group.id}>{group.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Jongere</label>
                                <input
                                    type="text"
                                    name="youthName"
                                    required
                                    placeholder="Naam van de jongere"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reden</label>
                            <textarea
                                name="reason"
                                rows={3}
                                placeholder="Beschrijf de reden voor het herstelgesprek..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={createTalk.isPending}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {createTalk.isPending ? 'Opslaan...' : 'Opslaan'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Annuleren
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-2 flex-1">
                        <Search size={20} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Zoek op naam of groep..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={20} className="text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="all">Alle statussen</option>
                            <option value="PENDING">Pending</option>
                            <option value="FAILED">Te herhalen</option>
                            <option value="COMPLETED">Gelukt</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Talks Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500">Laden...</div>
                ) : filteredTalks.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">Geen herstelgesprekken gevonden</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jongere</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groep</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reden</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredTalks.map((talk) => (
                                    <tr key={talk.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{talk.youthName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-700">
                                                {talk.group?.name || 'Onbekend'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600 line-clamp-2 max-w-md">
                                                {talk.reason || '-'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(talk.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {new Date(talk.createdAt).toLocaleDateString('nl-NL')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {talk.status !== 'COMPLETED' && (
                                                    <button
                                                        onClick={() => completeTalk.mutate(talk.id)}
                                                        disabled={completeTalk.isPending}
                                                        className="text-gray-400 hover:text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors"
                                                        title="Gesprek gelukt"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                )}
                                                {talk.status !== 'FAILED' && talk.status !== 'COMPLETED' && (
                                                    <button
                                                        onClick={() => failTalk.mutate(talk.id)}
                                                        disabled={failTalk.isPending}
                                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                        title="Gesprek niet gelukt"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => archiveTalk.mutate(talk.id)}
                                                    disabled={archiveTalk.isPending}
                                                    className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition-colors"
                                                    title="Archiveren"
                                                >
                                                    <Archive size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">Totaal</div>
                    <div className="text-2xl font-bold text-gray-900">{talks.length}</div>
                </div>
                <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
                    <div className="text-sm text-yellow-700">Pending</div>
                    <div className="text-2xl font-bold text-yellow-900">
                        {talks.filter(t => t.status === 'PENDING').length}
                    </div>
                </div>
                <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                    <div className="text-sm text-red-700">Te herhalen</div>
                    <div className="text-2xl font-bold text-red-900">
                        {talks.filter(t => t.status === 'FAILED').length}
                    </div>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                    <div className="text-sm text-green-700">Gelukt</div>
                    <div className="text-2xl font-bold text-green-900">
                        {talks.filter(t => t.status === 'COMPLETED').length}
                    </div>
                </div>
            </div>
        </div>
    );
}
