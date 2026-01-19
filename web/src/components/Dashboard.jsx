import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import QRCodeDisplay from './QRCodeDisplay';

const SORT_CONFIG = {
  date: { icon: 'calendar', label: 'Date' },
  clicks: { icon: 'bar-chart', label: 'Clicks' }
};

function Dashboard() {
  const { get, put, del } = useApi();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingUrl, setEditingUrl] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  const toggleSortBy = () => setSortBy(sortBy === 'date' ? 'clicks' : 'date');
  const toggleSortOrder = () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');

  const fetchUrls = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await get(`/api/urls?page=${page}&pageSize=10&sortBy=${sortBy}&sortOrder=${sortOrder}`);
      setUrls(data.urls);
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [get, page, sortBy, sortOrder]);

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this URL?')) {
      return;
    }

    try {
      await del(`/api/urls/${id}`);
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
      await put(`/api/urls/${editingUrl.id}`, { url: editValue });
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
      <h1 className="page-title">My URLs</h1>

      <div className="filters">
        <span className="sort-label">Sort by:</span>
        <button 
          className="btn btn-icon"
          onClick={toggleSortBy}
          title={`Sort by ${SORT_CONFIG[sortBy].label}`}
        >
          <i className={`fa fa-${SORT_CONFIG[sortBy].icon}`}></i>
        </button>
        <button 
          className="btn btn-icon"
          onClick={toggleSortOrder}
          title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        >
          <i className={`fa fa-sort-${sortOrder === 'asc' ? 'asc' : 'desc'}`}></i>
        </button>
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
                  <div className="url-short" style={{ marginRight: '20px' }}>
                    <a href={url.shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {url.shortUrl}
                    </a>
                  </div>
                  <div className="url-long" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <i className="fa fa-chain" style={{ marginRight: '8px', flexShrink: 0, opacity: 0.6 }}></i>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{url.url}</span>
                  </div>
                  <div className="url-stat"><i className="fa fa-calendar"></i> {new Date(url.createdAt).toLocaleDateString()}</div>
                  <div className="url-stat"><i className="fa fa-bar-chart"></i> {url.clickCount}</div>
                  <div className="url-actions">
                    <button
                      className="btn btn-icon"
                      onClick={() => setQrCodeUrl(url.shortUrl)}
                      title="Show QR Code"
                    >
                      <i className="fa fa-qrcode"></i>
                    </button>
                    <button
                      className="btn btn-icon"
                      onClick={() => copyToClipboard(url.shortUrl)}
                      title="Copy"
                    >
                      <i className="fa fa-copy"></i>
                    </button>
                    <button className="btn btn-icon" onClick={() => startEdit(url)} title="Edit">
                      <i className="fa fa-pencil"></i>
                    </button>
                    <button className="btn btn-icon btn-icon-danger" onClick={() => handleDelete(url.id)} title="Delete">
                      <i className="fa fa-trash-o"></i>
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

      {qrCodeUrl && (
        <div className="modal-overlay" onClick={() => setQrCodeUrl(null)}>
          <div className="modal qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h3>QR Code</h3>
              <button 
                className="btn btn-icon"
                onClick={() => setQrCodeUrl(null)}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
            <QRCodeDisplay url={qrCodeUrl} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
