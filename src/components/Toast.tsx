"use client";

import React, { useEffect, useState } from 'react';
import { CheckCircle, X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { Toast as ToastType } from '@/types/toast';

interface ToastProps {
    toast: ToastType;
    onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(() => {
            onClose();
        }, 300); // Match animation duration
    };

    // Auto-close before duration ends to trigger exit animation
    useEffect(() => {
        if (toast.duration && toast.duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, toast.duration - 300); // Start exit animation 300ms before removal
            return () => clearTimeout(timer);
        }
    }, [toast.duration]);

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
            case 'info':
                return <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />;
            default:
                return <Info className="w-5 h-5 text-gray-500 flex-shrink-0" />;
        }
    };

    const getBorderColor = () => {
        switch (toast.type) {
            case 'success':
                return 'border-green-500';
            case 'error':
                return 'border-red-500';
            case 'warning':
                return 'border-yellow-500';
            case 'info':
                return 'border-blue-500';
            default:
                return 'border-gray-500';
        }
    };

    return (
        <div
            className={`
        bg-white border-l-4 ${getBorderColor()}
        rounded-lg shadow-lg p-4
        flex items-center gap-3
        max-w-md w-full
        pointer-events-auto
        transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
            role="alert"
        >
            {getIcon()}
            <p className="text-gray-800 text-sm font-medium flex-1">
                {toast.message}
            </p>
            <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                aria-label="Sluiten"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
