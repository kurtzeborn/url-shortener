import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE, parseApiResponse, getErrorMessage } from '../api';

function Dashboard() {
  const { getAccessToken } = useAuth();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingUrl, setEditingUrl] = useState(null);
  const [editValue, setEditValue] = useState('');

  const fetchUrls = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${API_BASE}/api/urls?page=${page}&pageSize=10&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch URLs');
      }

      const data = await response.json();
      setUrls(data.urls);
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, page, sortBy, sortOrder]);

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this URL?')) {
      return;
    }

    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_BASE}/api/urls/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  const startEdit = (url) => {
    setEditingUrl(url);
    setEditValue(url.url);
  };

  const cancelEdit = () => {
    setEditingUrl(null);
    setEditValue('');
  };

  const handleEdit = async () => {
    if (!editingUrl) return;

    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_BASE}/api/urls/${editingUrl.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: editValue }),
      });

      const { data, ok } = await parseApiResponse(response);

      if (!ok) {
        throw new Error(getErrorMessage(data, 'Failed to update URL'));
      }

      cancelEdit();
      fetchUrls();
    } catch (err) {
      alert('Error updating URL: ' + err.message);
    }
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
                  <div className="url-short">{url.shortUrl}</div>
                  <div className="url-long">{url.url}</div>
                  <div className="url-stat">🔗 {url.clickCount}</div>
                  <div className="url-stat">📅 {new Date(url.createdAt).toLocaleDateString()}</div>
                  <div className="url-actions">
                    <button
                      className="btn btn-sm"
                      onClick={() => copyToClipboard(url.shortUrl)}
                      title="Copy"
                    >
                      📋
                    </button>
                    <button className="btn btn-sm" onClick={() => startEdit(url)} title="Edit">
                      ✏️
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(url.id)} title="Delete">
                      🗑️
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

      {editingUrl && (
        <div className="modal-overlay" onClick={cancelEdit}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit URL</h2>
            <p style={{ color: '#666', marginBottom: '15px' }}>
              Editing: <strong>{editingUrl.shortUrl}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Destination URL</label>
              <input
                type="url"
                className="form-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
