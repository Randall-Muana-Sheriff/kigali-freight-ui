import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMapEvents } from 'react-leaflet';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995471.png',
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});
const violatorIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});
const flagIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1441/1441463.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [jwtToken, setJwtToken] = useState('');
  const [userRole, setUserRole] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('dispatcher');
  const [authError, setAuthError] = useState('');
  const [trackedAssets, setTrackedAssets] = useState({});
  const [violations, setViolations] = useState([]);
  const [activeBreachedDrivers, setActiveBreachedDrivers] = useState({});
  const [routeHistories, setRouteHistories] = useState({});
  const [trailLimit, setTrailLimit] = useState(15);
  const [savedGeofences, setSavedGeofences] = useState([]);
  const [newFenceName, setNewFenceName] = useState('');
  const [newFenceSpeedLimit, setNewFenceSpeedLimit] = useState('60');
  const [drawModeActive, setDrawModeActive] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState([]);
  const [savedRoutesList, setSavedRoutesList] = useState([]);
  const [playbackCoords, setPlaybackCoords] = useState([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPlaybackRoute, setSelectedPlaybackRoute] = useState(null);
  const playbackIntervalRef = useRef(null);
  const [dispatchTargetMode, setDispatchTargetMode] = useState(false);
  const [dispatchLocation, setDispatchLocation] = useState(null);
  const [dispatchRankings, setDispatchRankings] = useState([]);

  useEffect(() => {
    const savedToken = localStorage.getItem('fleet_token');
    const savedRole = localStorage.getItem('fleet_role');
    if (savedToken && savedRole) {
      setJwtToken(savedToken);
      setUserRole(savedRole);
      refreshFeeds(savedToken);
    }
  }, []);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    const payload = authMode === 'signup'
      ? { username: inputUsername, password: inputPassword, role: selectedRole }
      : { username: inputUsername, password: inputPassword };
    
    fetch(`http://localhost:5000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          setJwtToken(data.token);
          setUserRole(data.role || 'dispatcher');
          localStorage.setItem('fleet_token', data.token);
          localStorage.setItem('fleet_role', data.role || 'dispatcher');
          refreshFeeds(data.token);
        } else {
          setAuthError(data.error || 'Authentication failed');
        }
      })
      .catch(() => setAuthError('Network error connecting to auth server'));
  };

  const handleLogout = () => {
    if (socket) socket.disconnect();
    setJwtToken('');
    setUserRole('');
    setIsConnected(false);
    localStorage.removeItem('fleet_token');
    localStorage.removeItem('fleet_role');
  };

  const refreshFeeds = (tokenToUse = jwtToken) => {
    const headers = tokenToUse ? { 'Authorization': `Bearer ${tokenToUse}` } : {};
    fetch('http://localhost:5000/api/routes', { headers })
      .then(res => res.json())
      .then(data => setSavedRoutesList(Array.isArray(data) ? data : []))
      .catch(() => setSavedRoutesList([]));
    
    fetch('http://localhost:5000/api/geofences', { headers })
      .then(res => res.json())
      .then(data => setSavedGeofences(Array.isArray(data) ? data : []))
      .catch(() => setSavedGeofences([]));
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
        setPlaybackIndex(prev => {
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

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        if (drawModeActive) {
          setDrawnPoints(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
        } else if (dispatchTargetMode) {
          setDispatchLocation([e.latlng.lat, e.latlng.lng]);
          calculateRoadMatrixETA(e.latlng.lat, e.latlng.lng);
        }
      },
    });
    return null;
  }

  const calculateRoadMatrixETA = (targetLat, targetLng) => {
    const fleetArray = Object.values(trackedAssets);
    if (fleetArray.length === 0) return;
    fetch('http://localhost:5000/api/dispatch/matrix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
      body: JSON.stringify({ targetLat, targetLng, activeFleet: fleetArray })
    })
      .then(res => res.json())
      .then(data => { if (data.rankings) setDispatchRankings(data.rankings); })
      .catch(err => console.error(err));
  };

  const saveCompiledGeofence = () => {
    if (!newFenceName || drawnPoints.length < 3) return;
    const formattedPoints = drawnPoints.map(([lat, lng]) => [lng, lat]);
    fetch('http://localhost:5000/api/geofences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
      body: JSON.stringify({ name: newFenceName, coordinates: formattedPoints, speedLimitKmh: newFenceSpeedLimit })
    })
      .then(() => {
        setNewFenceName(''); setNewFenceSpeedLimit('60'); setDrawnPoints([]); setDrawModeActive(false);
        refreshFeeds();
      });
  };

  const deleteGeofence = (id) => {
    fetch(`http://localhost:5000/api/geofences/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    })
      .then(() => refreshFeeds());
  };

  const toggleNetworkStream = () => {
    if (isConnected) {
      if (socket) socket.disconnect();
      setIsConnected(false);
      setTrackedAssets({});
      setRouteHistories({});
      setActiveBreachedDrivers({});
    } else {
      const newSocket = io('http://localhost:5000', {
        auth: { token: `Bearer ${jwtToken}` },
        transports: ['websocket']
      });
      newSocket.on('connect', () => setIsConnected(true));
      newSocket.on('fleet:snapshot', (arr) => {
        const m = {}; const h = {};
        arr.forEach(a => { m[a.driverName] = a; h[a.driverName] = [[a.lat, a.lng]]; });
        setTrackedAssets(m); setRouteHistories(h);
      });
      newSocket.on('driver:location-update', (data) => {
        setTrackedAssets(prev => ({ ...prev, [data.driverName]: data }));
        setRouteHistories(prev => {
          const curr = prev[data.driverName] || [];
          return { ...prev, [data.driverName]: [...curr, [data.lat, data.lng]] };
        });
      });
      newSocket.on('geofence:violation', (v) => {
        setViolations(prev => [v, ...prev]);
        setActiveBreachedDrivers(prev => ({ ...prev, [v.driverName]: v }));
      });
      newSocket.on('geofence:exit', (e) => {
        setActiveBreachedDrivers(prev => {
          const copy = { ...prev };
          delete copy[e.driverName];
          return copy;
        });
      });
      setSocket(newSocket);
    }
  };

  const saveDriverRouteHistory = (driverName) => {
    const history = routeHistories[driverName] || [];
    fetch('http://localhost:5000/api/routes/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
      body: JSON.stringify({ driverName, coordinates: history.map(([lat, lng]) => [lng, lat]) })
    })
      .then(() => refreshFeeds());
  };

  if (!jwtToken) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100 font-sans">
        <div className="w-[380px] bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Kigali Freight Control Tower</h2>
            <p className="text-[10px] text-indigo-400 uppercase font-mono tracking-wider">
              {authMode === 'signup' ? 'Create Operator Account' : 'Secure Operator Authentication'}
            </p>
          </div>
          {authError && (
            <div className="p-2 bg-rose-950/40 border border-rose-900/60 rounded text-[11px] text-rose-400 font-mono">
              {authError}
            </div>
          )}
          <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Username</label>
              <input
                type="text" value={inputUsername} onChange={e => setInputUsername(e.target.value)} required
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Password</label>
              <input
                type="password" value={inputPassword} onChange={e => setInputPassword(e.target.value)} required
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>
            {authMode === 'signup' && (
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Assigned Role</label>
                <select
                  value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="dispatcher">Dispatcher</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
            <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-bold uppercase rounded text-white tracking-wide transition-all mt-2">
              {authMode === 'signup' ? 'Register Account' : 'Authenticate Session'}
            </button>
          </form>
          <div className="text-center pt-2 border-t border-slate-800 text-[11px]">
            <button
              onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }}
              className="text-indigo-400 hover:underline font-mono"
            >
              {authMode === 'login' ? "Need an account? Sign up" : "Already registered? Log in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <button onClick={handleLogout} className="text-[9px] text-slate-400 hover:text-rose-400 font-mono underline">
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
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🕰️ Historical Playback Engine ("Time Machine")</h3>
          <select
            onChange={e => {
              const route = savedRoutesList.find(r => r.id === parseInt(e.target.value));
              if (route) loadRouteForPlayback(route);
            }}
            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-300"
          >
            <option value="">-- Load Archived Database Journeys --</option>
            {savedRoutesList.map(r => (
              <option key={r.id} value={r.id}>{r.driverName} (Trip #{r.id})</option>
            ))}
          </select>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
          {drawModeActive ? (
            <div className="space-y-2">
              <input
                type="text" placeholder="Polygon Identity Name" value={newFenceName}
                onChange={e => setNewFenceName(e.target.value)}
                className="w-full p-1.5 bg-slate-900 border border-slate-800 text-slate-100 rounded text-xs outline-none"
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase whitespace-nowrap">Speed Max:</span>
                <input
                  type="number" value={newFenceSpeedLimit}
                  onChange={e => setNewFenceSpeedLimit(e.target.value)}
                  className="w-full p-1 bg-slate-900 border border-slate-800 text-amber-400 rounded text-xs outline-none font-mono"
                />
                <span className="text-[10px] text-slate-500 font-mono">KM/H</span>
              </div>
              <div className="flex gap-2">
                <button onClick={saveCompiledGeofence} className="flex-1 py-1 bg-emerald-600 text-white font-bold rounded text-[10px] uppercase">Commit Bounds</button>
                <button onClick={() => { setDrawModeActive(false); setDrawnPoints([]); }} className="py-1 px-2.5 bg-slate-800 text-slate-400 font-bold rounded text-[10px] uppercase">Clear</button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setDrawModeActive(true); setDispatchTargetMode(false); }} className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-slate-800 rounded text-[11px] uppercase tracking-wide">
              ➕ Map Draw PostGIS Geofence Boundaries
            </button>
          )}
        </div>
        {savedGeofences.length > 0 && (
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">🛡️ Active Managed Geofences ({savedGeofences.length})</h3>
            <div className="max-h-[110px] overflow-y-auto space-y-1 pr-1">
              {savedGeofences.map(fence => (
                <div key={fence.id} className="flex justify-between items-center bg-slate-900/50 px-2 py-1.5 rounded border border-slate-800/40">
                  <div className="flex flex-col">
                    <span className="font-mono text-indigo-300 font-bold text-[11px]">{fence.name}</span>
                    <span className="text-[9px] text-amber-500 font-mono">Limit: {fence.speedLimitKmh} km/h</span>
                  </div>
                  {userRole === 'admin' && (
                    <button onClick={() => deleteGeofence(fence.id)} className="text-[9px] bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900 text-rose-400 py-0.5 px-2.5 rounded font-bold uppercase">Delete</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex-1 min-h-[140px] overflow-y-auto space-y-1.5">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">📡 Running Field Transmissions ({Object.keys(trackedAssets).length})</h3>
          {Object.values(trackedAssets).map(asset => {
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
      </div>
      <div className="flex-1 h-full w-full relative z-[1] bg-slate-950">
        <MapContainer center={[-1.9450, 30.0600]} zoom={13} className="h-full w-full opacity-90 filter invert-[0.9] hue-rotate-[180deg]">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <MapClickHandler />
          {savedGeofences.map(fence => {
            const positions = fence.geojson.coordinates[0].map(([lng, lat]) => [lat, lng]);
            return (
              <Polygon
                key={fence.id} positions={positions}
                pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.08, weight: 1.5 }}
              />
            );
          })}
          {drawModeActive && drawnPoints.length > 0 && (
            <>
              {drawnPoints.map((pt, idx) => <Marker key={idx} position={pt} />)}
              {drawnPoints.length > 1 && <Polygon positions={drawnPoints} pathOptions={{ color: '#ef4444', dashArray: '4,4' }} />}
            </>
          )}
          {Object.entries(routeHistories).map(([driverName, history]) => {
            const slicedTrail = history.slice(-trailLimit);
            if (slicedTrail.length < 2) return null;
            const hasViolation = !!activeBreachedDrivers[driverName];
            return <Polyline key={driverName} positions={slicedTrail} pathOptions={{ color: hasViolation ? '#ef4444' : '#10b981', weight: 2.5 }} />;
          })}
          {Object.values(trackedAssets).map(asset => {
            const hasViolation = !!activeBreachedDrivers[asset.driverName];
            return (
              <Marker key={asset.driverName} position={[asset.lat, asset.lng]} icon={hasViolation ? violatorIcon : truckIcon}>
                <Popup>
                  <div className="text-xs font-mono text-slate-900">
                    <div className="font-bold">{asset.driverName}</div>
                    <div className="text-slate-600 font-bold">Speed: {asset.velocityKmh} km/h</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
export default App;