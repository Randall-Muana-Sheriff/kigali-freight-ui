import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { apiFetch, API_BASE, fetchRoutes, fetchGeofences } from '../utils/api';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [jwtToken, setJwtToken] = useState(() => localStorage.getItem('fleet_token') || '');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('fleet_role') || '');
  const [authError, setAuthError] = useState('');

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const [trackedAssets, setTrackedAssets] = useState({});
  const [violations, setViolations] = useState([]);
  const [activeBreachedDrivers, setActiveBreachedDrivers] = useState({});
  const [routeHistories, setRouteHistories] = useState({});

  const [savedGeofences, setSavedGeofences] = useState([]);
  const [savedRoutesList, setSavedRoutesList] = useState([]);

  const refreshFeeds = useCallback(async (tokenToUse) => {
    const token = tokenToUse ?? jwtToken;
    try {
      const routesData = await fetchRoutes(token);
      setSavedRoutesList(Array.isArray(routesData) ? routesData : []);
    } catch {
      setSavedRoutesList([]);
    }
    try {
      const geofencesData = await fetchGeofences(token);
      setSavedGeofences(Array.isArray(geofencesData) ? geofencesData : []);
    } catch {
      setSavedGeofences([]);
    }
  }, [jwtToken]);

  // Restore session's saved feeds on mount (token/role are already read
  // synchronously above via lazy useState initializers, avoiding a
  // setState-in-effect on first render).
  useEffect(() => {
    const savedToken = localStorage.getItem('fleet_token');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedToken) refreshFeeds(savedToken); // async fetch; state set after I/O, not synchronously
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async ({ mode, username, password, role }) => {
    setAuthError('');
    const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    const payload = mode === 'signup' ? { username, password, role } : { username, password };

    try {
      const data = await apiFetch(endpoint, { method: 'POST', body: payload });
      if (data.token) {
        setJwtToken(data.token);
        setUserRole(data.role || 'dispatcher');
        localStorage.setItem('fleet_token', data.token);
        localStorage.setItem('fleet_role', data.role || 'dispatcher');
        refreshFeeds(data.token);
        return true;
      }
      setAuthError(data.error || 'Authentication failed');
      return false;
    } catch (err) {
      setAuthError(err.message || 'Network error connecting to auth server');
      return false;
    }
  }, [refreshFeeds]);

  const logout = useCallback(() => {
    if (socket) socket.disconnect();
    setJwtToken('');
    setUserRole('');
    setIsConnected(false);
    localStorage.removeItem('fleet_token');
    localStorage.removeItem('fleet_role');
  }, [socket]);

  const toggleNetworkStream = useCallback(() => {
    if (isConnected) {
      if (socket) socket.disconnect();
      setIsConnected(false);
      setTrackedAssets({});
      setRouteHistories({});
      setActiveBreachedDrivers({});
      return;
    }

    const newSocket = io(API_BASE, {
      auth: { token: `Bearer ${jwtToken}` },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => setIsConnected(true));

    newSocket.on('fleet:snapshot', (arr) => {
      const assetMap = {};
      const historyMap = {};
      arr.forEach((asset) => {
        assetMap[asset.driverName] = asset;
        historyMap[asset.driverName] = [[asset.lat, asset.lng]];
      });
      setTrackedAssets(assetMap);
      setRouteHistories(historyMap);
    });

    newSocket.on('driver:location-update', (data) => {
      setTrackedAssets((prev) => ({ ...prev, [data.driverName]: data }));
      setRouteHistories((prev) => {
        const curr = prev[data.driverName] || [];
        return { ...prev, [data.driverName]: [...curr, [data.lat, data.lng]] };
      });
    });

    newSocket.on('geofence:violation', (v) => {
      setViolations((prev) => [v, ...prev]);
      setActiveBreachedDrivers((prev) => ({ ...prev, [v.driverName]: v }));
    });

    newSocket.on('geofence:exit', (e) => {
      setActiveBreachedDrivers((prev) => {
        const copy = { ...prev };
        delete copy[e.driverName];
        return copy;
      });
    });

    setSocket(newSocket);
  }, [isConnected, socket, jwtToken]);

  const saveDriverRouteHistory = useCallback(async (driverName) => {
    const history = routeHistories[driverName] || [];
    await apiFetch('/api/routes/save', {
      method: 'POST',
      token: jwtToken,
      body: { driverName, coordinates: history.map(([lat, lng]) => [lng, lat]) },
    });
    refreshFeeds();
  }, [routeHistories, jwtToken, refreshFeeds]);

  const saveGeofence = useCallback(async ({ name, points, speedLimitKmh }) => {
    const formattedPoints = points.map(([lat, lng]) => [lng, lat]);
    await apiFetch('/api/geofences', {
      method: 'POST',
      token: jwtToken,
      body: { name, coordinates: formattedPoints, speedLimitKmh },
    });
    refreshFeeds();
  }, [jwtToken, refreshFeeds]);

  const deleteGeofence = useCallback(async (id) => {
    await apiFetch(`/api/geofences/${id}`, { method: 'DELETE', token: jwtToken });
    refreshFeeds();
  }, [jwtToken, refreshFeeds]);

  const calculateRoadMatrixETA = useCallback(async (targetLat, targetLng) => {
    const fleetArray = Object.values(trackedAssets);
    if (fleetArray.length === 0) return [];
    try {
      const data = await apiFetch('/api/dispatch/matrix', {
        method: 'POST',
        token: jwtToken,
        body: { targetLat, targetLng, activeFleet: fleetArray },
      });
      return data.rankings || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [trackedAssets, jwtToken]);

  const value = {
    jwtToken, userRole, authError, login, logout,
    isConnected, toggleNetworkStream,
    trackedAssets, violations, activeBreachedDrivers, routeHistories,
    savedGeofences, savedRoutesList, refreshFeeds,
    saveDriverRouteHistory, saveGeofence, deleteGeofence, calculateRoadMatrixETA,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}
