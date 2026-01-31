import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import CreateUrl from './components/CreateUrl';
import Settings from './components/Settings';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, isAllowed, loading, login, logout } = useAuth();

  const navigateTo = (page) => {
    setCurrentPage(page);
    setMenuOpen(false);
  };

  const isActive = (page) => currentPage === page ? '#0066cc' : '#6c757d';

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
              Your account (<strong>{user?.email}</strong>) is not authorized to use this application.
            </p>
            <p style={{ color: '#666' }}>
              Ask an existing user to invite you using the email address above.
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
          <button 
            className="btn btn-icon hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            title="Menu"
          >
            <i className="fa fa-bars"></i>
          </button>
          <nav className={`nav-menu ${menuOpen ? 'open' : ''}`}>
            <button
              className="btn btn-secondary nav-btn"
              onClick={() => navigateTo('dashboard')}
              style={{ background: isActive('dashboard') }}
              title="Dashboard"
            >
              <i className="fa fa-home"></i>
            </button>
            <button
              className="btn btn-secondary nav-btn"
              onClick={() => navigateTo('create')}
              style={{ background: isActive('create') }}
              title="Create URL"
            >
              <i className="fa fa-plus"></i>
            </button>
            <button
              className="btn btn-secondary nav-btn"
              onClick={() => navigateTo('settings')}
              style={{ background: isActive('settings') }}
              title="Settings"
            >
              <i className="fa fa-cog"></i>
            </button>
            <span className="user-email">{user?.email}</span>
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
