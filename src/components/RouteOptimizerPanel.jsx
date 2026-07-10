// src/components/RouteOptimizerPanel.jsx
import { useState, useEffect } from 'react';
import { apiFetch, createDeliveryStop, deleteDeliveryStop, optimizeMultiStopRoute, commitOptimizedRoute } from '../utils/api';
import { useSocket } from '../context/SocketContext';

export default function RouteOptimizerPanel({ onRouteOptimized, stopTargetMode, setStopTargetMode, newStopCoords }) {
    const { jwtToken } = useSocket();
    const [stops, setStops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [committing, setCommitting] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [optimizedSequence, setOptimizedSequence] = useState([]);

    // Form state for a new stop (including time windows)
    const [newName, setNewName] = useState('');
    const [newLat, setNewLat] = useState('');
    const [newLng, setNewLng] = useState('');
    const [newDemand, setNewDemand] = useState('10');
    const [earliestArrival, setEarliestArrival] = useState('0');
    const [latestArrival, setLatestArrival] = useState('480');

    const depot = { id: 'depot-01', lat: -1.9441, lng: 30.0619, name: 'Kigali Warehouse' };
    const vehicles = [{ id: 1, name: 'Heavy Hauler #01', type: 'HEAVY_HAULER', maxWeight: 500, maxRangeKm: 150 }];

    useEffect(() => {
        async function fetchStops() {
            try {
                const data = await apiFetch('/api/stops', { token: jwtToken });
                if (Array.isArray(data)) setStops(data);
            } catch (err) {
                console.error('Failed to load pending stops', err);
            }
        }
        if (jwtToken) fetchStops();
    }, [jwtToken]);

    useEffect(() => {
        if (newStopCoords) {
            // Update form fields asynchronously to avoid sync setState inside effect
            setTimeout(() => {
                setNewLat(newStopCoords[0].toFixed(5));
                setNewLng(newStopCoords[1].toFixed(5));
            }, 0);
        }
    }, [newStopCoords]);

    const handleAddStopSubmit = async (e) => {
        e.preventDefault();
        if (!newName || !newLat || !newLng) {
            setError('Please fill in name, latitude, and longitude.');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const createdStop = await createDeliveryStop({
                name: newName,
                lat: parseFloat(newLat),
                lng: parseFloat(newLng),
                demand: parseInt(newDemand, 10) || 1,
                earliestArrival: parseInt(earliestArrival, 10) || 0,
                latestArrival: parseInt(latestArrival, 10) || 480,
            }, jwtToken);
            setStops((prev) => [createdStop, ...prev]);
            setNewName('');
            setNewLat('');
            setNewLng('');
            setNewDemand('10');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteStop = async (stopId) => {
        setError(null);
        try {
            await deleteDeliveryStop(stopId, jwtToken);
            setStops((prev) => prev.filter((s) => s.id !== stopId));
        } catch (err) {
            setError(err.message);
        }
    };

    const handleRunOptimization = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await optimizeMultiStopRoute(depot, vehicles, stops, 100, jwtToken);
            setResult(data);
            if (data.routes && data.routes[0]) {
                setOptimizedSequence(data.routes[0].sequence);
            }
            if (onRouteOptimized) onRouteOptimized(data.routes);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMoveStopSequence = (index, direction) => {
        const newSequence = [...optimizedSequence];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSequence.length) return;
        const temp = newSequence[index];
        newSequence[index] = newSequence[targetIndex];
        newSequence[targetIndex] = temp;
        setOptimizedSequence(newSequence);
    };

    const handleCommitRoute = async () => {
        if (optimizedSequence.length === 0 || !result) return;
        setCommitting(true);
        setError(null);
        try {
            await commitOptimizedRoute({
                vehicleId: 1,
                driverName: 'Dispatcher Operator',
                geojsonPath: optimizedSequence,
                aggregateDistanceKm: result.summary.aggregateDistanceKm,
                totalDemand: result.summary.aggregateDemand,
            }, jwtToken);
            alert('Route successfully committed to database!');
        } catch (err) {
            setError(err.message);
        } finally {
            setCommitting(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-slate-100 space-y-3">
            <h3 className="text-sm font-bold tracking-tight text-white">Enterprise VRP Engine</h3>
            <div className="text-[11px] text-slate-400">Active Unassigned Stops: {stops.length}</div>
            {error && (
                <div className="p-2 bg-rose-950/80 border border-rose-800/80 text-rose-300 text-[11px] rounded font-mono">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleAddStopSubmit} className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
                <div className="flex justify-between items-center">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">Register Stop & Windows</div>
                    <button
                        type="button"
                        onClick={() => setStopTargetMode(!stopTargetMode)}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all border ${
                            stopTargetMode ? 'bg-rose-600 border-rose-500 text-white animate-pulse' : 'bg-slate-800 border-slate-700 text-indigo-300 hover:bg-slate-700'
                        }`}
                    >
                        {stopTargetMode ? 'CANCEL PICKER' : '📍 PICK ON MAP'}
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="Stop Name (e.g. Kacyiru Hub)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <div className="grid grid-cols-2 gap-1.5">
                    <input
                        type="number"
                        step="any"
                        placeholder="Latitude"
                        value={newLat}
                        onChange={(e) => setNewLat(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-500 font-mono"
                    />
                    <input
                        type="number"
                        step="any"
                        placeholder="Longitude"
                        value={newLng}
                        onChange={(e) => setNewLng(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-500 font-mono"
                    />
                </div>
                <div className="grid grid-cols-3 gap-1">
                    <input
                        type="number"
                        placeholder="Demand"
                        value={newDemand}
                        onChange={(e) => setNewDemand(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-white placeholder-slate-500 font-mono"
                    />
                    <input
                        type="number"
                        placeholder="Earliest (min)"
                        value={earliestArrival}
                        onChange={(e) => setEarliestArrival(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-white placeholder-slate-500 font-mono"
                    />
                    <input
                        type="number"
                        placeholder="Latest (min)"
                        value={latestArrival}
                        onChange={(e) => setLatestArrival(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-white placeholder-slate-500 font-mono"
                    />
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono font-bold py-1 rounded text-[11px] transition-all disabled:opacity-50 border border-slate-700/60"
                >
                    {submitting ? 'Saving Stop...' : '+ Add Stop to Queue'}
                </button>
            </form>

            <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-[11px]">
                {stops.map((s) => (
                    <div key={s.id} className="bg-slate-950/40 p-1.5 rounded flex justify-between items-center border border-slate-800/40 text-slate-300">
                        <span className="truncate max-w-[120px]">{s.name}</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-indigo-400 bg-indigo-950/60 px-1 py-0.5 rounded border border-indigo-800/60">Load: {s.demand}</span>
                            <button
                                type="button"
                                onClick={() => handleDeleteStop(s.id)}
                                className="text-rose-400 hover:text-rose-300 px-1 font-bold text-[10px]"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={handleRunOptimization}
                disabled={loading || stops.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-50"
            >
                {loading ? 'Optimizing Routes...' : 'Compute Optimal Routing'}
            </button>

            {optimizedSequence.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-[11px]">
                    <div className="text-white font-bold flex justify-between items-center">
                        <span>Optimized Sequence:</span>
                        <button
                            onClick={handleCommitRoute}
                            disabled={committing}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-bold"
                        >
                            {committing ? 'Committing...' : 'Commit Route'}
                        </button>
                    </div>
                    <div className="max-h-24 overflow-y-auto space-y-1">
                        {optimizedSequence.map((node, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-950/60 p-1 rounded border border-slate-800">
                                <span className="truncate max-w-[110px]">{idx}. {node.name || 'Stop'}</span>
                                <div className="flex gap-1">
                                    <button onClick={() => handleMoveStopSequence(idx, 'up')} className="px-1 bg-slate-800 hover:bg-slate-700 rounded text-[9px]">▲</button>
                                    <button onClick={() => handleMoveStopSequence(idx, 'down')} className="px-1 bg-slate-800 hover:bg-slate-700 rounded text-[9px]">▼</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {result && (
                <div className="pt-2 border-t border-slate-800 font-mono text-[10px] text-slate-400 space-y-0.5">
                    <div className="text-white font-bold">Metrics:</div>
                    <div>Vehicles Needed: {result.summary.totalVehiclesNeeded}</div>
                    <div>Total Distance: {result.summary.aggregateDistanceKm} km</div>
                </div>
            )}
        </div>
    );
}