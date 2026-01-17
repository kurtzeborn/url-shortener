import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import CreateUrl from './components/CreateUrl';
import Settings from './components/Settings';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // TODO: Implement proper auth

  const handleLogin = () => {
    // TODO: Implement Microsoft OAuth login
    alert('Microsoft OAuth login not yet implemented');
    setIsLoggedIn(true); // Temporary
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

  if (!isLoggedIn) {
    return (
      <div>
        <header className="header">
          <div className="header-content">
            <div className="logo">k61.dev</div>
          </div>
        </header>
        <div className="container">
          <div className="card" style={{ maxWidth: '500px', margin: '100px auto', textAlign: 'center' }}>
            <h1 style={{ marginBottom: '20px' }}>URL Shortener</h1>
            <p style={{ marginBottom: '30px', color: '#666' }}>
              Create short, memorable links with analytics and custom aliases.
            </p>
            <button className="btn btn-primary" onClick={handleLogin}>
              Login with Microsoft
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="header">
        <div className="header-content">
          <div className="logo">k61.dev</div>
          <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage('dashboard')}
              style={{ background: currentPage === 'dashboard' ? '#0066cc' : '#6c757d' }}
            >
              Dashboard
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage('create')}
              style={{ background: currentPage === 'create' ? '#0066cc' : '#6c757d' }}
            >
              Create URL
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage('settings')}
              style={{ background: currentPage === 'settings' ? '#0066cc' : '#6c757d' }}
            >
              Settings
            </button>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        </div>
      </header>

      <div className="container">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'create' && <CreateUrl onSuccess={() => setCurrentPage('dashboard')} />}
        {currentPage === 'settings' && <Settings />}
      </div>
    </div>
  );
}

export default App;
