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
                </div>
              </Popup>
            </Marker>
          );
        })}

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
