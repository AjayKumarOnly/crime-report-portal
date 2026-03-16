import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { getAdminReports } from '../utils/api';
import 'leaflet/dist/leaflet.css';

const URGENCY_COLORS = { Low: '#22c55e', Medium: '#eab308', High: '#ef4444' };
const STATUS_OPACITY = { Submitted: 0.9, Assigned: 0.8, 'In Progress': 0.85, Resolved: 0.4 };

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 13); }, [center]);
  return null;
}

export default function MapView({ reports: externalReports, center }) {
  const [reports, setReports] = useState(externalReports || []);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (externalReports) { setReports(externalReports); return; }
    getAdminReports({ limit: 200 })
      .then((res) => setReports(res.data || []))
      .catch(() => {});
  }, [externalReports]);

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-slate-700">
      <MapContainer
        center={center || [11.0168, 76.9558]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {center && <RecenterMap center={center} />}
        {reports.map((r) => {
          const [lng, lat] = r.location?.coordinates || [76.9558, 11.0168];
          return (
            <CircleMarker
              key={r._id}
              center={[lat, lng]}
              radius={r.urgency === 'High' ? 12 : r.urgency === 'Medium' ? 9 : 7}
              pathOptions={{
                color: URGENCY_COLORS[r.urgency] || '#6b7280',
                fillColor: URGENCY_COLORS[r.urgency] || '#6b7280',
                fillOpacity: STATUS_OPACITY[r.status] || 0.7,
                weight: 2,
              }}
              eventHandlers={{ click: () => setSelected(r) }}
            >
              <Popup>
                <div className="min-w-[180px] font-sans">
                  <div className="font-bold text-slate-800">{r.category}</div>
                  <div className="text-xs text-slate-600 mt-0.5">Urgency: {r.urgency}</div>
                  <div className="text-xs text-slate-600">Status: {r.status}</div>
                  {r.location?.address && (
                    <div className="text-xs text-slate-500 mt-1">{r.location.address}</div>
                  )}
                  <div className="text-xs text-slate-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
