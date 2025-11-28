export interface FileItem {
    id: string;
    filename: string;
    size: number;
    dateUploaded: string;
}

export interface UploadStatus {
    id: string;
    file: File;
    progress: number;
    status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'ERROR';
    error?: string;
}

export interface FileListResponse {
    totalFilesCount: number;
    files: FileItem[];
}
