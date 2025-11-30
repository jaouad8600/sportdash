"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: "danger" | "warning" | "info";
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = "Bevestigen",
    cancelLabel = "Annuleren",
    onConfirm,
    onCancel,
    variant = "warning"
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const colors = {
        danger: {
            icon: "text-red-600",
            bg: "bg-red-100 dark:bg-red-900/30",
            button: "bg-red-600 hover:bg-red-700",
            border: "border-red-200 dark:border-red-800"
        },
        warning: {
            icon: "text-orange-600",
            bg: "bg-orange-100 dark:bg-orange-900/30",
            button: "bg-orange-600 hover:bg-orange-700",
            border: "border-orange-200 dark:border-orange-800"
        },
        info: {
            icon: "text-blue-600",
            bg: "bg-blue-100 dark:bg-blue-900/30",
            button: "bg-blue-600 hover:bg-blue-700",
            border: "border-blue-200 dark:border-blue-800"
        }
    };

    const style = colors[variant];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700"
                        >
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0`}>
                                        <AlertTriangle className={`w-6 h-6 ${style.icon}`} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                            {title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                            {message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={onCancel}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`px-6 py-2 text-white font-medium rounded-lg shadow-lg transition-all transform hover:scale-105 ${style.button}`}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
