'use client';

import { useState, useRef } from 'react';

export default function UploadPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [statuses, setStatuses] = useState({});
  const fileInputRef = useRef(null);

  const handleAuth = (e) => {
    e.preventDefault();
    if (password === 'admin1234') {
      setAuthenticated(true);
    } else {
      alert('Incorrect password! Please type admin1234 in lowercase.');
    }
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setStatuses({});
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name;

      setStatuses((prev) => ({ ...prev, [fileName]: { status: 'uploading', message: 'Uploading...' } }));

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'x-upload-password': password },
          body: formData,
        });

        const data = await res.json();

        if (res.ok) {
          setStatuses((prev) => ({
            ...prev,
            [fileName]: {
              status: 'done',
              message: `✅ ${data.sheetsProcessed} sheets, ${data.cellsInserted} cells uploaded`,
            },
          }));
        } else {
          setStatuses((prev) => ({
            ...prev,
            [fileName]: { status: 'error', message: `❌ ${data.error}` },
          }));
        }
      } catch (err) {
        setStatuses((prev) => ({
          ...prev,
          [fileName]: { status: 'error', message: `❌ ${err.message}` },
        }));
      }
    }

    setUploading(false);
  };

  if (!authenticated) {
    return (
      <main className="container">
        <div className="hero">
          <div className="logo">
            <span className="logo-icon">🔐</span>
            <h1>Admin Upload</h1>
          </div>
          <p className="tagline">Enter password to upload Excel files</p>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
          <div className="search-wrapper">
            <div className="search-bar">
              <input
                id="password-input"
                type="password"
                placeholder="Enter upload password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.75rem' }}>
              Hint: The default password is <strong>admin1234</strong>
            </p>
          </div>
          <button type="submit" className="upload-btn" id="auth-button">
            Authenticate
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="hero">
        <div className="logo">
          <span className="logo-icon">📤</span>
          <h1>Upload Excel Files</h1>
        </div>
        <p className="tagline">Select .xlsx or .xls files to upload to the database</p>
      </div>

      <div className="upload-section">
        <div
          className="drop-zone"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="drop-icon">📁</div>
          <p>Click to select Excel files</p>
          <span className="drop-hint">.xlsx, .xls — multiple files allowed</span>
          <input
            ref={fileInputRef}
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {files.length > 0 && (
          <div className="file-list">
            <h3>{files.length} file{files.length !== 1 ? 's' : ''} selected</h3>
            <ul>
              {files.map((file) => (
                <li key={file.name} className={`file-item ${statuses[file.name]?.status || ''}`}>
                  <span className="file-item-name">{file.name}</span>
                  <span className="file-item-size">{(file.size / 1024).toFixed(1)} KB</span>
                  {statuses[file.name] && (
                    <span className={`file-item-status status-${statuses[file.name].status}`}>
                      {statuses[file.name].message}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <button
              className="upload-btn"
              id="upload-button"
              onClick={uploadFiles}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner small"></span> Uploading...
                </>
              ) : (
                `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>
          <a href="/" className="back-link">← Back to Search</a>
        </p>
      </footer>
    </main>
  );
}
