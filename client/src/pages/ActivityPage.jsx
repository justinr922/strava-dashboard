import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { fetchActivityById, fetchActivityStreams } from '../api/api';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Tiny inline SVG line chart component
function MiniLineChart({ series, width = 600, height = 200, stroke = '#2563eb' }) {
  // series: array of numbers
  const path = useMemo(() => {
    if (!series || series.length === 0) return '';
    const w = width;
    const h = height;
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const stepX = w / Math.max(1, series.length - 1);
    const points = series.map((v, i) => {
      const x = i * stepX;
      const y = h - ((v - min) / range) * h; // invert y for SVG
      return `${x},${y}`;
    });
    return `M ${points[0]} L ${points.slice(1).join(' ')}`;
  }, [series, width, height]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

function hrColor(hr, min, max) {
  if (hr == null || Number.isNaN(hr)) return '#9ca3af';
  const t = Math.max(0, Math.min(1, (hr - min) / (max - min || 1)));
  // interpolate from blue (210deg) to red (0deg)
  const hue = 210 - 210 * t;
  return `hsl(${hue}, 85%, 50%)`;
}

export default function ActivityPage() {
  const { id } = useParams();
  const { auth } = useAuth();
  const [activity, setActivity] = useState(null);
  const [streams, setStreams] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!auth?.appToken || !id) return;
      setLoading(true);
      setError(null);
      try {
        const [a, s] = await Promise.all([
          fetchActivityById(auth.appToken, id),
          fetchActivityStreams(auth.appToken, id),
        ]);
        setActivity(a);
        setStreams(s);
      } catch (e) {
        setError(e?.response?.data || e.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [auth?.appToken, id]);

  const hr = streams?.heartrate?.data;
  const speed = streams?.velocity_smooth?.data;
  const time = streams?.time?.data;
  const latlng = streams?.latlng?.data;

  // For map coloring
  const hrStats = useMemo(() => {
    if (!hr || hr.length === 0) return null;
    const min = Math.min(...hr);
    const max = Math.max(...hr);
    return { min, max };
  }, [hr]);

  // Downsample for performance (aim ~1000 segments)
  const coloredSegments = useMemo(() => {
    if (!latlng || latlng.length < 2) return [];
    const n = latlng.length;
    const target = 1000;
    const step = Math.max(1, Math.floor(n / target));
    const segments = [];
    for (let i = 0; i < n - 1; i += step) {
      const p1 = latlng[i];
      const p2 = latlng[Math.min(i + step, n - 1)];
      const color = hrStats ? hrColor(hr?.[i], hrStats.min, hrStats.max) : '#3b82f6';
      segments.push({ p1: { lat: p1[0], lng: p1[1] }, p2: { lat: p2[0], lng: p2[1] }, color });
    }
    return segments;
  }, [latlng, hr, hrStats]);

  if (!auth) return (
    <div className="p-6 text-center text-gray-600">Please log in.</div>
  );

  if (loading) return (
    <div className="p-6 text-center text-gray-600">Loading activity…</div>
  );

  if (error) return (
    <div className="p-6 text-center text-red-600">{String(error)}</div>
  );

  return (
    <div className="px-3 sm:px-6 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{activity?.name || `Activity ${id}`}</h1>
        <Link to="/history" className="text-blue-600 hover:underline">← Back to History</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2">Summary</h2>
          <div className="text-sm text-gray-700 space-y-1">
            <div>Type: {activity?.type}</div>
            <div>Date: {new Date(activity?.start_date).toLocaleString()}</div>
            <div>Distance: {(activity?.distance / 1609.34).toFixed(2)} mi</div>
            <div>Moving Time: {Math.round(activity?.moving_time / 60)} min</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2">{hr ? 'Heart Rate' : 'Speed'} vs Time</h2>
          {hr || speed ? (
            <MiniLineChart series={(hr || speed)} />
          ) : (
            <div className="text-gray-500 text-sm">No HR or speed stream available.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-2">Route {hr ? '(colored by HR)' : ''}</h2>
        {!latlng ? (
          <div className="text-gray-500 text-sm">No route stream available.</div>
        ) : (
          <MapContainer
            style={{ height: '320px', width: '100%', borderRadius: '0.75rem' }}
            center={{ lat: latlng[0][0], lng: latlng[0][1] }}
            zoom={13}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url='https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}'
              maxZoom={20}
            />
            {coloredSegments.map((seg, idx) => (
              <Polyline key={idx} positions={[seg.p1, seg.p2]} color={seg.color} weight={4} />
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

