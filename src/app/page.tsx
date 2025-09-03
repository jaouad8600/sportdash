import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home(){
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="p-4 space-y-2">
        <h1 className="text-xl font-bold">Welkom</h1>
        <Link href="/login" className="underline">Inloggen</Link>
      </div>
    );
  }
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate()+1);
  const sessions = await prisma.session.findMany({
    where: { date: { gte: today, lt: tomorrow } },
    include: { group: true },
  });
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Sessies vandaag</h1>
      <ul className="space-y-2">
        {sessions.map(s => (
          <li key={s.id} className="border p-2">
            <div className="font-semibold">{s.group.name} - {new Date(s.date).toLocaleTimeString()}</div>
            <div>Headcount: {s.headcount}</div>
          </li>
        ))}
      </ul>
      <div className="space-x-4">
        <Link href="/sessions/new" className="underline">Nieuwe sessie</Link>
        <Link href="/admin" className="underline">Admin</Link>
      </div>
    </div>
  );
}
