import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, LayerGroup, useMapEvents } from 'react-leaflet';
import { useSocket } from '../context/SocketContext';
import { truckIcon, violatorIcon, flagIcon } from '../utils/mapIcons';

function MapClickHandler({
  drawModeActive, setDrawnPoints,
  dispatchTargetMode, setDispatchLocation, onDispatchClick,
  stopTargetMode, setNewStopCoords, setStopTargetMode
}) {
  useMapEvents({
    click(e) {
      if (drawModeActive) {
        setDrawnPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
      } else if (dispatchTargetMode) {
        setDispatchLocation([e.latlng.lat, e.latlng.lng]);
        onDispatchClick(e.latlng.lat, e.latlng.lng);
      } else if (stopTargetMode) {
        setNewStopCoords([e.latlng.lat, e.latlng.lng]);
        setStopTargetMode(false); // Disable picking mode after choice
      }
    },
  });
  return null;
}

export default function FleetMap({
  drawModeActive, drawnPoints, setDrawnPoints,
  dispatchTargetMode, dispatchLocation, setDispatchLocation, onDispatchClick,
  trailLimit, playbackCoords, playbackIndex,
  optimizedRoutes = [],
  stopTargetMode, setStopTargetMode, newStopCoords, setNewStopCoords
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
          stopTargetMode={stopTargetMode}
          setNewStopCoords={setNewStopCoords}
          setStopTargetMode={setStopTargetMode}
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

        {/* Render Optimized VRP Multi-Stop Routes */}
        {optimizedRoutes.map((routeGroup, idx) => {
          const routePositions = routeGroup.sequence.map((node) => [node.lat, node.lng]);
          const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
          const strokeColor = colors[idx % colors.length];

          return (
            <LayerGroup key={`vrp-group-${idx}`}>
              <Polyline
                positions={routePositions}
                pathOptions={{ color: strokeColor, weight: 3.5, opacity: 0.9, dashArray: '6, 6' }}
              />
              {routeGroup.sequence.map((node, nodeIdx) => (
                <Marker key={`node-${idx}-${nodeIdx}`} position={[node.lat, node.lng]}>
                  <Popup>
                    <div className="text-xs font-mono text-slate-900 space-y-1">
                      <div className="font-bold">{node.name || `Stop ${nodeIdx}`}</div>
                      <div className="text-slate-600 font-bold">Vehicle Route: #{idx + 1}</div>
                      {node.demand && <div className="text-indigo-600 font-bold">Demand Load: {node.demand}</div>}
                      <div className="text-[10px] text-slate-400 font-bold">Sequence Order: {nodeIdx}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </LayerGroup>
          );
        })}

        {Object.entries(routeHistories).map(([driverName, history]) => {
          const slicedTrail = history.slice(-trailLimit);
          if (slicedTrail.length < 2) return null;
          const hasViolation = !activeBreachedDrivers[driverName];
          return <Polyline key={driverName} positions={slicedTrail} pathOptions={{ color: hasViolation ? '#ef4444' : '#10b981', weight: 2.5 }} />;
        })}

        {Object.values(trackedAssets).map((asset) => {
          const hasViolation = !activeBreachedDrivers[asset.driverName];
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

        {/* New stop drop-pin marker */}
        {newStopCoords && (
          <Marker position={newStopCoords} icon={flagIcon}>
            <Popup>
              <div className="text-xs font-mono text-slate-900 font-bold">New Delivery Stop Target</div>
            </Popup>
          </Marker>
        )}

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