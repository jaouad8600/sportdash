import { prisma } from "@/lib/prisma";

export interface GroupPriority {
    groupId: string;
    groupName: string;
    groupColor: string;
    regularMoments: number;
    extraMoments: number;
    missedMoments: number;
    totalScore: number;
    priority: number;
    explanation: string;
}

/**
 * Berekent de prioriteit voor elke groep op basis van sportmomenten
 * Score = reguliere momenten + extra momenten - gemiste momenten
 * Lagere score = hogere prioriteit
 */
export async function calculateGroupPriorities(startDate?: Date, endDate?: Date): Promise<GroupPriority[]> {
    const start = startDate || new Date(new Date().getFullYear(), 0, 1); // Begin van dit jaar
    const end = endDate || new Date();

    // Haal alle actieve groepen op
    const groups = await prisma.group.findMany({
        where: {
            isActive: true,
            status: 'ACTIVE'
        },
        include: {
            reports: {
                where: {
                    date: {
                        gte: start,
                        lte: end
                    },
                    type: 'SESSION', // Alleen reguliere sessies
                    archived: false
                },
                select: {
                    id: true,
                    date: true
                }
            },
            extraSportMoments: {
                where: {
                    date: {
                        gte: start,
                        lte: end
                    },
                    // Fetch both COMPLETED and REFUSED to count as "offered/consumed"
                    status: {
                        in: ['COMPLETED', 'REFUSED']
                    }
                },
                select: {
                    id: true,
                    date: true,
                    status: true
                }
            }
        }
    });

    // Bereken scores voor elke groep
    const priorities: GroupPriority[] = groups.map(group => {
        const regularMoments = group.reports.length;
        // Count both COMPLETED and REFUSED as "moments" that affect priority
        const extraMoments = group.extraSportMoments.length;
        const missedMoments = 0; // TODO: Implementeer logica voor gemiste momenten indien nodig

        const totalScore = regularMoments + extraMoments - missedMoments;

        let explanation = `${regularMoments} reguliere moment${regularMoments !== 1 ? 'en' : ''}`;
        if (extraMoments > 0) {
            explanation += `, ${extraMoments} extra moment${extraMoments !== 1 ? 'en' : ''}`;
        }
        if (missedMoments > 0) {
            explanation += `, ${missedMoments} gemist`;
        }

        return {
            groupId: group.id,
            groupName: group.name,
            groupColor: group.color || 'GROEN',
            regularMoments,
            extraMoments,
            missedMoments,
            totalScore,
            priority: 0, // Wordt hieronder ingevuld
            explanation
        };
    });

    // Sorteer op score (laag naar hoog), bij gelijke score alfabetisch op naam
    priorities.sort((a, b) => {
        if (a.totalScore === b.totalScore) {
            return a.groupName.localeCompare(b.groupName);
        }
        return a.totalScore - b.totalScore;
    });
    priorities.forEach((group, index) => {
        group.priority = index + 1;
    });

    return priorities;
}

/**
 * Registreer een extra sportmoment voor een groep
 */
export async function registerExtraSportMoment(groupId: string, date: Date = new Date()) {
    return await prisma.extraSportMoment.create({
        data: {
            groupId,
            date,
            status: 'COMPLETED'
        }
    });
}

/**
 * Haal de top N groepen op die prioriteit hebben voor een extra sportmoment
 */
export async function getTopPriorityGroups(limit: number = 5): Promise<GroupPriority[]> {
    const priorities = await calculateGroupPriorities();
    return priorities.slice(0, limit);
}
