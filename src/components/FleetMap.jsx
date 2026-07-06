import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
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
  const [paths, setPaths] = useState({});

  useEffect(() => {
    if (!fleet || fleet.length === 0) return;

    setPaths((prevPaths) => {
      const updatedPaths = { ...prevPaths };
      
      fleet.forEach((vehicle) => {
        if (!vehicle.driverName || !vehicle.lat || !vehicle.lng) return;

        const currentPath = updatedPaths[vehicle.driverName] || [];
        const lastPoint = currentPath[currentPath.length - 1];

        if (!lastPoint || lastPoint[0] !== vehicle.lat || lastPoint[1] !== vehicle.lng) {
          updatedPaths[vehicle.driverName] = [...currentPath, [vehicle.lat, vehicle.lng]].slice(-50);
        }
      });

      return updatedPaths;
    });
  }, [fleet]);

  return (
    <div className="absolute inset-0 w-full h-full rounded-xl overflow-hidden shadow-md border border-gray-200">
      <MapContainer center={kigaliCenter} zoom={13} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <Circle
          center={[-1.945, 30.060]}
          radius={600}
          pathOptions={{
            color: '#ef4444',
            fillColor: '#f87171',
            fillOpacity: 0.15,
            dashArray: '4, 4'
          }}
        />

        {Object.entries(paths).map(([driverName, coordinates]) => (
          <Polyline
            key={`line-${driverName}`}
            positions={coordinates}
            pathOptions={{
              color: driverName.includes('Jean Bosco') ? '#3b82f6' : '#10b981',
              weight: 4,
              opacity: 0.7,
              dashArray: '6, 8'
            }}
          />
        ))}

        {fleet.map((vehicle, idx) => {
          if (!vehicle.lat || !vehicle.lng) return null;
          return (
            <Marker key={vehicle.driverName || idx} position={[vehicle.lat, vehicle.lng]} icon={truckIcon}>
              <Popup>
                <div className="p-1 font-sans">
                  <h4 className="font-bold text-gray-900">{vehicle.driverName}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Trail points logged: {paths[vehicle.driverName]?.length || 1}
                  </p>
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
}