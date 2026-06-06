import React, { useState, useEffect } from 'react';
import PreferenceForm from '../components/PreferenceForm';
import ItineraryDisplay from '../components/ItineraryDisplay';
import RouteMap from '../components/RouteMap';
import WeatherWidget from '../components/WeatherWidget';
import TransportSuggestions from '../components/TransportSuggestions';
import { fetchTrips, fetchTripById, generateTrip, deleteTrip } from '../services/api';
import { Compass, Trash2, Calendar, MapPin, Loader2 } from 'lucide-react';

const PlannerDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all saved trips on load
  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const data = await fetchTrips();
      setTrips(data);
    } catch (err) {
      console.error('Failed to load trips history', err);
    }
  };

  const handleGenerate = async (tripData) => {
    setIsLoading(true);
    setError('');
    setActiveTrip(null);
    setSelectedActivity(null);
    setSelectedDayIndex(0);
    try {
      const newTrip = await generateTrip(tripData);
      setActiveTrip(newTrip);
      await loadTrips(); // Reload sidebar list
    } catch (err) {
      setError(err.message || 'Failed to generate itinerary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTrip = async (id) => {
    setIsLoading(true);
    setError('');
    setSelectedActivity(null);
    setSelectedDayIndex(0);
    try {
      const fullTrip = await fetchTripById(id);
      setActiveTrip(fullTrip);
    } catch (err) {
      setError('Failed to fetch trip details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Avoid selecting the trip card
    if (!window.confirm('Are you sure you want to delete this trip plan?')) return;
    try {
      await deleteTrip(id);
      if (activeTrip && activeTrip._id === id) {
        setActiveTrip(null);
        setSelectedActivity(null);
      }
      await loadTrips();
    } catch (err) {
      alert('Failed to delete trip.');
    }
  };

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
    console.log('[Dashboard] Selected Activity for map:', activity);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="main-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: 'var(--primary-glow)', padding: '0.6rem', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
            <Compass size={28} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>AI Trip Planner</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Spec-Driven Travel Companion</p>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div className="dashboard-layout">
        
        {/* Left Column: Form & Saved History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <PreferenceForm onSubmit={handleGenerate} isLoading={isLoading} />

          {activeTrip && <TransportSuggestions itinerary={activeTrip.itinerary} />}

          {/* Saved Trips List */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              Your Trip Plans
            </h3>
            
            {trips.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                No saved trips yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                {trips.map(trip => {
                  const isActive = activeTrip && activeTrip._id === trip._id;
                  return (
                    <div
                      key={trip._id}
                      onClick={() => handleSelectTrip(trip._id)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.8rem 1rem',
                        borderRadius: '8px',
                        background: isActive ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                        border: isActive ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{trip.title}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar size={12} />
                          {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={12} style={{ color: 'var(--accent)' }} />
                          {trip.destinations.map(d => d.name).join(', ')}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, trip._id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.4rem',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'var(--transition-smooth)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Itinerary view & Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
          {isLoading ? (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem', gap: '1rem', flex: 1 }}>
              <Loader2 size={40} className="spin" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
              <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <h3 style={{ fontSize: '1.2rem' }}>We are designing your travel adventure...</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Consulting Gemini AI for optimal routes and seasonal guides</p>
            </div>
          ) : error ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--accent)' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Failed to generate itinerary</h3>
              <p>{error}</p>
            </div>
          ) : activeTrip ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.0rem', height: '100%' }}>
              
              {/* Weather Forecast Widget */}
              <WeatherWidget weather={activeTrip.itinerary[selectedDayIndex]?.weather} />

              {/* Interactive Route Map */}
              <RouteMap 
                activities={activeTrip.itinerary[selectedDayIndex]?.activities} 
                selectedActivity={selectedActivity} 
              />

              {/* Day-by-Day Timeline Display */}
              <ItineraryDisplay 
                itinerary={activeTrip.itinerary} 
                onActivityClick={handleActivityClick}
                activeActivityId={selectedActivity ? selectedActivity._id : null}
                selectedDayIndex={selectedDayIndex}
                setSelectedDayIndex={setSelectedDayIndex}
              />
            </div>
          ) : (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8rem', color: 'var(--text-secondary)' }}>
              <Compass size={64} style={{ marginBottom: '1.5rem', color: 'var(--primary-glow)' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No Itinerary Active</h3>
              <p style={{ fontSize: '0.95rem' }}>Use the planning form on the left to automatically generate a travel plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlannerDashboard;
