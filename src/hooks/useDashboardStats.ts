
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { SportMutation, SportIndication, Restriction, Group } from '@prisma/client';

export interface DashboardStats {
    mutations: {
        count: number;
        active: SportMutation[];
    };
    indications: {
        count: number;
        active: SportIndication[];
    };
    restrictions: {
        count: number;
        active: Restriction[];
    };
    groups: (Group & {
        activeMutations: number;
        activeIndications: number;
        activeRestrictions: number;
    })[];
    restorativeTalks: any[]; // Using any for now to avoid extensive type imports, ideally RestorativeTalk[]
    extraSportPriority: any[];
}

export const useDashboardStats = () => {
    return useQuery<DashboardStats>({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            // In a real app, we might have a dedicated endpoint for this to reduce round trips.
            // For now, we'll fetch in parallel and aggregate.
            const [mutationsRes, indicationsRes, groupsRes, talksRes, extraSportRes] = await Promise.all([
                axios.get('/api/sportmutaties'),
                axios.get('/api/indicaties'),
                axios.get('/api/groups'),
                axios.get('/api/restorative-talks?status=PENDING'),
                axios.get('/api/extra-sportmomenten/priority'), // Assuming this endpoint exists or we create it
            ]);

            const mutations = mutationsRes.data.filter((m: SportMutation) => m.isActive);
            const indications = indicationsRes.data.filter((i: SportIndication) => i.isActive);
            // Assuming restrictions API exists or is part of another endpoint. 
            // If not, we'll mock it or add it later. For now, empty.
            const restrictions: Restriction[] = [];

            const groups = groupsRes.data.map((group: Group) => ({
                ...group,
                activeMutations: mutations.filter((m: SportMutation) => m.groupId === group.id).length,
                activeIndications: indications.filter((i: SportIndication) => i.groupId === group.id).length,
                activeRestrictions: 0, // Placeholder
            }));

            return {
                mutations: {
                    count: mutations.length,
                    active: mutations,
                },
                indications: {
                    count: indications.length,
                    active: indications,
                },
                restrictions: {
                    count: restrictions.length,
                    active: restrictions,
                },
                groups,
                restorativeTalks: talksRes.data,
                extraSportPriority: extraSportRes.data || [],
            };
        },
        refetchInterval: 15000, // Poll every 15 seconds
        staleTime: 10000, // Consider data fresh for 10 seconds
    });
};
