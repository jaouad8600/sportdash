import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFiles, uploadFile, deleteFiles, renameFile } from '../api/files';
import { FileListResponse } from '../types/file';

export const useFilesQuery = (
    page: number,
    pageSize: number,
    sortField: string,
    sortOrder: 'asc' | 'desc'
) => {
    return useQuery<FileListResponse>({
        queryKey: ['files', page, pageSize, sortField, sortOrder],
        queryFn: () => fetchFiles(page, pageSize, sortField, sortOrder),
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
    });
};

export const useUploadMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ file, onProgress }: { file: File; onProgress: (p: number) => void }) =>
            uploadFile(file, onProgress),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },
    });
};

export const useDeleteMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteFiles,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },
    });
};

export const useRenameMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, newName }: { id: string; newName: string }) => renameFile(id, newName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },
    });
};
