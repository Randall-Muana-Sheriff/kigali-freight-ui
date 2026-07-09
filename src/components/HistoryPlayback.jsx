import { useSocket } from '../context/SocketContext';

export default function HistoryPlayback({
  playbackCoords,
  playbackIndex,
  isPlaying,
  selectedPlaybackRoute,
  loadRouteForPlayback,
  togglePlaybackPlay,
}) {
  const { savedRoutesList } = useSocket();

  return (
    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🕰️ Historical Playback Engine ("Time Machine")</h3>
      <select
        value={selectedPlaybackRoute?.id || ''}
        onChange={(e) => {
          const route = savedRoutesList.find((r) => r.id === parseInt(e.target.value));
          if (route) loadRouteForPlayback(route);
        }}
        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-300"
      >
        <option value="">-- Load Archived Database Journeys --</option>
        {savedRoutesList.map((r) => (
          <option key={r.id} value={r.id}>{r.driverName} (Trip #{r.id})</option>
        ))}
      </select>

      {selectedPlaybackRoute && playbackCoords.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlaybackPlay}
              className={`flex-1 py-1.5 rounded font-mono text-[11px] font-bold ${isPlaying ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}
            >
              {isPlaying ? '⏸ PAUSE PLAYBACK' : '▶ PLAY ROUTE'}
            </button>
            <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
              {playbackIndex + 1} / {playbackCoords.length}
            </span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${((playbackIndex + 1) / playbackCoords.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
