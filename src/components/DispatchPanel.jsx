
export default function DispatchPanel({ dispatchTargetMode, setDispatchTargetMode, setDrawModeActive, dispatchRankings }) {
  return (
    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🎯 OSRM Network Route Matrix</h3>
      <button
        onClick={() => { setDispatchTargetMode(!dispatchTargetMode); setDrawModeActive(false); }}
        className={`w-full py-1.5 rounded font-mono text-[11px] font-bold ${dispatchTargetMode ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
      >
        {dispatchTargetMode ? '🛑 SELECT TARGET HUB MODE ACTIVE' : '⚡ CHOOSE MAP TARGET DISPATCH POINT'}
      </button>
      {dispatchRankings.length > 0 && (
        <div className="space-y-1 max-h-[110px] overflow-y-auto pt-1">
          {dispatchRankings.slice(0, 3).map((rank, i) => (
            <div key={i} className="flex justify-between items-center bg-slate-900/40 px-2 py-1.5 rounded text-[11px] border border-slate-800/40">
              <span className="font-bold text-slate-200 truncate max-w-[130px]">{rank.driverName}</span>
              <span className="font-mono text-emerald-400 font-bold">{rank.distanceKm} km | {rank.etaMinutes} mins</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
