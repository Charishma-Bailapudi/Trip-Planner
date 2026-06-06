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

const getCurrencySymbol = (currency) => {
  switch (currency?.toUpperCase()) {
    case 'INR': return '₹';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    case 'USD':
    default: return '$';
  }
};

const TransportSuggestions = ({ itinerary, currency }) => {
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
          <strong style={{ fontSize: '1.1rem', color: 'var(--success)' }}>{getCurrencySymbol(currency)}{totalCost}</strong>
        </div>
      </div>

      {/* Individual Transit Legs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
        {allTransits.map((transit, index) => (
          <div 
            key={index}
            style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '0.4rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
              fontSize: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                  {getTransportIcon(transit.mode)}
                </div>
                <div>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {transit.transitNumber || `${transit.mode.toUpperCase()} Conn`}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                    (Day {transit.dayNumber})
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                  {transit.estimatedCost > 0 ? `${getCurrencySymbol(currency)}${transit.estimatedCost}` : 'Free'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1.6rem' }}>
              <div style={{ color: 'var(--text-secondary)' }}>
                <strong>{transit.origin}</strong> → <strong>{transit.destination}</strong>
              </div>
              
              {transit.departureTime && transit.arrivalTime && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Schedule: <span style={{ color: 'var(--secondary)' }}>{transit.departureTime}</span> – <span style={{ color: 'var(--secondary)' }}>{transit.arrivalTime}</span> ({transit.durationMinutes} mins)
                </div>
              )}
              
              {transit.originStation && transit.destinationStation && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Stations: {transit.originStation} to {transit.destinationStation}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransportSuggestions;
