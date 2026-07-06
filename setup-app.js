const fs = require('fs');
const path = require('path');

const files = {
  'src/index.css': `@import "tailwindcss";

body, html, #root {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  background-color: #f3f4f6;
  overflow: hidden;
}

.leaflet-container {
  width: 100%;
  height: 100%;
  z-index: 1;
}`,

  'src/context/SocketContext.jsx': `import React, { createContext, useContext, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [fleet, setFleet] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [lastTickTime, setLastTickTime] = useState(null);

  const connectGateway = useCallback((token) => {
    if (socket) socket.disconnect();
    const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000';
    
    const newSocket = io(gatewayUrl, {
      auth: { token: token.startsWith('Bearer ') ? token : \`Bearer \${token}\` },
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('📡 Connected securely to Freight Gateway Core Engine');
    });

    newSocket.on('dispatcher:fleet-grid-update', (payload) => {
      setFleet(payload.vehicles || []);
      setLastTickTime(payload.tickTimestamp);
    });

    newSocket.on('dispatcher:geofence-alert', (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 50));
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Gateway Authentication Failed:', err.message);
      setIsConnected(false);
    });

    newSocket.on('disconnect', () => setIsConnected(false));
    setSocket(newSocket);
  }, [socket]);

  const disconnectGateway = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={{ isConnected, fleet, alerts, lastTickTime, connectGateway, disconnectGateway }}>
      {children}
    </SocketContext.Provider>
  );
};`,

  'src/components/FleetMap.jsx': `import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../context/SocketContext';

if (typeof window !== 'undefined' && L && L.Icon && L.Icon.Default) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

export default function FleetMap() {
  const { fleet } = useSocket();
  const kigaliCenter = [-1.9441, 30.0619];

  return (
    <div className="absolute inset-0 w-full h-full rounded-xl overflow-hidden shadow-md border border-gray-200">
      <MapContainer center={kigaliCenter} zoom={13} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {fleet.map((vehicle, idx) => {
          if (!vehicle.lat || !vehicle.lng) return null;
          return (
            <Marker key={vehicle.driverName || idx} position={[vehicle.lat, vehicle.lng]} icon={truckIcon}>
              <Popup>
                <div className="p-1 font-sans">
                  <h4 className="font-bold text-gray-900">{vehicle.driverName}</h4>
                  <div className="text-xs font-mono bg-gray-100 p-1 rounded mt-1 text-gray-600">
                    Lat: {vehicle.lat.toFixed(5)}<br />Lng: {vehicle.lng.toFixed(5)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}`,

  'src/components/ControlPanel.jsx': `import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';

export default function ControlPanel() {
  const { isConnected, fleet, alerts, lastTickTime, connectGateway, disconnectGateway } = useSocket();
  const [tokenInput, setTokenInput] = useState('');

  const handleToggleConnect = () => {
    if (isConnected) {
      disconnectGateway();
    } else {
      if (!tokenInput.trim()) return alert('Please present a signed Dispatcher JWT Key.');
      connectGateway(tokenInput);
    }
  };

  return (
    <div className="w-96 bg-white h-screen border-r border-gray-200 shadow-xl flex flex-col font-sans z-10">
      <div className="p-6 border-b border-gray-100 bg-gray-50">
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Kigali Freight Router</h1>
        <p className="text-xs text-gray-500 mt-0.5">Control Tower Dashboard</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={\`h-3 w-3 rounded-full \${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}\`} />
            <span className="text-sm font-semibold text-gray-700">{isConnected ? 'Network Stream Active' : 'Gateway Logged Out'}</span>
          </div>
          {lastTickTime && <span className="text-xs font-mono bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Tick: {new Date(lastTickTime).toLocaleTimeString()}</span>}
        </div>
      </div>

      <div className="p-4 border-b border-gray-100 bg-white">
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Dispatcher JWT Authentication</label>
        <textarea rows={2} value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Paste cryptographically signed testing payload..." disabled={isConnected} className="w-full p-2 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 disabled:opacity-60" />
        <button onClick={handleToggleConnect} className={\`w-full mt-2 py-2 px-4 rounded-lg font-bold text-sm text-white transition-colors \${isConnected ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}\`}>{isConnected ? 'Disconnect Operational Hub' : 'Establish Gateway Stream'}</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tracked Assets ({fleet.length})</h3>
          {fleet.length === 0 ? <p className="text-xs text-gray-400 italic bg-white p-3 rounded-lg border border-dashed">No active telemetry pipelines...</p> : (
            <div className="space-y-2">
              {fleet.map((vehicle, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">{vehicle.driverName}</h4>
                    <p className="text-mono text-xxs text-gray-500 mt-1">{vehicle.lat.toFixed(4)}, {vehicle.lng.toFixed(4)}</p>
                  </div>
                  <span className="text-xxs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-100">Live</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">Geofence Violations ({alerts.length})</h3>
          <div className="space-y-2">
            {alerts.length === 0 && <p className="text-xs text-gray-400 italic bg-white p-3 rounded-lg border border-dashed">No dynamic perimeter breaks logged.</p>}
            {alerts.map((alert, idx) => (
              <div key={idx} className="p-3 bg-rose-50 rounded-lg border border-rose-100 text-xs shadow-sm">
                <div className="flex justify-between font-bold text-rose-900"><span>{alert.event?.toUpperCase() || 'ALARM'}</span><span className="font-mono text-xxs opacity-70">{new Date(alert.timestamp).toLocaleTimeString()}</span></div>
                <p className="text-gray-800 font-semibold mt-1">{alert.driverName}</p>
                <p className="text-xxs text-gray-600 mt-0.5">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'src/App.jsx': `import React from 'react';
import { SocketProvider } from './context/SocketContext';
import ControlPanel from './components/ControlPanel';
import FleetMap from './components/FleetMap';

export default function App() {
  return (
    <SocketProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-gray-100 antialiased">
        <ControlPanel />
        <main className="flex-1 h-screen relative bg-gray-200">
          <FleetMap />
        </main>
      </div>
    </SocketProvider>
  );
}`
};

Object.entries(files).forEach(([filepath, content]) => {
  fs.writeFileSync(path.join(process.cwd(), filepath), content, 'utf8');
  console.log(`✅ Synthesized and updated: ${filepath}`);
});

// Clean up residual boilerplate styles
const oldAppCss = path.join(process.cwd(), 'src/App.css');
if (fs.existsSync(oldAppCss)) fs.unlinkSync(oldAppCss);

console.log('\n🏁 Deployment Successful! Your local files are ready.');
