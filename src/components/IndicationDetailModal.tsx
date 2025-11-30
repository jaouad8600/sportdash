'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, Activity, CheckCircle, XCircle, FileText, MessageSquare, Target } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { SportIndication, Group, Youth } from '@prisma/client';

type IndicationWithRelations = SportIndication & {
    group: Group;
    youth: Youth;
};

interface IndicationDetailModalProps {
    indication: IndicationWithRelations | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function IndicationDetailModal({ indication, isOpen, onClose }: IndicationDetailModalProps) {
    if (!indication) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: "spring", duration: 0.5 }}
                                className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 border-b border-purple-500/20 z-10">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                                    <User className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-white">
                                                        {indication.youth ? `${indication.youth.firstName} ${indication.youth.lastName}` : "Onbe kend"}
                                                    </h2>
                                                    <p className="text-purple-100 text-sm">
                                                        Sportindicatie Details
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                                            aria-label="Sluiten"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    {/* Quick Info Badges */}
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
                                            {indication.group?.name || "Onbekend"}
                                        </span>
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
                                            {indication.type === "CARDIO" ? "SPORT" : indication.type}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
                                    {/* Grid Info */}
                                    <div className="grid grid-cols-2 gap-6 mb-8">
                                        {/* Geldig Vanaf */}
                                        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                    Geldig Vanaf
                                                </p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                    {format(new Date(indication.validFrom), "dd MMMM yyyy", { locale: nl })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Geldig Tot */}
                                        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                                                <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                    Geldig Tot
                                                </p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                    {indication.validUntil && new Date(indication.validUntil).getFullYear() > 1900
                                                        ? format(new Date(indication.validUntil), "dd MMMM yyyy", { locale: nl })
                                                        : "Onbepaald"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Issued By */}
                                        {indication.issuedBy && (
                                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                        Afgegeven Door
                                                    </p>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                        {indication.issuedBy}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Feedback To */}
                                        {indication.feedbackTo && (
                                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                                    <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                        Feedback Aan
                                                    </p>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                        {indication.feedbackTo}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Can Combine */}
                                    <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            {indication.canCombineWithGroup ? (
                                                <>
                                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                        Kan gecombineerd worden met groepsgenoot
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                        Kan niet gecombineerd worden met groepsgenoot
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Onderbouwing Indicering */}
                                    {indication.description && (
                                        <div className="mb-8">
                                            <div className="flex items-center gap-2 mb-3">
                                                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                    Onderbouwing Indicering
                                                </h3>
                                            </div>
                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                    {indication.description}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bejegeningstips */}
                                    {indication.guidanceTips && (
                                        <div className="mb-8">
                                            <div className="flex items-center gap-2 mb-3">
                                                <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                    Bejegeningstips
                                                </h3>
                                            </div>
                                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                    {indication.guidanceTips}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Leerdoelen */}
                                    {indication.learningGoals && indication.learningGoals !== "N.v.t." && (
                                        <div className="mb-8">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                    Leerdoelen
                                                </h3>
                                            </div>
                                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whit espace-pre-wrap">
                                                    {indication.learningGoals}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 px-8 py-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={onClose}
                                            className="px-6 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium border border-gray-300 dark:border-gray-600"
                                        >
                                            Sluiten
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
