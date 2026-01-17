import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE, parseApiResponse, getErrorMessage } from '../api';

function Settings() {
  const { getAccessToken } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const { data, ok } = await parseApiResponse(response);

      if (!ok) {
        throw new Error(getErrorMessage(data, 'Failed to add user'));
      }

      setSuccess(`User added! Remaining invites today: ${data.remainingInvites}`);
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Settings</h1>

      <div className="card" style={{ maxWidth: '600px' }}>
        <h2 style={{ marginBottom: '15px' }}>Invite Users</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Add email addresses to allow others to use the URL shortener. You can invite up to 10
          users per day.
        </p>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <form onSubmit={handleAddUser}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>

      <div className="card" style={{ maxWidth: '600px', marginTop: '20px' }}>
        <h3 style={{ marginBottom: '10px' }}>ℹ️ Invite Limits</h3>
        <ul style={{ paddingLeft: '20px', color: '#666' }}>
          <li>Maximum 10 invites per day per user</li>
          <li>Limit resets at midnight UTC</li>
          <li>Duplicate emails are automatically rejected</li>
          <li>All invited users have the same privileges</li>
        </ul>
      </div>
    </div>
  );
}

export default Settings;
