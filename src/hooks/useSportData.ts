import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { SportMutation, SportIndication, Group, ChatMessage, File as FileModel } from '@prisma/client';

// --- Generic Types ---

type ApiError = {
    message: string;
};

// --- Sport Mutations ---

export const useSportMutations = () => {
    const queryClient = useQueryClient();

    const query = useQuery<SportMutation[], ApiError>({
        queryKey: ['sportMutations'],
        queryFn: async () => {
            const { data } = await axios.get('/api/sportmutaties');
            return data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (newMutation: Partial<SportMutation>) => {
            const { data } = await axios.post('/api/sportmutaties', newMutation);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sportMutations'] });
            queryClient.invalidateQueries({ queryKey: ['groups'] }); // Groups might show counts
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, ...updates }: { id: string } & Partial<SportMutation>) => {
            const { data } = await axios.put('/api/sportmutaties', { id, ...updates });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sportMutations'] });
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/sportmutaties/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sportMutations'] });
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });

    return { ...query, createMutation, updateMutation, deleteMutation };
};

// --- Sport Indications ---

export const useIndications = (archived = false) => {
    const queryClient = useQueryClient();

    const query = useQuery<SportIndication[], ApiError>({
        queryKey: ['sportIndications', { archived }],
        queryFn: async () => {
            const { data } = await axios.get(`/api/indicaties?archived=${archived}`);
            return data;
        },
    });

    const createIndication = useMutation({
        mutationFn: async (newIndication: Partial<SportIndication>) => {
            const { data } = await axios.post('/api/indicaties', newIndication);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sportIndications'] });
        },
    });

    const updateIndication = useMutation({
        mutationFn: async ({ id, ...updates }: { id: string } & Partial<SportIndication>) => {
            const { data } = await axios.put('/api/indicaties', { id, ...updates });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sportIndications'] });
        },
    });

    const addEvaluation = useMutation({
        mutationFn: async (evaluation: { indicationId: string; notes: string; createdBy: string }) => {
            const { data } = await axios.post('/api/indicaties/evaluations', evaluation);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sportIndications'] });
        },
    });

    const markEvaluationsAsMailed = useMutation({
        mutationFn: async (ids: string[]) => {
            const { data } = await axios.put('/api/indicaties/evaluations', { ids, emailedAt: new Date() });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sportIndications'] });
        },
    });

    const deleteIndication = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/indicaties?id=${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sportIndications'] });
        },
    });

    return { ...query, createIndication, updateIndication, addEvaluation, markEvaluationsAsMailed, deleteIndication };
};

// --- Groups ---

export const useGroups = () => {
    const queryClient = useQueryClient();

    const query = useQuery<Group[], ApiError>({
        queryKey: ['groups'],
        queryFn: async () => {
            const { data } = await axios.get('/api/groups');
            return data;
        },
    });

    return { ...query };
};

// --- Chat ---

export const useChatMessages = (channel: string) => {
    const queryClient = useQueryClient();

    const query = useQuery<ChatMessage[], ApiError>({
        queryKey: ['chatMessages', channel],
        queryFn: async () => {
            const { data } = await axios.get(`/api/chat?channel=${channel}`);
            return data;
        },
        refetchInterval: 5000, // Poll every 5 seconds for now
    });

    const sendMessage = useMutation({
        mutationFn: async (message: { channel: string; content: string; sender: string }) => {
            const { data } = await axios.post('/api/chat', message);
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['chatMessages', variables.channel] });
        },
    });

    return { ...query, sendMessage };
};

// --- Files ---

export const useFiles = () => {
    const queryClient = useQueryClient();

    const query = useQuery<FileModel[], ApiError>({
        queryKey: ['files'],
        queryFn: async () => {
            const { data } = await axios.get('/api/files');
            return data;
        },
    });

    const uploadFile = useMutation({
        mutationFn: async (formData: FormData) => {
            const { data } = await axios.post('/api/files', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },
    });

    const deleteFile = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/files/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },
    });

    const renameFile = useMutation({
        mutationFn: async ({ id, name }: { id: string; name: string }) => {
            const { data } = await axios.put(`/api/files/${id}`, { name });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },
    });

    return { ...query, uploadFile, deleteFile, renameFile };
};

// --- Phone Numbers ---

export const usePhoneNumbers = () => {
    const queryClient = useQueryClient();

    const query = useQuery<any[], ApiError>({
        queryKey: ['phoneNumbers'],
        queryFn: async () => {
            const { data } = await axios.get('/api/telefoonnummers');
            return data;
        },
    });

    const createPhoneNumber = useMutation({
        mutationFn: async (newNumber: any) => {
            const { data } = await axios.post('/api/telefoonnummers', newNumber);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['phoneNumbers'] });
        },
    });

    const updatePhoneNumber = useMutation({
        mutationFn: async (updatedNumber: any) => {
            const { data } = await axios.put('/api/telefoonnummers', updatedNumber);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['phoneNumbers'] });
        },
    });

    const deletePhoneNumber = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/telefoonnummers?id=${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['phoneNumbers'] });
        },
    });

    return { ...query, createPhoneNumber, updatePhoneNumber, deletePhoneNumber };
};
