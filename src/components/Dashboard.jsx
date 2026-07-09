import { useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import KpiSummary from './KpiSummary';
import IncidentRegistry from './IncidentRegistry';
import DispatchPanel from './DispatchPanel';
import HistoryPlayback from './HistoryPlayback';
import GeofenceDrawer from './GeofenceDrawer';
import FleetAssetList from './FleetAssetList';
import FleetMap from './FleetMap';

export default function Dashboard() {
  const { userRole, isConnected, toggleNetworkStream, logout, calculateRoadMatrixETA } = useSocket();

  // Geofence drawing
  const [drawModeActive, setDrawModeActive] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState([]);

  // Dispatch targeting
  const [dispatchTargetMode, setDispatchTargetMode] = useState(false);
  const [dispatchLocation, setDispatchLocation] = useState(null);
  const [dispatchRankings, setDispatchRankings] = useState([]);

  // Historical playback
  const [playbackCoords, setPlaybackCoords] = useState([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPlaybackRoute, setSelectedPlaybackRoute] = useState(null);
  const playbackIntervalRef = useRef(null);

  const trailLimit = 15;

  const handleDispatchClick = async (lat, lng) => {
    const rankings = await calculateRoadMatrixETA(lat, lng);
    setDispatchRankings(rankings);
  };

  const loadRouteForPlayback = (route) => {
    setSelectedPlaybackRoute(route);
    setIsPlaying(false);
    if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    const geojson = JSON.parse(route.geojsonSimplified);
    const points = geojson.coordinates.map(([lng, lat]) => [lat, lng]);
    setPlaybackCoords(points);
    setPlaybackIndex(0);
  };

  const togglePlaybackPlay = () => {
    if (isPlaying) {
      clearInterval(playbackIntervalRef.current);
      setIsPlaying(false);
    } else {
      if (playbackCoords.length === 0) return;
      setIsPlaying(true);
      playbackIntervalRef.current = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= playbackCoords.length - 1) {
            clearInterval(playbackIntervalRef.current);
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 400);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <div className="w-[450px] bg-slate-900 border-r border-slate-800 h-full p-4 flex flex-col overflow-y-auto space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Kigali Freight Control Tower</h1>
            <p className="text-[10px] text-indigo-400 uppercase font-mono tracking-wider">Geospatial Optimization Platform</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {userRole && (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-indigo-950 border border-indigo-700/80 text-indigo-300">
                Role: {userRole}
              </span>
            )}
            <button onClick={logout} className="text-[9px] text-slate-400 hover:text-rose-400 font-mono underline">
              Sign Out
            </button>
          </div>
        </div>

        <button
          onClick={toggleNetworkStream}
          className={`w-full py-2 rounded text-xs font-bold text-white transition-all ${isConnected ? 'bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-500'}`}
        >
          {isConnected ? 'DISCONNECT OPERATIONS ROUTER' : 'ESTABLISH CONNECTIVITY PIPELINE'}
        </button>

        <KpiSummary />
        <IncidentRegistry />

        <DispatchPanel
          dispatchTargetMode={dispatchTargetMode}
          setDispatchTargetMode={setDispatchTargetMode}
          setDrawModeActive={setDrawModeActive}
          dispatchRankings={dispatchRankings}
        />

        <HistoryPlayback
          playbackCoords={playbackCoords}
          playbackIndex={playbackIndex}
          isPlaying={isPlaying}
          selectedPlaybackRoute={selectedPlaybackRoute}
          loadRouteForPlayback={loadRouteForPlayback}
          togglePlaybackPlay={togglePlaybackPlay}
        />

        <GeofenceDrawer
          drawModeActive={drawModeActive}
          setDrawModeActive={setDrawModeActive}
          drawnPoints={drawnPoints}
          setDrawnPoints={setDrawnPoints}
          setDispatchTargetMode={setDispatchTargetMode}
        />

        <FleetAssetList />
      </div>

      <FleetMap
        drawModeActive={drawModeActive}
        drawnPoints={drawnPoints}
        setDrawnPoints={setDrawnPoints}
        dispatchTargetMode={dispatchTargetMode}
        dispatchLocation={dispatchLocation}
        setDispatchLocation={setDispatchLocation}
        onDispatchClick={handleDispatchClick}
        trailLimit={trailLimit}
        playbackCoords={playbackCoords}
        playbackIndex={playbackIndex}
      />
    </div>
  );
}
