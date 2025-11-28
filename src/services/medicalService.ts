import { prisma } from "@/lib/prisma";
import { MutationReasonType, IndicationType } from "@prisma/client";

// --- Sport Mutations ---

export async function createMutation(data: {
    youthId: string;
    groupId: string;
    reason: string;
    reasonType: MutationReasonType;
    startDate: Date;
    endDate?: Date;
    createdBy: string;
}) {
    return await prisma.sportMutation.create({
        data: {
            ...data,
            isActive: true,
        },
    });
}

export async function updateMutation(id: string, data: {
    endDate?: Date;
    isActive?: boolean;
}) {
    return await prisma.sportMutation.update({
        where: { id },
        data,
    });
}

export async function getActiveMutations(groupId?: string, date?: Date) {
    const targetDate = date || new Date();
    return await prisma.sportMutation.findMany({
        where: {
            ...(groupId && { groupId }),
            startDate: { lte: targetDate },
            OR: [
                { endDate: null },
                { endDate: { gte: targetDate } }
            ]
        },
        include: {
            youth: true,
            group: true,
            evaluations: {
                orderBy: { createdAt: 'desc' }
            }
        },
        orderBy: { startDate: "desc" },
    });
}

// --- Sport Indications ---

export async function createIndication(data: {
    youthId: string;
    groupId: string;
    description: string;
    type: IndicationType;
    createdBy: string;
    validFrom: Date;
    validUntil?: Date;

    // New medical service fields
    leefgroep?: string;
    responsiblePersons?: string;
    issuedBy?: string;
    feedbackTo?: string;
    canCombineWithGroup?: boolean;
    guidanceTips?: string;
    learningGoals?: string;
}) {
    return await prisma.sportIndication.create({
        data: {
            youthId: data.youthId,
            groupId: data.groupId,
            description: data.description,
            type: data.type,
            validFrom: data.validFrom,
            validUntil: data.validUntil,
            issuedBy: data.issuedBy || data.createdBy,
            isActive: true,

            // New medical service fields
            leefgroep: data.leefgroep,
            responsiblePersons: data.responsiblePersons,
            feedbackTo: data.feedbackTo,
            canCombineWithGroup: data.canCombineWithGroup ?? true,
            guidanceTips: data.guidanceTips,
            learningGoals: data.learningGoals,
        },
    });
}

export async function updateIndication(id: string, data: {
    validUntil?: Date;
    isActive?: boolean;
}) {
    return await prisma.sportIndication.update({
        where: { id },
        data,
    });
}

export async function getActiveIndications(groupId?: string, date?: Date) {
    const targetDate = date || new Date();
    return await prisma.sportIndication.findMany({
        where: {
            ...(groupId && { groupId }),
            validFrom: { lte: targetDate },
            OR: [
                { validUntil: null },
                { validUntil: { gte: targetDate } }
            ]
        },
        include: {
            youth: true,
            group: true,
            evaluations: {
                orderBy: { createdAt: 'desc' }
            }
        },
        orderBy: { validFrom: "desc" },
    });
}
