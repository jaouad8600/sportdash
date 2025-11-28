"use client";

import { useToastContext } from '@/contexts/ToastContext';

/**
 * Hook voor eenvoudige toegang tot toast notifications
 * 
 * @example
 * const toast = useToast();
 * toast.success("Mutatie succesvol toegevoegd!");
 * toast.error("Er is een fout opgetreden");
 * toast.warning("Let op: ...");
 * toast.info("Informatie: ...");
 */
export function useToast() {
    const context = useToastContext();
    return {
        success: context.success,
        error: context.error,
        warning: context.warning,
        info: context.info,
    };
}
