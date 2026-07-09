import { useSocket } from '../context/SocketContext';

export default function FleetAssetList() {
  const { trackedAssets, activeBreachedDrivers, saveDriverRouteHistory } = useSocket();

  return (
    <div className="flex-1 min-h-[140px] overflow-y-auto space-y-1.5">
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">📡 Running Field Transmissions ({Object.keys(trackedAssets).length})</h3>
      {Object.values(trackedAssets).map((asset) => {
        const violationRecord = activeBreachedDrivers[asset.driverName];
        const hasViolation = !!violationRecord;
        return (
          <div
            key={asset.driverName}
            className={`p-2 border rounded-xl flex items-center justify-between text-xs transition-colors ${hasViolation ?
              (violationRecord.type === 'SPEED_VIOLATION' ? 'border-amber-900 bg-amber-950/20 text-amber-200' : 'border-rose-900 bg-rose-950/20 text-rose-200') : 'border-slate-800/60 bg-slate-900/30'}`}
          >
            <div className="flex flex-col truncate max-w-[280px]">
              <span className="font-medium">
                {hasViolation ? (violationRecord.type === 'SPEED_VIOLATION' ? '⚠️ ' : '🔺 ') : ''}{asset.driverName}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Live: {asset.velocityKmh} km/h</span>
            </div>
            <button onClick={() => saveDriverRouteHistory(asset.driverName)} className="text-[9px] bg-indigo-950 border border-indigo-800/80 hover:bg-indigo-900 text-indigo-300 py-0.5 px-2">Snap & Save</button>
          </div>
        );
      })}
    </div>
  );
}
