import React, { useState, useEffect } from 'react';
import PlannerDashboard from './pages/PlannerDashboard';
import AuthPage from './pages/AuthPage';
import { fetchCurrentUser } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const currentUser = await fetchCurrentUser();
          setUser(currentUser);
        } catch (err) {
          console.warn('[App] Session expired or invalid token');
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0d0f18',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)'
      }}>
        <h3>Loading your planner profile...</h3>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={(userData) => setUser(userData)} />;
  }

  return <PlannerDashboard user={user} onLogout={handleLogout} />;
}

export default App;
