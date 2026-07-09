// src/components/Dashboard.jsx
import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useRoutes } from '../utils/useRoutes';
import KpiSummary from './KpiSummary';
import IncidentRegistry from './IncidentRegistry';
import DispatchPanel from './DispatchPanel';
import HistoryPlayback from './HistoryPlayback';
import GeofenceDrawer from './GeofenceDrawer';
import FleetAssetList from './FleetAssetList';
import FleetMap from './FleetMap';
import RouteOptimizerPanel from './RouteOptimizerPanel';
import AdminControlPanel from './AdminControlPanel';
import AdminUserManagement from './AdminUserManagement';
import SystemAuditLogs from './SystemAuditLogs';
import VehicleAssignmentPanel from './VehicleAssignmentPanel';
import UserProfile from './UserProfile';

export default function Dashboard() {
    const { jwtToken, userRole, isConnected, toggleNetworkStream, logout, calculateRoadMatrixETA, socket } = useSocket();
    const { routes: savedRoutes, loading: routesLoading, refreshRoutes, commitRoute } = useRoutes(jwtToken);

    // Geofence drawing
    const [drawModeActive, setDrawModeActive] = useState(false);
    const [drawnPoints, setDrawnPoints] = useState([]);

    // Dispatch targeting
    const [dispatchTargetMode, setDispatchTargetMode] = useState(false);
    const [dispatchLocation, setDispatchLocation] = useState(null);
    const [dispatchRankings, setDispatchRankings] = useState([]);

    // New Stop Map Picker
    const [stopTargetMode, setStopTargetMode] = useState(false);
    const [newStopCoords, setNewStopCoords] = useState(null);

    // Historical playback
    const [playbackCoords, setPlaybackCoords] = useState([]);
    const [playbackIndex, setPlaybackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedPlaybackRoute, setSelectedPlaybackRoute] = useState(null);
    const playbackIntervalRef = useRef(null);
    const playbackCoordsRef = useRef([]);

    // Keep ref synchronized with state coordinates
    useEffect(() => {
        playbackCoordsRef.current = playbackCoords;
    }, [playbackCoords]);

    // Declarative interval effect for smooth playback animation
    useEffect(() => {
        if (!isPlaying) {
            if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current);
                playbackIntervalRef.current = null;
            }
            return;
        }

        playbackIntervalRef.current = setInterval(() => {
            setPlaybackIndex((prev) => {
                if (prev >= playbackCoordsRef.current.length - 1) {
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, 400);

        return () => {
            if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current);
                playbackIntervalRef.current = null;
            }
        };
    }, [isPlaying]);

    // Multi-stop VRP optimization paths
    const [optimizedRoutes, setOptimizedRoutes] = useState([]);
    const trailLimit = 15;

    // Real-time synchronization event listener via Socket.io
    useEffect(() => {
        if (!socket) return;
        const handleRouteUpdate = () => {
            refreshRoutes();
        };
        socket.on('routeUpdated', handleRouteUpdate);
        socket.on('stopUpdated', handleRouteUpdate);
        return () => {
            socket.off('routeUpdated', handleRouteUpdate);
            socket.off('stopUpdated', handleRouteUpdate);
        };
    }, [socket, refreshRoutes]);

    const handleDispatchClick = async (lat, lng) => {
        const rankings = await calculateRoadMatrixETA(lat, lng);
        setDispatchRankings(rankings);
    };

    const loadRouteForPlayback = (route) => {
        setSelectedPlaybackRoute(route);
        setIsPlaying(false);
        
        try {
            const rawGeo = route.geojsonSimplified || route.geojson_simplified || route.geojson;
            const geojson = typeof rawGeo === 'string' ? JSON.parse(rawGeo) : rawGeo;
            if (geojson && geojson.coordinates) {
                const points = geojson.coordinates.map(([lng, lat]) => [lat, lng]);
                setPlaybackCoords(points);
                playbackCoordsRef.current = points;
                setPlaybackIndex(0);
            } else {
                setPlaybackCoords([]);
                playbackCoordsRef.current = [];
                setPlaybackIndex(0);
            }
        } catch (err) {
            console.error('Failed to parse route geojson:', err);
            setPlaybackCoords([]);
            playbackCoordsRef.current = [];
            setPlaybackIndex(0);
        }
    };

    const togglePlaybackPlay = () => {
        if (isPlaying) {
            setIsPlaying(false);
        } else {
            if (playbackCoordsRef.current.length === 0) return;
            // If at the end of the route, reset index to beginning before playing
            setPlaybackIndex((prev) => (prev >= playbackCoordsRef.current.length - 1 ? 0 : prev));
            setIsPlaying(true);
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
                <UserProfile />
                <KpiSummary />
                <IncidentRegistry />
                <DispatchPanel
                    dispatchTargetMode={dispatchTargetMode}
                    setDispatchTargetMode={setDispatchTargetMode}
                    setDrawModeActive={setDrawModeActive}
                    dispatchRankings={dispatchRankings}
                />
                {/* Multi-Stop VRP Optimizer Control Panel */}
                <RouteOptimizerPanel
                    onRouteOptimized={setOptimizedRoutes}
                    stopTargetMode={stopTargetMode}
                    setStopTargetMode={setStopTargetMode}
                    newStopCoords={newStopCoords}
                />
                {/* Saved Database Routes Audit List */}
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-slate-100 space-y-2 font-mono text-[11px]">
                    <div className="text-white font-bold flex justify-between items-center">
                        <span>Committed Routes ({savedRoutes.length})</span>
                        {routesLoading && <span className="text-[9px] text-indigo-400 animate-pulse">Syncing...</span>}
                    </div>
                    <div className="max-h-24 overflow-y-auto space-y-1">
                        {savedRoutes.map((rt) => (
                            <div key={rt.id} className="bg-slate-950/60 p-1.5 rounded border border-slate-800 flex justify-between items-center text-slate-300">
                                <span className="truncate max-w-[120px]">
                                    Vehicle #{rt.vehicleId || rt.vehicle_id || rt.id} - {rt.driverName || rt.driver_name || 'Driver'}
                                </span>
                                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-800/60">
                                    {rt.aggregateDistanceKm || rt.aggregate_distance_km || rt.distanceKm || 0} km
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <HistoryPlayback
                    routes={savedRoutes}
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
                {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                    <>
                        <AdminControlPanel />
                        <AdminUserManagement />
                        <SystemAuditLogs />
                        <VehicleAssignmentPanel />
                    </>
                )}
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
                optimizedRoutes={optimizedRoutes}
                stopTargetMode={stopTargetMode}
                setStopTargetMode={setStopTargetMode}
                newStopCoords={newStopCoords}
                setNewStopCoords={setNewStopCoords}
            />
        </div>
    );
}