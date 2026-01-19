import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const QR_OPTIONS = {
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
};

function QRCodeDisplay({ url, size = 256, downloadSize = 512 }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (url) {
      QRCode.toDataURL(url, { ...QR_OPTIONS, width: size })
        .then(setQrDataUrl)
        .catch(err => console.error('Error generating QR code:', err));
    }
  }, [url, size]);

  const handleDownload = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(url, { ...QR_OPTIONS, width: downloadSize });
      
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
    return <div className="qr-loading">Loading QR Code...</div>;
  }

  return (
    <>
      <div className="qr-modal-content">
        <img 
          src={qrDataUrl} 
          alt="QR Code"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
        <p className="qr-url-display">{url}</p>
      </div>
      <div className="qr-modal-actions">
        <button className="btn btn-primary" onClick={handleDownload}>
          <i className="fa fa-download"></i> Download PNG
        </button>
      </div>
    </>
  );
}

export default QRCodeDisplay;