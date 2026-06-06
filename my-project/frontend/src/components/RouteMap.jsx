import React, { useEffect, useRef } from 'react';
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

const RouteMap = ({ activities, selectedActivity }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || !activities || activities.length === 0) return;

    const initialCenter = [activities[0].location.latitude, activities[0].location.longitude];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [activities && activities.length > 0]); // Reinitialize map if activities presence changes

  // Update Markers and Polyline when activities or selectedActivity change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Remove existing polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (!activities || activities.length === 0) return;

    const coords = [];
    activities.forEach((activity, index) => {
      const pos = [activity.location.latitude, activity.location.longitude];
      coords.push(pos);

      const isSelected = selectedActivity && selectedActivity._id === activity._id;

      const marker = L.marker(pos, {
        icon: isSelected ? selectedMarkerIcon : new L.Icon.Default()
      });

      const popupContent = `
        <div style="font-family: var(--font-sans); color: #121420; min-width: 150px;">
          <strong style="display: block; font-size: 0.9rem; margin-bottom: 0.2rem;">${activity.timeSlot}: ${activity.title}</strong>
          <span style="font-size: 0.8rem; color: #6b6375; display: block; margin-bottom: 0.2rem;">${activity.location.name}</span>
          ${activity.cost > 0 ? `<span style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--primary);">Cost: $${activity.cost}</span>` : ''}
        </div>
      `;
      marker.bindPopup(popupContent);
      marker.addTo(map);

      markersRef.current.push(marker);

      if (isSelected) {
        marker.openPopup();
      }
    });

    // Draw routing line connecting points
    if (coords.length > 1) {
      const polyline = L.polyline(coords, {
        color: 'var(--primary)',
        weight: 3,
        opacity: 0.8,
        dashArray: '6, 8'
      }).addTo(map);
      polylineRef.current = polyline;
    }

    // Centering/Zoom logic
    if (selectedActivity) {
      map.setView(
        [selectedActivity.location.latitude, selectedActivity.location.longitude],
        14,
        { animate: true, duration: 0.8 }
      );
    } else if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 0.8 });
    }
  }, [activities, selectedActivity]);

  if (!activities || activities.length === 0) {
    return (
      <div className="map-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '320px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
        <p>No map coordinates available for this day.</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainerRef} 
      className="map-container" 
      style={{ height: '320px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
    />
  );
};

export default RouteMap;
