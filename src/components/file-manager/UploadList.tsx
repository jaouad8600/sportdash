"use client";

import React from 'react';
import type { UploadStatus } from '@/types/file';
import { FileIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface UploadListProps {
    uploads: UploadStatus[];
}

export const UploadList: React.FC<UploadListProps> = ({ uploads }) => {
    if (uploads.length === 0) return null;

    return (
        <div className="space-y-3">
            <h3 className="font-semibold text-gray-700">Active Uploads</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-sm overflow-hidden">
                {uploads.map((upload) => (
                    <div key={upload.id} className="p-4 flex items-center gap-4">
                        <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                            <FileIcon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                    {upload.file.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {upload.status === 'ERROR' ? 'Failed' : `${upload.progress}%`}
                                </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${upload.status === 'ERROR'
                                            ? 'bg-red-500'
                                            : upload.status === 'COMPLETED'
                                                ? 'bg-green-500'
                                                : 'bg-blue-500'
                                        }`}
                                    style={{ width: `${upload.progress}%` }}
                                />
                            </div>
                        </div>
                        <div className="text-gray-400">
                            {upload.status === 'UPLOADING' && <Loader2 size={18} className="animate-spin text-blue-500" />}
                            {upload.status === 'COMPLETED' && <CheckCircle size={18} className="text-green-500" />}
                            {upload.status === 'ERROR' && <XCircle size={18} className="text-red-500" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
