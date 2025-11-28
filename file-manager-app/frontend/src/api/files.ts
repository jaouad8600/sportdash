import axios from 'axios';
import { FileListResponse } from '../types/file';

const API_URL = 'http://localhost:4000';

export const fetchFiles = async (
    page: number = 0,
    pageSize: number = 10,
    sortField: string = 'dateUploaded',
    sortOrder: 'asc' | 'desc' = 'desc'
): Promise<FileListResponse> => {
    const response = await axios.get(`${API_URL}/files`, {
        params: { page, pageSize, sortField, sortOrder }
    });
    return response.data;
};

export const uploadFile = async (
    file: File,
    onProgress: (progress: number) => void
): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);

    await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            onProgress(percentCompleted);
        }
    });
};

export const deleteFiles = async (fileIds: string[]): Promise<void> => {
    await axios.delete(`${API_URL}/files`, { data: { fileIds } });
};

export const renameFile = async (id: string, newName: string): Promise<void> => {
    await axios.patch(`${API_URL}/files/${id}`, { newName });
};

export const getDownloadUrl = (id: string): string => {
    return `${API_URL}/files/${id}`;
};
