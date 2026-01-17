import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import CreateUrl from './components/CreateUrl';
import Settings from './components/Settings';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { user, isAuthenticated, isAllowed, loading, login, logout } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div>
        <header className="header">
          <div className="header-content">
            <div className="logo">k61.dev</div>
          </div>
        </header>
        <div className="container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
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
            <button className="btn btn-primary" onClick={login}>
              Login with Microsoft
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if user is not in AllowedUsers
  if (isAllowed === false) {
    return (
      <div>
        <header className="header">
          <div className="header-content">
            <div className="logo">k61.dev</div>
            <button className="btn btn-secondary" onClick={logout}>
              Logout
            </button>
          </div>
        </header>
        <div className="container">
          <div className="card" style={{ maxWidth: '500px', margin: '100px auto', textAlign: 'center' }}>
            <h1 style={{ marginBottom: '20px', color: '#dc3545' }}>Access Denied</h1>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Your account ({user?.email}) is not authorized to use this application.
            </p>
            <p style={{ color: '#666' }}>
              Please contact an existing user to request access.
            </p>
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
            <span style={{ color: '#666', fontSize: '14px' }}>{user?.email}</span>
            <button className="btn btn-secondary" onClick={logout}>
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
