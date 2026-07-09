<<<<<<< HEAD
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMapEvents } from 'react-leaflet';
import { useSocket } from '../context/SocketContext';
import { truckIcon, violatorIcon, flagIcon } from '../utils/mapIcons';

function MapClickHandler({ drawModeActive, setDrawnPoints, dispatchTargetMode, setDispatchLocation, onDispatchClick }) {
  useMapEvents({
    click(e) {
      if (drawModeActive) {
        setDrawnPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
      } else if (dispatchTargetMode) {
        setDispatchLocation([e.latlng.lat, e.latlng.lng]);
        onDispatchClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function FleetMap({
  drawModeActive, drawnPoints, setDrawnPoints,
  dispatchTargetMode, dispatchLocation, setDispatchLocation, onDispatchClick,
  trailLimit, playbackCoords, playbackIndex,
}) {
  const { savedGeofences, routeHistories, trackedAssets, activeBreachedDrivers } = useSocket();

  return (
    <div className="flex-1 h-full w-full relative z-[1] bg-slate-950">
      <MapContainer center={[-1.9450, 30.0600]} zoom={13} className="h-full w-full opacity-90 filter invert-[0.9] hue-rotate-[180deg]">
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        <MapClickHandler
          drawModeActive={drawModeActive}
          setDrawnPoints={setDrawnPoints}
          dispatchTargetMode={dispatchTargetMode}
          setDispatchLocation={setDispatchLocation}
          onDispatchClick={onDispatchClick}
        />

        {savedGeofences.map((fence) => {
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

        {Object.values(trackedAssets).map((asset) => {
          const hasViolation = !!activeBreachedDrivers[asset.driverName];
          return (
            <Marker key={asset.driverName} position={[asset.lat, asset.lng]} icon={hasViolation ? violatorIcon : truckIcon}>
              <Popup>
                <div className="text-xs font-mono text-slate-900">
                  <div className="font-bold">{asset.driverName}</div>
                  <div className="text-slate-600 font-bold">Speed: {asset.velocityKmh} km/h</div>
=======
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
>>>>>>> 5e1575e6290f31f7c1d65d5cec1d558bafe6e010
                </div>
              </Popup>
            </Marker>
          );
        })}
<<<<<<< HEAD

        {/* Dispatch target: mark the clicked location with a flag */}
        {dispatchLocation && (
          <Marker position={dispatchLocation} icon={flagIcon}>
            <Popup>
              <div className="text-xs font-mono text-slate-900 font-bold">Dispatch target hub</div>
            </Popup>
          </Marker>
        )}

        {/* Historical playback: full route shown as a dashed trail, with a flag marker at the current index */}
        {playbackCoords.length > 1 && (
          <Polyline positions={playbackCoords} pathOptions={{ color: '#f59e0b', weight: 2, dashArray: '6,6' }} />
        )}
        {playbackCoords.length > 0 && playbackCoords[playbackIndex] && (
          <Marker position={playbackCoords[playbackIndex]} icon={truckIcon}>
            <Popup>
              <div className="text-xs font-mono text-slate-900 font-bold">
                Playback position {playbackIndex + 1} / {playbackCoords.length}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
=======
      </MapContainer>
    </div>
  );
}
>>>>>>> 5e1575e6290f31f7c1d65d5cec1d558bafe6e010
