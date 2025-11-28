"use client";

import React from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

export default function AlertsSection() {
    // Mock data
    const alerts = [
        { type: 'warning', message: "Zijl: 2 jongeren in beperking – sportveld niet beschikbaar" },
        { type: 'info', message: "Lier: sportmoment 13:00 verplaatst naar 14:00" },
        { type: 'error', message: "3 ballen kapot – voorraad BAL laag" },
        { type: 'error', message: "Loopband fitness EB defect – niet inplannen" },
    ];

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle size={18} className="text-orange-500" />;
            case 'error': return <AlertCircle size={18} className="text-red-500" />;
            default: return <Info size={18} className="text-blue-500" />;
        }
    };

    const getStyles = (type: string) => {
        switch (type) {
            case 'warning': return 'bg-orange-50 border-orange-100 text-orange-800';
            case 'error': return 'bg-red-50 border-red-100 text-red-800';
            default: return 'bg-blue-50 border-blue-100 text-blue-800';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-600" />
                Belangrijke Meldingen
            </h3>
            <div className="space-y-3">
                {alerts.map((alert, index) => (
                    <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border ${getStyles(alert.type)}`}>
                        <div className="mt-0.5">{getIcon(alert.type)}</div>
                        <span className="text-sm font-medium">{alert.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
