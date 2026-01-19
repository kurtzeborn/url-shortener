import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

function QRCodeDisplay({ url, size = 256 }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (url) {
      // Generate QR code as data URL for display
      QRCode.toDataURL(url, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then(dataUrl => {
        setQrDataUrl(dataUrl);
      })
      .catch(err => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [url, size]);

  const handleDownload = async () => {
    try {
      // Generate higher resolution QR code for download
      const dataUrl = await QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `qr-code-${url.split('/').pop()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading QR code:', err);
      alert('Error downloading QR code');
    }
  };

  if (!qrDataUrl) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading QR Code...</div>;
  }

  return (
    <>
      <div className="qr-modal-content">
        <img 
          src={qrDataUrl} 
          alt="QR Code"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
        <p style={{ marginTop: '15px', color: '#666', fontSize: '14px' }}>
          {url}
        </p>
      </div>
      <div className="qr-modal-actions">
        <button
          className="btn btn-primary"
          onClick={handleDownload}
        >
          <i className="fa fa-download" style={{ marginRight: '8px' }}></i>
          Download PNG
        </button>
      </div>
    </>
  );
}

export default QRCodeDisplay;