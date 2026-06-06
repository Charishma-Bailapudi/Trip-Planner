import React from 'react';
import { Plane, Train, Bus, Car, Navigation, Footprints } from 'lucide-react';

const getTransportIcon = (mode) => {
  switch (mode.toLowerCase()) {
    case 'flight':
      return <Plane size={16} />;
    case 'train':
      return <Train size={16} />;
    case 'bus':
      return <Bus size={16} />;
    case 'car_rental':
    case 'driving':
      return <Car size={16} />;
    case 'walk':
      return <Footprints size={16} />;
    default:
      return <Navigation size={16} style={{ transform: 'rotate(45deg)' }} />;
  }
};

const TransportSuggestions = ({ itinerary }) => {
  if (!itinerary) return null;

  // Extract and aggregate all transit segments
  const allTransits = [];
  itinerary.forEach(day => {
    if (day.transits && day.transits.length > 0) {
      day.transits.forEach(transit => {
        allTransits.push({
          ...transit,
          dayNumber: day.dayNumber
        });
      });
    }
  });

  if (allTransits.length === 0) {
    return null;
  }

  // Calculate totals
  const totalCost = allTransits.reduce((sum, t) => sum + (t.estimatedCost || 0), 0);
  const totalDuration = allTransits.reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
  
  const formatDuration = (mins) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return hrs > 0 ? `${hrs}h ${m}m` : `${m} mins`;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
        Transit Summary
      </h3>

      {/* Aggregate Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Transit Time</span>
          <strong style={{ fontSize: '1.1rem', color: 'var(--secondary)' }}>{formatDuration(totalDuration)}</strong>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Est. Cost</span>
          <strong style={{ fontSize: '1.1rem', color: 'var(--success)' }}>${totalCost}</strong>
        </div>
      </div>

      {/* Individual Transit Legs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
        {allTransits.map((transit, index) => (
          <div 
            key={index}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.02)',
              fontSize: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                {getTransportIcon(transit.mode)}
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Day {transit.dayNumber} Leg</span>
                <span style={{ color: 'var(--text-primary)' }}>{transit.origin} → {transit.destination}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 600, display: 'block' }}>{transit.durationMinutes} mins</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>{transit.estimatedCost > 0 ? `$${transit.estimatedCost}` : 'Free'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransportSuggestions;
