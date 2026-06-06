import React from 'react';
import { CloudRain } from 'lucide-react';

const WeatherWidget = ({ weather }) => {
  if (!weather) {
    return null;
  }

  const { tempCelsius, condition, description, iconCode } = weather;
  const iconUrl = iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : null;

  return (
    <div 
      className="glass-panel" 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0.8rem 1.5rem', 
        borderRadius: 'var(--radius-md)', 
        border: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(18, 20, 32, 0.4)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: '50%', width: '48px', height: '48px', overflow: 'hidden' }}>
          {iconUrl ? (
            <img src={iconUrl} alt={condition} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          ) : (
            <CloudRain size={24} style={{ color: 'var(--secondary)' }} />
          )}
        </div>
        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weather</h4>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, textTransform: 'capitalize' }}>
            {condition} • <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{description}</span>
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--secondary)' }}>
          {tempCelsius}°C
        </span>
      </div>
    </div>
  );
};

export default WeatherWidget;
