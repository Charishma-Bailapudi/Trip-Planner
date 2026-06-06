import React, { useState, useEffect } from 'react';
import { Clock, MapPin, DollarSign, Calendar, Navigation, Eye } from 'lucide-react';

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

const ItineraryDisplay = ({ itinerary, onActivityClick, activeActivityId, selectedDayIndex, setSelectedDayIndex, currency, onSelectTransitOption }) => {
  
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

  const renderTransitCard = (transit, label = 'Transit Connection') => {
    if (!transit) return null;
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '0.6rem', 
        margin: '0.5rem 1.5rem', 
        padding: '1.2rem',
        borderLeft: '2px dashed var(--primary-glow)',
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)'
      }}>
        {/* Active connection header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--secondary)', fontWeight: 600 }}>
            <Navigation size={14} style={{ transform: 'rotate(45deg)' }} />
            <span>
              Active connection: <strong style={{ color: 'var(--text-primary)', textTransform: 'uppercase' }}>{transit.mode}</strong> ({transit.transitNumber || 'Direct'})
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({label})
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 700, display: 'block' }}>
              {getCurrencySymbol(currency)}{transit.estimatedCost}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {transit.durationMinutes} mins
            </span>
          </div>
        </div>

        {/* Current schedule info */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
          <div>
            Route: <strong>{transit.origin}</strong> ({transit.originStation || 'Start'}) ➔ <strong>{transit.destination}</strong> ({transit.destinationStation || 'End'})
          </div>
          {transit.departureTime && transit.arrivalTime && (
            <div>
              Schedule: <strong style={{ color: 'var(--secondary)' }}>{transit.departureTime}</strong> – <strong style={{ color: 'var(--secondary)' }}>{transit.arrivalTime}</strong>
            </div>
          )}
        </div>

        {/* Train & Flight options boxes side-by-side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
          {/* Left Box: Train Options */}
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              🚆 Train Options
            </h4>
            
            {transit.trainInstructions && (
              <div style={{ padding: '0.3rem 0.5rem', background: 'rgba(255,165,0,0.06)', color: '#ffbe76', fontSize: '0.7rem', borderRadius: '4px', lineHeight: '1.3' }}>
                {transit.trainInstructions}
              </div>
            )}

            {(!transit.trainOptions || transit.trainOptions.length === 0) ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No trains configured.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {transit.trainOptions.map((opt, idx) => {
                  const isActive = transit.selectedMode === 'train' && transit.selectedOptionIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectTransitOption && onSelectTransitOption(transit._id, 'train', idx)}
                      style={{
                        padding: '0.4rem 0.6rem',
                        borderRadius: '6px',
                        background: isActive ? 'rgba(57, 114, 255, 0.12)' : 'rgba(255,255,255,0.01)',
                        border: isActive ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span style={{ color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>{opt.transitNumber}</span>
                        <span style={{ color: 'var(--success)' }}>{getCurrencySymbol(currency)}{opt.estimatedCost}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.15rem' }}>
                        <span>{opt.departureTime} – {opt.arrivalTime}</span>
                        <span>{Math.round(opt.durationMinutes / 60)}h</span>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {opt.originStation} to {opt.destinationStation}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Box: Flight Options */}
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              ✈️ Flight Options
            </h4>
            
            {transit.flightInstructions && (
              <div style={{ padding: '0.3rem 0.5rem', background: 'rgba(255,165,0,0.06)', color: '#ffbe76', fontSize: '0.7rem', borderRadius: '4px', lineHeight: '1.3' }}>
                {transit.flightInstructions}
              </div>
            )}

            {(!transit.flightOptions || transit.flightOptions.length === 0) ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No flights configured.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {transit.flightOptions.map((opt, idx) => {
                  const isActive = transit.selectedMode === 'flight' && transit.selectedOptionIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectTransitOption && onSelectTransitOption(transit._id, 'flight', idx)}
                      style={{
                        padding: '0.4rem 0.6rem',
                        borderRadius: '6px',
                        background: isActive ? 'rgba(57, 114, 255, 0.12)' : 'rgba(255,255,255,0.01)',
                        border: isActive ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span style={{ color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>{opt.transitNumber}</span>
                        <span style={{ color: 'var(--success)' }}>{getCurrencySymbol(currency)}{opt.estimatedCost}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.15rem' }}>
                        <span>{opt.departureTime} – {opt.arrivalTime}</span>
                        <span>{opt.durationMinutes}m</span>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {opt.originStation} to {opt.destinationStation}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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

        {/* Start Transit (e.g. from Source Place to first activity on Day 1) */}
        {activeDay.dayNumber === 1 && activeDay.transits && activeDay.transits.length > 0 && (() => {
          // The prepended start transit connects sourcePlace to Day 1 first activity
          const startTransit = activeDay.transits[0];
          // Simple verification
          if (startTransit && startTransit.origin !== startTransit.destination) {
            return renderTransitCard(startTransit, 'Start Journey');
          }
          return null;
        })()}

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(46, 213, 115, 0.1)', color: 'var(--success)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span>{activity.cost === 0 ? 'Free' : `${getCurrencySymbol(currency)}${activity.cost}`}</span>
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

              {/* Transit Card (detailed connection legs between activities) */}
              {(() => {
                const transitIdx = activeDay.dayNumber === 1 ? actIdx + 1 : actIdx;
                const transit = activeDay.transits && activeDay.transits[transitIdx];
                if (transit) {
                  return renderTransitCard(transit, `Leg ${actIdx + 1}`);
                }
                return null;
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ItineraryDisplay;
