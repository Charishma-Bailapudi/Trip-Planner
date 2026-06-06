import React, { useState, useEffect } from 'react';
import PreferenceForm from '../components/PreferenceForm';
import ItineraryDisplay from '../components/ItineraryDisplay';
import RouteMap from '../components/RouteMap';
import WeatherWidget from '../components/WeatherWidget';
import TransportSuggestions from '../components/TransportSuggestions';
import { fetchTrips, fetchTripById, generateTrip, deleteTrip, selectTransitOption } from '../services/api';
import { Compass, Trash2, Calendar, MapPin, Loader2, Download } from 'lucide-react';

const PlannerDashboard = ({ user, onLogout }) => {
  const [trips, setTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuthError = (err) => {
    if (err?.status === 401 || err?.message === 'Not authorized' || (err?.message && err.message.toLowerCase().includes('authorized'))) {
      onLogout();
    }
  };

  const handleDownloadTrip = () => {
    if (!activeTrip) return;
    
    let mdContent = `# Trip Plan: ${activeTrip.title}\n`;
    mdContent += `**Dates:** ${new Date(activeTrip.startDate).toLocaleDateString()} to ${new Date(activeTrip.endDate).toLocaleDateString()}\n`;
    mdContent += `**Destinations:** ${activeTrip.destinations.map(d => `${d.name} (${d.stayDurationDays} days)`).join(', ')}\n`;
    mdContent += `**Budget Mode:** ${activeTrip.budget.mode === 'tier' ? `${activeTrip.budget.tier} tier` : `${activeTrip.budget.limitAmount} limit`} (${activeTrip.budget.currency})\n\n`;
    mdContent += `=========================================\n\n`;

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
    const sym = getCurrencySymbol(activeTrip.budget.currency);

    activeTrip.itinerary.forEach(day => {
      mdContent += `## Day ${day.dayNumber} - ${new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}\n`;
      if (day.weather) {
        mdContent += `**Weather:** ${day.weather.tempCelsius}°C, ${day.weather.condition} (${day.weather.description})\n\n`;
      }
      
      mdContent += `### Activities:\n`;
      day.activities.forEach((act, idx) => {
        mdContent += `${idx + 1}. **[${act.timeSlot}] ${act.title}**\n`;
        mdContent += `   - *Location:* ${act.location.name} (${act.location.latitude}, ${act.location.longitude})\n`;
        mdContent += `   - *Cost:* ${act.cost === 0 ? 'Free' : `${sym}${act.cost}`}\n`;
        if (act.description) {
          mdContent += `   - *Description:* ${act.description}\n`;
        }
        mdContent += `\n`;
      });

      if (day.transits && day.transits.length > 0) {
        mdContent += `### Transit Connections:\n`;
        day.transits.forEach((tr, idx) => {
          mdContent += `- **${tr.transitNumber || tr.mode.toUpperCase() + ' connection'}** (${tr.durationMinutes} mins)\n`;
          mdContent += `  - *From:* ${tr.origin} ${tr.originStation ? `(${tr.originStation})` : ''}\n`;
          mdContent += `  - *To:* ${tr.destination} ${tr.destinationStation ? `(${tr.destinationStation})` : ''}\n`;
          if (tr.departureTime && tr.arrivalTime) {
            mdContent += `  - *Schedule:* ${tr.departureTime} → ${tr.arrivalTime}\n`;
          }
          mdContent += `  - *Estimated Cost:* ${tr.estimatedCost === 0 ? 'Free' : `${sym}${tr.estimatedCost}`}\n`;
          mdContent += `\n`;
        });
      }
      mdContent += `-----------------------------------------\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTrip.title.toLowerCase().replace(/\s+/g, '_')}_itinerary.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      handleAuthError(err);
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
      handleAuthError(err);
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
      handleAuthError(err);
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
      handleAuthError(err);
    }
  };

  const handleSelectTransitOption = async (transitId, selectedMode, optionIndex) => {
    if (!activeTrip) return;
    try {
      const updatedTrip = await selectTransitOption(activeTrip._id, transitId, selectedMode, optionIndex);
      setActiveTrip(updatedTrip);
      await loadTrips();
    } catch (err) {
      console.error('Failed to change transit option', err);
      alert(err.message || 'Failed to change transport option');
      handleAuthError(err);
    }
  };

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
    console.log('[Dashboard] Selected Activity for map:', activity);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="main-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: 'var(--primary-glow)', padding: '0.6rem', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
            <Compass size={28} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>AI Trip Planner</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Spec-Driven Travel Companion</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Welcome, <strong>{user?.username}</strong>
          </span>
          <button 
            onClick={onLogout} 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '6px' }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div className="dashboard-layout">
        
        {/* Left Column: Form & Saved History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <PreferenceForm onSubmit={handleGenerate} isLoading={isLoading} />

          {activeTrip && <TransportSuggestions itinerary={activeTrip.itinerary} currency={activeTrip.budget.currency} />}

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
              
              {/* Active Trip Header Banner */}
              <div className="glass-panel" style={{ padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {activeTrip.title}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    {new Date(activeTrip.startDate).toLocaleDateString()} – {new Date(activeTrip.endDate).toLocaleDateString()} • {activeTrip.destinations.map(d => d.name).join(', ')}
                  </p>
                </div>
                <button
                  onClick={handleDownloadTrip}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.2rem',
                    fontSize: '0.9rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  <Download size={16} />
                  Download Plan
                </button>
              </div>

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
                currency={activeTrip.budget.currency}
                onSelectTransitOption={handleSelectTransitOption}
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
