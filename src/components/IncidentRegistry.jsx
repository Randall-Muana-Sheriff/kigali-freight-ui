import { useSocket } from '../context/SocketContext';

export default function IncidentRegistry() {
  const { violations } = useSocket();

  return (
    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2">
      <h3 className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
        <span className="animate-ping h-1.5 w-1.5 rounded-full bg-rose-500 inline-block mr-1"></span>
        Real-Time Boundary & Speed Incident Registry
      </h3>
      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
        {violations.length === 0 ? (
          <div className="text-[11px] text-slate-500 italic p-2 text-center bg-slate-900/30 rounded border border-slate-800/30">
            No active security or speed breaches detected.
          </div>
        ) : (
          violations.map((violation) => (
            <div key={violation.id} className={`p-2 border rounded-lg text-[11px] flex flex-col space-y-0.5 ${violation.type === 'SPEED_VIOLATION' ? 'border-amber-950/60 bg-amber-950/20' : 'border-rose-950/60 bg-rose-950/20'}`}>
              <div className="flex justify-between font-bold text-slate-200">
                <span>{violation.type === 'SPEED_VIOLATION' ? '⚠️' : '🚨'} {violation.driverName}</span>
                <span className="font-mono text-[9px] text-slate-500">{new Date(violation.enteredAt).toLocaleTimeString()}</span>
              </div>
              <div className="text-slate-300 font-mono text-[10px]">{violation.description}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
