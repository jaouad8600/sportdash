"use client";
import React, { useState } from 'react';
import ReportingForm from './ReportingForm';
import ReportPreview from './ReportPreview';

export interface GroupReport {
    id: string;
    groupName: string;
    youthCount: number;
    glCount: number;
    warmingUp: string;
    sportMoment: string;
    particularities: string;
}

export default function ReportingApp() {
    const [reports, setReports] = useState<GroupReport[]>([]);
    const [isPreview, setIsPreview] = useState(false);

    const addReport = (report: GroupReport) => {
        setReports([...reports, report]);
    };

    const removeReport = (id: string) => {
        setReports(reports.filter(r => r.id !== id));
    };

    const handleFinish = () => {
        if (reports.length > 0) {
            setIsPreview(true);
        }
    };

    const handleBack = () => {
        setIsPreview(false);
    };

    const handleReset = () => {
        setReports([]);
        setIsPreview(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">Dagelijkse Rapportage</h2>

            {!isPreview ? (
                <ReportingForm
                    onAdd={addReport}
                    reports={reports}
                    onRemove={removeReport}
                    onFinish={handleFinish}
                />
            ) : (
                <ReportPreview
                    reports={reports}
                    onBack={handleBack}
                    onReset={handleReset}
                />
            )}
        </div>
    );
}
