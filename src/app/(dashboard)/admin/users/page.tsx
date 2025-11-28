'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthContext';
import { Role } from '@prisma/client';
import { Plus, Trash2, Edit2, Shield, User, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface UserData {
    id: string;
    username: string;
    name: string;
    role: Role;
    isActive: boolean;
}

export default function AdminUsersPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const toast = useToast();

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        password: '',
        role: 'SPORTBEGELEIDER' as Role,
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to create user');

            toast.success('Gebruiker aangemaakt!');
            setShowModal(false);
            setFormData({ username: '', name: '', password: '', role: 'SPORTBEGELEIDER' });
            fetchUsers();
        } catch (error) {
            toast.error('Fout bij aanmaken gebruiker.');
        }
    };

    if (user?.role !== 'BEHEERDER') {
        return <div className="p-8 text-center text-red-500">Geen toegang.</div>;
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-serif">
                        Gebruikersbeheer
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Beheer accounts en rechten.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 font-medium shadow-lg shadow-blue-200"
                >
                    <Plus size={20} />
                    Nieuwe Gebruiker
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gebruikersnaam</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{u.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{u.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {u.isActive ? (
                                        <span className="text-green-600 flex items-center gap-1 text-sm"><Check size={14} /> Actief</span>
                                    ) : (
                                        <span className="text-red-600 flex items-center gap-1 text-sm"><X size={14} /> Inactief</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-blue-600 hover:text-blue-900 mr-3"><Edit2 size={18} /></button>
                                    <button className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Nieuwe Gebruiker</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Naam</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Gebruikersnaam</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Wachtwoord</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Rol</label>
                                <select
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                                >
                                    <option value="SPORTBEGELEIDER">Sportbegeleider</option>
                                    <option value="GROEPSLEIDING">Groepsleiding</option>
                                    <option value="TEAMLEIDER">Teamleider</option>
                                    <option value="BEHEERDER">Beheerder</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Annuleren
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Aanmaken
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
