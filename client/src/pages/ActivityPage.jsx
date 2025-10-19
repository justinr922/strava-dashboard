import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { fetchActivityById, fetchActivityStreams } from '../api/api';
import { MapContainer, TileLayer, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function formatSeconds(total) {
  if (total == null) return '';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

// Inline SVG line chart with time-based X axis and hover tooltip
function MiniLineChart({ x = [], y = [], width = 600, height = 200, stroke = '#2563eb', valueFormatter = (v)=>String(v) }) {
  const { xs, ys, points, minX, maxX } = useMemo(() => {
    if (!y || y.length === 0) return { xs: [], ys: [], points: [], minX:0, maxX:0 };
    const n = Math.min(x?.length || y.length, y.length);
    const xs0 = x && x.length ? x.slice(0, n) : Array.from({ length: n }, (_, i) => i);
    const ys0 = y.slice(0, n);

    // filter out null/NaN/non-finite y and detect gaps in time (pauses)
    const xs = [], ys = [];
    let lastTime = null;
    for (let i = 0; i < ys0.length; i++) {
      if (ys0[i] != null && Number.isFinite(ys0[i])) {
        const currentTime = xs0[i];
        // skip if there's a large gap (>120 seconds) indicating a pause
        if (lastTime !== null && currentTime - lastTime > 120) {
          // don't add this point to create a visual gap
          continue;
        }
        xs.push(currentTime);
        ys.push(ys0[i]);
        lastTime = currentTime;
      }
    }

    if (ys.length === 0) return { xs: [], ys: [], points: [], minX:0, maxX:0 };
    const w = width, h = height;
    const minY = Math.min(...ys), maxY = Math.max(...ys); const rangeY = maxY - minY || 1;
    const minX = Math.min(...xs), maxX = Math.max(...xs); const rangeX = maxX - minX || 1;
    const points = ys.map((v, i) => {
      const xPos = ((xs[i] - minX) / rangeX) * w;
      const yPos = h - ((v - minY) / rangeY) * h;
      return { x: xPos, y: yPos };
    });
    return { xs, ys, points, minX, maxX };
  }, [x, y, width, height]);

  const path = useMemo(() => {
    if (!points.length) return '';
    // create path with potential breaks for gaps
    let pathStr = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prevTime = xs[i-1];
      const currTime = xs[i];
      // if there's a gap in time, move to the new point instead of drawing a line
      if (currTime - prevTime > 120) {
        pathStr += ` M ${points[i].x},${points[i].y}`;
      } else {
        pathStr += ` L ${points[i].x},${points[i].y}`;
      }
    }
    return pathStr;
  }, [points, xs]);

  const [hover, setHover] = useState(null); // { i, px, py }

  const onMove = (e) => {
    if (!points.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    // find nearest x
    let nearest = 0, best = Infinity;
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(points[i].x - px);
      if (d < best) { best = d; nearest = i; }
    }
    setHover({ i: nearest, px: points[nearest].x, py: points[nearest].y });
  };

  const onLeave = () => setHover(null);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48" onMouseMove={onMove} onMouseLeave={onLeave}>
        <path d={path} fill="none" stroke={stroke} strokeWidth="2" />
        {hover && (
          <g>
            <line x1={hover.px} y1={0} x2={hover.px} y2={height} stroke="#9ca3af" strokeDasharray="4 4" />
            <circle cx={hover.px} cy={hover.py} r={3} fill={stroke} />
            {/* Tooltip */}
            <g transform={`translate(${Math.min(Math.max(hover.px + 8, 0), width - 120)}, ${Math.max(hover.py - 28, 8)})`}>
              <rect width="120" height="24" rx="4" fill="white" stroke="#e5e7eb" />
              <text x="6" y="16" fontSize="11" fill="#111827">
                {formatSeconds(xs[hover.i])} • {valueFormatter(ys[hover.i])}
              </text>
            </g>
          </g>
        )}
      </svg>
      <div className="mt-1 text-xs text-gray-500 flex justify-between">
        <span>{formatSeconds(minX)}</span>
        <span>{formatSeconds(Math.round(minX + (maxX - minX)/2))}</span>
        <span>{formatSeconds(maxX)}</span>
      </div>
    </div>
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
  const [metric, setMetric] = useState('heartrate');
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
  const speed = streams?.velocity_smooth?.data; // m/s
  const latlng = streams?.latlng?.data;

  // choose series for chart by metric; convert speed units based on activity type
  const isRun = activity?.type === 'Run';
  const chartSeries = metric === 'heartrate' ? hr : (
    isRun
      ? (speed?.map(v => v > 0.1 ? (1609.34 / (v * 60)) : null) ?? null) // min/mi, filter very low speeds
      : (speed?.map(v => v > 0 ? (v * 2.23694) : null) ?? null) // mph, filter zero speeds
  );

  // For map coloring — derive min/max based on chosen metric, filtering out null/NaN values
  const colorStats = useMemo(() => {
    const series = chartSeries;
    if (!series || series.length === 0) return null;
    const validValues = series.filter(v => v != null && Number.isFinite(v));
    if (validValues.length === 0) return null;
    return { min: Math.min(...validValues), max: Math.max(...validValues) };
  }, [chartSeries]);

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
      const val = chartSeries?.[i];
      // only add segments with valid values
      if (val != null && Number.isFinite(val) && colorStats) {
        const color = hrColor(val, colorStats.min, colorStats.max);
        segments.push({ p1: { lat: p1[0], lng: p1[1] }, p2: { lat: p2[0], lng: p2[1] }, color, val });
      }
    }
    return segments;
  }, [latlng, chartSeries, colorStats]);

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
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">{metric === 'heartrate' ? 'Heart Rate' : 'Speed'} vs Time</h2>
            <select value={metric} onChange={(e) => setMetric(e.target.value)} className="text-sm border rounded px-2 py-1">
              <option value="heartrate">Heart Rate</option>
              <option value="speed">Speed</option>
            </select>
          </div>
          {chartSeries ? (
            <MiniLineChart x={streams?.time?.data} y={chartSeries} />
          ) : (
            <div className="text-gray-500 text-sm">No {metric === 'heartrate' ? 'HR' : 'speed'} stream available.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Route (colored by {metric === 'heartrate' ? 'HR' : 'speed'})</h2>
          <select value={metric} onChange={(e) => setMetric(e.target.value)} className="text-sm border rounded px-2 py-1">
            <option value="heartrate">Heart Rate</option>
            <option value="speed">Speed</option>
          </select>
        </div>
        {!latlng ? (
          <div className="text-gray-500 text-sm">No route stream available.</div>
        ) : (
          <div>
            <MapContainer
              key={`${metric}-${coloredSegments.length}`}
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
              {/* full route outline for continuity */}
              <Polyline positions={latlng.map(([a,b]) => ({ lat:a, lng:b }))} color="#94a3b8" weight={2} opacity={0.6} />
              {coloredSegments.map((seg, idx) => (
                <Polyline key={`${metric}-${idx}`} positions={[seg.p1, seg.p2]} color={seg.color} weight={4}>
                  <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={false}>
                    <div className="text-xs">
                      {metric === 'heartrate' ? `${Math.round(seg.val)} bpm` : `${seg.val?.toFixed?.(1) ?? seg.val} ${isRun ? 'min/mi' : 'mph'}`}
                    </div>
                  </Tooltip>
                </Polyline>
              ))}
            </MapContainer>
            {colorStats && (
              <div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
                <span>Legend:</span>
                <span className="inline-block w-3 h-3 rounded" style={{ background: 'hsl(210,85%,50%)' }} />
                <span>{Math.round(colorStats.min)}{metric==='heartrate'?' bpm':' '}{isRun ? 'min/mi' : 'mph'}</span>
                <div className="h-2 w-24 bg-gradient-to-r from-[hsl(210,85%,50%)] to-[hsl(0,85%,50%)] rounded" />
                <span>{Math.round(colorStats.max)}{metric==='heartrate'?' bpm':' '}{isRun ? 'min/mi' : 'mph'}</span>
                <span className="inline-block w-3 h-3 rounded" style={{ background: 'hsl(0,85%,50%)' }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

