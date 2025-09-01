export default function Admin(){
  return (
    <div className="p-6">
      <h1 className="text-3xl font-extrabold" style={{letterSpacing:1}}>✅ ADMIN DASHBOARD LIVE</h1>
      <p className="mt-2 text-sm opacity-75">Als je dit ziet, zit je op /admin van dezelfde host/poort als /health.</p>
      <p className="mt-4"><a href="/health" className="underline">Health</a> • <a href="/" className="underline">Home</a></p>
    </div>
  );
}
