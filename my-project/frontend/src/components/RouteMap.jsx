import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icon rendering bugs in React builds
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom highlighted marker icon (Gold)
const selectedMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Map controller component to pan the map and fit bounds dynamically
const MapController = ({ activities, selectedActivity }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedActivity) {
      // Pan to highlighted activity coordinates
      map.setView(
        [selectedActivity.location.latitude, selectedActivity.location.longitude],
        14,
        { animate: true, duration: 0.8 }
      );
    } else if (activities && activities.length > 0) {
      // Fit bounds to cover all activities for the day
      const bounds = L.latLngBounds(activities.map(act => [act.location.latitude, act.location.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 0.8 });
    }
  }, [activities, selectedActivity, map]);

  return null;
};

const RouteMap = ({ activities, selectedActivity }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="map-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
        <p>No map coordinates available for this day.</p>
      </div>
    );
  }

  const defaultCenter = [activities[0].location.latitude, activities[0].location.longitude];
  const routeCoordinates = activities.map(act => [act.location.latitude, act.location.longitude]);

  return (
    <div className="map-container" style={{ height: '320px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Dynamic Markers */}
        {activities.map((activity, index) => {
          const isSelected = selectedActivity && selectedActivity._id === activity._id;
          const pos = [activity.location.latitude, activity.location.longitude];
          
          return (
            <Marker 
              key={activity._id || index} 
              position={pos}
              icon={isSelected ? selectedMarkerIcon : undefined}
            >
              <Popup>
                <div style={{ fontFamily: 'var(--font-sans)', color: '#121420' }}>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>{activity.timeSlot}: {activity.title}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#6b6375' }}>{activity.location.name}</span>
                  {activity.cost > 0 && <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginTop: '0.2rem' }}>Cost: ${activity.cost}</span>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Draw routing line connecting points */}
        {routeCoordinates.length > 1 && (
          <Polyline 
            positions={routeCoordinates} 
            color="var(--primary)" 
            weight={3} 
            opacity={0.8} 
            dashArray="6, 8" 
          />
        )}

        {/* Map Center Panner and Bounds Fitter */}
        <MapController activities={activities} selectedActivity={selectedActivity} />
      </MapContainer>
    </div>
  );
};

export default RouteMap;
