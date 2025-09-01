import Link from "next/link";
export default function Home(){
  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">Homepage</h1>
      <p className="space-x-3">
        <Link href="/admin" className="underline">Naar Dashboard</Link>
        <Link href="/health" className="underline">Health</Link>
      </p>
    </div>
  );
}
