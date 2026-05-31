'use client';

import { useState, useRef, useCallback, Fragment } from 'react';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null); // key of expanded row
  const [rowDetails, setRowDetails] = useState(null);   // cells of expanded row
  const [loadingRow, setLoadingRow] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      setCount(0);
      setSearched(false);
      setExpandedRow(null);
      setRowDetails(null);
      return;
    }

    setLoading(true);
    setSearched(true);
    setExpandedRow(null);
    setRowDetails(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.results || []);
      setCount(data.count || 0);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      search(query);
    }
  };

  // Fetch all cells for a specific row
  const toggleRowDetail = async (row, rowKey) => {
    if (expandedRow === rowKey) {
      // Collapse
      setExpandedRow(null);
      setRowDetails(null);
      return;
    }

    setExpandedRow(rowKey);
    setLoadingRow(true);
    setRowDetails(null);

    try {
      const params = new URLSearchParams({
        file: row.file_name,
        sheet: row.sheet_name,
        row: String(row.row_no),
      });
      const res = await fetch(`/api/row?${params}`);
      const data = await res.json();
      setRowDetails(data.cells || []);
    } catch (err) {
      console.error('Row fetch failed:', err);
      setRowDetails([]);
    } finally {
      setLoadingRow(false);
    }
  };

  // Highlight matching text in results
  const highlightMatch = (text, q) => {
    if (!q || q.length < 2) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = String(text).split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <main className="container">
      {/* Hero Section */}
      <div className="hero">
        <div className="logo">
          <span className="logo-icon">📊</span>
          <h1>Excel Search</h1>
        </div>
        <p className="tagline">Search across all spreadsheets instantly</p>
      </div>

      {/* Search Bar */}
      <div className="search-wrapper">
        <div className="search-bar">
          <svg
            className="search-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            id="search-input"
            type="text"
            placeholder="Search anything... (e.g. Tomader, Sticker59)"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoFocus
            autoComplete="off"
          />
          {query && (
            <button
              className="clear-btn"
              onClick={() => {
                setQuery('');
                setResults([]);
                setCount(0);
                setSearched(false);
                setExpandedRow(null);
                setRowDetails(null);
              }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="results-section">
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <span>Searching...</span>
          </div>
        )}

        {!loading && searched && (
          <div className="results-info">
            <span className="result-count">
              {count > 0 ? `Found ${count} result${count !== 1 ? 's' : ''}` : 'No results found'}
            </span>
            {count > 0 && (
              <span className="results-hint">Click any row to see all columns</span>
            )}
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="table-container fade-in">
            <table id="results-table">
              <thead>
                <tr>
                  <th></th>
                  <th>File</th>
                  <th>Sheet</th>
                  <th>Row</th>
                  <th>Column</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, index) => {
                  const rowKey = `${row.file_name}-${row.sheet_name}-${row.row_no}-${index}`;
                  const isExpanded = expandedRow === rowKey;

                  return (
                    <Fragment key={rowKey}>
                      <tr
                        key={rowKey}
                        className={`result-row clickable ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => toggleRowDetail(row, rowKey)}
                        title="Click to see all columns in this row"
                      >
                        <td className="cell-expand">
                          <span className={`expand-icon ${isExpanded ? 'open' : ''}`}>▶</span>
                        </td>
                        <td className="cell-file">
                          <span className="file-badge">{row.file_name}</span>
                        </td>
                        <td>{row.sheet_name}</td>
                        <td className="cell-row">{row.row_no}</td>
                        <td>{row.column_name}</td>
                        <td className="cell-value">{highlightMatch(row.cell_value, query)}</td>
                      </tr>

                      {/* Expanded row detail */}
                      {isExpanded && (
                        <tr key={`${rowKey}-detail`} className="row-detail">
                          <td colSpan={6}>
                            <div className="row-detail-content">
                              <div className="row-detail-header">
                                <strong>📋 Full Row {row.row_no}</strong> — {row.file_name} → {row.sheet_name}
                              </div>
                              {loadingRow ? (
                                <div className="row-detail-loading">
                                  <div className="spinner small"></div>
                                  <span>Loading row data...</span>
                                </div>
                              ) : rowDetails && rowDetails.length > 0 ? (
                                <div className="row-detail-grid">
                                  {rowDetails.map((cell) => (
                                    <div
                                      key={cell.id}
                                      className={`row-detail-cell ${
                                        cell.cell_value === row.cell_value &&
                                        cell.column_name === row.column_name
                                          ? 'matched'
                                          : ''
                                      }`}
                                    >
                                      <span className="row-detail-col">{cell.column_name}</span>
                                      <span className="row-detail-val">
                                        {highlightMatch(cell.cell_value, query)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="row-detail-empty">No data found for this row</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !searched && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>Type at least 2 characters to start searching</p>
          </div>
        )}
      </div>
    </main>
  );
}
