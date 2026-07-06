import React, { useState } from 'react';
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
    <div className="w-96 bg-white h-screen border-r border-gray-200 shadow-xl flex flex-col font-sans z-10 select-none">
      <div className="p-6 border-b border-gray-100 bg-gray-50/70">
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Kigali Freight Router</h1>
        <p className="text-xs text-gray-500 mt-0.5">Control Tower Dashboard</p>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              {isConnected ? 'Network Stream Active' : 'Gateway Logged Out'}
            </span>
          </div>
          {lastTickTime && (
            <span className="text-xxs font-mono bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md font-bold">
              TICK: {new Date(lastTickTime).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 border-b border-gray-100 bg-white">
        <label className="block text-xxs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Dispatcher JWT Authentication</label>
        <textarea
          rows={2}
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="Paste signed dispatcher JSON Web Token..."
          disabled={isConnected}
          className="w-full p-2 text-xs font-mono border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50 disabled:opacity-60 resize-none"
        />
        <button
          onClick={handleToggleConnect}
          className={`w-full mt-2 py-2 px-4 rounded-lg font-bold text-xs text-white uppercase tracking-wider transition-all duration-150 active:scale-[0.98] ${
            isConnected ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
          } shadow-md`}
        >
          {isConnected ? 'Disconnect Operational Hub' : 'Establish Gateway Stream'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        <div>
          <h3 className="text-xxs font-bold text-gray-400 uppercase tracking-wider mb-2">Tracked Assets ({fleet.length})</h3>
          {fleet.length === 0 ? (
            <p className="text-xs text-gray-400 italic bg-white p-3 rounded-xl border border-dashed border-gray-200 text-center">No active telemetry pipelines...</p>
          ) : (
            <div className="space-y-2">
              {fleet.map((vehicle, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs flex justify-between items-center transition-all duration-200 hover:border-gray-200">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">{vehicle.driverName}</h4>
                    <p className="text-mono text-xxs text-gray-400 mt-0.5">{vehicle.lat.toFixed(5)}, {vehicle.lng.toFixed(5)}</p>
                  </div>
                  <span className="text-xxs bg-blue-50 text-blue-600 border border-blue-100 font-bold px-2 py-0.5 rounded-md cubic-bezier animate-pulse">LIVE</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xxs font-bold text-rose-500 uppercase tracking-wider mb-2">Geofence Violations ({alerts.length})</h3>
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <p className="text-xs text-gray-400 italic bg-white p-3 rounded-xl border border-dashed border-gray-200 text-center">No dynamic perimeter breaks logged.</p>
            ) : (
              alerts.map((alert, idx) => (
                <div key={idx} className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 text-xs shadow-xs transition-all duration-300 animate-slide-in">
                  <div className="flex justify-between items-center font-bold text-rose-900 uppercase tracking-wider text-xxs">
                    <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md">{alert.event || 'BREACH'}</span>
                    <span className="font-mono text-gray-400 opacity-90">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-900 font-black text-sm mt-2">{alert.driverName}</p>
                  <p className="text-gray-600 text-xxs mt-0.5 leading-relaxed font-medium">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}