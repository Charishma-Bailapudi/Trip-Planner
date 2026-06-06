import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const PreferenceForm = ({ onSubmit, isLoading }) => {
  const [title, setTitle] = useState('');
  const [sourcePlace, setSourcePlace] = useState('');
  const [destinations, setDestinations] = useState([{ name: '', stayDurationDays: 3 }]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetMode, setBudgetMode] = useState('tier');
  const [budgetTier, setBudgetTier] = useState('moderate');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState('USD');
  const [transportPreferences, setTransportPreferences] = useState(['flight', 'train']);
  const [tripStructure, setTripStructure] = useState('linear');
  const [error, setError] = useState('');

  // Calculate total days in trip
  const calculateTotalTripDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return 0;
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const totalTripDays = calculateTotalTripDays();
  const sumStayDays = destinations.reduce((sum, d) => sum + Number(d.stayDurationDays || 0), 0);

  const handleAddDestination = () => {
    setDestinations([...destinations, { name: '', stayDurationDays: 3 }]);
  };

  const handleRemoveDestination = (index) => {
    if (destinations.length === 1) return;
    setDestinations(destinations.filter((_, i) => i !== index));
  };

  const handleDestinationChange = (index, field, value) => {
    const updated = [...destinations];
    updated[index][field] = field === 'stayDurationDays' ? Number(value) : value;
    setDestinations(updated);
  };

  const handleTransportChange = (mode) => {
    if (transportPreferences.includes(mode)) {
      setTransportPreferences(transportPreferences.filter(t => t !== mode));
    } else {
      setTransportPreferences([...transportPreferences, mode]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!title.trim() || !sourcePlace.trim() || !startDate || !endDate) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (destinations.some(d => !d.name.trim() || !d.stayDurationDays)) {
      setError('Please provide names and stay durations for all destinations.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      setError('End Date must be on or after Start Date.');
      return;
    }

    if (sumStayDays !== totalTripDays) {
      setError(`Stay durations mismatch! Destinations add up to ${sumStayDays} days, but your trip date range is ${totalTripDays} days. Please align them.`);
      return;
    }

    // Prepare API formatted data
    const tripData = {
      title,
      sourcePlace,
      destinations,
      startDate,
      endDate,
      budget: {
        mode: budgetMode,
        tier: budgetMode === 'tier' ? budgetTier : undefined,
        limitAmount: budgetMode !== 'tier' ? Number(budgetLimit) : undefined,
        currency: budgetCurrency
      },
      transportPreferences,
      tripStructure
    };

    onSubmit(tripData);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <h2 style={{ marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>Plan New Trip</h2>
      
      {error && (
        <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--accent-glow)', color: 'var(--accent)', fontSize: '0.9rem', border: '1px solid rgba(255,118,117,0.2)' }}>
          {error}
        </div>
      )}

      <div>
        <label htmlFor="trip-title">Trip Title</label>
        <input 
          id="trip-title"
          type="text" 
          placeholder="e.g. Summer EuroTrip" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="trip-source">Source Place (Starting Point)</label>
        <input 
          id="trip-source"
          type="text" 
          placeholder="e.g. New Delhi" 
          value={sourcePlace} 
          onChange={(e) => setSourcePlace(e.target.value)}
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label htmlFor="start-date">Start Date</label>
          <input 
            id="start-date"
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="end-date">End Date</label>
          <input 
            id="end-date"
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      {startDate && endDate && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '0.5rem 0.8rem', borderRadius: '6px' }}>
          Trip Length: <strong>{totalTripDays} days</strong> | Destinations Stay: <strong>{sumStayDays} days</strong>
        </div>
      )}

      {/* Destinations List */}
      <div>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span>Destinations</span>
          <button 
            type="button" 
            onClick={handleAddDestination} 
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem', borderRadius: '4px' }}
          >
            <Plus size={14} /> Add City
          </button>
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {destinations.map((dest, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 40px', gap: '0.6rem', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="e.g. Paris" 
                value={dest.name} 
                onChange={(e) => handleDestinationChange(index, 'name', e.target.value)}
                required
              />
              <input 
                type="number" 
                min="1" 
                placeholder="Days" 
                value={dest.stayDurationDays} 
                onChange={(e) => handleDestinationChange(index, 'stayDurationDays', e.target.value)}
                title="Duration in days"
                required
              />
              <button 
                type="button" 
                onClick={() => handleRemoveDestination(index)}
                disabled={destinations.length === 1}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  cursor: destinations.length === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: destinations.length === 1 ? 0.3 : 1
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label htmlFor="budget-mode">Budget Mode</label>
          <select id="budget-mode" value={budgetMode} onChange={(e) => setBudgetMode(e.target.value)}>
            <option value="tier">Tier-based Category</option>
            <option value="daily_limit">Strict Daily Limit</option>
            <option value="total_cap">Overall Trip Cap</option>
          </select>
        </div>

        <div>
          {budgetMode === 'tier' ? (
            <>
              <label htmlFor="budget-tier">Budget Tier</label>
              <select id="budget-tier" value={budgetTier} onChange={(e) => setBudgetTier(e.target.value)}>
                <option value="budget">Budget (Eco)</option>
                <option value="moderate">Moderate</option>
                <option value="luxury">Luxury (Premium)</option>
              </select>
            </>
          ) : (
            <>
              <label htmlFor="budget-limit">Limit Amount ({budgetCurrency})</label>
              <input 
                id="budget-limit"
                type="number" 
                min="1" 
                placeholder="e.g. 500" 
                value={budgetLimit} 
                onChange={(e) => setBudgetLimit(e.target.value)}
                required
              />
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label htmlFor="budget-currency">Preferred Currency</label>
          <select id="budget-currency" value={budgetCurrency} onChange={(e) => setBudgetCurrency(e.target.value)}>
            <option value="USD">USD ($ - Dollar)</option>
            <option value="INR">INR (₹ - Rupee)</option>
            <option value="EUR">EUR (€ - Euro)</option>
            <option value="GBP">GBP (£ - Pound)</option>
            <option value="JPY">JPY (¥ - Yen)</option>
          </select>
        </div>

        <div>
          <label htmlFor="trip-structure">Trip Structure</label>
          <select id="trip-structure" value={tripStructure} onChange={(e) => setTripStructure(e.target.value)}>
            <option value="linear">Linear Route (Stay Sequence)</option>
            <option value="hub_and_spoke">Hub & Spoke (Day trips from base)</option>
            <option value="flex">Flexible Route (AI Suggested)</option>
          </select>
        </div>
      </div>

      <div>
        <label>Transport Preferences</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '0.4rem' }}>
          {['flight', 'train', 'bus', 'car_rental', 'driving'].map(mode => (
            <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'capitalize', cursor: 'pointer', marginBottom: 0 }}>
              <input 
                type="checkbox" 
                checked={transportPreferences.includes(mode)}
                onChange={() => handleTransportChange(mode)}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              {mode.replace('_', ' ')}
            </label>
          ))}
        </div>
      </div>

      <button 
        type="submit" 
        className="btn btn-primary" 
        style={{ marginTop: '0.5rem' }} 
        disabled={isLoading}
      >
        {isLoading ? 'Generating Itinerary...' : 'Generate Trip Itinerary'}
      </button>
    </form>
  );
};

export default PreferenceForm;
