import { useSocket } from '../context/SocketContext';

export default function KpiSummary() {
  const { trackedAssets, violations } = useSocket();

  return (
    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-3">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">📈 Operational Performance Real-Time KPIs</h3>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase block">Active Assets</span>
          <span className="text-xl font-bold font-mono text-emerald-400">{Object.keys(trackedAssets).length}</span>
        </div>
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase block">Incidents Logged</span>
          <span className="text-xl font-bold font-mono text-rose-500">{violations.length}</span>
        </div>
      </div>
    </div>
  );
}
