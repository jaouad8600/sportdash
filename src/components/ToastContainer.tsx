"use client";

import React from 'react';
import { useToastContext } from '@/contexts/ToastContext';
import Toast from '@/components/Toast';

export default function ToastContainer() {
    const { toasts, removeToast } = useToastContext();

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div
            className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
            aria-live="polite"
            aria-atomic="true"
        >
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    toast={toast}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}
