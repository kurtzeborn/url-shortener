import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';

function CreateUrl({ onSuccess }) {
  const { post } = useApi();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await post('/api/urls', { url });
      setSuccess(`Created: ${data.shortUrl}`);
      setUrl('');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Create Shortened URL</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">URL to shorten</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://example.com/very/long/url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Short URL'}
          </button>
        </form>
      </div>

      <div className="card" style={{ maxWidth: '600px', marginTop: '20px' }}>
        <h3 style={{ marginBottom: '10px' }}><i className="fa fa-info-circle"></i> How it works</h3>
        <ul style={{ paddingLeft: '20px', color: '#666' }}>
          <li>Enter any URL you want to shorten</li>
          <li>We'll generate a random 4-character ID</li>
          <li>Your short URL will be k61.dev/[ID]</li>
          <li>Track clicks and manage your URLs from the dashboard</li>
        </ul>
      </div>
    </div>
  );
}

export default CreateUrl;
