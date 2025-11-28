"use client";

import React from 'react';
import { Upload } from 'lucide-react';

interface UploadAreaProps {
    onFilesSelected: (files: File[]) => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onFilesSelected }) => {
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            onFilesSelected(files);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group"
            onClick={() => document.getElementById('fileInput')?.click()}
        >
            <input
                type="file"
                id="fileInput"
                multiple
                className="hidden"
                onChange={handleFileInput}
            />
            <div className="flex flex-col items-center gap-4">
                <div className="bg-blue-100 p-4 rounded-full text-blue-600 group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-700">
                        Drag & Drop files here
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        or click to browse from your computer
                    </p>
                </div>
            </div>
        </div>
    );
};
