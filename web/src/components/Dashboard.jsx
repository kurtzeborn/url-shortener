import React, { useState, useEffect } from 'react';

const API_BASE = '/api'; // Uses Vite proxy in development

function Dashboard() {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchUrls();
  }, [page, sortBy, sortOrder]);

  const fetchUrls = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/urls?page=${page}&pageSize=10&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch URLs');
      }

      const data = await response.json();
      setUrls(data.urls);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this URL?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/urls/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete URL');
      }

      // Refresh list
      fetchUrls();
    } catch (err) {
      alert('Error deleting URL: ' + err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>My URLs</h1>

      <div className="filters">
        <div>
          <label>Sort by: </label>
          <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Date</option>
            <option value="clicks">Clicks</option>
          </select>
        </div>
        <div>
          <label>Order: </label>
          <select className="select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {urls.length === 0 ? (
        <div className="empty-state">
          <h2>No URLs yet</h2>
          <p>Create your first shortened URL to get started!</p>
        </div>
      ) : (
        <>
          <div className="card">
            <ul className="url-list">
              {urls.map((url) => (
                <li key={url.id} className="url-item">
                  <div className="url-info">
                    <div className="url-short">{url.shortUrl}</div>
                    <div className="url-long">{url.url}</div>
                    <div className="url-stats">
                      <span>🔗 {url.clickCount} clicks</span>
                      <span>📅 {new Date(url.createdDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="url-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => copyToClipboard(url.shortUrl)}
                    >
                      Copy
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(url.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="pagination">
            <button
              className="btn btn-secondary"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <span style={{ padding: '10px' }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
