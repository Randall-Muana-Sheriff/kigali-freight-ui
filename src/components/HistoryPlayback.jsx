// src/components/HistoryPlayback.jsx
export default function HistoryPlayback({
  routes = [],
  playbackCoords = [],
  playbackIndex = 0,
  isPlaying = false,
  selectedPlaybackRoute,
  loadRouteForPlayback,
  togglePlaybackPlay
}) {
  return (
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-slate-100 space-y-3 font-mono text-[11px]">
          <div className="flex justify-between items-center">
              <span className="text-white font-bold">Historical Playback Engine ("Time Machine")</span>
          </div>

          <select
              onChange={(e) => {
                  const routeId = e.target.value;
                  if (!routeId) return;
                  const found = routes.find(r => String(r.id) === String(routeId));
                  if (found) loadRouteForPlayback(found);
              }}
              value={selectedPlaybackRoute?.id || ''}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
          >
              <option value="">-- Load Archived Database Journeys --</option>
              {routes.map((rt) => {
                  const vId = rt.vehicleId || rt.vehicle_id || rt.id;
                  const dName = rt.driverName || rt.driver_name || 'Operator';
                  const dist = rt.aggregateDistanceKm || rt.aggregate_distance_km || rt.distanceKm || 0;
                  return (
                      <option key={rt.id} value={rt.id}>
                          Vehicle #{vId} - {dName} ({dist} km)
                      </option>
                  );
              })}
          </select>

          {selectedPlaybackRoute && (
              <div className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
                  <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Progress: {playbackIndex} / {playbackCoords.length > 0 ? playbackCoords.length - 1 : 0} pts</span>
                      <span className="text-emerald-400 font-bold">{isPlaying ? 'PLAYING...' : 'PAUSED'}</span>
                  </div>
                  <button
                      onClick={togglePlaybackPlay}
                      className={`w-full py-1.5 rounded text-xs font-bold text-white transition-all ${isPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                  >
                      {isPlaying ? 'PAUSE PLAYBACK' : 'START PLAYBACK'}
                  </button>
              </div>
          )}
      </div>
  );
}