import { useState } from 'react';
import { useSocket } from '../context/SocketContext';

export default function GeofenceDrawer({ drawModeActive, setDrawModeActive, drawnPoints, setDrawnPoints, setDispatchTargetMode }) {
  const { userRole, savedGeofences, saveGeofence, deleteGeofence } = useSocket();
  const [newFenceName, setNewFenceName] = useState('');
  const [newFenceSpeedLimit, setNewFenceSpeedLimit] = useState('60');

  const handleSave = async () => {
    if (!newFenceName || drawnPoints.length < 3) return;
    await saveGeofence({ name: newFenceName, points: drawnPoints, speedLimitKmh: newFenceSpeedLimit });
    setNewFenceName('');
    setNewFenceSpeedLimit('60');
    setDrawnPoints([]);
    setDrawModeActive(false);
  };

  return (
    <>
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
        {drawModeActive ? (
          <div className="space-y-2">
            <input
              type="text" placeholder="Polygon Identity Name" value={newFenceName}
              onChange={(e) => setNewFenceName(e.target.value)}
              className="w-full p-1.5 bg-slate-900 border border-slate-800 text-slate-100 rounded text-xs outline-none"
            />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase whitespace-nowrap">Speed Max:</span>
              <input
                type="number" value={newFenceSpeedLimit}
                onChange={(e) => setNewFenceSpeedLimit(e.target.value)}
                className="w-full p-1 bg-slate-900 border border-slate-800 text-amber-400 rounded text-xs outline-none font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono">KM/H</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex-1 py-1 bg-emerald-600 text-white font-bold rounded text-[10px] uppercase">Commit Bounds</button>
              <button onClick={() => { setDrawModeActive(false); setDrawnPoints([]); }} className="py-1 px-2.5 bg-slate-800 text-slate-400 font-bold rounded text-[10px] uppercase">Clear</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setDrawModeActive(true); setDispatchTargetMode(false); }}
            className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-slate-800 rounded text-[11px] uppercase tracking-wide"
          >
            ➕ Map Draw PostGIS Geofence Boundaries
          </button>
        )}
      </div>
      {savedGeofences.length > 0 && (
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">🛡️ Active Managed Geofences ({savedGeofences.length})</h3>
          <div className="max-h-[110px] overflow-y-auto space-y-1 pr-1">
            {savedGeofences.map((fence) => (
              <div key={fence.id} className="flex justify-between items-center bg-slate-900/50 px-2 py-1.5 rounded border border-slate-800/40">
                <div className="flex flex-col">
                  <span className="font-mono text-indigo-300 font-bold text-[11px]">{fence.name}</span>
                  <span className="text-[9px] text-amber-500 font-mono">Limit: {fence.speedLimitKmh} km/h</span>
                </div>
                {(userRole === 'admin' || userRole === 'dispatcher') && (
                  <button onClick={() => deleteGeofence(fence.id)} className="text-[9px] bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900 text-rose-400 py-0.5 px-2.5 rounded font-bold uppercase">Delete</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
