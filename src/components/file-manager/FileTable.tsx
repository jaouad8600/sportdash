"use client";

import React, { useState } from 'react';
import type { FileItem } from '@/types/file';
import { File, Download, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface FileTableProps {
    files: FileItem[];
    totalCount: number;
    page: number;
    pageSize: number;
    sortField: string;
    sortOrder: 'asc' | 'desc';
    onPageChange: (newPage: number) => void;
    onSortChange: (field: string) => void;
    onDelete: (ids: string[]) => void;
    onRename: (id: string, newName: string) => void;
    onDownload: (id: string) => void;
}

export const FileTable: React.FC<FileTableProps> = ({
    files,
    totalCount,
    page,
    pageSize,
    sortField,
    sortOrder,
    onPageChange,
    onSortChange,
    onDelete,
    onRename,
    onDownload,
}) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const toggleSelectAll = () => {
        if (selectedIds.size === files.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(files.map((f) => f.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleRenameSubmit = (id: string) => {
        if (editName.trim()) {
            onRename(id, editName);
            setEditingId(null);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Bulk Actions Toolbar */}
            {selectedIds.size > 0 && (
                <div className="bg-blue-50 p-3 flex items-center justify-between border-b border-blue-100">
                    <span className="text-blue-700 font-medium text-sm">
                        {selectedIds.size} selected
                    </span>
                    <button
                        onClick={() => {
                            if (confirm(`Delete ${selectedIds.size} files?`)) {
                                onDelete(Array.from(selectedIds));
                                setSelectedIds(new Set());
                            }
                        }}
                        className="flex items-center gap-2 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Trash2 size={16} />
                        Delete Selected
                    </button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                            <th className="p-4 w-10">
                                <input
                                    type="checkbox"
                                    checked={files.length > 0 && selectedIds.size === files.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th
                                className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => onSortChange('filename')}
                            >
                                <div className="flex items-center gap-1">
                                    Name
                                    {sortField === 'filename' && (
                                        sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                    )}
                                </div>
                            </th>
                            <th
                                className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => onSortChange('size')}
                            >
                                <div className="flex items-center gap-1">
                                    Size
                                    {sortField === 'size' && (
                                        sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                    )}
                                </div>
                            </th>
                            <th
                                className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => onSortChange('dateUploaded')}
                            >
                                <div className="flex items-center gap-1">
                                    Date Uploaded
                                    {sortField === 'dateUploaded' && (
                                        sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                    )}
                                </div>
                            </th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {files.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    No files found. Upload some files to get started.
                                </td>
                            </tr>
                        ) : (
                            files.map((file) => (
                                <tr
                                    key={file.id}
                                    className={`hover:bg-gray-50 transition-colors group ${selectedIds.has(file.id) ? 'bg-blue-50/30' : ''
                                        }`}
                                >
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(file.id)}
                                            onChange={() => toggleSelect(file.id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                                                <File size={20} />
                                            </div>
                                            {editingId === file.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleRenameSubmit(file.id);
                                                            if (e.key === 'Escape') setEditingId(null);
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleRenameSubmit(file.id)}
                                                        className="text-green-600 hover:text-green-700 text-xs font-bold"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="font-medium text-gray-900">{file.filename}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 font-mono">
                                        {formatSize(file.size)}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        {format(new Date(file.dateUploaded), 'MMM d, yyyy HH:mm')}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onDownload(file.id)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Download"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingId(file.id);
                                                    setEditName(file.filename);
                                                }}
                                                className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                title="Rename"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to delete this file?')) {
                                                        onDelete([file.id]);
                                                    }
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <span className="text-sm text-gray-500">
                    Page {page + 1} of {totalPages || 1} ({totalCount} items)
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};
