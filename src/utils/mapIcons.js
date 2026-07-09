import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995471.png',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

export const violatorIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export const flagIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1441/1441463.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});
