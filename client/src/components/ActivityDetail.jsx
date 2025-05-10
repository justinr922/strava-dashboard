// src/ActivityDetail.js

import React from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import polyline from '@mapbox/polyline';
import 'leaflet/dist/leaflet.css';

export default function ActivityDetail({ activity, onClose }) {

  const coords = polyline.decode(activity.map.summary_polyline);
  const latlngs = coords.map(([lat, lng]) => ({ lat, lng }));

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-3">
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-bold">{activity.name}</h2>
        <button
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      <p><strong>Type:</strong> {activity.type}</p>
      <p><strong>Date:</strong> {new Date(activity.start_date).toLocaleString()}</p>
      <p><strong>Distance:</strong> {(activity.distance / 1000).toFixed(2)} km</p>
      <p><strong>Time:</strong> {Math.round(activity.moving_time / 60)} min</p>
      <p><strong>Pace:</strong> {activity.formattedSpeed}</p>

      {activity?.map?.summary_polyline && (
        <MapContainer
            style={{ height: '300px', width: '100%', borderRadius: '0.75rem' }}
            center={latlngs[0]}
            zoom={13}
            scrollWheelZoom={false}
        >
            <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url='https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}'
            maxZoom={20}
            />
            <Polyline positions={latlngs} color="blue" weight={4} />
      </MapContainer>)}
    </div>
  );
}
