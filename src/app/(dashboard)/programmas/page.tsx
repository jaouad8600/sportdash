'use client';

import { useState } from 'react';
import { Plus, Dumbbell, Clock, Users, Target, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Program {
    id: string;
    title: string;
    description: string;
    duration: string;
    intensity: 'Laag' | 'Gemiddeld' | 'Hoog';
    targetGroup: string;
    exercises: number;
    tags: string[];
}

const INITIAL_PROGRAMS: Program[] = [
    {
        id: '1',
        title: 'Basis Conditie',
        description: 'Algemene conditietraining voor beginners. Focus op uithoudingsvermogen en basisbewegingen.',
        duration: '45 min',
        intensity: 'Gemiddeld',
        targetGroup: 'Alle groepen',
        exercises: 8,
        tags: ['Cardio', 'Conditie']
    },
    {
        id: '2',
        title: 'Krachtcircuit Bovenlichaam',
        description: 'Circuit training gericht op spieropbouw en kracht voor het bovenlichaam.',
        duration: '60 min',
        intensity: 'Hoog',
        targetGroup: 'Gevorderden',
        exercises: 12,
        tags: ['Kracht', 'Circuit']
    },
    {
        id: '3',
        title: 'Spel & Samenwerking',
        description: 'Sociale vaardigheden trainen door middel van samenwerkingsspellen.',
        duration: '50 min',
        intensity: 'Laag',
        targetGroup: 'Nieuwe instroom',
        exercises: 5,
        tags: ['Sociaal', 'Spel']
    },
];

export default function ProgramsPage() {
    const [programs, setPrograms] = useState<Program[]>(INITIAL_PROGRAMS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProgram, setNewProgram] = useState<Partial<Program>>({
        title: '', description: '', duration: '45 min', intensity: 'Gemiddeld', targetGroup: '', tags: []
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const program: Program = {
            ...newProgram as Program,
            id: Math.random().toString(36).substr(2, 9),
            exercises: 0,
            tags: ['Nieuw']
        };
        setPrograms([...programs, program]);
        setIsModalOpen(false);
        setNewProgram({ title: '', description: '', duration: '45 min', intensity: 'Gemiddeld', targetGroup: '', tags: [] });
    };

    const getIntensityColor = (intensity: string) => {
        switch (intensity) {
            case 'Laag': return 'bg-green-100 text-green-700';
            case 'Gemiddeld': return 'bg-yellow-100 text-yellow-700';
            case 'Hoog': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Trainingsprogramma's</h1>
                    <p className="text-gray-500">Bibliotheek met sportactiviteiten en schema's</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    <span>Nieuw Programma</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {programs.map((program) => (
                    <motion.div
                        key={program.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <Dumbbell size={24} />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getIntensityColor(program.intensity)}`}>
                                    {program.intensity}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2">{program.title}</h3>
                            <p className="text-gray-500 text-sm mb-4 line-clamp-2">{program.description}</p>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {program.tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {program.duration}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Target size={14} />
                                        {program.exercises} oef.
                                    </span>
                                </div>
                                <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 text-xs uppercase tracking-wide">
                                    Bekijk
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6"
                        >
                            <h2 className="text-xl font-bold mb-6">Nieuw Programma</h2>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                                    <input
                                        type="text"
                                        required
                                        value={newProgram.title}
                                        onChange={e => setNewProgram({ ...newProgram, title: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                        placeholder="Bijv. Core Stability"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
                                    <textarea
                                        required
                                        value={newProgram.description}
                                        onChange={e => setNewProgram({ ...newProgram, description: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 h-24 resize-none"
                                        placeholder="Korte omschrijving van de training..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duur</label>
                                        <select
                                            value={newProgram.duration}
                                            onChange={e => setNewProgram({ ...newProgram, duration: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                        >
                                            <option>30 min</option>
                                            <option>45 min</option>
                                            <option>60 min</option>
                                            <option>90 min</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Intensiteit</label>
                                        <select
                                            value={newProgram.intensity}
                                            onChange={e => setNewProgram({ ...newProgram, intensity: e.target.value as any })}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                        >
                                            <option>Laag</option>
                                            <option>Gemiddeld</option>
                                            <option>Hoog</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
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
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
