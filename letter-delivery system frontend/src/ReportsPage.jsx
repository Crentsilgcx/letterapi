import { useState, useCallback } from 'react';
import { receptionApi } from './api';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DELIVERED', label: 'Pending (Delivered)' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'FAILED', label: 'Failed' },
];

const DATE_PRESETS = [
  { value: '', label: 'Custom Range' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

function getDateRange(preset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today': {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { from: today.toISOString().split('T')[0], to: tomorrow.toISOString().split('T')[0] };
    }
    case 'week': {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Sunday
      return { from: weekStart.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    }
    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: monthStart.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    }
    default:
      return { from: '', to: '' };
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const ReportsPage = () => {

  const [datePreset, setDatePreset] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [organization, setOrganization] = useState('');
  const [recipientPosition, setRecipientPosition] = useState('');
  const [status, setStatus] = useState('');

  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(null);
  const [error, setError] = useState(null);

  const organizations = [
    { value: '', label: 'All Organizations' },
    { value: 'GRA', label: 'GRA' },
    { value: 'NCA', label: 'NCA' },
    { value: 'BoG', label: 'BoG' },
    { value: 'Other', label: 'Other' },
  ];

  const positions = [
    { value: '', label: 'All Positions' },
    { value: 'HR Officer', label: 'HR Officer' },
    { value: 'IT Officer', label: 'IT Officer' },
    { value: 'Finance Manager', label: 'Finance Manager' },
    { value: 'Human Resources Manager', label: 'Human Resources Manager' },
    { value: 'Chief Executive Officer', label: 'Chief Executive Officer' },
    { value: 'Chief Technology Officer', label: 'Chief Technology Officer' },
    { value: 'Managing Director', label: 'Managing Director' },
    { value: 'Administrative Manager', label: 'Administrative Manager' },
    { value: 'Accountant', label: 'Accountant' },
    { value: 'Procurement Officer', label: 'Procurement Officer' },
  ];

  // Handle date preset changes
  const handleDatePresetChange = useCallback((value) => {
    setDatePreset(value);
    if (value) {
      const { from, to } = getDateRange(value);
      setDateFrom(from);
      setDateTo(to);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setIsGenerating(true);
    try {
      const filters = {
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        organization: organization || null,
        recipientPosition: recipientPosition || null,
        status: status || null,
      };
      const data = await receptionApi.generateReport(filters);
      setReportData(data);
    } catch (err) {
      setError(err.message);
      setReportData(null);
    } finally {
      setIsGenerating(false);
    }
  }, [dateFrom, dateTo, organization, recipientPosition, status]);

  const handleExport = useCallback(async (type) => {
    setError(null);
    setIsExporting(type);
    try {
      const filters = {
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        organization: organization || null,
        recipientPosition: recipientPosition || null,
        status: status || null,
      };

      let blob;
      let filename;
      if (type === 'csv') {
        blob = await receptionApi.exportCsv(filters);
        filename = `incoming-letter-report-${new Date().toISOString().slice(0,10)}.csv`;
      } else if (type === 'excel') {
        blob = await receptionApi.exportExcel(filters);
        filename = `incoming-letter-report-${new Date().toISOString().slice(0,10)}.xlsx`;
      } else if (type === 'pdf') {
        blob = await receptionApi.exportPdf(filters);
        filename = `incoming-letter-report-${new Date().toISOString().slice(0,10)}.pdf`;
      }
      downloadBlob(blob, filename);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExporting(null);
    }
  }, [dateFrom, dateTo, organization, recipientPosition, status]);

  const hasReportData = reportData && reportData.records && reportData.records.length > 0;

  return (
    <div className="container">
      <div className="form-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Reports</h2>
            <p className="card-subtitle">Generate and export incoming letter reports</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="report-filters">
          <div className="filter-row">
            <div className="filter-field">
              <label htmlFor="datePreset">Date Range</label>
              <select
                id="datePreset"
                value={datePreset}
                onChange={(e) => handleDatePresetChange(e.target.value)}
                className="filter-select"
              >
                {DATE_PRESETS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="dateFrom">From</label>
              <input
                type="date"
                id="dateFrom"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setDatePreset(''); }}
                className="filter-input"
              />
            </div>

            <div className="filter-field">
              <label htmlFor="dateTo">To</label>
              <input
                type="date"
                id="dateTo"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setDatePreset(''); }}
                className="filter-input"
              />
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-field">
              <label htmlFor="organization">Organization</label>
              <select
                id="organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="filter-select"
              >
                {organizations.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="recipientPosition">Recipient Position</label>
              <select
                id="recipientPosition"
                value={recipientPosition}
                onChange={(e) => setRecipientPosition(e.target.value)}
                className="filter-select"
              >
                {positions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="filter-select"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {reportData && (
          <div className="report-results">
            <div className="report-header">
              <h3>Report Results</h3>
              <div className="report-meta">
                <span>{reportData.totalRecords} record(s) found</span>
                <span>Generated: {formatDateTime(reportData.generatedAt)}</span>
              </div>
            </div>

            <div className="report-export-bar">
              <button
                className="btn btn-secondary btn-small"
                onClick={() => handleExport('csv')}
                disabled={!hasReportData || isExporting === 'csv'}
              >
                {isExporting === 'csv' ? 'Exporting...' : 'Export CSV'}
              </button>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => handleExport('excel')}
                disabled={!hasReportData || isExporting === 'excel'}
              >
                {isExporting === 'excel' ? 'Exporting...' : 'Export Excel'}
              </button>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => handleExport('pdf')}
                disabled={!hasReportData || isExporting === 'pdf'}
              >
                {isExporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>

            {hasReportData ? (
              <div className="table-wrap">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Reference</th>
                      <th>Status</th>
                      <th>Delivery Person</th>
                      <th>Organization</th>
                      <th>Recipient</th>
                      <th>Subject</th>
                      <th>Delivered</th>
                      <th>Received</th>
                      <th>Received By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.records.map((record) => (
                      <tr key={record.id}>
                        <td>{record.id}</td>
                        <td>{record.trackingNumber}</td>
                        <td>
                          <span className={`status-badge status-${record.status.toLowerCase()}`}>
                            {record.status}
                          </span>
                        </td>
                        <td>{record.deliveryPersonName}</td>
                        <td>{record.organizationName}</td>
                        <td>
                          {record.recipientName}
                          {record.recipientTitle && <span className="muted"> ({record.recipientTitle})</span>}
                        </td>
                        <td>{record.subject}</td>
                        <td className="nowrap">{formatDateTime(record.deliveredAt)}</td>
                        <td className="nowrap">{record.receivedAt ? formatDateTime(record.receivedAt) : <span className="muted">—</span>}</td>
                        <td>{record.receivedBy || <span className="muted">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty report-empty">
                No records match the selected filters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;