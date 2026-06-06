import React, { useState, useEffect } from 'react';
import { Clock, MapPin, DollarSign, Calendar, Navigation, Eye } from 'lucide-react';

const ItineraryDisplay = ({ itinerary, onActivityClick, activeActivityId, selectedDayIndex, setSelectedDayIndex }) => {
  
  // Safe guard: Reset day selection if it exceeds bounds of the new itinerary (prevents blank screen)
  useEffect(() => {
    if (itinerary && selectedDayIndex >= itinerary.length) {
      setSelectedDayIndex(0);
    }
  }, [itinerary, selectedDayIndex, setSelectedDayIndex]);

  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Calendar size={48} style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
        <p>No itinerary available. Fill out the form to generate one!</p>
      </div>
    );
  }

  // Safety assignment
  const activeDay = itinerary[selectedDayIndex] || itinerary[0];
  if (!activeDay) return null;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', minHeight: '500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
        <h2>Trip Itinerary</h2>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
          {itinerary.length} {itinerary.length === 1 ? 'Day' : 'Days'} Total
        </span>
      </div>

      {/* Day Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {itinerary.map((day, index) => (
          <button
            key={day.dayNumber}
            onClick={() => setSelectedDayIndex(index)}
            className={`btn ${selectedDayIndex === index ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              padding: '0.5rem 1rem', 
              fontSize: '0.9rem', 
              borderRadius: '20px', 
              whiteSpace: 'nowrap',
              border: selectedDayIndex === index ? 'none' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            Day {day.dayNumber}
          </button>
        ))}
      </div>

      {/* Day Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>
          {new Date(activeDay.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
        </h3>

        {activeDay.activities.map((activity, actIdx) => {
          const isSelected = activeActivityId === activity._id;

          return (
            <div key={activity._id || actIdx} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Activity Card */}
              <div 
                className="card" 
                style={{ 
                  cursor: 'pointer', 
                  borderLeft: isSelected ? '4px solid var(--primary)' : '1px solid var(--card-border)',
                  background: isSelected ? 'var(--bg-tertiary)' : 'var(--card-bg)',
                  padding: '1.2rem'
                }}
                onClick={() => onActivityClick && onActivityClick(activity)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)' }}>
                    <Clock size={16} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{activity.timeSlot}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(46, 213, 115, 0.1)', color: 'var(--success)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                    <DollarSign size={12} />
                    <span>{activity.cost === 0 ? 'Free' : activity.cost}</span>
                  </div>
                </div>

                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{activity.title}</h4>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.8rem', color: 'var(--text-secondary)' }}>{activity.description}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <MapPin size={14} style={{ color: 'var(--accent)' }} />
                    <span>{activity.location.name}</span>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--primary)' }}>
                    <Eye size={12} /> Map Focus
                  </span>
                </div>
              </div>

              {/* Transit Card (detailed connection legs) */}
              {activeDay.transits && activeDay.transits[actIdx] && (() => {
                const transit = activeDay.transits[actIdx];
                return (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '0.4rem', 
                    margin: '0 1.5rem', 
                    padding: '0.8rem 1.2rem',
                    borderLeft: '2px dashed var(--primary-glow)',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--secondary)', fontWeight: 600 }}>
                      <Navigation size={14} style={{ transform: 'rotate(45deg)' }} />
                      <span style={{ textTransform: 'capitalize' }}>
                        {transit.transitNumber || `${transit.mode} connection`}
                      </span>
                      {transit.estimatedCost > 0 && (
                        <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 500 }}>
                          • Est. Cost: ${transit.estimatedCost}
                        </span>
                      )}
                    </div>
                    {transit.departureTime && transit.arrivalTime && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        Time: {transit.departureTime} → {transit.arrivalTime} ({transit.durationMinutes} mins)
                      </div>
                    )}
                    {transit.originStation && transit.destinationStation && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Route: {transit.originStation} to {transit.destinationStation}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ItineraryDisplay;
