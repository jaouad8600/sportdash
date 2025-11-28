import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const headers = { 'cache-control': 'no-store', 'content-type': 'application/json' };

function normKleur(v?: string) {
  const x = String(v || '').toLowerCase();
  if (['rood', 'red'].includes(x)) return 'rood';
  if (['oranje', 'orange'].includes(x)) return 'oranje';
  if (['geel', 'yellow'].includes(x)) return 'geel';
  if (['groen', 'green'].includes(x)) return 'groen';
  return undefined;
}

export async function GET() {
  try {
    // Fetch all groups from database
    const groups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
        color: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Map to expected format
    const items = groups.map(g => ({
      id: g.id,
      naam: g.name,
      kleur: normKleur(g.color || undefined)
    }));

    return new NextResponse(JSON.stringify(items), {
      headers: { ...headers, 'x-total-count': String(items.length) }
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return new NextResponse(JSON.stringify([]), {
      status: 500,
      headers: { ...headers, 'x-total-count': '0' }
    });
  }
}
