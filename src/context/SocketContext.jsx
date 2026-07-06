import React, { createContext, useContext, useState, useCallback } from 'react';
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
      auth: { token: token.startsWith('Bearer ') ? token : `Bearer ${token}` },
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
};